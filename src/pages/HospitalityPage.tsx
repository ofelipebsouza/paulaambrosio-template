import React from 'react';
import { ArrowRight, Check, Compass, Layers, Sparkles, Building2, Coffee, Shield } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { ProjectCard } from '../components/ProjectCard';
import { servicesData } from '../data/servicesData';
import { projectsData } from '../data/projectsData';

interface HospitalityPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const HospitalityPage: React.FC<HospitalityPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const data = servicesData.hospitality;
  const hospitalityProjects = projectsData.filter(p => p.category === 'Hospitality');

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title={data.seoTitle}
        description={data.metaDescription}
        faqs={data.faqs}
      />

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={data.coverImage}
            alt="Hospitality Interior Design Miami - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Commercial & Hospitality Sector</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              {data.heroHeadline}
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              {data.heroSubheadline}
            </p>

            <p className="text-sm sm:text-base text-[#B8B1A8] font-light leading-relaxed max-w-xl">
              {data.intro}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onOpenConsultation('Hospitality & Commercial Design')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg"
              >
                Discuss a Hospitality Project
              </button>
              
              <button
                onClick={() => onNavigate('/portfolio')}
                className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all text-center"
              >
                View Hospitality Work
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning & Approach */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Guest Experience Design
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Atmosphere, Flow & Operational Rigor
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                {data.approach}
              </p>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Our hospitality projects are engineered for high-performance durability without sacrificing the tactile intimacy and quiet sophistication of an ultra-luxury private home.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Sensory Immersion</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Acoustics, ambient illumination & spatial flow</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Contract Durability</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">High-abrasion fabrics, sealed woods & code safety</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85"
                  alt="Boutique Hotel Hospitality Suite by Paula Ambrosio Interiors"
                  className="w-full aspect-[4/3] object-cover border border-[#E2DBD1] shadow-lg"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Sectors We Design */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Sectors & Environments
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Hospitality & Commercial Typologies
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light">
              Tailored commercial spaces designed for brand resonance and memorable guest engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.scopeItems.map((item, idx) => (
              <div key={idx} className="p-7 bg-[#FAF9F6] border border-[#E5DFD7] flex flex-col justify-between">
                <div>
                  <h3 className="font-serif-luxury text-xl text-[#1A1816] mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-[#68625B] leading-relaxed font-light">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Process Section */}
      <ProcessTimeline
        title="Hospitality Design Journey"
        subtitle="Brand Narrative & Guest Journey → Public & Private Space Planning → Material & Lighting Engineering → Contract FF&E Procurement → Installation & Launch Styling."
        steps={data.processSteps}
        onStartProject={() => onOpenConsultation('Hospitality Project')}
      />

      {/* Featured Hospitality Work */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Portfolio
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Featured Hospitality Project
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              View Full Portfolio →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hospitalityProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onNavigate={onNavigate}
                aspectRatio="aspect-[16/10]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQAccordion
        title="Hospitality Interior Design FAQ"
        subtitle="Answers regarding commercial codes, FF&E manufacturing, and operational flow coordination."
        faqs={data.faqs}
      />

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Discuss a Hospitality Project
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Connect with Paula Ambrosio Interiors to explore how we can elevate your boutique hotel, lounge, or commercial space.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Hospitality & Commercial Design')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Discuss a Hospitality Project
            </button>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              View Hospitality Work
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
