import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Modules from "@/components/Modules";
import Platform from "@/components/Platform";
import Why from "@/components/Why";
import Workflow from "@/components/Workflow";
import Stats from "@/components/Stats";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import SiteMotion from "@/components/SiteMotion";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Modules />
        <Platform />
        <Why />
        <Workflow />
        <Stats />
        <CTA />
      </main>
      <Footer />
      <SiteMotion />
    </>
  );
}
