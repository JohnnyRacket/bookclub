'use server';

import { db } from '@/lib/db/client';
import { sql } from 'kysely';
import { getSession } from '@/lib/auth/session';
import { requireAdmin, isAdmin } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import { notifyVoteSessionChanged } from '@/lib/events/vote-session-emitter';

export type VoteSessionStatus = 'open' | 'closed' | 'finalized';

export type VotingBook = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  submitter_name: string | null;
};

export type SessionSnapshot = {
  id: number;
  status: VoteSessionStatus;
  created_at: number;
  total_votes_cast: number;
  total_voters: number;
  books?: Array<{
    id: number;
    title: string;
    author: string;
    cover_url: string | null;
    submitter_name: string | null;
    vote_count: number;
  }>;
  winner?: { id: number; title: string; author: string; cover_url: string | null } | null;
};

export async function getSelectionConfig() {
  const rows = await db
    .selectFrom('club_settings')
    .select(['key', 'value'])
    .where('key', 'in', ['selection_mode', 'votes_per_member', 'random_reveal', 'vote_start_admin_only', 'purge_after_selection'])
    .execute();

  const map = new Map(rows.map(r => [r.key, r.value]));
  const votesPerMemberRaw = map.get('votes_per_member');

  return {
    selectionMode: (map.get('selection_mode') ?? 'vote') as 'admin' | 'vote' | 'random',
    votesPerMember: votesPerMemberRaw ? (parseInt(votesPerMemberRaw, 10) || 2) : 2,
    randomReveal: map.get('random_reveal') === '1',
    voteStartAdminOnly: map.get('vote_start_admin_only') === '1',
    purgeAfterSelection: map.get('purge_after_selection') !== '0',
  };
}

async function buildSnapshot(sessionId: number): Promise<SessionSnapshot> {
  const session = await db
    .selectFrom('book_selection_sessions')
    .selectAll()
    .where('id', '=', sessionId)
    .executeTakeFirstOrThrow();

  const stats = await db
    .selectFrom('book_selection_votes')
    .select([
      db.fn.count<number>('session_id').as('total_votes_cast'),
      sql<number>`count(distinct user_id)`.as('total_voters'),
    ])
    .where('session_id', '=', sessionId)
    .executeTakeFirst();

  const result: SessionSnapshot = {
    id: session.id,
    status: session.status as VoteSessionStatus,
    created_at: session.created_at,
    total_votes_cast: Number(stats?.total_votes_cast ?? 0),
    total_voters: Number(stats?.total_voters ?? 0),
  };

  if (session.status !== 'open') {
    // Get vote counts per book for this session
    const voteCounts = await db
      .selectFrom('book_selection_votes')
      .select(['book_id', db.fn.count<number>('user_id').as('count')])
      .where('session_id', '=', sessionId)
      .groupBy('book_id')
      .execute();

    const voteMap = new Map(voteCounts.map(r => [r.book_id, Number(r.count)]));

    // Get submitted books (voted-on books that changed status are caught via extraBooks below)
    const candidateBooks = await db
      .selectFrom('books')
      .leftJoin('users as submitter', 'submitter.id', 'books.submitted_by')
      .select(['books.id', 'books.title', 'books.author', 'books.cover_url', 'submitter.name as submitter_name'])
      .where('books.status', '=', 'submitted')
      .execute();

    // Also include books that were voted on but may have been rejected/deleted
    const votedBookIds = [...voteMap.keys()];
    const extraBookIds = votedBookIds.filter(id => !candidateBooks.find(b => b.id === id));
    let extraBooks: typeof candidateBooks = [];
    if (extraBookIds.length > 0) {
      extraBooks = await db
        .selectFrom('books')
        .leftJoin('users as submitter', 'submitter.id', 'books.submitted_by')
        .select(['books.id', 'books.title', 'books.author', 'books.cover_url', 'submitter.name as submitter_name'])
        .where('books.id', 'in', extraBookIds)
        .execute();
    }

    const allBooks = [...candidateBooks, ...extraBooks]
      .map(b => ({
        id: b.id,
        title: b.title,
        author: b.author,
        cover_url: b.cover_url,
        submitter_name: b.submitter_name ?? null,
        vote_count: voteMap.get(b.id) ?? 0,
      }))
      .sort((a, b) => b.vote_count - a.vote_count);

    result.books = allBooks;

    const top = allBooks[0];
    result.winner = top && top.vote_count > 0
      ? { id: top.id, title: top.title, author: top.author, cover_url: top.cover_url }
      : null;
  }

  return result;
}

