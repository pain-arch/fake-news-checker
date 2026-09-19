"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { BrandMark } from "@/components/ui/brand-mark";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" className="menu-mark" aria-label="Open menu" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
        <Icon name="menu" className="size-5" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-[#fafaf9] p-6 shadow-xl border-r border-[#cfcfcf] sm:w-[385px] flex flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <Link href="/" onClick={() => setIsOpen(false)} aria-label="Fake or Real home"><BrandMark compact /></Link>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close menu" className="p-2 -mr-2 text-[#252525]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-6 text-[15px] font-medium text-[#252525]">
              <Link href="/" onClick={() => setIsOpen(false)} className="pb-2 border-b border-[#e5e5e5]">Home</Link>
              <span className="pb-2 border-b border-[#e5e5e5]">For You</span>
              <span className="pb-2 border-b border-[#e5e5e5]">Local</span>
              <span className="pb-2 border-b border-[#e5e5e5]">Blindspot</span>
            </nav>
            <div className="mt-auto pt-8 flex flex-col gap-3" aria-label="Future account options">
              <span className="bg-[#292929] text-white rounded-[4px] h-[40px] font-semibold w-full flex items-center justify-center text-[13px]">Subscribe</span>
              <span className="border border-[#292929] text-[#292929] bg-transparent rounded-[4px] h-[40px] font-semibold w-full flex items-center justify-center text-[13px]">Login</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
