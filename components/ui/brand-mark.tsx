type BrandMarkProps = {
  inverted?: boolean;
  compact?: boolean;
};

export function BrandMark({ inverted = false, compact = false }: BrandMarkProps) {
  return (
    <div
      className={`inline-flex flex-col font-bold leading-none tracking-[-0.06em] ${
        inverted ? "text-white" : "text-foreground"
      }`}
      aria-label="Fake or Real"
    >
      <span className={compact ? "text-[22px] sm:text-[23px]" : "text-[48px] sm:text-[56px]"}>
        Fake or Real
      </span>
    </div>
  );
}
