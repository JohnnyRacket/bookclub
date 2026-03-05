'use server';

import { db } from '@/lib/db/client';
import { requireAdmin } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';

export type SubmittedBookRow = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  submitter_name: string | null;
  created_at: number;
};

export async function getSubmittedBooks(): Promise<SubmittedBookRow[]> {
  await requireAdmin();

  return db
    .selectFrom('books')
    .leftJoin('users as submitter', 'submitter.id', 'books.submitted_by')
    .select([
      'books.id',
      'books.title',
      'books.author',
      'books.cover_url',
      'books.created_at',
      'submitter.name as submitter_name',
    ])
    .where('books.status', '=', 'submitted')
    .orderBy('books.created_at', 'asc')
    .execute();
}

export async function setCurrentBook(bookId: number): Promise<void> {
  await requireAdmin();

  const now = Math.floor(Date.now() / 1000);
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('books')
      .set({ status: 'past', archived_at: now })
      .where('status', '=', 'current')
      .execute();

    await trx
      .updateTable('books')
      .set({ status: 'current', archived_at: null })
      .where('id', '=', bookId)
      .execute();
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteSubmittedBook(bookId: number): Promise<void> {
  await requireAdmin();

  await db
    .deleteFrom('books')
    .where('id', '=', bookId)
    .where('status', '=', 'submitted')
    .execute();

  revalidatePath('/admin');
}
