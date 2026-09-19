type BiasMeterProps = {
  left: number;
  center: number;
  right: number;
  compact?: boolean;
  showScale?: boolean;
};

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function BiasMeter({ left, center, right, compact = false, showScale = false }: BiasMeterProps) {
  const values = [left, center, right].map(clampPercentage);
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const widths = values.map((value) => `${(value / total) * 100}%`);

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`AI-estimated political framing: left ${left} percent, center ${center} percent, right ${right} percent`}
    >
      <div className={`flex w-full overflow-hidden rounded-sm font-semibold ${compact ? "h-5 text-[9px] sm:text-[10px]" : "h-8 text-[11px]"}`}>
        <span className="flex items-center justify-center bg-left-bias px-1 text-center text-white" style={{ width: widths[0] }}>Left {left}%</span>
        <span className="flex items-center justify-center bg-center-bias px-1 text-center text-foreground" style={{ width: widths[1] }}>Center {center}%</span>
        <span className="flex items-center justify-center bg-right-bias px-1 text-center text-white" style={{ width: widths[2] }}>Right {right}%</span>
      </div>
      {showScale ? (
        <div className="mt-2 flex justify-between text-[10px] text-muted" aria-hidden="true">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      ) : null}
    </div>
  );
}
