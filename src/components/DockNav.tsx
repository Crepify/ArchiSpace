"use client";

import { motion } from "framer-motion";
import { Home, LayoutGrid, User, FileText, Calculator, Lock } from "lucide-react";
const items = [
  { label: "Home", href: "#top", icon: Home },
  { label: "Work", href: "#work", icon: LayoutGrid },
  { label: "About", href: "#about", icon: User },
  { label: "Résumé", href: "/resume", icon: FileText },
  { label: "Calculators", href: "/tools", icon: Calculator },
  { label: "Owner", href: "/owner", icon: Lock },
];

export default function DockNav() {
  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-3"
    >
      <nav
        aria-label="Primary"
        className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-md"
      >
        <a
          href="#top"
          className="mr-1 hidden items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.22em] text-white/90 sm:flex"
        >
          ARCHIT<span className="text-accent">·</span>SPACE
        </a>
        {items.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            className="group flex items-center gap-2 rounded-full px-3 py-2 text-[13px] text-white/65 transition hover:bg-white/[0.07] hover:text-white"
          >
            <Icon size={15} strokeWidth={1.8} className="text-white/45 transition group-hover:text-accent" />
            <span className="hidden md:inline">{label}</span>
          </a>
        ))}
      </nav>
    </motion.header>
  );
}
