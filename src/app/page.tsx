import Hero from '@/components/home/Hero';
import StatsBar from '@/components/home/StatsBar';
import CTASection from '@/components/home/CTASection';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import Footer from '@/components/home/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <Hero />
      <StatsBar />
      <CTASection />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
}
