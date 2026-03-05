// PRIMARY_COLOR may be a bare hex (e.g. 5BAB3E) or quoted (#5BAB3E).
// In .env files, # starts a comment, so always quote: PRIMARY_COLOR="#5BAB3E"
const rawColor = process.env.PRIMARY_COLOR?.trim();
const primaryColor = rawColor
  ? rawColor.startsWith('#') ? rawColor : `#${rawColor}`
  : '#4f46e5';

export const clubConfig = {
  name: process.env.CLUB_NAME ?? 'Book Club',
  primaryColor,
  logoUrl: process.env.LOGO_URL ?? null,
  reactPresets: (process.env.REACT_PRESETS ?? '❤️,😂,😢,🔥,👏,🤔,😴').split(',').map(e => e.trim()).filter(Boolean),
  maxSubmissionsPerMember: parseInt(process.env.MAX_SUBMISSIONS_PER_MEMBER ?? '1', 10),
  thumbsUpEmoji: process.env.THUMBS_UP_EMOJI ?? '👍',
  thumbsDownEmoji: process.env.THUMBS_DOWN_EMOJI ?? '👎',
};
