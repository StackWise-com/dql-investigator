import dynamic from "next/dynamic";

const PublicProfileScreen = dynamic(
  () =>
    import("@/components/PublicProfileScreen").then((m) => ({ default: m.PublicProfileScreen })),
  { ssr: false }
);

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicProfileScreen slug={slug} />;
}
