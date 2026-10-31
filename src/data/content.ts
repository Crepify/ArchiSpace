// Real content only — lifted verbatim from Archit's existing site data
// (archispace/src/profile.js + projects.js). If a fact isn't here, it doesn't ship.

export const profile = {
  name: "Archit Renjeev",
  firstName: "Archit",
  headline: "Backend-focused developer · AI & Data Science student",
  location: "Bengaluru, India",
  badge: "AI & Data Science student · Bengaluru",
  heroLine: "I build software that runs in the real world.",
  heroSub: "Everything on this desk is real and built by me.",
  bio: [
    "Born in Kerala and raised in Bengaluru, I'm a backend-focused developer and AI & Data Science student with a love for gaming, technology and the automotive world. I'm curious about it all: software, hardware, electronics, mechanical systems, cars and bikes.",
    "I'm drawn to new-generation technology, especially AI, and I'm currently learning AI model training. I'm also a big Iron Man fan. For me, the excitement is in understanding how things work and finding ways to build something useful.",
    "I enjoy listening, simplifying ideas, suggesting new directions and bringing people together. Entrepreneurship is a big part of what I aspire to, and I hope to build a startup one day with my friends and partners in 404 Error Found.",
  ],
  github: "https://github.com/Crepify",
  siteUrl: "https://architspace.vercel.app",
};

// Legacy pages (owner workspace, calculators, shares, résumé) keep running
// under /legacy/ on the same domain; /owner, /tools etc. redirect there.
export const legacyUrl = (page: "owner" | "tools" | "share" | "resume") => `/legacy/${page}.html`;

export const skills = [
  "Backend development & configuration",
  "Full-stack development (working knowledge)",
  "GitHub configuration",
  "Vercel",
  "Supabase",
  "Prompt engineering",
  "Game development (familiarity)",
  "Web development & hosting fundamentals",
  "UI fundamentals",
  "AI model training (learning)",
];

export type Project = {
  id: string;
  title: string;
  context: string;
  status: string;
  statusLive?: boolean;
  description: string;
  image: string;
  url?: string;
  urlLabel?: string;
  span: string; // bento span classes
};

export const projects: Project[] = [
  {
    id: "civiceye",
    title: "CivicEye",
    context: "Our flagship project · 404 Error Found",
    status: "Live",
    statusLive: true,
    description:
      "CivicEye is the flagship and passion project of 404 Error Found. A shared idea we care deeply about and continue to build together.",
    image: "/screens/civiceye-site.jpg",
    url: "https://civiceye.co.in",
    urlLabel: "Visit civiceye.co.in",
    span: "md:col-span-7",
  },
  {
    id: "agripulse",
    title: "AgriPulse",
    context: "NexHack · IITM Delhi",
    status: "Hackathon build — shortlisted, travelled to Delhi",
    description:
      "AgriPulse was our agritech app project for NexHack at IITM Delhi. It aimed to bring leaf scanning, a central marketplace for farmers to sell their crops, and other supporting features into one app.",
    image: "/screens/agripulse-app.jpg",
    span: "md:col-span-5",
  },
  {
    id: "metrikai",
    title: "MetrikAI",
    context: "SIH · National hackathon",
    status: "Live",
    statusLive: true,
    description: "MetrikAI is our SIH project, created for a national hackathon.",
    image: "/screens/metrikai.jpg",
    url: "https://metrik-steel.vercel.app",
    urlLabel: "Visit metrik-steel.vercel.app",
    span: "md:col-span-5",
  },
  {
    id: "archispace",
    title: "ArchiSpace",
    context: "This website · personal universe & workspace",
    status: "Live",
    statusLive: true,
    description:
      "My personal site and owner workspace — a public portfolio with private, login-protected tools for my degree, plus read-only shares I control.",
    image: "/screens/archispace-new.jpg",
    url: "https://architspace.vercel.app",
    urlLabel: "Visit architspace.vercel.app",
    span: "md:col-span-7",
  },
];

export const hackathonNotes = [
  {
    event: "NexHack · IITM Delhi",
    project: "AgriPulse",
    outcome: "Shortlisted and travelled to Delhi; narrowly missed making the elimination round.",
  },
  {
    event: "Smart India Hackathon (SIH)",
    project: "MetrikAI",
    outcome: "Built MetrikAI for a national hackathon.",
  },
];
