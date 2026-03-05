import { db } from '@/lib/db/client';

const OL_BASE = 'https://openlibrary.org';
const COVER_BASE = 'https://covers.openlibrary.org/b/id';

export interface OLSearchResult {
  olKey: string;
  title: string;
  author: string;
  coverUrl: string | null;
  year: number | null;
  pages: number | null;
  genres: string[];
}

export interface OLWorkDetails {
  synopsis: string | null;
}

async function getCached<T>(cacheKey: string, ttlSeconds: number): Promise<T | null> {
  const row = await db
    .selectFrom('ol_cache')
    .select(['data', 'cached_at'])
    .where('cache_key', '=', cacheKey)
    .executeTakeFirst();

  if (!row) return null;

  const age = Math.floor(Date.now() / 1000) - row.cached_at;
  if (age > ttlSeconds) return null;

  try {
    return JSON.parse(row.data) as T;
  } catch {
    return null;
  }
}

async function setCache(cacheKey: string, data: unknown): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const json = JSON.stringify(data);
  await db
    .insertInto('ol_cache')
    .values({ cache_key: cacheKey, data: json, cached_at: now })
    .onConflict(oc => oc.column('cache_key').doUpdateSet({ data: json, cached_at: now }))
    .execute();
}

export async function searchBooks(query: string): Promise<OLSearchResult[]> {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = await getCached<OLSearchResult[]>(cacheKey, 60 * 60); // 1 hour
  if (cached) return cached;

  const url = `${OL_BASE}/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject&limit=10`;
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as { docs?: any[] };
  const results: OLSearchResult[] = (data.docs ?? []).map((doc) => ({
    olKey: (doc.key as string)?.replace('/works/', '') ?? '',
    title: (doc.title as string) ?? '',
    author: Array.isArray(doc.author_name) ? (doc.author_name[0] as string) : ((doc.author_name as string) ?? 'Unknown'),
    coverUrl: doc.cover_i ? `${COVER_BASE}/${doc.cover_i as number}-M.jpg` : null,
    year: (doc.first_publish_year as number) ?? null,
    pages: (doc.number_of_pages_median as number) ?? null,
    genres: Array.isArray(doc.subject) ? (doc.subject as string[]).slice(0, 5) : [],
  }));

  await setCache(cacheKey, results);
  return results;
}

export async function getWorkDetails(olKey: string): Promise<OLWorkDetails> {
  const cacheKey = `work:${olKey}`;
  const cached = await getCached<OLWorkDetails>(cacheKey, 60 * 60 * 24 * 7); // 7 days
  if (cached) return cached;

  const url = `${OL_BASE}/works/${olKey}.json`;
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch {
    return { synopsis: null };
  }
  if (!res.ok) return { synopsis: null };

  const data = await res.json() as { description?: string | { value: string } };
  let synopsis: string | null = null;
  if (data.description) {
    synopsis = typeof data.description === 'string'
      ? data.description
      : (data.description as { value: string }).value ?? null;
  }

  const result: OLWorkDetails = { synopsis };
  await setCache(cacheKey, result);
  return result;
}
