'use client';

import { useState, useTransition } from 'react';
import { PinPad } from '@/components/auth/PinPad';
import { verifyAdminPinOnly, elevateToAdmin } from '@/lib/actions/admin';

interface AdminPinModalProps {
  open: boolean;
  pinless: boolean;
  title?: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function AdminPinModal({ open, pinless, title = 'Admin Required', onClose, onSuccess }: AdminPinModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isConfirming, startConfirm] = useTransition();

  if (!open) return null;

  async function handlePinComplete(pin: string) {
    setLoading(true);
    setError('');
    const res = await verifyAdminPinOnly(pin);
    if (res.error) {
      setError(res.error);
      setResetKey(k => k + 1);
      setLoading(false);
    } else {
      await onSuccess();
      onClose();
      setLoading(false);
    }
  }

  function handleConfirm() {
    startConfirm(async () => {
      const res = await elevateToAdmin();
      if (res.error) {
        setError(res.error);
      } else {
        await onSuccess();
        onClose();
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xs rounded-3xl p-6 shadow-2xl"
        style={{ background: 'white', animation: 'pop-in 0.25s ease forwards' }}
      >
        <div className="text-center mb-5">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            Admin Action
          </p>
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-fredoka)' }}>
            {title}
          </h2>
          {pinless && (
            <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
              You&apos;re about to perform an admin action. Confirm to proceed.
            </p>
          )}
        </div>

        {pinless ? (
          <>
            {isConfirming ? (
              <div className="flex justify-center py-8">
                <div
                  className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95"
                style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
              >
                Confirm
              </button>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center py-8">
                <div
                  className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : (
              <PinPad key={resetKey} name="admin_pin" autoFocus onComplete={handlePinComplete} />
            )}
          </>
        )}

        {error && (
          <p
            className="text-center text-sm text-amber-700 mt-3"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            {error}
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 rounded-2xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
