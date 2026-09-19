type ChipProps = {
  label: string;
  showPlus?: boolean;
};

export function Chip({ label, showPlus = true }: ChipProps) {
  return (
    <button
      type="button"
      className="inline-flex min-h-8 items-center gap-3 rounded-full bg-[#e9e9eb] px-4 text-[12px] font-medium text-foreground transition-colors hover:bg-[#dedee1]"
      aria-label={showPlus ? `Add ${label} category` : label}
    >
      <span>{label}</span>
      {showPlus ? <span aria-hidden="true" className="text-[18px] font-normal leading-none">+</span> : null}
    </button>
  );
}
