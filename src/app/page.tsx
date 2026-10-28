import { Preloader } from "@/components/experience/preloader";
import { Hero } from "@/components/experience/hero";
import { Menu } from "@/components/experience/Menu";
import { ScrollingText } from "@/components/experience/scrolling-text";
import { VideoScrubSection } from "@/components/experience/video-scrub-section";
import { DeveloperMetrics } from "@/components/experience/developer-metrics";
import { Works } from "@/components/experience/works";
import { StudioVideo } from "@/components/experience/studio-video";
import { StudioInfo } from "@/components/experience/studio-info";
import { ExperienceFooter } from "@/components/experience/footer";

export default function Home() {
  return (
    <main className="relative bg-[#050505] min-h-screen text-white selection:bg-white selection:text-black">
      <Preloader />
      <Menu />

      {/* Hero with WebGL scanline bloom & brand logo */}
      <Hero />

      {/* Kinetic typography transition */}
      <ScrollingText />

      {/* Interactive scroll-scrub video with educational platform capabilities */}
      <VideoScrubSection />

      {/* Developer readiness topography & metrics */}
      <DeveloperMetrics />

      {/* Feature showcase with dynamic hover reveals */}
      <Works />

      {/* BrainWhite Engine v2 architectural walkthrough video */}
      <StudioVideo />

      {/* Core architectural thesis & platform deliverables */}
      <StudioInfo />

      {/* Final conversion CTA and footer */}
      <ExperienceFooter />
    </main>
  );
}
