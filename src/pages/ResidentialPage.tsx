import React from 'react';
import { ArrowRight, Check, Compass, Layers, MapPin, Sparkles, Home, Shield, Award } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { ProjectCard } from '../components/ProjectCard';
import { servicesData } from '../data/servicesData';
import { projectsData } from '../data/projectsData';

interface ResidentialPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const ResidentialPage: React.FC<ResidentialPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const data = servicesData.residential;
  const residentialProjects = projectsData.filter(p => p.category === 'Residential');

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
            alt="Luxury Residential Interior Design Miami - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Bespoke Residential Discipline</span>
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
                onClick={() => onOpenConsultation('Luxury Residential Design')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg"
              >
                Start Your Residential Project
              </button>
              
              <button
                onClick={() => onNavigate('/portfolio')}
                className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all text-center"
              >
                View Residential Projects
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning & Design Approach */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Design Philosophy
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Bespoke Architecture, Natural Materials & Quiet Luxury
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                {data.approach}
              </p>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Every residence we design is deeply anchored in its architectural context. We consider the quality of sunlight filtering through floor-to-ceiling glass, the acoustic harmony of expansive open rooms, and the sensory richness of European oak, honed limestones, and handcrafted bronze details.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Proportion & Flow</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Harmonious scale and intuitive transitions</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Material Sincerity</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Authentic stones, solid woods & natural fibers</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85"
                  alt="Luxury Kitchen in Miami Beach Estate"
                  className="w-full aspect-[3/4] object-cover border border-[#E2DBD1] shadow-md"
                />
                <img
                  src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=85"
                  alt="Primary Suite in Palm Beach Residence"
                  className="w-full aspect-[3/4] object-cover border border-[#E2DBD1] shadow-md mt-8"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Services Breakdown */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Full-Spectrum Scope
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Residential Design Disciplines
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light">
              From schematic architectural planning through to procurement, custom millwork, and final styling.
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
        title="Residential Design Journey"
        subtitle="Discovery & Programming → Concept & Architecture → Design Development & 3D Previews → Procurement & Trade Coordination → Installation & Reveal."
        steps={data.processSteps}
        onStartProject={() => onOpenConsultation('Luxury Residential Design')}
      />

      {/* Featured Residential Projects */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Portfolio
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Featured Residential Case Studies
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              View Full Portfolio →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {residentialProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onNavigate={onNavigate}
                aspectRatio="aspect-[4/3]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Property Typologies */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
              Expertise
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Residential Property Typologies
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.propertyTypes.map((prop, idx) => (
              <div key={idx} className="p-5 bg-[#FAF9F6] border border-[#E5DFD7] flex items-center gap-3">
                <Check className="w-4 h-4 text-[#C9A986] shrink-0" />
                <span className="text-xs sm:text-sm text-[#1A1816] font-medium">{prop}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQAccordion
        title="Residential Interior Design FAQ"
        subtitle="Answers regarding architectural collaboration, project timelines, materials, and investment thresholds."
        faqs={data.faqs}
      />

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Start Your Residential Project
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Contact Paula Ambrosio Interiors to schedule a private consultation for your waterfront residence, condominium, or custom estate.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Luxury Residential Design')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Start Your Residential Project
            </button>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              View Residential Projects
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
