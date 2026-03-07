import { redirect } from 'next/navigation';

// This route is superseded by /select-book/reveal/[revealId]
export default function OldRandomRevealPage() {
  redirect('/');
}
