import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/lib/openlibrary/client';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json([]);

  const results = await searchBooks(q);
  return NextResponse.json(results);
}
