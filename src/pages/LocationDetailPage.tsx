import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Compass, MapPin, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { ProjectCard } from '../components/ProjectCard';
import { locationsData } from '../data/locationsData';
import { projectsData } from '../data/projectsData';

interface LocationDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const LocationDetailPage: React.FC<LocationDetailPageProps> = ({ slug, onNavigate, onOpenConsultation }) => {
  const location = locationsData.find(loc => loc.slug === slug) || locationsData[0];
  const featuredProject = projectsData.find(p => p.slug === location.featuredProjectSlug) || projectsData[0];
  const relatedProjects = projectsData.filter(p => p.city.toLowerCase() === location.city.toLowerCase() || p.location.includes(location.city));

  const heroImages = [
    '/assets/hero-img-1.avif',
    '/assets/hero-img-2.avif',
    '/assets/hero-img-3.avif',
  ];
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title={location.seoTitle}
        description={location.metaDescription}
        faqs={location.faqs}
      />

      {/* Breadcrumb Navigation */}
      <div className="bg-[#FAF9F6] border-b border-[#EAE4DB] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-2 text-xs text-[#7A746E]">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
            className="hover:text-[#1A1816]"
          >
            Home
          </a>
          <ChevronRight className="w-3 h-3 text-[#B8B1A8]" />
          <a
            href="/locations"
            onClick={(e) => { e.preventDefault(); onNavigate('/locations'); }}
            className="hover:text-[#1A1816]"
          >
            Locations
          </a>
          <ChevronRight className="w-3 h-3 text-[#B8B1A8]" />
          <span className="text-[#1A1816] font-medium">{location.city}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-end justify-center overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Luxury Interior Designer ${location.city} - Paula Ambrosio Interiors ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1500ms] ease-in-out ${
                index === currentHeroIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent h-full" style={{ top: '40%' }} />
        </div>

        {/* Text Content Centered at Bottom */}
        <div className="relative z-10 w-full pb-20 pt-80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight text-[#1A1816]">
              {location.heroHeadline}
            </h1>

            <p className="font-serif-luxury text-lg sm:text-xl text-[#4A4540] font-light max-w-2xl mx-auto leading-relaxed">
              {location.heroSubheadline}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenConsultation(`Project in ${location.city}`, location.city)}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-[#171513] hover:text-white transition-all text-center"
              >
                Start Your {location.city} Project
              </button>
              
              <button
                onClick={() => onOpenConsultation(`Private Consultation - ${location.city}`, location.city)}
                className="px-8 py-4 bg-transparent border border-[#1A1816]/30 text-[#1A1816] text-xs uppercase tracking-widest font-medium hover:bg-[#1A1816] hover:text-white hover:border-[#1A1816] transition-all text-center"
              >
                Request a Private Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Localized Intro Section (150-250 unique words) */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Local Architectural Context
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Interior Architecture in {location.city}
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                {location.localIntro}
              </p>

              {/* Highlights & Enclaves */}
              <div className="pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816] mb-2">
                  Featured Neighborhoods & Enclaves:
                </div>
                <div className="flex flex-wrap gap-2">
                  {location.highlights.map((hl, idx) => (
                    <span key={idx} className="text-xs px-3 py-1.5 bg-white border border-[#DDD5CA] text-[#4A453F] font-medium">
                      {hl}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative">
                <img
                  src={location.galleryImages[0]?.url || location.heroImage}
                  alt={location.galleryImages[0]?.alt || `${location.city} Interior Design`}
                  className="w-full aspect-[4/3] object-cover border border-[#E2DBD1] shadow-lg"
                />
                <div className="absolute -bottom-4 -right-4 bg-white p-4 border border-[#E2DBD1] shadow-md hidden sm:block max-w-xs">
                  <p className="text-[11px] uppercase tracking-widest text-[#C9A986] font-semibold">Verified Scope</p>
                  <p className="text-xs text-[#524D47] mt-1 font-light">Turnkey, Full-Service Residential & Renovation Coordination</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services Specific to This Location */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Tailored Capabilities
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Services Offered in {location.city}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {location.services.map((svc, idx) => (
              <div key={idx} className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] flex items-start gap-4">
                <div className="w-8 h-8 bg-[#F0EAE1] text-[#C9A986] flex items-center justify-center text-xs font-bold shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1816]">{svc}</h3>
                  <p className="text-xs text-[#68625B] mt-1 font-light">
                    Customized execution adapted to {location.city} properties.
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Featured Verified Project in Location */}
      {featuredProject && (
        <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12 space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Local Case Study
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Featured {location.city} Project: {featuredProject.title}
              </h2>
              <p className="text-sm text-[#6E6861] font-light">
                {featuredProject.subTitle} — {featuredProject.location}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white border border-[#E5DFD7] p-8 shadow-xs">
              <div className="lg:col-span-6">
                <img
                  src={featuredProject.coverImage}
                  alt={featuredProject.title}
                  className="w-full aspect-[16/11] object-cover border border-[#E8E2D8]"
                />
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#FAF9F6] border border-[#E5DFD7] text-[10px] uppercase tracking-widest text-[#1A1816] font-semibold">
                      {featuredProject.category}
                    </span>
                    <span className="text-xs text-[#7A746E] font-light">
                      Completed: {featuredProject.completionYear}
                    </span>
                  </div>

                  <h3 className="font-serif-luxury text-2xl sm:text-3xl text-[#1A1816] font-medium">
                    {featuredProject.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#5C564F] leading-relaxed font-light">
                    {featuredProject.clientVision}
                  </p>

                  <div className="p-4 bg-[#FAF9F6] border-l-2 border-[#C9A986] text-xs text-[#615B54] font-light">
                    <strong className="text-[#1A1816] block font-medium mb-1">Design Challenge & Solution:</strong>
                    {featuredProject.designChallenge}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EAE4DB] flex items-center justify-between">
                  <button
                    onClick={() => onNavigate(`/portfolio/${featuredProject.slug}`)}
                    className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#1A1816] hover:text-[#C9A986] transition-colors"
                  >
                    <span>Read Complete Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenConsultation(`Similar Project in ${location.city}`, location.city)}
                    className="text-xs uppercase tracking-wider text-[#C9A986] hover:underline"
                  >
                    Discuss Similar Project →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Process Section */}
      <ProcessTimeline
        title={`${location.city} Design Process`}
        subtitle="Consultation → Concept → Visualization → Design Development → Procurement/Coordination → Installation/Styling."
        steps={location.processSteps}
        onStartProject={() => onOpenConsultation(`Project in ${location.city}`, location.city)}
      />

      {/* Localized FAQ Section */}
      <FAQAccordion
        title={`${location.city} Interior Design FAQ`}
        subtitle={`Frequently asked questions for clients considering an interior design or turnkey project in ${location.city}.`}
        faqs={location.faqs}
      />

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Start Your {location.city} Project
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Contact Paula Ambrosio Interiors to schedule a private consultation for your {location.city} home.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation(`Project in ${location.city}`, location.city)}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Start Your {location.city} Project
            </button>
            <button
              onClick={() => onOpenConsultation(`Private Consultation - ${location.city}`, location.city)}
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
