'use client';

import { BookThumbs } from './BookThumbs';
import { BookStars } from './BookStars';

interface BookRatingProps {
  ratingMode: 'thumbs' | 'stars';
  bookId: number;
  upCount: number;
  downCount: number;
  userThumb: 1 | -1 | null;
  starAvg: number | null;
  starCount: number;
  userStar: number | null;
  locked: boolean;
  upEmoji?: string;
  downEmoji?: string;
}

export function BookRating({
  ratingMode,
  bookId,
  upCount,
  downCount,
  userThumb,
  starAvg,
  starCount,
  userStar,
  locked,
  upEmoji,
  downEmoji,
}: BookRatingProps) {
  if (ratingMode === 'stars') {
    return (
      <BookStars
        bookId={bookId}
        starAvg={starAvg}
        starCount={starCount}
        userStar={userStar}
        upCount={upCount}
        downCount={downCount}
        locked={locked}
      />
    );
  }

  return (
    <BookThumbs
      bookId={bookId}
      upCount={upCount}
      downCount={downCount}
      userThumb={userThumb}
      locked={locked}
      upEmoji={upEmoji}
      downEmoji={downEmoji}
    />
  );
}
