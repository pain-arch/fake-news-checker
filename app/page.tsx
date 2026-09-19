import type { ReactNode } from "react";
import { BiasMeter } from "@/components/ui/bias-meter";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Icon, type IconName } from "@/components/ui/icon";
import { NewsCard } from "@/components/ui/news-card";

const colors = [
  { name: "Text primary", value: "#0D0D0F", color: "bg-[#0d0d0f]" },
  { name: "Text secondary", value: "#6B7280", color: "bg-[#6b7280]" },
  { name: "Surface", value: "#F6F6F6", color: "bg-[#f6f6f6]" },
  { name: "Left bias", value: "#B42318", color: "bg-left-bias" },
  { name: "Center", value: "#E5E7EB", color: "bg-center-bias" },
  { name: "Right bias", value: "#1D4ED8", color: "bg-right-bias" },
  { name: "BG primary", value: "#FFFFFF", color: "bg-white" },
  { name: "BG secondary", value: "#F0F0F0", color: "bg-[#f0f0f0]" },
  { name: "Border", value: "#E5E7EB", color: "bg-white" },
  { name: "Divider", value: "#E5E7EB", color: "bg-[#fafafa]" },
];

const typeRows = [
  ["H1", "Page / Screen Title", "32px", "Bold", "1.2"],
  ["H2", "Section Title", "24px", "SemiBold", "1.3"],
  ["H3", "Card / Module Title", "20px", "SemiBold", "1.3"],
  ["H4", "Subheading", "16px", "Medium", "1.4"],
  ["Body Large", "Important content", "16px", "Regular", "1.6"],
  ["Body Medium", "Body text", "14px", "Regular", "1.6"],
  ["Body Small", "Supporting text", "13px", "Regular", "1.6"],
  ["Caption", "Labels, meta text", "11px", "Regular", "1.4"],
];

const iconNames: IconName[] = [
  "menu", "search", "bookmark", "clock", "info",
  "share", "external", "calendar", "chart", "tag",
  "user", "bell", "sliders", "check", "more",
];

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <h2 className="border-b border-divider pb-3 text-[14px] font-semibold uppercase tracking-[-0.02em]">{title}</h2>
      {children}
    </section>
  );
}

function Swatches() {
  return (
    <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3">
      {colors.map((color, index) => (
        <div key={color.name}>
          <div className={`h-12 w-16 rounded-md border ${color.color} ${index < 2 || (index > 2 && index < 6) ? "border-transparent" : "border-[#d4d4d8]"}`} />
          <p className="mt-2 text-[9px] font-medium uppercase leading-4 text-[#3f3f46]">{color.name}</p>
          <p className="text-[9px] uppercase text-muted">{color.value}</p>
        </div>
      ))}
    </div>
  );
}

