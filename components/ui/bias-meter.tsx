type BiasMeterProps = {
  left: number;
  center: number;
  right: number;
  compact?: boolean;
  showScale?: boolean;
};

export function BiasMeter({ left, center, right, compact = false, showScale = false }: BiasMeterProps) {
  const segments = [
    { label: "Left", value: left, className: "bias-left" },
    { label: "Center", value: center, className: "bias-center" },
    { label: "Right", value: right, className: "bias-right" },
  ];
  const needsLegend = segments.some((segment) => segment.value < 20);

  return (
    <div className="bias-meter" role="img" aria-label={`AI-estimated political framing: left ${left} percent, center ${center} percent, right ${right} percent`}>
      <div className={`bias-track ${compact ? "bias-track-compact" : ""}`}>
        {segments.map((segment) => (
          <span key={segment.label} className={`bias-segment ${segment.className}`} style={{ width: `${segment.value}%` }}>
            {segment.value >= 20 ? `${segment.label} ${segment.value}%` : null}
          </span>
        ))}
      </div>
      {needsLegend ? <div className="bias-legend" aria-hidden="true">{segments.map((segment) => <span key={segment.label}>{segment.label} {segment.value}%</span>)}</div> : null}
      {showScale ? <div className="bias-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div> : null}
    </div>
  );
}
