import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DockNav from "@/components/DockNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://architspace.vercel.app"),
  title: "Archit Renjeev · Backend-focused developer & AI & Data Science student",
  description:
    "ArchiSpace by Archit Renjeev — a backend-focused AI & Data Science student in Bengaluru, building clear ideas and collaborative projects. Currently learning AI model training.",
  openGraph: {
    title: "Archit Renjeev — I build software that runs in the real world",
    description:
      "Backend-focused developer · AI & Data Science student. CivicEye, AgriPulse, MetrikAI — everything here is real and built by me.",
    url: "https://architspace.vercel.app",
    siteName: "ArchiSpace",
    type: "website",
    images: [{ url: "/screens/archispace-new.jpg", alt: "ArchiSpace — Archit Renjeev's interactive 3D desk" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Archit Renjeev — I build software that runs in the real world",
    description:
      "Backend-focused developer · AI & Data Science student. CivicEye, AgriPulse, MetrikAI — everything here is real and built by me.",
    images: ["/screens/archispace-new.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-ink min-h-screen">
        <DockNav />
        {children}
      </body>
    </html>
  );
}
