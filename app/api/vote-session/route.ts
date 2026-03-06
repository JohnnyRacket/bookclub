import { getSession } from '@/lib/auth/session';
import { getSnapshotForSession } from '@/lib/actions/book-selection';
import {
  onVoteSessionChanged,
  onPresenceChanged,
  joinPresence,
  leavePresence,
  getPresence,
} from '@/lib/events/vote-session-emitter';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionIdStr = searchParams.get('sessionId');
  if (!sessionIdStr) return new Response('Missing sessionId', { status: 400 });

  const sessionId = parseInt(sessionIdStr, 10);

  if (searchParams.get('snapshot') === '1') {
    const snapshot = await getSnapshotForSession(sessionId);
    if (!snapshot) return new Response('Not found', { status: 404 });
    return Response.json(snapshot);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (text: string) => {
        try { controller.enqueue(encoder.encode(text)); } catch { /* closed */ }
      };

      let lastSnapshotJson = '';

      const sendSnapshot = async () => {
        try {
          const snapshot = await getSnapshotForSession(sessionId);
          if (!snapshot) return;
          const json = JSON.stringify(snapshot);
          if (json !== lastSnapshotJson) {
            lastSnapshotJson = json;
            enqueue(`event: snapshot\ndata: ${json}\n\n`);
          }
        } catch { /* DB errors shouldn't kill the stream */ }
      };

      const sendPresence = () => {
        const json = JSON.stringify(getPresence(sessionId));
        enqueue(`event: presence\ndata: ${json}\n\n`);
      };

      joinPresence(sessionId, session.userId, session.name);

      await sendSnapshot();
      sendPresence();

      const unsubSnapshot = onVoteSessionChanged(sessionId, sendSnapshot);
      const unsubPresence = onPresenceChanged(sessionId, sendPresence);
      const interval = setInterval(sendSnapshot, 30_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unsubSnapshot();
        unsubPresence();
        leavePresence(sessionId, session.userId);
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
