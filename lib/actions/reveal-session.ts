'use server';

import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { requireAdmin } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import {
  notifyRevealChanged,
  notifyRevealStart,
  clearRevealStartPayload,
  type RevealStartPayload,
} from '@/lib/events/reveal-session-emitter';
import { randomInt } from 'crypto';

export type RevealBook = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  submitter_name: string | null;
};

export type RevealSession = {
  id: number;
  game_type: string;
  status: string;
  winner_book_id: number;
  seed: number;
  books: RevealBook[];
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
};

async function parseSession(row: {
  id: number;
  game_type: string;
  status: string;
  winner_book_id: number;
  seed: number;
  books_json: string;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
}): Promise<RevealSession> {
  return {
    id: row.id,
    game_type: row.game_type,
    status: row.status,
    winner_book_id: row.winner_book_id,
    seed: row.seed,
    books: JSON.parse(row.books_json) as RevealBook[],
    created_at: row.created_at,
    started_at: row.started_at,
    finished_at: row.finished_at,
  };
}

export async function createRevealSession(
  gameType: string,
): Promise<{ error?: string; revealId?: number }> {
  await requireAdmin();

  const submittedBooks = await db
    .selectFrom('books')
    .leftJoin('users as submitter', 'submitter.id', 'books.submitted_by')
    .select(['books.id', 'books.title', 'books.author', 'books.cover_url', 'submitter.name as submitter_name'])
    .where('books.status', '=', 'submitted')
    .orderBy('books.created_at', 'asc')
    .execute();

  if (submittedBooks.length === 0) return { error: 'No submitted books to pick from' };

  const winnerIndex = randomInt(submittedBooks.length);
  const winner = submittedBooks[winnerIndex];
  const seed = randomInt(0, 2147483647);

  const sess = await getSession();
  const booksJson = JSON.stringify(
    submittedBooks.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover_url: b.cover_url ?? null,
      submitter_name: b.submitter_name ?? null,
    })),
  );

  const result = await db
    .insertInto('reveal_sessions')
    .values({
      game_type: gameType,
      status: 'lobby',
      winner_book_id: winner.id,
      seed,
      books_json: booksJson,
      created_by: sess?.userId ?? null,
    })
    .executeTakeFirstOrThrow();

  const revealId = Number(result.insertId);
  notifyRevealChanged(revealId);
  revalidatePath('/');

  return { revealId };
}

export async function getRevealSession(revealId: number): Promise<RevealSession | null> {
  const row = await db
    .selectFrom('reveal_sessions')
    .selectAll()
    .where('id', '=', revealId)
    .executeTakeFirst();

  if (!row) return null;
  return parseSession(row);
}

export async function getActiveRevealSession(): Promise<{ id: number; status: string } | null> {
  const row = await db
    .selectFrom('reveal_sessions')
    .select(['id', 'status'])
    .where('status', 'not in', ['finalized'])
    .orderBy('created_at', 'desc')
    .executeTakeFirst();

  return row ?? null;
}

export async function startReveal(
  revealId: number,
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const row = await db
    .selectFrom('reveal_sessions')
    .selectAll()
    .where('id', '=', revealId)
    .executeTakeFirst();

  if (!row) return { error: 'Reveal session not found' };
  if (row.status !== 'lobby') return { error: 'Session is not in lobby state' };

  const now = Math.floor(Date.now() / 1000);
  await db
    .updateTable('reveal_sessions')
    .set({ status: 'playing', started_at: now })
    .where('id', '=', revealId)
    .execute();

  const books: RevealBook[] = JSON.parse(row.books_json);
  const payload: RevealStartPayload = {
    game_type: row.game_type,
    seed: row.seed,
    winner_book_id: row.winner_book_id,
    books,
    started_at: now,
  };

  notifyRevealStart(revealId, payload);
  return { success: true };
}

export async function markRevealFinished(
  revealId: number,
): Promise<{ error?: string; success?: boolean }> {
  const sess = await getSession();
  if (!sess) return { error: 'Not authenticated' };

  await db
    .updateTable('reveal_sessions')
    .set({ status: 'finished', finished_at: Math.floor(Date.now() / 1000) })
    .where('id', '=', revealId)
    .where('status', '=', 'playing')
    .execute();

  notifyRevealChanged(revealId);
  return { success: true };
}

export async function finalizeReveal(
  revealId: number,
): Promise<{ error?: string; bookId?: number }> {
  await requireAdmin();

  const row = await db
    .selectFrom('reveal_sessions')
    .selectAll()
    .where('id', '=', revealId)
    .executeTakeFirst();

  if (!row) return { error: 'Reveal session not found' };
  if (row.status !== 'finished') return { error: 'Animation must complete before finalizing' };

  const winnerBookId = row.winner_book_id;
  const now = Math.floor(Date.now() / 1000);

  const themeSetting = await db
    .selectFrom('club_settings')
    .select('value')
    .where('key', '=', 'next_book_theme')
    .executeTakeFirst();
  const theme = themeSetting?.value ?? null;

  const purgeRow = await db
    .selectFrom('club_settings')
    .select('value')
    .where('key', '=', 'purge_after_selection')
    .executeTakeFirst();
  const purge = purgeRow?.value !== '0';

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

    if (purge) {
      await trx
        .deleteFrom('books')
        .where('status', '=', 'submitted')
        .execute();
    }

    await trx
      .updateTable('reveal_sessions')
      .set({ status: 'finalized', finished_at: now })
      .where('id', '=', revealId)
      .execute();
  });

  await db
    .deleteFrom('club_settings')
    .where('key', 'in', ['next_book_theme', 'next_meeting_at', 'next_meeting_location'])
    .execute();

  notifyRevealChanged(revealId);
  revalidatePath('/');
  revalidatePath('/admin');

  return { bookId: winnerBookId };
}

export async function redoReveal(
  revealId: number,
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const row = await db
    .selectFrom('reveal_sessions')
    .selectAll()
    .where('id', '=', revealId)
    .executeTakeFirst();

  if (!row) return { error: 'Reveal session not found' };
  if (row.status !== 'finished') return { error: 'Can only redo a finished session' };

  const books: RevealBook[] = JSON.parse(row.books_json);
  const newSeed = randomInt(0, 2147483647);
  const newWinner = books[randomInt(books.length)];

  await db
    .updateTable('reveal_sessions')
    .set({
      status: 'lobby',
      seed: newSeed,
      winner_book_id: newWinner.id,
      started_at: null,
      finished_at: null,
    })
    .where('id', '=', revealId)
    .execute();

  clearRevealStartPayload(revealId);
  notifyRevealChanged(revealId);

  return { success: true };
}
