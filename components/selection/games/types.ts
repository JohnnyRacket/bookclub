export type GameBook = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  submitter_name: string | null;
};

export type GameProps = {
  books: GameBook[];
  winnerId: number;
  seed: number;
  onComplete: () => void;
};

// Pastel palette for game segments/lanes
export const GAME_COLORS = [
  'oklch(0.88 0.10 145)', // soft green
  'oklch(0.88 0.10 220)', // sky blue
  'oklch(0.88 0.10 60)',  // warm yellow
  'oklch(0.88 0.10 350)', // soft pink
  'oklch(0.88 0.10 280)', // lavender
  'oklch(0.88 0.10 30)',  // peach
  'oklch(0.88 0.10 180)', // teal
  'oklch(0.88 0.10 310)', // rose
];
