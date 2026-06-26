import { Navbar } from "@/components/layout/navbar";
import HeroScrollScrub from "@/components/landing/HeroScrollScrub";
import Features from "@/components/landing/Features";
import Workflow from "@/components/landing/Workflow";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroScrollScrub />
        <Features />
        <Workflow />
        <Testimonials />
        <Pricing />
      </main>
    </>
  );
}
