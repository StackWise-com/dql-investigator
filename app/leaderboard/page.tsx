import dynamic from "next/dynamic";

const LeaderboardScreen = dynamic(
  () => import("@/components/LeaderboardScreen").then((m) => ({ default: m.LeaderboardScreen })),
  { ssr: false }
);

export default function LeaderboardPage() {
  return <LeaderboardScreen />;
}
