"use client";

// Desk stage: hosts the interactive 3D workbench on desktop, and keeps a
// designed 2D fallback for small screens / reduced-motion / no-WebGL.
// Clicking the laptop or phone maximizes it — the real website (iframe) or
// the real app screenshot, scrollable, inside the stage.
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, FlipHorizontal2, MousePointerClick, Pause, Play, RefreshCw, X } from "lucide-react";
import { SITES, type DeskElement } from "./desk/DeskScene";
import { projects } from "@/data/content";

const DeskScene = dynamic(() => import("./desk/DeskScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-[11px] tracking-[0.3em] text-white/40">
      BUILDING THE DESK…
    </div>
  ),
});

const NAMES: Record<DeskElement, string> = {
  laptop: "HP OMEN 16",
  phone: "NOTHING PHONE",
  earbuds: "EARBUDS",
  printer: "3D PRINTER",
};

type Focus = "laptop" | "phone" | null;

export default function DeskStage() {
  const [siteIdx, setSiteIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [caseOpen, setCaseOpen] = useState(true);
  const [printing, setPrinting] = useState(true);
  const [active, setActive] = useState<DeskElement | null>(null);
  const [focus, setFocus] = useState<Focus>(null);
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const small = window.matchMedia("(max-width: 819px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    setLite(small || reduced || !webgl);
  }, []);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const site = SITES[siteIdx];
  const agripulse = projects.find((p) => p.id === "agripulse");

  const cycleSite = () => {
    setActive("laptop");
    setSiteIdx((i) => (i + 1) % SITES.length);
  };

  const select = (el: DeskElement) => {
    setActive(el);
    if (el === "laptop") setFocus("laptop");
    if (el === "phone") setFocus("phone");
    if (el === "earbuds") setCaseOpen((o) => !o);
    if (el === "printer") setPrinting((p) => !p);
  };

  const info = (() => {
    switch (active) {
      case "laptop":
        return `Showing ${site.title} on the Omen. Click the laptop to maximize it and scroll the real site.`;
      case "phone":
        return flipped
          ? "The Nothing Phone's transparent Glyph back — click it to maximize AgriPulse."
          : "AgriPulse on the Nothing Phone. Click it to maximize, or flip it for the Glyph back.";
      case "earbuds":
        return caseOpen ? "Earbuds — case open, ready to play." : "Earbuds — case closed. Click to open it.";
      case "printer":
        return printing
          ? "3D printer at work on a small gear. Mechanical is still EXPLORING — real builds will dock here."
          : "Printer paused. Click it to resume the print.";
      default:
        return "Drag to orbit. Click the laptop or phone to maximize them.";
    }
  })();

  return (
    <div className="relative mx-auto mt-12 w-full max-w-6xl px-2">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(900px_420px_at_50%_0%,rgba(99,242,166,0.07),transparent_65%),linear-gradient(180deg,#070807,#050505)] sm:h-[560px]"
      >
        {lite ? (
          <div className="flex h-full items-end justify-center gap-5 px-4 pb-14 pt-10 sm:gap-10">
            <button type="button" onClick={() => setFocus("laptop")} className="w-[68%] max-w-[560px] text-left" aria-label="Maximize the laptop">
              <div className="rounded-t-2xl border border-white/10 bg-[#0a0c0b] p-2">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                  <Image src={site.img} alt={`${site.title} website on the laptop`} fill sizes="560px" className="object-cover object-top" priority />
                </div>
                <p className="py-1.5 text-center font-mono text-[9px] tracking-[0.3em] text-white/35">OMEN 16 · TAP TO MAXIMIZE</p>
              </div>
              <div className="mx-auto h-3 w-[106%] -translate-x-[3%] rounded-b-2xl border border-white/10 bg-white/[0.05]" />
            </button>
            <button type="button" onClick={() => setFocus("phone")} className="w-[19%] min-w-[88px] max-w-[150px] text-left" aria-label="Maximize the phone">
              <div className="rounded-[1.6rem] border border-white/15 bg-[#0a0c0b] p-1.5">
                <div className="relative aspect-[9/19] overflow-hidden rounded-[1.25rem]">
                  <Image src="/screens/agripulse-portrait.jpg" alt="AgriPulse app on the phone" fill sizes="150px" className="object-cover object-top" />
                </div>
                <p className="py-1.5 text-center font-mono text-[8px] tracking-[0.28em] text-white/35">NOTHING</p>
              </div>
            </button>
          </div>
        ) : (
          <DeskScene
            active={active}
            siteIdx={siteIdx}
            flipped={flipped}
            caseOpen={caseOpen}
            printing={printing}
            onSelect={select}
            onHover={setActive}
          />
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-4 py-2 backdrop-blur-md">
          <MousePointerClick size={13} className="text-accent shrink-0" />
          <p className="max-w-[430px] text-[12px] leading-snug text-white/75" aria-live="polite">
            <span className="mr-2 font-mono text-[10px] tracking-[0.2em] text-accent">
              {active ? NAMES[active] : "THE DESK"}
            </span>
            {info}
          </p>
        </div>

        {/* ---------- Maximize: laptop = real website, phone = real app ---------- */}
        <AnimatePresence>
          {focus === "laptop" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-5"
              role="dialog"
              aria-modal="true"
              aria-label={`${site.title} maximized`}
            >
              <motion.div
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 8 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="flex h-full w-full max-w-[1060px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0d0b] shadow-[0_50px_120px_rgba(0,0,0,0.8)]"
              >
                <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5">
                  <span className="flex gap-1.5 px-1">
                    <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </span>
                  <div className="flex gap-1.5" role="tablist" aria-label="Websites on this laptop">
                    {SITES.map((s, i) => (
                      <button
                        key={s.title}
                        role="tab"
                        aria-selected={i === siteIdx}
                        onClick={() => setSiteIdx(i)}
                        className={`rounded-full px-3.5 py-1.5 text-[12px] transition ${i === siteIdx ? "bg-accent font-medium text-black" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"}`}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                  <span className="ml-1 hidden truncate rounded-md bg-white/[0.05] px-3 py-1.5 font-mono text-[11px] text-white/50 lg:block">
                    https://{site.url}
                  </span>
                  <span className="ml-auto flex gap-1.5">
                    <a
                      href={site.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[12px] text-white/85 transition hover:bg-white/[0.12]"
                    >
                      Open real site <ArrowUpRight size={13} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setFocus(null)}
                      aria-label="Close maximized view"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white/85 transition hover:bg-white/[0.14]"
                    >
                      <X size={15} />
                    </button>
                  </span>
                </div>
                <iframe
                  key={site.url}
                  src={site.href}
                  title={`${site.title} — live website`}
                  className="w-full flex-1 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  referrerPolicy="no-referrer"
                />
                <p className="border-t border-white/10 px-4 py-2 text-center font-mono text-[10px] tracking-[0.14em] text-white/35">
                  LIVE WEBSITE — SCROLL INSIDE · IF A SITE BLOCKS EMBEDDING, “OPEN REAL SITE” ALWAYS WORKS
                </p>
              </motion.div>
            </motion.div>
          )}

          {focus === "phone" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center gap-6 bg-black/85 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label="AgriPulse maximized"
            >
              <motion.div
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 8 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="h-full max-h-[520px] shrink-0 overflow-hidden rounded-[2rem] border border-white/20 bg-[#0a0c0b] shadow-[0_50px_120px_rgba(0,0,0,0.8)]"
                style={{ aspectRatio: "9/19" }}
              >
                <div className="h-full overflow-y-auto overscroll-contain">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/screens/agripulse-portrait.jpg" alt="AgriPulse app — scroll to explore" className="w-full" />
                </div>
              </motion.div>
              <div className="hidden max-w-[300px] sm:block">
                <p className="font-mono text-[10px] tracking-[0.26em] text-accent">NOTHING PHONE · MAXIMIZED</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">AgriPulse</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {agripulse?.description}
                </p>
                <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-white/40">
                  NEXHACK · IITM DELHI — SHORTLISTED, TRAVELLED TO Delhi
                  <br />
                  SCROLL THE APP SCREEN — IT&apos;S THE REAL SCREENSHOT
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFocus(null);
                      setFlipped(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[13px] font-medium text-black transition hover:brightness-110"
                  >
                    <FlipHorizontal2 size={14} /> See the Glyph back
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocus(null)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-[13px] text-white/85 transition hover:bg-white/[0.1]"
                  >
                    <X size={14} /> Close
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFocus(null)}
                aria-label="Close maximized view"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/90 transition hover:bg-white/[0.16] sm:hidden"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* controls — same state as the 3D clicks */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={cycleSite}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[13px] text-white/85 backdrop-blur-md transition hover:bg-white/[0.09]"
        >
          <RefreshCw size={14} className="text-accent" /> Next website · {SITES[(siteIdx + 1) % SITES.length].title}
        </button>
        <a
          href={site.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[13px] font-medium text-black transition hover:brightness-110"
        >
          Open {site.title} <ArrowUpRight size={14} />
        </a>
        <button
          type="button"
          onClick={() => select("phone")}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[13px] text-white/85 backdrop-blur-md transition hover:bg-white/[0.09]"
        >
          <FlipHorizontal2 size={14} className="text-accent" /> Maximize the phone
        </button>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[13px] text-white/85 backdrop-blur-md transition hover:bg-white/[0.09]"
        >
          {flipped ? "Show AgriPulse" : "Flip the Nothing Phone"}
        </button>
        <button
          type="button"
          onClick={() => select("earbuds")}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[13px] text-white/85 backdrop-blur-md transition hover:bg-white/[0.09]"
        >
          {caseOpen ? "Close" : "Open"} earbuds case
        </button>
        <button
          type="button"
          onClick={() => select("printer")}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[13px] text-white/85 backdrop-blur-md transition hover:bg-white/[0.09]"
        >
          {printing ? <Pause size={14} className="text-accent" /> : <Play size={14} className="text-accent" />}
          {printing ? "Pause" : "Resume"} printer
        </button>
      </div>

      <p className="mt-5 text-center font-mono text-[10px] tracking-[0.3em] text-white/35">
        {lite ? "TAP A DEVICE TO MAXIMIZE IT" : "DRAG TO ORBIT · CLICK THE LAPTOP OR PHONE TO MAXIMIZE · SCROLL FOR THE WORK"}
      </p>
    </div>
  );
}
