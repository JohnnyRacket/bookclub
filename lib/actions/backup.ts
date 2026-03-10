import AdmZip from 'adm-zip';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db/client';
import { clubConfig } from '@/lib/config';

const COVERS_DIR = path.join(process.cwd(), 'public', 'covers');
const REACTIONS_DIR = path.join(process.cwd(), 'public', 'reactions');

// ---- CSV helpers ----

export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  return [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n');
}

export function csvToRows(csv: string): Record<string, string>[] {
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) { cells.push(cur); cur = ''; }
      else cur += c;
    }
    cells.push(cur);
    return cells;
  };
  const headers = parseRow(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

// ---- Export ----

export async function buildBackupZip(): Promise<{ buffer: Buffer; filename: string }> {
  const zip = new AdmZip();

  const tables = [
    { name: 'users',                   rows: await db.selectFrom('users').selectAll().execute() },
    { name: 'books',                   rows: await db.selectFrom('books').selectAll().execute() },
    { name: 'book_thumbs',             rows: await db.selectFrom('book_thumbs').selectAll().execute() },
    { name: 'book_reacts',             rows: await db.selectFrom('book_reacts').selectAll().execute() },
    { name: 'club_settings',           rows: await db.selectFrom('club_settings').selectAll().execute() },
    { name: 'custom_reactions',        rows: await db.selectFrom('custom_reactions').selectAll().execute() },
    { name: 'book_selection_sessions', rows: await db.selectFrom('book_selection_sessions').selectAll().execute() },
    { name: 'book_selection_votes',    rows: await db.selectFrom('book_selection_votes').selectAll().execute() },
    { name: 'reveal_sessions',         rows: await db.selectFrom('reveal_sessions').selectAll().execute() },
  ];

  for (const { name, rows } of tables) {
    zip.addFile(`data/${name}.csv`, Buffer.from(rowsToCsv(rows as Record<string, unknown>[]), 'utf8'));
  }

  const addDir = (dir: string, zipFolder: string) => {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      if (fs.statSync(full).isFile()) {
        zip.addFile(`${zipFolder}/${file}`, fs.readFileSync(full));
      }
    }
  };
  addDir(COVERS_DIR, 'covers');
  addDir(REACTIONS_DIR, 'reactions');

  const clubName = (clubConfig.name ?? 'bookclub').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  const filename = `bookclub-backup-${clubName}-${date}.zip`;

  return { buffer: zip.toBuffer(), filename };
}

// ---- Import ----

async function downloadToLocal(url: string, targetDir: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const urlPath = new URL(url).pathname;
    const ext = path.extname(urlPath) || '.jpg';
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, filename), buf);
    return filename;
  } catch {
    return null;
  }
}

function restoreImages(zip: AdmZip, zipFolder: string, targetDir: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  zip.getEntries()
    .filter(e => e.entryName.startsWith(`${zipFolder}/`) && !e.isDirectory)
    .forEach(e => {
      const origFilename = path.basename(e.entryName);
      let destFilename = origFilename;
      if (fs.existsSync(path.join(targetDir, destFilename))) {
        destFilename = `${crypto.randomBytes(4).toString('hex')}-${origFilename}`;
      }
      fs.writeFileSync(path.join(targetDir, destFilename), e.getData());
      map.set(origFilename, destFilename);
    });
  return map;
}

async function resolveCoverUrl(
  original: string | null,
  coverMap: Map<string, string>,
): Promise<string | null> {
  if (!original) return null;
  if (original.startsWith('/covers/')) {
    const file = path.basename(original);
    const newFile = coverMap.get(file) ?? file;
    return `/covers/${newFile}`;
  }
  // Remote URL — download and save locally
  if (original.startsWith('http')) {
    const filename = await downloadToLocal(original, COVERS_DIR);
    return filename ? `/covers/${filename}` : null;
  }
  return null;
}

