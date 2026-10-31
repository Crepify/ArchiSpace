import Hero from "@/components/Hero";
import WorkBento from "@/components/WorkBento";
import { ToolkitMarquee, About, Journey, Contact } from "@/components/Sections";

export default function Home() {
  return (
    <main>
      <Hero />
      <WorkBento />
      <ToolkitMarquee />
      <About />
      <Journey />
      <Contact />
    </main>
  );
}
