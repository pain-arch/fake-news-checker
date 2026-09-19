export function Chip({ label }: { label: string }) {
  return <span className="topic-chip"><span>{label}</span><span className="chip-plus" aria-hidden="true">+</span></span>;
}
