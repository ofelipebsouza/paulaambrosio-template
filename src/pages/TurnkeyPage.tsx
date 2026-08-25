import React from 'react';
import { ArrowRight, Check, Compass, Sparkles, Shield, Clock, Layers, Award } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { ProjectCard } from '../components/ProjectCard';
import { servicesData } from '../data/servicesData';
import { projectsData } from '../data/projectsData';

interface TurnkeyPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const TurnkeyPage: React.FC<TurnkeyPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const data = servicesData.turnkey;
  const turnkeyProjects = projectsData.filter(p => p.category === 'Turnkey');

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
            alt="Turnkey Interior Design in Miami - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>White-Glove Move-In Ready Service</span>
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
                onClick={() => onOpenConsultation('Turnkey Interior Design')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg"
              >
                Start Your Turnkey Project
              </button>
              
              <button
                onClick={() => onOpenConsultation('Private Consultation - Turnkey')}
                className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all text-center"
              >
                Request a Private Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What Turnkey Means & Miami International Lifestyle */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Complete Living Experience
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                What Turnkey Means
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                {data.whatItMeans}
              </p>

              <div className="p-6 bg-white border border-[#E5DFD7] space-y-2">
                <div className="text-xs uppercase tracking-widest text-[#1A1816] font-semibold flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#C9A986]" />
                  <span>Miami International Lifestyle</span>
                </div>
                <p className="text-xs sm:text-sm text-[#615B54] font-light leading-relaxed">
                  {data.lifestyleStatement}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Zero Friction</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Complete logistics, freight & assembly oversight</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Curated Down to Linens</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Custom bedding, scents, tableware & art</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <BeforeAfterSlider
                beforeImage="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"
                afterImage="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85"
                beforeLabel="Initial Concrete Shell"
                afterLabel="Turnkey Sky Penthouse"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Scope of Turnkey Services */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Turnkey Inclusions
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Comprehensive Turnkey Scope
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light">
              Every detail is accounted for so that your arrival feels like stepping into a private boutique hotel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.scopeItems.map((item, idx) => (
              <div key={idx} className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 mb-4 bg-[#F2EDE5] text-[#C9A986] flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-[#1A1816] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#68625B] leading-relaxed font-light">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Eight-Step Turnkey Process */}
      <ProcessTimeline
        title="The Eight-Step Turnkey Sequence"
        subtitle="Understand → Design → Visualize → Source → Coordinate → Install → Style → Reveal."
        steps={data.processSteps}
        onStartProject={() => onOpenConsultation('Turnkey Project')}
      />

      {/* Featured Turnkey Case Studies */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Turnkey Portfolio
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Completed Turnkey Residences
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
            {turnkeyProjects.map((p) => (
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

      {/* Property Types */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
              Suitability
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Property Types We Turnkey
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
        title="Turnkey Interior Design FAQ"
        subtitle="Common questions regarding turnkey logistics, budget parameters, and international client workflows."
        faqs={data.faqs}
      />

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Start Your Turnkey Project
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Contact Paula Ambrosio Interiors to schedule a confidential turnkey design consultation for your South Florida residence.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Turnkey Interior Design')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Start Your Turnkey Project
            </button>
            <button
              onClick={() => onOpenConsultation('Private Consultation - Turnkey')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              Request a Private Consultation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
