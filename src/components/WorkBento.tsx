"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/data/content";

export default function WorkBento() {
  return (
    <section id="work" className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-24">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <p className="font-mono text-[11px] tracking-[0.3em] text-accent">MY WORK</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Real projects, running on this desk.</h2>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-mist">
          Every card below is something I actually built — no concept pieces, no borrowed work.
        </p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12">
        {projects.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: (i % 2) * 0.08 }}
            className={`group overflow-hidden rounded-4xl border border-white/10 bg-panel transition duration-300 hover:-translate-y-1 hover:border-white/25 ${p.span}`}
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={p.image}
                alt={`${p.title} — real screenshot`}
                fill
                sizes="(max-width: 768px) 100vw, 700px"
                className={`${p.id === "agripulse" ? "object-contain bg-[#07130c]" : "object-cover object-top"} transition duration-500 group-hover:scale-[1.03]`}
              />
              <span
                className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] backdrop-blur-md ${
                  p.statusLive ? "bg-accent/15 text-accent" : "bg-black/55 text-white/75"
                }`}
              >
                {p.statusLive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                {p.status.toUpperCase()}
              </span>
            </div>
            <div className="p-6 sm:p-7">
              <p className="font-mono text-[10px] tracking-[0.24em] text-white/40">{p.context.toUpperCase()}</p>
              <h3 className="mt-2 text-[22px] font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{p.description}</p>
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition hover:gap-2.5"
                >
                  {p.urlLabel} <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
