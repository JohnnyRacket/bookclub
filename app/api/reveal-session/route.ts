import { getSession } from '@/lib/auth/session';
import { getRevealSession } from '@/lib/actions/reveal-session';
import {
  onRevealChanged,
  onRevealStart,
  onRevealPresenceChanged,
  joinRevealPresence,
  leaveRevealPresence,
  getRevealPresence,
  getRevealStartPayload,
  type RevealStartPayload,
} from '@/lib/events/reveal-session-emitter';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const revealIdStr = searchParams.get('revealId');
  if (!revealIdStr) return new Response('Missing revealId', { status: 400 });

  const revealId = parseInt(revealIdStr, 10);

  if (searchParams.get('snapshot') === '1') {
    const reveal = await getRevealSession(revealId);
    if (!reveal) return new Response('Not found', { status: 404 });
    return Response.json(reveal);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (text: string) => {
        try { controller.enqueue(encoder.encode(text)); } catch { /* closed */ }
      };

      let lastLobbyJson = '';

      const sendLobby = async () => {
        try {
          const reveal = await getRevealSession(revealId);
          if (!reveal) return;
          const viewers = getRevealPresence(revealId);
          const data = { ...reveal, viewers };
          const json = JSON.stringify(data);
          if (json !== lastLobbyJson) {
            lastLobbyJson = json;
            enqueue(`event: lobby\ndata: ${json}\n\n`);
          }
        } catch { /* DB errors shouldn't kill the stream */ }
      };

      const sendPresence = () => {
        const json = JSON.stringify(getRevealPresence(revealId));
        enqueue(`event: presence\ndata: ${json}\n\n`);
      };

      const sendStart = (payload: RevealStartPayload) => {
        enqueue(`event: start\ndata: ${JSON.stringify(payload)}\n\n`);
      };

      joinRevealPresence(revealId, session.userId, session.name);

      await sendLobby();
      sendPresence();

      // If session is already playing, send the start payload immediately for late-joiners
      const existingPayload = getRevealStartPayload(revealId);
      if (existingPayload) {
        sendStart(existingPayload);
      }

      const unsubChanged = onRevealChanged(revealId, sendLobby);
      const unsubStart = onRevealStart(revealId, sendStart);
      const unsubPresence = onRevealPresenceChanged(revealId, sendPresence);
      const interval = setInterval(sendLobby, 30_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unsubChanged();
        unsubStart();
        unsubPresence();
        leaveRevealPresence(revealId, session.userId);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
