"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowDown, FileText, Github } from "lucide-react";
import { profile } from "@/data/content";
import DeskStage from "./DeskStage";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 180, damping: 14 });
  const y = useSpring(useMotionValue(0), { stiffness: 180, damping: 14 });
  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className="inline-block"
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * 0.22);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.22);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-36 sm:pt-40">
      <div className="blob left-[-6rem] top-[-4rem] h-80 w-80 bg-accent/[0.07]" aria-hidden="true" />
      <div className="blob right-[-8rem] top-[16rem] h-96 w-96 bg-sky2/[0.06]" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-5 text-center">
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] text-white/70 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {profile.badge}
        </motion.p>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mt-7 text-[clamp(2.6rem,7vw,5.2rem)] font-semibold leading-[1.04] tracking-[-0.03em]"
        >
          Hi, I&apos;m {profile.firstName}.<br />
          <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
            {profile.heroLine}
          </span>
        </motion.h1>

        <motion.p {...fadeUp} transition={{ duration: 0.7, delay: 0.16 }} className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-mist">
          {profile.headline}. {profile.heroSub}
        </motion.p>

        <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.24 }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <a href="#work" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-black transition hover:brightness-110">
              See my work <ArrowDown size={15} />
            </a>
          </Magnetic>
          <Magnetic>
            <a href={"/resume"} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm text-white/85 backdrop-blur-md transition hover:bg-white/[0.08]">
              <FileText size={15} /> Résumé
            </a>
          </Magnetic>
          <Magnetic>
            <a href={profile.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm text-white/85 backdrop-blur-md transition hover:bg-white/[0.08]">
              <Github size={15} /> GitHub
            </a>
          </Magnetic>
        </motion.div>
      </div>

      <DeskStage />
    </section>
  );
}
