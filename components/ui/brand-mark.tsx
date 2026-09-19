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
      <span
        className={`self-end tracking-[-0.035em] ${
          compact ? "-mt-0.5 text-[10px]" : "-mt-1 text-[18px] sm:text-[20px]"
        } ${inverted ? "text-white/88" : "text-muted"}`}
      >
        News
      </span>
    </div>
  );
}
