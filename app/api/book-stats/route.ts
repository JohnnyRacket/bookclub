import { getSession } from '@/lib/auth/session';
import { getBookStats } from '@/lib/actions/books';
import { onBookStatsChanged } from '@/lib/events/book-stats-emitter';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const bookIdStr = searchParams.get('bookId');
  if (!bookIdStr) return new Response('Missing bookId', { status: 400 });

  const bookId = parseInt(bookIdStr, 10);

  // snapshot=1 returns a single JSON response (used for immediate refresh after actions)
  if (searchParams.get('snapshot') === '1') {
    const stats = await getBookStats(bookId, session.userId);
    return Response.json(stats);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastJson = '';

      const send = async () => {
        try {
          const stats = await getBookStats(bookId, session.userId);
          const json = JSON.stringify(stats);
          if (json !== lastJson) {
            lastJson = json;
            controller.enqueue(encoder.encode(`data: ${json}\n\n`));
          }
        } catch {
          // DB errors shouldn't kill the stream; next tick will retry
        }
      };

      await send();
      // Subscribe to in-process change notifications for instant push
      const unsubscribe = onBookStatsChanged(bookId, send);
      // Polling as a fallback (e.g. server restart, missed events)
      const interval = setInterval(send, 30_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unsubscribe();
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
