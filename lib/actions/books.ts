'use server';

import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export type BookReact = {
  emoji: string;
  count: number;
  userReacted: boolean;
  users: string[]; // names of reactors, current user first if they reacted
};

export type BookWithStats = {
  id: number;
  status: string;
  title: string;
  author: string;
  cover_url: string | null;
  pages: number | null;
  year: number | null;
  genres: string | null;
  ol_key: string | null;
  submitted_by: number | null;
  submitter_name: string | null;
  created_at: number;
  archived_at: number | null;
  up_count: number;
  down_count: number;
  user_thumb: 1 | -1 | null;
  reacts: BookReact[];
};

async function getBookStats(bookId: number, userId: number | null) {
  const thumbRows = await db
    .selectFrom('book_thumbs')
    .select(['value', db.fn.count<number>('user_id').as('cnt')])
    .where('book_id', '=', bookId)
    .groupBy('value')
    .execute();

  let up_count = 0, down_count = 0;
  for (const r of thumbRows) {
    if (Number(r.value) === 1) up_count = Number(r.cnt);
    else down_count = Number(r.cnt);
  }

  let user_thumb: 1 | -1 | null = null;
  if (userId) {
    const utRow = await db
      .selectFrom('book_thumbs')
      .select('value')
      .where('book_id', '=', bookId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    user_thumb = utRow ? (utRow.value as 1 | -1) : null;
  }

  // Fetch all reacts with reactor names in one join query, oldest first
  const reactUserRows = await db
    .selectFrom('book_reacts')
    .innerJoin('users', 'users.id', 'book_reacts.user_id')
    .select(['book_reacts.emoji', 'book_reacts.user_id', 'users.name'])
    .where('book_reacts.book_id', '=', bookId)
    .orderBy('book_reacts.created_at', 'asc')
    .execute();

  // Group by emoji — Map preserves insertion order, so first emoji seen = first reacted
  const groups = new Map<string, { id: number; name: string }[]>();
  for (const row of reactUserRows) {
    if (!groups.has(row.emoji)) groups.set(row.emoji, []);
    groups.get(row.emoji)!.push({ id: row.user_id, name: row.name });
  }

  const reacts: BookReact[] = Array.from(groups.entries()).map(([emoji, reactors]) => {
    return {
      emoji,
      count: reactors.length,
      userReacted: userId ? reactors.some(u => u.id === userId) : false,
      users: userId
        ? [...reactors.filter(u => u.id === userId), ...reactors.filter(u => u.id !== userId)].map(u => u.name)
        : reactors.map(u => u.name),
    };
  });

  return { up_count, down_count, user_thumb, reacts };
}

function bookBaseQuery(status: string) {
  return db
    .selectFrom('books')
    .leftJoin('users as submitter', 'submitter.id', 'books.submitted_by')
    .select([
      'books.id',
      'books.status',
      'books.title',
      'books.author',
      'books.cover_url',
      'books.pages',
      'books.year',
      'books.genres',
      'books.ol_key',
      'books.submitted_by',
      'books.created_at',
      'books.archived_at',
      'submitter.name as submitter_name',
    ])
    .where('books.status', '=', status);
}

export async function getCurrentBook(): Promise<BookWithStats | null> {
  const session = await getSession();
  const userId = session?.userId ?? null;

  const book = await bookBaseQuery('current').executeTakeFirst();
  if (!book) return null;

  const stats = await getBookStats(book.id, userId);
  return { ...book, ...stats };
}

export async function getPastBooks(): Promise<BookWithStats[]> {
  const session = await getSession();
  const userId = session?.userId ?? null;

  const books = await bookBaseQuery('past').orderBy('books.archived_at', 'desc').execute();
  return Promise.all(
    books.map(async (book) => {
      const stats = await getBookStats(book.id, userId);
      return { ...book, ...stats };
    })
  );
}

export async function thumbBook(bookId: number, value: 1 | -1): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const book = await db
    .selectFrom('books')
    .select('status')
    .where('id', '=', bookId)
    .executeTakeFirst();
  if (!book || book.status !== 'current') throw new Error('Book not available for voting');

  const existing = await db
    .selectFrom('book_thumbs')
    .select('value')
    .where('book_id', '=', bookId)
    .where('user_id', '=', session.userId)
    .executeTakeFirst();

  if (existing) {
    if (Number(existing.value) === value) {
      await db
        .deleteFrom('book_thumbs')
        .where('book_id', '=', bookId)
        .where('user_id', '=', session.userId)
        .execute();
    } else {
      await db
        .updateTable('book_thumbs')
        .set({ value })
        .where('book_id', '=', bookId)
        .where('user_id', '=', session.userId)
        .execute();
    }
  } else {
    await db
      .insertInto('book_thumbs')
      .values({
        book_id: bookId,
        user_id: session.userId,
        value,
        created_at: Math.floor(Date.now() / 1000),
      })
      .execute();
  }

  revalidatePath('/');
}

export async function reactBook(bookId: number, emoji: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const book = await db
    .selectFrom('books')
    .select('status')
    .where('id', '=', bookId)
    .executeTakeFirst();
  if (!book || book.status !== 'current') throw new Error('Book not available for reacting');

  const existing = await db
    .selectFrom('book_reacts')
    .select('emoji')
    .where('book_id', '=', bookId)
    .where('user_id', '=', session.userId)
    .where('emoji', '=', emoji)
    .executeTakeFirst();

  if (existing) {
    await db
      .deleteFrom('book_reacts')
      .where('book_id', '=', bookId)
      .where('user_id', '=', session.userId)
      .where('emoji', '=', emoji)
      .execute();
  } else {
    await db
      .insertInto('book_reacts')
      .values({
        book_id: bookId,
        user_id: session.userId,
        emoji,
        created_at: Math.floor(Date.now() / 1000),
      })
      .execute();
  }

  revalidatePath('/');
}
