import dynamic from "next/dynamic";

const InvestigatorShell = dynamic(
  () => import("@/components/InvestigatorShell").then((m) => ({ default: m.InvestigatorShell })),
  { ssr: false }
);

export default function Home() {
  return <InvestigatorShell />;
}
