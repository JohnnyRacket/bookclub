import { getSession } from '@/lib/auth/session';
import { getOpenVotingSession } from '@/lib/actions/book-selection';
import { getActiveRevealSession } from '@/lib/actions/reveal-session';
import { onGlobalSessionChanged } from '@/lib/events/vote-session-emitter';
import { onGlobalRevealChanged } from '@/lib/events/reveal-session-emitter';

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

      const sendRevealStatus = async () => {
        try {
          const reveal = await getActiveRevealSession();
          const data = reveal && reveal.status === 'lobby'
            ? { revealId: reveal.id, status: reveal.status }
            : null;
          enqueue(`event: reveal-status\ndata: ${JSON.stringify(data)}\n\n`);
        } catch { /* DB errors shouldn't kill the stream */ }
      };

      await sendStatus();
      await sendRevealStatus();

      const unsubVote = onGlobalSessionChanged(sendStatus);
      const unsubReveal = onGlobalRevealChanged(sendRevealStatus);
      const interval = setInterval(async () => {
        await sendStatus();
        await sendRevealStatus();
      }, 30_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unsubVote();
        unsubReveal();
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
