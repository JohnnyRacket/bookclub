'use client';

import { useActionState, useRef, useState } from 'react';
import { addCustomReaction } from '@/lib/actions/reactions';

export function AddReactionForm() {
  const [state, action, isPending] = useActionState(addCustomReaction, null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); setFileError(null); return; }
    if (file.size > 8 * 1024 * 1024) {
      setPreview(null);
      setFileError('Image must be under 8 MB.');
      e.target.value = '';
      return;
    }
    setFileError(null);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="space-y-5">
      {(fileError ?? state?.error) && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700" style={{ fontFamily: 'var(--font-nunito)' }}>
          {fileError ?? state?.error}
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors cursor-pointer"
          style={{ borderColor: 'color-mix(in oklch, var(--color-primary) 50%, transparent)', background: 'color-mix(in oklch, var(--color-primary) 6%, white)' }}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <svg viewBox="0 0 48 48" width="52" height="52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Face circle */}
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" strokeLinecap="round" style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, transparent)' }} />
              {/* Left eye */}
              <circle cx="17" cy="20" r="1.5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, transparent)' }} />
              {/* Right eye */}
              <circle cx="31" cy="20" r="1.5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, transparent)' }} />
              {/* Smile */}
              <path d="M16 29 Q24 37 32 29" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2.5" strokeLinecap="round" fill="none" style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, transparent)' }} />
            </svg>
          )}
        </button>
        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          {preview ? 'Tap to change' : 'Tap to choose image'}
        </p>
        <input
          ref={inputRef}
          type="file"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          Label <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          type="text"
          name="label"
          maxLength={32}
          placeholder="e.g. spicy take"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ fontFamily: 'var(--font-nunito)', focusRingColor: 'var(--color-primary)' } as React.CSSProperties}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !preview}
        className="acnh-btn w-full py-3 rounded-2xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
      >
        {isPending ? 'Uploading...' : 'Upload Reaction'}
      </button>
    </form>
  );
}