export async function restoreFromZip(
  zipBuffer: Buffer,
): Promise<{ tablesRestored: string[] }> {
  const zip = new AdmZip(zipBuffer);

  const getCsv = (name: string): Record<string, string>[] => {
    const entry = zip.getEntry(`data/${name}.csv`);
    if (!entry) return [];
    return csvToRows(entry.getData().toString('utf8'));
  };

  const usersRows   = getCsv('users');
  const booksRows   = getCsv('books');
  const thumbsRows  = getCsv('book_thumbs');
  const reactsRows  = getCsv('book_reacts');
  const settingsRows = getCsv('club_settings');
  const customRRows  = getCsv('custom_reactions');
  const bssRows     = getCsv('book_selection_sessions');
  const bsvRows     = getCsv('book_selection_votes');
  const revealRows  = getCsv('reveal_sessions');

  // Restore image files to disk first (outside DB transaction)
  const coverMap    = restoreImages(zip, 'covers', COVERS_DIR);
  const reactionMap = restoreImages(zip, 'reactions', REACTIONS_DIR);

  // Pre-resolve cover URLs (downloads remote URLs to local storage)
  const resolvedCoverUrls = new Map<string, string | null>();
  for (const r of booksRows) {
    resolvedCoverUrls.set(r.id, await resolveCoverUrl(r.cover_url || null, coverMap));
  }

  const tablesRestored: string[] = [];

  await db.transaction().execute(async (trx) => {
    // Clear all data in reverse dependency order
    await trx.deleteFrom('reveal_sessions').execute();
    await trx.deleteFrom('book_selection_votes').execute();
    await trx.deleteFrom('book_selection_sessions').execute();
    await trx.deleteFrom('book_reacts').execute();
    await trx.deleteFrom('book_thumbs').execute();
    await trx.deleteFrom('custom_reactions').execute();
    await trx.deleteFrom('sessions').execute();
    await trx.deleteFrom('books').execute();
    await trx.deleteFrom('users').execute();
    await trx.deleteFrom('club_settings').execute();

    // Insert users → build ID map
    const userIdMap = new Map<string, number>();
    for (const r of usersRows) {
      const result = await trx
        .insertInto('users')
        .values({
          name: r.name,
          pin_hash: r.pin_hash,
          pin_reset: (Number(r.pin_reset) || 0) as 0 | 1,
          ...(r.created_at ? { created_at: Number(r.created_at) } : {}),
        })
        .executeTakeFirstOrThrow();
      userIdMap.set(r.id, Number(result.insertId));
    }
    tablesRestored.push('users');

    // Insert books → build ID map
    const bookIdMap = new Map<string, number>();
    for (const r of booksRows) {
      const result = await trx
        .insertInto('books')
        .values({
          status: r.status,
          title: r.title,
          author: r.author,
          cover_url: resolvedCoverUrls.get(r.id) ?? null,
          pages: r.pages ? Number(r.pages) : null,
          year: r.year ? Number(r.year) : null,
          genres: r.genres || null,
          ol_key: r.ol_key || null,
          submitted_by: r.submitted_by ? (userIdMap.get(r.submitted_by) ?? null) : null,
          ...(r.created_at ? { created_at: Number(r.created_at) } : {}),
          archived_at: r.archived_at ? Number(r.archived_at) : null,
          theme: r.theme || null,
        })
        .executeTakeFirstOrThrow();
      bookIdMap.set(r.id, Number(result.insertId));
    }
    tablesRestored.push('books');

    // book_thumbs
    for (const r of thumbsRows) {
      const bookId = bookIdMap.get(r.book_id);
      const userId = userIdMap.get(r.user_id);
      if (!bookId || !userId) continue;
      await trx.insertInto('book_thumbs').values({
        book_id: bookId,
        user_id: userId,
        value: Number(r.value),
        created_at: Number(r.created_at),
      }).execute();
    }
    tablesRestored.push('book_thumbs');

    // book_reacts
    for (const r of reactsRows) {
      const bookId = bookIdMap.get(r.book_id);
      const userId = userIdMap.get(r.user_id);
      if (!bookId || !userId) continue;
      await trx.insertInto('book_reacts').values({
        book_id: bookId,
        user_id: userId,
        emoji: r.emoji,
        created_at: Number(r.created_at),
      }).execute();
    }
    tablesRestored.push('book_reacts');

    // club_settings
    for (const r of settingsRows) {
      await trx.insertInto('club_settings')
        .values({ key: r.key, value: r.value })
        .onConflict(oc => oc.column('key').doUpdateSet({ value: r.value }))
        .execute();
    }
    tablesRestored.push('club_settings');

    // custom_reactions
    for (const r of customRRows) {
      const origFile = path.basename(r.image_path);
      const newFile = reactionMap.get(origFile) ?? origFile;
      await trx.insertInto('custom_reactions').values({
        image_path: `/reactions/${newFile}`,
        label: r.label || null,
        uploaded_by: r.uploaded_by ? (userIdMap.get(r.uploaded_by) ?? null) : null,
        ...(r.created_at ? { created_at: r.created_at } : {}),
      }).execute();
    }
    tablesRestored.push('custom_reactions');

    // book_selection_sessions → build ID map
    const bssIdMap = new Map<string, number>();
    for (const r of bssRows) {
      const result = await trx.insertInto('book_selection_sessions').values({
        status: r.status,
        created_by: r.created_by ? (userIdMap.get(r.created_by) ?? null) : null,
        ...(r.created_at ? { created_at: Number(r.created_at) } : {}),
        closed_at: r.closed_at ? Number(r.closed_at) : null,
        finalized_at: r.finalized_at ? Number(r.finalized_at) : null,
      }).executeTakeFirstOrThrow();
      bssIdMap.set(r.id, Number(result.insertId));
    }
    tablesRestored.push('book_selection_sessions');

    // book_selection_votes
    for (const r of bsvRows) {
      const sessionId = bssIdMap.get(r.session_id);
      const bookId    = bookIdMap.get(r.book_id);
      const userId    = userIdMap.get(r.user_id);
      if (!sessionId || !bookId || !userId) continue;
      await trx.insertInto('book_selection_votes').values({
        session_id: sessionId,
        book_id: bookId,
        user_id: userId,
        ...(r.created_at ? { created_at: Number(r.created_at) } : {}),
      }).execute();
    }
    tablesRestored.push('book_selection_votes');

    // reveal_sessions (books_json is a historical snapshot — leave as-is)
    for (const r of revealRows) {
      const winnerBookId = bookIdMap.get(r.winner_book_id);
      if (!winnerBookId) continue;
      await trx.insertInto('reveal_sessions').values({
        game_type: r.game_type,
        status: r.status,
        winner_book_id: winnerBookId,
        seed: Number(r.seed),
        books_json: r.books_json,
        created_by: r.created_by ? (userIdMap.get(r.created_by) ?? null) : null,
        ...(r.created_at ? { created_at: Number(r.created_at) } : {}),
        started_at: r.started_at ? Number(r.started_at) : null,
        finished_at: r.finished_at ? Number(r.finished_at) : null,
      }).execute();
    }
    tablesRestored.push('reveal_sessions');
  });

  return { tablesRestored };
}
