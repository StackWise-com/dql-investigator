export const ANIMAL_EMOJIS = [
  "🐉", "🐅", "🦁", "🦅", "🦈", "🐺", "🦉", "🦌",
  "🐻", "🦊", "🐼", "🐯", "🐆", "🦓", "🦏", "🐘",
  "🦒", "🦘", "🐎", "🦚", "🐊", "🐲", "🦇", "🐍",
];

export function getAnimalEmoji(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const idx = Math.abs(hash) % ANIMAL_EMOJIS.length;
  return ANIMAL_EMOJIS[idx];
}
