'use server';

import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { requireAdmin } from '@/lib/actions/admin';
import { clubConfig } from '@/lib/config';
import { revalidatePath } from 'next/cache';

export type MeetingSettings = {
  nextMeetingAt: number | null;
  nextMeetingLocation: string | null;
};

export type ClubConfig = {
  name: string;
  primaryColor: string;
  logoUrl: string | null;
  reactPresets: string[];
  maxSubmissionsPerMember: number;
  thumbsUpEmoji: string;
  thumbsDownEmoji: string;
};

const CONFIG_KEYS = [
  'club_name',
  'primary_color',
  'logo_url',
  'react_presets',
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

  const reactPresetsRaw = map.get('react_presets');
  const reactPresets = reactPresetsRaw
    ? reactPresetsRaw.split(',').map(e => e.trim()).filter(Boolean)
    : clubConfig.reactPresets;

  const maxRaw = map.get('max_submissions');
  const maxSubmissionsPerMember = maxRaw
    ? (parseInt(maxRaw, 10) || clubConfig.maxSubmissionsPerMember)
    : clubConfig.maxSubmissionsPerMember;

  return {
    name: map.get('club_name') ?? clubConfig.name,
    primaryColor: map.get('primary_color') ?? clubConfig.primaryColor,
    logoUrl: map.has('logo_url') ? (map.get('logo_url') || null) : clubConfig.logoUrl,
    reactPresets,
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
    ['logo_url', (formData.get('logo_url') as string)?.trim() ?? null],
    ['react_presets', (formData.get('react_presets') as string)?.trim() || null],
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

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/submit');
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
