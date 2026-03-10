'use client';

import { useRef, useState, useTransition } from 'react';

type ImportResult = {
  error?: string;
  tablesRestored?: string[];
  success?: boolean;
};

export function BackupPanel() {
  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setImportResult({ error: 'Please select a backup ZIP file.' });
      return;
    }
    startTransition(async () => {
      setImportResult(null);
      const form = new FormData();
      form.append('backup', file);
      const res = await fetch('/api/backup/import', { method: 'POST', body: form });
      const json: ImportResult = await res.json();
      setImportResult(json);
    });
  };

  return (
    <div className="space-y-4">
      {/* Export card */}
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] px-5 py-6 stagger">
        <p
          className="text-sm font-semibold text-foreground mb-1"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Export Backup
        </p>
        <p
          className="text-xs text-muted-foreground mb-4"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Downloads a ZIP containing all your book club data and images.
        </p>
        <a
          href="/api/backup/export"
          download
          className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 bg-[var(--color-primary)]"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Download Backup
        </a>
      </div>

      {/* Import card */}
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] px-5 py-6 stagger">
        <p
          className="text-sm font-semibold text-foreground mb-1"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Import Backup
        </p>
        <p
          className="text-xs text-muted-foreground mb-1"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Restore from a previously exported ZIP.{' '}
          <strong>This will replace all existing data.</strong>
        </p>
        <p
          className="text-xs text-amber-600 mb-4"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Warning: all current members, books, and history will be permanently deleted before restoring.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="block w-full text-xs text-muted-foreground mb-3 cursor-pointer file:cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-medium file:my-1"
        />
        <button
          onClick={handleImport}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-primary)]"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {isPending ? 'Restoring…' : 'Restore Backup'}
        </button>

        {importResult?.error && (
          <div
            className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            {importResult.error}
          </div>
        )}
        {importResult?.success && (
          <div
            className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Restored successfully! Tables: {importResult.tablesRestored?.join(', ')}.
          </div>
        )}
      </div>
    </div>
  );
}
