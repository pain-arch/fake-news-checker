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
      aria-label="Biasly News"
    >
      <span className={compact ? "text-[25px]" : "text-[56px] sm:text-[62px]"}>
        biasly
      </span>
    </div>
  );
}
