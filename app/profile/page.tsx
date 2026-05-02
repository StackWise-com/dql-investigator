import dynamic from "next/dynamic";

const ProfileScreen = dynamic(
  () => import("@/components/ProfileScreen").then((m) => ({ default: m.ProfileScreen })),
  { ssr: false }
);

export default function ProfilePage() {
  return <ProfileScreen />;
}
