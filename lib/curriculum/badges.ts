export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide-style SVG path
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-filter",
    title: "First Filter",
    description: "Ran your first filter command",
    icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z",
  },
  {
    id: "first-parse",
    title: "Pattern Detective",
    description: "Used parse to extract structured fields",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  },
  {
    id: "track-fundamentals",
    title: "DQL Graduate",
    description: "Completed the DQL Fundamentals track",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Maintained a 7-day learning streak",
    icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
  },
  {
    id: "streak-30",
    title: "Month Master",
    description: "Maintained a 30-day learning streak",
    icon: "M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1m18 0h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707",
  },
  {
    id: "speed-demon",
    title: "Speed Demon",
    description: "Completed an arcade run in under 30 seconds",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    id: "polyglot",
    title: "All-Track Explorer",
    description: "Started all 5 learning tracks",
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
  },
  {
    id: "mentor",
    title: "Mentor",
    description: "Shared your public profile",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export function getBadge(id: string) {
  return BADGE_DEFINITIONS.find((b) => b.id === id);
}
