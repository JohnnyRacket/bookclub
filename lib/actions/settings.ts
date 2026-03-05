'use server';

import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export type MeetingSettings = {
  nextMeetingAt: number | null;
  nextMeetingLocation: string | null;
};

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
