'use server';

import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { saveUploadedReaction, deleteReactionFile } from '@/lib/images/reactions';
import { requireAdmin } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type CustomReaction = {
  id: number;
  image_path: string;
  label: string | null;
};

export async function getCustomReactions(): Promise<CustomReaction[]> {
  return db
    .selectFrom('custom_reactions')
    .select(['id', 'image_path', 'label'])
    .orderBy('created_at', 'desc')
    .execute();
}

export async function addCustomReaction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect('/join');

  const file = formData.get('image') as File | null;
  if (!file || file.size === 0) return { error: 'Please select an image.' };
  if (file.size > 8 * 1024 * 1024) return { error: 'Image must be under 8 MB.' };
  if (!file.type.startsWith('image/')) return { error: 'File must be an image.' };

  const image_path = await saveUploadedReaction(file);
  if (!image_path) return { error: 'Failed to save image.' };

  const label = (formData.get('label') as string)?.trim() || null;

  await db
    .insertInto('custom_reactions')
    .values({ image_path, label, uploaded_by: session.userId })
    .execute();

  revalidatePath('/');
  redirect('/');
}

export async function deleteCustomReaction(id: number): Promise<{ error?: string }> {
  await requireAdmin();
  const row = await db.selectFrom('custom_reactions').select('image_path').where('id', '=', id).executeTakeFirst();
  if (row) deleteReactionFile(row.image_path);
  await db.deleteFrom('custom_reactions').where('id', '=', id).execute();
  revalidatePath('/');
  revalidatePath('/admin');
  return {};
}