export async function getSnapshotForSession(sessionId: number): Promise<SessionSnapshot | null> {
  const session = await db
    .selectFrom('book_selection_sessions')
    .select('id')
    .where('id', '=', sessionId)
    .executeTakeFirst();
  if (!session) return null;
  return buildSnapshot(sessionId);
}

export async function getOpenVotingSession(): Promise<SessionSnapshot | null> {
  const session = await db
    .selectFrom('book_selection_sessions')
    .select('id')
    .where('status', '!=', 'finalized')
    .orderBy('created_at', 'desc')
    .executeTakeFirst();

  if (!session) return null;
  return buildSnapshot(session.id);
}

export async function getUserVotesForSession(sessionId: number): Promise<number[]> {
  const sess = await getSession();
  if (!sess) return [];

  const votes = await db
    .selectFrom('book_selection_votes')
    .select('book_id')
    .where('session_id', '=', sessionId)
    .where('user_id', '=', sess.userId)
    .execute();

  return votes.map(v => v.book_id);
}

export async function getSubmittedBooksForVoting(): Promise<VotingBook[]> {
  return db
    .selectFrom('books')
    .leftJoin('users as submitter', 'submitter.id', 'books.submitted_by')
    .select(['books.id', 'books.title', 'books.author', 'books.cover_url', 'submitter.name as submitter_name'])
    .where('books.status', '=', 'submitted')
    .orderBy('books.created_at', 'asc')
    .execute()
    .then(rows => rows.map(r => ({ ...r, submitter_name: r.submitter_name ?? null })));
}

export async function startVotingSession(): Promise<{ error?: string; sessionId?: number }> {
  await requireAdmin();

  const existing = await db
    .selectFrom('book_selection_sessions')
    .select('id')
    .where('status', '!=', 'finalized')
    .executeTakeFirst();

  if (existing) return { error: 'A voting session is already active' };

  const books = await db
    .selectFrom('books')
    .select('id')
    .where('status', '=', 'submitted')
    .execute();

  if (books.length === 0) return { error: 'No submitted books to vote on' };

  const sess = await getSession();
  const result = await db
    .insertInto('book_selection_sessions')
    .values({ status: 'open', created_by: sess?.userId ?? null, closed_at: null, finalized_at: null })
    .executeTakeFirstOrThrow();

  const sessionId = Number(result.insertId);
  notifyVoteSessionChanged(sessionId);
  revalidatePath('/');
  revalidatePath('/admin');

  return { sessionId };
}

export async function castVote(
  sessionId: number,
  bookIds: number[],
): Promise<{ error?: string; success?: boolean }> {
  const sess = await getSession();
  if (!sess) return { error: 'Not authenticated' };

  const config = await getSelectionConfig();
  if (bookIds.length > config.votesPerMember) {
    return { error: `You can only vote for up to ${config.votesPerMember} book(s)` };
  }

  const session = await db
    .selectFrom('book_selection_sessions')
    .select(['id', 'status'])
    .where('id', '=', sessionId)
    .executeTakeFirst();

  if (!session || session.status !== 'open') {
    return { error: 'Voting session is not open' };
  }

  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom('book_selection_votes')
      .where('session_id', '=', sessionId)
      .where('user_id', '=', sess.userId)
      .execute();

    if (bookIds.length > 0) {
      await trx
        .insertInto('book_selection_votes')
        .values(bookIds.map(bookId => ({
          session_id: sessionId,
          book_id: bookId,
          user_id: sess.userId,
        })))
        .execute();
    }
  });

  notifyVoteSessionChanged(sessionId);
  return { success: true };
}

export async function closeVotingSession(
  sessionId: number,
): Promise<{ error?: string; snapshot?: SessionSnapshot }> {
  await requireAdmin();

  const session = await db
    .selectFrom('book_selection_sessions')
    .select(['id', 'status'])
    .where('id', '=', sessionId)
    .executeTakeFirst();

  if (!session || session.status !== 'open') {
    return { error: 'Session is not open' };
  }

  const now = Math.floor(Date.now() / 1000);
  await db
    .updateTable('book_selection_sessions')
    .set({ status: 'closed', closed_at: now })
    .where('id', '=', sessionId)
    .execute();

  const snapshot = await buildSnapshot(sessionId);
  notifyVoteSessionChanged(sessionId);
  revalidatePath('/admin');

  return { snapshot };
}

