'use server';

import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { requireAdmin } from '@/lib/actions/admin';
import { clubConfig } from '@/lib/config';
import { revalidatePath } from 'next/cache';
import { saveUploadedCover } from '@/lib/images/covers';

export type MeetingSettings = {
  nextMeetingAt: number | null;
  nextMeetingLocation: string | null;
};

export type ClubConfig = {
  name: string;
  primaryColor: string;
  logoUrl: string | null;
  emojiReactions: string[];
  maxSubmissionsPerMember: number;
  thumbsUpEmoji: string;
  thumbsDownEmoji: string;
};

const CONFIG_KEYS = [
  'club_name',
  'primary_color',
  'logo_url',
  'emoji_reactions',
  'max_submissions',
  'thumbs_up_emoji',
  'thumbs_down_emoji',
] as const;

export async function getMeetingSettings(): Promise<MeetingSettings> {
  const rows = await db
    .selectFrom('club_settings')
    .select(['key', 'value'])
    .where('key', 'in', ['next_meeting_at', 'next_meeting_location'])
    .execute();

  const map = new Map(rows.map(r => [r.key, r.value]));
  return {
    nextMeetingAt: map.has('next_meeting_at') ? Number(map.get('next_meeting_at')) : null,
    nextMeetingLocation: map.get('next_meeting_location') ?? null,
  };
}

export async function getClubConfig(): Promise<ClubConfig> {
  const rows = await db
    .selectFrom('club_settings')
    .select(['key', 'value'])
    .where('key', 'in', [...CONFIG_KEYS])
    .execute();

  const map = new Map(rows.map(r => [r.key, r.value]));

  // emoji_reactions: map.has distinguishes "not configured" (use default) from "" (0 emojis)
  const emojiReactions = map.has('emoji_reactions')
    ? (map.get('emoji_reactions') ?? '').split(',').map(e => e.trim()).filter(Boolean)
    : clubConfig.emojiReactions;

  const maxRaw = map.get('max_submissions');
  const maxSubmissionsPerMember = maxRaw
    ? (parseInt(maxRaw, 10) || clubConfig.maxSubmissionsPerMember)
    : clubConfig.maxSubmissionsPerMember;

  return {
    name: map.get('club_name') ?? clubConfig.name,
    primaryColor: map.get('primary_color') ?? clubConfig.primaryColor,
    logoUrl: map.has('logo_url') ? (map.get('logo_url') || null) : null,
    emojiReactions,
    maxSubmissionsPerMember,
    thumbsUpEmoji: map.get('thumbs_up_emoji') ?? clubConfig.thumbsUpEmoji,
    thumbsDownEmoji: map.get('thumbs_down_emoji') ?? clubConfig.thumbsDownEmoji,
  };
}

export async function updateClubConfig(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const fields: Array<[string, string | null]> = [
    ['club_name', (formData.get('club_name') as string)?.trim() || null],
    ['primary_color', (formData.get('primary_color') as string)?.trim() || null],
    ['max_submissions', (formData.get('max_submissions') as string)?.trim() || null],
    ['thumbs_up_emoji', (formData.get('thumbs_up_emoji') as string)?.trim() || null],
    ['thumbs_down_emoji', (formData.get('thumbs_down_emoji') as string)?.trim() || null],
  ];

  for (const [key, value] of fields) {
    if (value !== null) {
      await db
        .insertInto('club_settings')
        .values({ key, value })
        .onConflict(oc => oc.column('key').doUpdateSet({ value }))
        .execute();
    }
  }

  // emoji_reactions: always upsert so empty string (0 emojis) is preserved
  const emojiReactionsValue = (formData.get('emoji_reactions') as string)?.trim() ?? '';
  await db
    .insertInto('club_settings')
    .values({ key: 'emoji_reactions', value: emojiReactionsValue })
    .onConflict(oc => oc.column('key').doUpdateSet({ value: emojiReactionsValue }))
    .execute();

  // Logo: file upload, remove, or leave unchanged
  const logoRemove = formData.get('logo_remove') === '1';
  const logoFile = formData.get('logo_file');
  if (logoRemove) {
    await db.deleteFrom('club_settings').where('key', '=', 'logo_url').execute();
  } else if (logoFile instanceof File && logoFile.size > 0) {
    const logoPath = await saveUploadedCover(logoFile);
    if (logoPath) {
      await db
        .insertInto('club_settings')
        .values({ key: 'logo_url', value: logoPath })
        .onConflict(oc => oc.column('key').doUpdateSet({ value: logoPath }))
        .execute();
    }
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/submit');
  return { success: true };
}

export async function getNextBookTheme(): Promise<string | null> {
  const row = await db
    .selectFrom('club_settings')
    .select('value')
    .where('key', '=', 'next_book_theme')
    .executeTakeFirst();
  return row?.value ?? null;
}

export async function updateNextBookTheme(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const theme = (formData.get('next_book_theme') as string)?.trim() ?? '';

  if (theme) {
    await db
      .insertInto('club_settings')
      .values({ key: 'next_book_theme', value: theme })
      .onConflict(oc => oc.column('key').doUpdateSet({ value: theme }))
      .execute();
  } else {
    await db.deleteFrom('club_settings').where('key', '=', 'next_book_theme').execute();
  }

  revalidatePath('/');
  revalidatePath('/theme');
  return { success: true };
}

export async function updateMeetingSettings(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const dtValue = formData.get('next_meeting_at') as string;
  const location = (formData.get('next_meeting_location') as string)?.trim() ?? '';

  if (dtValue) {
    const ts = Math.floor(new Date(dtValue).getTime() / 1000);
    if (!isNaN(ts)) {
      await db
        .insertInto('club_settings')
        .values({ key: 'next_meeting_at', value: String(ts) })
        .onConflict(oc => oc.column('key').doUpdateSet({ value: String(ts) }))
        .execute();
    }
  }

  await db
    .insertInto('club_settings')
    .values({ key: 'next_meeting_location', value: location })
    .onConflict(oc => oc.column('key').doUpdateSet({ value: location }))
    .execute();

  revalidatePath('/');
  revalidatePath('/meeting');
  return { success: true };
}
