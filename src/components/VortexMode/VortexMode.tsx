import { VortexScene } from "./VortexScene";

interface Props {
  onBackToMenu: () => void;
}

export function VortexMode({ onBackToMenu }: Props) {
  return (
    <div className="flex-1 relative overflow-hidden bg-black">
      <VortexScene onBackToMenu={onBackToMenu} />
    </div>
  );
}
