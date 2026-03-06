import { EventEmitter } from 'events';

const g = globalThis as typeof globalThis & {
  __voteSessionEmitter?: EventEmitter;
  __votePresence?: Map<number, Map<number, string>>;
};

if (!g.__voteSessionEmitter) {
  g.__voteSessionEmitter = new EventEmitter();
  g.__voteSessionEmitter.setMaxListeners(200);
}
if (!g.__votePresence) g.__votePresence = new Map();

const emitter = g.__voteSessionEmitter;
const presence = g.__votePresence;

export function notifyVoteSessionChanged(sessionId: number): void {
  emitter.emit(`session:${sessionId}`);
  emitter.emit('global:session');
}

export function onGlobalSessionChanged(listener: () => void): () => void {
  emitter.on('global:session', listener);
  return () => emitter.off('global:session', listener);
}

export function onVoteSessionChanged(sessionId: number, listener: () => void): () => void {
  emitter.on(`session:${sessionId}`, listener);
  return () => emitter.off(`session:${sessionId}`, listener);
}

export function joinPresence(sessionId: number, userId: number, name: string): void {
  if (!presence.has(sessionId)) presence.set(sessionId, new Map());
  presence.get(sessionId)!.set(userId, name);
  emitter.emit(`presence:${sessionId}`);
}

export function leavePresence(sessionId: number, userId: number): void {
  presence.get(sessionId)?.delete(userId);
  emitter.emit(`presence:${sessionId}`);
}

export function getPresence(sessionId: number): string[] {
  return [...(presence.get(sessionId)?.values() ?? [])];
}

export function onPresenceChanged(sessionId: number, listener: () => void): () => void {
  emitter.on(`presence:${sessionId}`, listener);
  return () => emitter.off(`presence:${sessionId}`, listener);
}
