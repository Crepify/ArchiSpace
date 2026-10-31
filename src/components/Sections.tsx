"use client";

import { motion } from "framer-motion";
import { Award, Github, FileText, MessageSquare, Server, Code2, GitBranch, Rocket, Database, Sparkles, Gamepad2, Globe, Layout, Brain } from "lucide-react";
import { profile, skills, hackathonNotes } from "@/data/content";

const skillIcons = [Server, Code2, GitBranch, Rocket, Database, Sparkles, Gamepad2, Globe, Layout, Brain];

const rise = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
};

export function ToolkitMarquee() {
  const row = [...skills, ...skills];
  return (
    <section aria-label="Toolkit" className="border-y border-white/[0.06] py-10">
      <p className="mb-6 text-center font-mono text-[10px] tracking-[0.3em] text-white/35">TOOLKIT · WHAT I ACTUALLY USE &amp; LEARN</p>
      <div className="marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="marquee-track flex w-max items-center gap-3 pr-3">
          {row.map((s, i) => {
            const Icon = skillIcons[i % skillIcons.length];
            return (
              <span key={i} className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/75">
                <Icon size={15} className="text-accent/80" /> {s}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-24">
      <div className="grid gap-10 md:grid-cols-12">
        <motion.div {...rise} transition={{ duration: 0.6 }} className="md:col-span-4">
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent">ABOUT ME</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">The person<br />behind the desk.</h2>
        </motion.div>
        <motion.div {...rise} transition={{ duration: 0.6, delay: 0.08 }} className="space-y-5 md:col-span-8">
          {profile.bio.map((para, i) => (
            <p key={i} className="max-w-2xl text-[15px] leading-[1.85] text-white/70">{para}</p>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            {["Mechanical + Electrical · EXPLORING", "Gaming", "Cars & bikes", "Electronics", "Iron Man fan", "Startup dream · 404 Error Found"].map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/60">{t}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Journey() {
  return (
    <section aria-label="Hackathons and certificates" className="mx-auto max-w-6xl px-5 pb-24">
      <motion.div {...rise} transition={{ duration: 0.6 }}>
        <p className="font-mono text-[11px] tracking-[0.3em] text-accent">HACKATHONS &amp; CERTIFICATES</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Where I&apos;ve shown up.</h2>
      </motion.div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {hackathonNotes.map((h, i) => (
          <motion.article key={h.event} {...rise} transition={{ duration: 0.55, delay: i * 0.07 }} className="rounded-4xl border border-white/10 bg-panel p-7 transition hover:-translate-y-1 hover:border-white/25">
            <Award size={19} className="text-accent" />
            <h3 className="mt-4 text-lg font-semibold">{h.event}</h3>
            <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-white/40">{h.project.toUpperCase()}</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">{h.outcome}</p>
          </motion.article>
        ))}
        <motion.article {...rise} transition={{ duration: 0.55, delay: 0.14 }} className="rounded-4xl border border-dashed border-white/15 bg-transparent p-7">
          <Award size={19} className="text-white/35" />
          <h3 className="mt-4 text-lg font-semibold text-white/80">Certificates</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            This shelf is intentionally empty — real certificates will be placed here as they&apos;re earned. Nothing decorative, nothing invented.
          </p>
        </motion.article>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-28">
      <motion.div {...rise} transition={{ duration: 0.6 }} className="rounded-4xl border border-white/10 bg-panel px-7 py-14 text-center sm:px-12">
        <MessageSquare size={20} className="mx-auto text-accent" />
        <h2 className="mx-auto mt-5 max-w-md text-3xl font-semibold tracking-tight">Let&apos;s build something real.</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-mist">
          I don&apos;t publish a public email — the fastest way to reach me is GitHub, or grab the résumé for the full picture.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={profile.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-black transition hover:brightness-110">
            <Github size={15} /> GitHub · Crepify
          </a>
          <a href={"/resume"} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm text-white/85 transition hover:bg-white/[0.08]">
            <FileText size={15} /> Résumé
          </a>
        </div>
      </motion.div>
      <footer className="flex flex-col items-center justify-between gap-3 pb-4 pt-10 text-xs text-white/35 sm:flex-row">
        <p>© {new Date().getFullYear()} {profile.name} · {profile.location}</p>
        <p className="font-mono text-[10px] tracking-[0.24em]">DESIGNED &amp; BUILT BY ARCHIT · EVERYTHING HERE IS REAL</p>
      </footer>
    </section>
  );
}
