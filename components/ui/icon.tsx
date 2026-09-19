import type { ReactNode, SVGProps } from "react";

export type IconName = "menu" | "search" | "bookmark" | "clock" | "info" | "share" | "external" | "calendar" | "chart" | "tag" | "user" | "bell" | "sliders" | "check" | "more";

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; label?: string };

const paths: Record<IconName, ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.1" /></>,
  share: <path d="M12 16V3m0 0L8 7m4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3v5M16 3v5M4 10h16M15.5 14h.01" /></>,
  chart: <path d="M4 20h16M6 17v-4h3v4M11 17V9h3v8M16 17V5h3v12M5 8l4-3 4 2 6-5" />,
  tag: <><path d="M20 13.5 13.5 20 4 10.5V4h6.5Z" /><circle cx="8" cy="8" r="1" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0Z" /></>,
  bell: <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8M10 21h4" />,
  sliders: <><path d="M4 7h4M12 7h8M4 17h8M16 17h4" /><circle cx="10" cy="7" r="2" /><circle cx="14" cy="17" r="2" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
};

export function Icon({ name, label, className = "", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`size-6 ${className}`} aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined} {...props}>
      {paths[name]}
    </svg>
  );
}
