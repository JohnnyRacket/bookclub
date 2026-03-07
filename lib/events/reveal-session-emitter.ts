import { EventEmitter } from 'events';

export type RevealStartPayload = {
  game_type: string;
  seed: number;
  winner_book_id: number;
  books: Array<{ id: number; title: string; author: string; cover_url: string | null; submitter_name: string | null }>;
  started_at: number;
};

const g = globalThis as typeof globalThis & {
  __revealSessionEmitter?: EventEmitter;
  __revealPresence?: Map<number, Map<number, string>>;
  __revealStartPayloads?: Map<number, RevealStartPayload>;
};

if (!g.__revealSessionEmitter) {
  g.__revealSessionEmitter = new EventEmitter();
  g.__revealSessionEmitter.setMaxListeners(200);
}
if (!g.__revealPresence) g.__revealPresence = new Map();
if (!g.__revealStartPayloads) g.__revealStartPayloads = new Map();

const emitter = g.__revealSessionEmitter;
const presence = g.__revealPresence;
const startPayloads = g.__revealStartPayloads;

export function notifyRevealChanged(revealId: number): void {
  emitter.emit(`reveal:${revealId}`);
  emitter.emit('global:reveal');
}

export function notifyRevealStart(revealId: number, payload: RevealStartPayload): void {
  startPayloads.set(revealId, payload);
  emitter.emit(`reveal-start:${revealId}`, payload);
}

export function getRevealStartPayload(revealId: number): RevealStartPayload | undefined {
  return startPayloads.get(revealId);
}

export function clearRevealStartPayload(revealId: number): void {
  startPayloads.delete(revealId);
}

export function onGlobalRevealChanged(listener: () => void): () => void {
  emitter.on('global:reveal', listener);
  return () => emitter.off('global:reveal', listener);
}

export function onRevealChanged(revealId: number, listener: () => void): () => void {
  emitter.on(`reveal:${revealId}`, listener);
  return () => emitter.off(`reveal:${revealId}`, listener);
}

export function onRevealStart(revealId: number, listener: (payload: RevealStartPayload) => void): () => void {
  emitter.on(`reveal-start:${revealId}`, listener);
  return () => emitter.off(`reveal-start:${revealId}`, listener);
}

export function joinRevealPresence(revealId: number, userId: number, name: string): void {
  if (!presence.has(revealId)) presence.set(revealId, new Map());
  presence.get(revealId)!.set(userId, name);
  emitter.emit(`reveal-presence:${revealId}`);
}

export function leaveRevealPresence(revealId: number, userId: number): void {
  presence.get(revealId)?.delete(userId);
  emitter.emit(`reveal-presence:${revealId}`);
}

export function getRevealPresence(revealId: number): string[] {
  return [...(presence.get(revealId)?.values() ?? [])];
}

export function onRevealPresenceChanged(revealId: number, listener: () => void): () => void {
  emitter.on(`reveal-presence:${revealId}`, listener);
  return () => emitter.off(`reveal-presence:${revealId}`, listener);
}
