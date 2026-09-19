import { BiasMeter } from "./bias-meter";
import { Icon } from "./icon";

export function NewsCard() {
  return (
    <article className="grid overflow-hidden rounded-lg border border-border bg-white p-3 shadow-sm sm:grid-cols-[42%_1fr] sm:gap-5 sm:p-4">
      <div className="relative min-h-52 overflow-hidden rounded-md bg-[#242932] sm:min-h-0" role="img" aria-label="Abstract editorial illustration of a political news story">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#10151c_0%,#394555_47%,#731f1f_48%,#b65046_66%,#18253a_67%,#0e1420_100%)]" />
        <div className="absolute -bottom-8 left-1/2 h-44 w-36 -translate-x-1/2 rounded-t-full bg-[#141820] shadow-lg" />
        <div className="absolute bottom-20 left-1/2 h-24 w-20 -translate-x-1/2 rounded-[45%_45%_42%_42%] bg-[#d2a381]" />
        <div className="absolute bottom-[8.8rem] left-1/2 h-11 w-24 -translate-x-1/2 -rotate-6 rounded-[60%_60%_25%_25%] bg-[#e9e3db]" />
        <div className="absolute right-3 top-3 rounded-full bg-black/40 p-1 text-white backdrop-blur-sm"><Icon name="info" className="size-4" /></div>
        <span className="absolute bottom-3 left-3 rounded bg-black/55 px-2 py-1 text-[9px] font-medium text-white/90 backdrop-blur-sm">Editorial illustration</span>
      </div>
      <div className="flex min-w-0 flex-col pt-4 sm:pt-1">
        <p className="text-[11px] font-medium text-muted">Politics&nbsp; · &nbsp;United States</p>
        <h3 className="mt-2 text-[17px] font-semibold leading-[1.35] tracking-[-0.02em] sm:text-[18px]">Leaders Announce Revised Peace Proposal With Tougher Terms</h3>
        <p className="mt-3 text-[12px] leading-5 text-[#3f3f46]">The proposal includes stricter limits and enhanced verification measures.</p>
        <div className="mt-4"><BiasMeter left={25} center={50} right={25} compact /></div>
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-[11px] font-medium text-foreground">
          <span className="inline-flex items-center gap-2"><Icon name="clock" className="size-4" /> 2h ago</span>
          <span className="inline-flex items-center gap-2"><Icon name="bookmark" className="size-4" /> 12 min read</span>
        </div>
      </div>
    </article>
  );
}
