'use server';

import { db } from '@/lib/db/client';
import { requireAdmin } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import { downloadCover, saveUploadedCover } from '@/lib/images/covers';

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

  const themeSetting = await db
    .selectFrom('club_settings')
    .select('value')
    .where('key', '=', 'next_book_theme')
    .executeTakeFirst();
  const theme = themeSetting?.value ?? null;

  const now = Math.floor(Date.now() / 1000);
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('books')
      .set({ status: 'past', archived_at: now })
      .where('status', '=', 'current')
      .execute();

    await trx
      .updateTable('books')
      .set({ status: 'current', archived_at: null, theme })
      .where('id', '=', bookId)
      .execute();
  });

  await db
    .deleteFrom('club_settings')
    .where('key', 'in', ['next_book_theme', 'next_meeting_at', 'next_meeting_location'])
    .execute();

  revalidatePath('/');
  revalidatePath('/admin');
}

export type CurrentBookAdmin = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  pages: number | null;
  year: number | null;
  genres: string | null;
};

export async function getCurrentBookAdmin(): Promise<CurrentBookAdmin | null> {
  await requireAdmin();
  return (
    (await db
      .selectFrom('books')
      .select(['id', 'title', 'author', 'cover_url', 'pages', 'year', 'genres'])
      .where('status', '=', 'current')
      .executeTakeFirst()) ?? null
  );
}

export async function updateBook(bookId: number, formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const title = (formData.get('title') as string)?.trim();
  const author = (formData.get('author') as string)?.trim();
  if (!title || !author) return { error: 'Title and author are required' };

  const pagesVal = formData.get('pages') as string;
  const pages = pagesVal ? Number(pagesVal) : null;
  const yearVal = formData.get('year') as string;
  const year = yearVal ? Number(yearVal) : null;
  const genresRaw = (formData.get('genres') as string)?.trim();
  const genres = genresRaw
    ? JSON.stringify(genresRaw.split(',').map((g) => g.trim()).filter(Boolean))
    : null;

  let cover_url = (formData.get('existing_cover_url') as string) || null;
  const uploadedFile = formData.get('cover_file') as File | null;
  const olCoverUrl = (formData.get('cover_url') as string)?.trim() || null;

  if (uploadedFile && uploadedFile.size > 0) {
    const saved = await saveUploadedCover(uploadedFile);
    if (saved) cover_url = saved;
  } else if (olCoverUrl) {
    const downloaded = await downloadCover(olCoverUrl);
    if (downloaded) cover_url = downloaded;
  }

  await db
    .updateTable('books')
    .set({ title, author, cover_url, pages, year, genres })
    .where('id', '=', bookId)
    .execute();

  revalidatePath('/');
  revalidatePath('/admin');
  return {};
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

export async function overrideCurrentBook(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const title = (formData.get('title') as string)?.trim();
  const author = (formData.get('author') as string)?.trim();
  if (!title || !author) return { error: 'Title and author are required' };

  const pagesVal = formData.get('pages') as string;
  const pages = pagesVal ? Number(pagesVal) : null;
  const yearVal = formData.get('year') as string;
  const year = yearVal ? Number(yearVal) : null;
  const genresRaw = (formData.get('genres') as string)?.trim();
  const genres = genresRaw
    ? JSON.stringify(genresRaw.split(',').map((g) => g.trim()).filter(Boolean))
    : null;
  const ol_key = (formData.get('ol_key') as string)?.trim() || null;
  const submissions_action = (formData.get('submissions_action') as string) === 'delete' ? 'delete' : 'keep';

  let cover_url: string | null = null;
  const uploadedFile = formData.get('cover_file') as File | null;
  const olCoverUrl = (formData.get('cover_url') as string)?.trim() || null;

  if (uploadedFile && uploadedFile.size > 0) {
    const saved = await saveUploadedCover(uploadedFile);
    if (saved) cover_url = saved;
  } else if (olCoverUrl) {
    const downloaded = await downloadCover(olCoverUrl);
    if (downloaded) cover_url = downloaded;
  }

  const now = Math.floor(Date.now() / 1000);
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('books')
      .set({ status: 'past', archived_at: now })
      .where('status', '=', 'current')
      .execute();

    await trx
      .insertInto('books')
      .values({
        status: 'current',
        title,
        author,
        cover_url,
        pages,
        year,
        genres,
        ol_key,
        submitted_by: null,
        theme: null,
        archived_at: null,
      })
      .execute();

    if (submissions_action === 'delete') {
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
  return { success: true };
}

export async function addPastBook(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const title = (formData.get('title') as string)?.trim();
  const author = (formData.get('author') as string)?.trim();
  if (!title || !author) return { error: 'Title and author are required' };

  const readDateStr = (formData.get('read_date') as string)?.trim();
  if (!readDateStr) return { error: 'Date Read is required' };
  const readDateMs = Date.parse(readDateStr);
  if (isNaN(readDateMs)) return { error: 'Invalid date' };
  const archived_at = Math.floor(readDateMs / 1000);

  const pagesVal = formData.get('pages') as string;
  const pages = pagesVal ? Number(pagesVal) : null;
  const yearVal = formData.get('year') as string;
  const year = yearVal ? Number(yearVal) : null;
  const genresRaw = (formData.get('genres') as string)?.trim();
  const genres = genresRaw
    ? JSON.stringify(genresRaw.split(',').map((g) => g.trim()).filter(Boolean))
    : null;

  const submittedByIdRaw = formData.get('submitted_by_id') as string;
  const submitted_by = submittedByIdRaw ? Number(submittedByIdRaw) : null;
  const themeRaw = (formData.get('theme') as string)?.trim();
  const theme = themeRaw || null;

  let cover_url: string | null = null;
  const uploadedFile = formData.get('cover_file') as File | null;
  const olCoverUrl = (formData.get('cover_url') as string)?.trim() || null;

  if (uploadedFile && uploadedFile.size > 0) {
    const saved = await saveUploadedCover(uploadedFile);
    if (saved) cover_url = saved;
  } else if (olCoverUrl) {
    const downloaded = await downloadCover(olCoverUrl);
    if (downloaded) cover_url = downloaded;
  }

  await db
    .insertInto('books')
    .values({
      status: 'past',
      title,
      author,
      cover_url,
      pages,
      year,
      genres,
      ol_key: null,
      submitted_by,
      theme,
      archived_at,
    })
    .execute();

  revalidatePath('/past-reads');
  revalidatePath('/admin');
  return { success: true };
}