export async function finalizeVote(
  sessionId: number,
): Promise<{ error?: string; bookId?: number }> {
  await requireAdmin();

  const session = await db
    .selectFrom('book_selection_sessions')
    .select(['id', 'status'])
    .where('id', '=', sessionId)
    .executeTakeFirst();

  if (!session || session.status !== 'closed') {
    return { error: 'Session must be closed before finalizing' };
  }

  // Find top-voted book (tiebreak: earliest created_at)
  const topVote = await db
    .selectFrom('book_selection_votes')
    .innerJoin('books', 'books.id', 'book_selection_votes.book_id')
    .select([
      'book_selection_votes.book_id',
      db.fn.count<number>('book_selection_votes.user_id').as('vote_count'),
      'books.created_at',
    ])
    .where('book_selection_votes.session_id', '=', sessionId)
    .groupBy('book_selection_votes.book_id')
    .orderBy('vote_count', 'desc')
    .orderBy('books.created_at', 'asc')
    .executeTakeFirst();

  if (!topVote) return { error: 'No votes cast in this session' };

  const winnerBookId = topVote.book_id;
  const now = Math.floor(Date.now() / 1000);
  const config = await getSelectionConfig();

  const themeSetting = await db
    .selectFrom('club_settings')
    .select('value')
    .where('key', '=', 'next_book_theme')
    .executeTakeFirst();
  const theme = themeSetting?.value ?? null;

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('books')
      .set({ status: 'past', archived_at: now })
      .where('status', '=', 'current')
      .execute();

    await trx
      .updateTable('books')
      .set({ status: 'current', archived_at: null, theme })
      .where('id', '=', winnerBookId)
      .execute();

    if (config.purgeAfterSelection) {
      await trx
        .deleteFrom('books')
        .where('status', '=', 'submitted')
        .execute();
    }

    await trx
      .updateTable('book_selection_sessions')
      .set({ status: 'finalized', finalized_at: now })
      .where('id', '=', sessionId)
      .execute();
  });

  await db
    .deleteFrom('club_settings')
    .where('key', 'in', ['next_book_theme', 'next_meeting_at', 'next_meeting_location'])
    .execute();

  notifyVoteSessionChanged(sessionId);
  revalidatePath('/');
  revalidatePath('/admin');

  return { bookId: winnerBookId };
}

export async function reopenVotingSession(
  sessionId: number,
): Promise<{ error?: string; sessionId?: number }> {
  await requireAdmin();

  const session = await db
    .selectFrom('book_selection_sessions')
    .select(['id', 'status'])
    .where('id', '=', sessionId)
    .executeTakeFirst();

  if (!session || session.status !== 'closed') {
    return { error: 'Session must be closed to re-open for a revote' };
  }

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom('book_selection_votes').where('session_id', '=', sessionId).execute();
    await trx
      .updateTable('book_selection_sessions')
      .set({ status: 'open', closed_at: null })
      .where('id', '=', sessionId)
      .execute();
  });

  notifyVoteSessionChanged(sessionId);
  revalidatePath('/');
  revalidatePath('/admin');

  return { sessionId };
}

export async function startRandomSelection(gameType?: string): Promise<{
  error?: string;
  redirect?: string;
  bookId?: number;
}> {
  await requireAdmin();

  const config = await getSelectionConfig();

  const submittedBooks = await db
    .selectFrom('books')
    .select('id')
    .where('status', '=', 'submitted')
    .execute();

  if (submittedBooks.length === 0) return { error: 'No submitted books to pick from' };

  if (config.randomReveal) {
    // Reveal flow: create a reveal session and redirect to it
    const { createRevealSession } = await import('@/lib/actions/reveal-session');
    const result = await createRevealSession(gameType ?? 'wheel');
    if (result.error) return { error: result.error };
    return { redirect: `/select-book/reveal/${result.revealId}` };
  }

  // Direct pick (no reveal animation)
  const randomBook = submittedBooks[Math.floor(Math.random() * submittedBooks.length)];
  const now = Math.floor(Date.now() / 1000);

  const themeSetting = await db
    .selectFrom('club_settings')
    .select('value')
    .where('key', '=', 'next_book_theme')
    .executeTakeFirst();
  const theme = themeSetting?.value ?? null;

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('books')
      .set({ status: 'past', archived_at: now })
      .where('status', '=', 'current')
      .execute();

    await trx
      .updateTable('books')
      .set({ status: 'current', archived_at: null, theme })
      .where('id', '=', randomBook.id)
      .execute();

    if (config.purgeAfterSelection) {
      await trx
        .deleteFrom('books')
        .where('status', '=', 'submitted')
        .execute();
    }
  });

  await db
    .deleteFrom('club_settings')
    .where('key', 'in', ['next_book_theme', 'next_meeting_at', 'next_meeting_location'])
    .execute();

  revalidatePath('/');
  revalidatePath('/admin');

  return { bookId: randomBook.id };
}

export { isAdmin };
