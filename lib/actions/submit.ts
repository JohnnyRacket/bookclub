'use server';

import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { getClubConfig } from '@/lib/actions/settings';
import { revalidatePath } from 'next/cache';
import { downloadCover, saveUploadedCover } from '@/lib/images/covers';
import { isCleanTag } from '@/lib/utils/tags';

export type MySubmission = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  created_at: number;
  status: string;
};

export async function getMySubmissions(): Promise<MySubmission[]> {
  const session = await getSession();
  if (!session) return [];

  return db
    .selectFrom('books')
    .select(['id', 'title', 'author', 'cover_url', 'created_at', 'status'])
    .where('submitted_by', '=', session.userId)
    .where('status', '=', 'submitted')
    .orderBy('created_at', 'desc')
    .execute();
}

export async function submitBook(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const { maxSubmissionsPerMember: max } = await getClubConfig();
  const countRow = await db
    .selectFrom('books')
    .select(db.fn.count<number>('id').as('cnt'))
    .where('submitted_by', '=', session.userId)
    .where('status', '=', 'submitted')
    .executeTakeFirstOrThrow();

  if (Number(countRow.cnt) >= max) {
    return { error: `You can only have ${max} pending submission${max !== 1 ? 's' : ''} at a time` };
  }

  const title = (formData.get('title') as string)?.trim();
  const author = (formData.get('author') as string)?.trim();
  if (!title || !author) return { error: 'Title and author are required' };

  let cover_url: string | null = null
  const uploadedFile = formData.get('cover_file') as File | null
  const olCoverUrl = (formData.get('cover_url') as string)?.trim() || null

  if (uploadedFile && uploadedFile.size > 0) {
    cover_url = await saveUploadedCover(uploadedFile)
  } else if (olCoverUrl) {
    cover_url = await downloadCover(olCoverUrl)
  }
  const pagesVal = formData.get('pages') as string;
  const pages = pagesVal ? Number(pagesVal) : null;
  const yearVal = formData.get('year') as string;
  const year = yearVal ? Number(yearVal) : null;
  const genresRaw = (formData.get('genres') as string)?.trim();
  const genres = genresRaw
    ? JSON.stringify(genresRaw.split(',').map(g => g.trim()).filter(g => Boolean(g) && isCleanTag(g)))
    : null;
  const ol_key = (formData.get('ol_key') as string)?.trim() || null;

  await db
    .insertInto('books')
    .values({
      status: 'submitted',
      title,
      author,
      cover_url,
      pages,
      year,
      genres,
      ol_key,
      submitted_by: session.userId,
      archived_at: null,
    })
    .execute();

  revalidatePath('/submit');
  return { success: true };
}
