import { getSession } from '@/lib/auth/session';
import { getOpenVotingSession } from '@/lib/actions/book-selection';
import { onGlobalSessionChanged } from '@/lib/events/vote-session-emitter';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (text: string) => {
        try { controller.enqueue(encoder.encode(text)); } catch { /* closed */ }
      };

      const sendStatus = async () => {
        try {
          const open = await getOpenVotingSession();
          const data = open && open.status === 'open'
            ? { sessionId: open.id, status: open.status }
            : null;
          enqueue(`event: status\ndata: ${JSON.stringify(data)}\n\n`);
        } catch { /* DB errors shouldn't kill the stream */ }
      };

      await sendStatus();

      const unsub = onGlobalSessionChanged(sendStatus);
      const interval = setInterval(sendStatus, 30_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unsub();
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
