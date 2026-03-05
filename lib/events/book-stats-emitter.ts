import { EventEmitter } from 'events';

// Next.js bundles server actions and route handlers into separate module graphs,
// so a plain module-level variable would create two separate EventEmitter instances.
// globalThis persists across module evaluations in the same Node.js process,
// ensuring both sides share the exact same emitter object.
const g = globalThis as typeof globalThis & { __bookStatsEmitter?: EventEmitter };
if (!g.__bookStatsEmitter) {
  g.__bookStatsEmitter = new EventEmitter();
  g.__bookStatsEmitter.setMaxListeners(200);
}
const emitter = g.__bookStatsEmitter;

export function notifyBookStatsChanged(bookId: number) {
  emitter.emit(`book:${bookId}`);
}

export function onBookStatsChanged(bookId: number, listener: () => void): () => void {
  emitter.on(`book:${bookId}`, listener);
  return () => emitter.off(`book:${bookId}`, listener);
}