function TypographyPanel() {
  return (
    <Panel title="Typography" className="lg:col-span-5 lg:row-span-2">
      <div className="mt-5 grid gap-6 md:grid-cols-[150px_1fr] lg:grid-cols-1 xl:grid-cols-[150px_1fr]">
        <div>
          <p className="text-[11px] font-medium uppercase">Font family</p>
          <p className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.04em]">Poppins</p>
          <p className="mt-4 text-[11px] leading-[1.6] text-[#4b4b52]">Poppins is a modern geometric sans-serif typeface that ensures clarity and excellent readability.</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[340px]">
            <div className="grid grid-cols-[58px_1fr_40px_54px_48px] gap-2 text-[9px] font-medium uppercase text-[#27272a]">
              <span>Style</span><span /><span>Size</span><span>Weight</span><span>Line height</span>
            </div>
            <div className="mt-3 space-y-3">
              {typeRows.map(([style, use, size, weight, lineHeight], index) => (
                <div key={style} className="grid grid-cols-[58px_1fr_40px_54px_48px] items-center gap-2">
                  <span className={index < 4 ? "text-[18px] font-semibold" : "text-[10px] font-medium"}>{style}</span>
                  <span className="text-[9px] text-[#52525b]">{use}</span>
                  <span className="text-[9px]">{size}</span>
                  <span className="text-[9px]">{weight}</span>
                  <span className="text-[9px]">{lineHeight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ButtonsTable() {
  const states = ["default", "hover", "outline", "disabled"] as const;
  return (
    <div className="mt-5 overflow-x-auto">
      <div className="min-w-[360px]">
        <div className="grid grid-cols-[60px_repeat(4,1fr)] gap-2 text-center text-[10px] text-[#52525b]">
          <span /><span>Default</span><span>Hover</span><span>Outline</span><span>Disabled</span>
        </div>
        {(["primary", "secondary", "text"] as const).map((variant) => (
          <div key={variant} className="mt-3 grid grid-cols-[60px_repeat(4,1fr)] items-center gap-2">
            <span className="text-[10px] font-medium capitalize">{variant}</span>
            {states.map((state) => (
              <Button key={state} variant={variant} presentation={state} className="w-full px-1">
                {variant === "text" && (state === "outline" || state === "disabled") ? "—" : "Button"}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen p-3 sm:p-5 lg:p-6">
      <h1 className="sr-only">Biasly News design system</h1>
      <div className="mx-auto grid max-w-[1480px] gap-4 md:grid-cols-2 lg:grid-cols-13">
        <div className="space-y-4 md:col-span-1 lg:col-span-4 lg:row-span-2">
          <Panel title="Brand">
            <div className="flex min-h-40 flex-col items-center justify-center py-5 text-center">
              <BrandMark />
              <p className="mt-5 max-w-60 text-[14px] leading-6 text-[#3f3f46]">Balanced news coverage,<br />powered by AI.</p>
            </div>
          </Panel>
          <Panel title="Colors"><Swatches /></Panel>
        </div>
        <TypographyPanel />
        <Panel title="UI Elements" className="md:col-span-2 lg:col-span-4 lg:row-span-2">
          <p className="mt-5 text-[10px] font-medium uppercase">Buttons</p>
          <ButtonsTable />
          <p className="mt-6 text-[10px] font-medium uppercase">Chip / category</p>
          <div className="mt-3 flex flex-wrap gap-2"><Chip label="World Cup" /><Chip label="IPL" /><Chip label="Business & Markets" /><Chip label="More" /></div>
          <p className="mt-6 text-[10px] font-medium uppercase">Bias meter</p>
          <div className="mt-3"><BiasMeter left={25} center={50} right={25} showScale /></div>
        </Panel>
        <Panel title="Icons" className="lg:col-span-4">
          <div className="mt-6 grid grid-cols-5 gap-x-8 gap-y-7">{iconNames.map((name) => <Icon key={name} name={name} className="mx-auto size-5" />)}</div>
          <p className="mt-7 text-[12px] text-muted">Line style&nbsp; · &nbsp;2px stroke&nbsp; · &nbsp;Rounded caps</p>
        </Panel>
        <Panel title="Card Example" className="md:col-span-2 lg:col-span-9"><div className="mt-4"><NewsCard /></div></Panel>
        <Panel title="Spacing System" className="lg:col-span-4">
          <div className="mt-6 flex h-28 items-end justify-between gap-3">
            {[4, 8, 16, 24, 32, 40, 64].map((size) => (
              <div key={size} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full max-w-12 bg-[#d9ddff]" style={{ height: `${Math.max(8, size)}px` }} />
                <span className="text-[9px] font-medium">{size}px</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[12px] text-muted">Consistent spacing scale based on 4px base unit</p>
        </Panel>
        <Panel title="Grid System" className="lg:col-span-4">
          <div className="mt-5 grid grid-cols-[1fr_92px] gap-4">
            <div className="grid h-36 grid-cols-12 gap-2 border-x border-[#c7ccfb] bg-[#f7f7ff] px-2">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="bg-[#dfe1fa]" />)}</div>
            <div className="flex flex-col justify-between py-1 text-[9px]">
              <p><span className="font-semibold">Container</span><br />1280px</p><p><span className="font-semibold">Columns</span><br />12</p><p><span className="font-semibold">Gutter</span><br />24px</p><p><span className="font-semibold">Margin</span><br />24px</p>
            </div>
          </div>
        </Panel>
        <Panel title="Shadows" className="lg:col-span-2">
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-4"><div className="size-10 shrink-0 rounded-sm border border-border bg-white shadow-sm" /><p className="text-[9px] leading-4"><span className="font-semibold uppercase">Small</span><br />0px 1px 2px</p></div>
            <div className="flex items-center gap-4"><div className="size-10 shrink-0 rounded-sm border border-border bg-white shadow-md" /><p className="text-[9px] leading-4"><span className="font-semibold uppercase">Medium</span><br />0px 4px 12px</p></div>
            <div className="flex items-center gap-4"><div className="size-10 shrink-0 rounded-sm border border-border bg-white shadow-lg" /><p className="text-[9px] leading-4"><span className="font-semibold uppercase">Large</span><br />0px 12px 24px</p></div>
          </div>
        </Panel>
        <Panel title="Border Radius" className="lg:col-span-3">
          <div className="mt-5 space-y-3">
            {[["Small", "4px", "rounded-sm"], ["Medium", "8px", "rounded-md"], ["Large", "12px", "rounded-lg"], ["Full", "9999px", "rounded-full"]].map(([name, value, radius]) => (
              <div key={name} className="grid grid-cols-[40px_1fr_48px] items-center gap-3"><div className={`size-8 border border-[#d4d4d8] bg-white ${radius}`} /><span className="text-[9px] font-semibold uppercase">{name}</span><span className="text-[9px]">{value}</span></div>
            ))}
          </div>
        </Panel>
        <footer className="grid gap-6 rounded-lg bg-[#18191c] px-7 py-7 text-white shadow-lg md:col-span-2 md:grid-cols-[1.2fr_1fr_1fr] md:items-center lg:col-span-13 lg:px-10">
          <div className="flex items-center gap-8"><BrandMark inverted compact /><p className="text-[10px] leading-4 text-white/85">Balanced news coverage,<br />powered by AI.</p></div>
          <div className="flex gap-10 text-[10px] text-white/55 md:justify-center"><span>Design System v1.0</span><span>June 1, 2026</span></div>
          <p className="text-[10px] text-white/85 md:text-right">Stay consistent. Stay unbiased.</p>
        </footer>
      </div>
    </main>
  );
}
