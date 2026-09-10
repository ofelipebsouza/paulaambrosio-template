import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Compass, Layers, Sparkles, Building2, Coffee, Shield, Camera, ZoomIn, X, BookOpen, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { ProjectCard } from '../components/ProjectCard';
import { servicesData } from '../data/servicesData';
import { projectsData } from '../data/projectsData';
import { journalData } from '../data/journalData';

interface HospitalityPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const HospitalityPage: React.FC<HospitalityPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const data = servicesData.hospitality;
  const hospitalityProjects = projectsData.filter(p => p.category === 'Hospitality');
  const relatedJournalArticles = journalData.filter(a => a.relatedServices.includes('hospitality'));

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

  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    subtitle: string;
    category: string;
    description: string;
  } | null>(null);

  // Curated 4 flagship hospitality images as requested:
  // - Hotel / hospitality hero
  // - Guest room or common area
  // - Lounge / commercial project
  // - Material / detail image
  const flagshipHospitalityGallery = [
    {
      type: 'Hotel / Hospitality Hero',
      title: 'The Aurelia Arrival Salon & Fluted Cocktail Bar',
      subtitle: 'Boutique Hotel • South Beach / Miami Beach',
      category: 'Boutique Hotel & Lounge',
      description: 'Sculptural fluted walnut bar island, custom brushed brass sconces, and poured Venetian terrazzo flooring.',
      url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1600&q=85',
      badge: 'Hotel Hero & Arrival'
    },
    {
      type: 'Guest Room / Common Area',
      title: 'Boutique Penthouse Hospitality Suite',
      subtitle: 'Guest Suites & Private Terraces',
      category: 'Hospitality Suites',
      description: 'Tailored upholstered headboard wall, dim-to-warm architectural lighting, and bespoke minimalist joinery.',
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=85',
      badge: 'Guest Suites'
    },
    {
      type: 'Lounge / Commercial Project',
      title: 'Intimate Cocktail Pavilion & Secluded Alcove Seating',
      subtitle: 'Private Members Club & Lounge • Miami',
      category: 'Lounge & Commercial',
      description: 'Acoustically isolated velvet banquettes, low-glare warm illumination, and custom fluted bronze architectural dividers.',
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',
      badge: 'Lounge Environment'
    },
    {
      type: 'Material / Detail Image',
      title: 'Tactile Commercial Finish Engineering',
      subtitle: 'Stone, Hardwood & Contract Velvet Specifications',
      category: 'Material & Craft Detail',
      description: 'Honed Roman travertine, solid teak joinery, Crypton-treated performance fabrics, and living patinated brass accents.',
      url: '/assets/uJDafV2OYdKY0ezWt4AhW3Dpj0.avif',
      badge: 'Material Detail'
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Hospitality Interior Design Miami | Paula Ambrosio Interiors"
        description="Hospitality interior design in Miami for hotels, lounges, wellness, beauty and guest-focused commercial environments."
        faqs={data.faqs}
      />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-end justify-center overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Hospitality Interior Design Miami - Paula Ambrosio Interiors ${index + 1}`}
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
              Hospitality Interior Design in Miami
            </h1>

            <p className="font-serif-luxury text-lg sm:text-xl text-[#4A4540] font-light max-w-2xl mx-auto leading-relaxed">
              Memorable environments designed around experience, flow and identity.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenConsultation('Discuss a Hospitality Project', 'Miami')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-[#171513] hover:text-white transition-all text-center"
              >
                Discuss a Hospitality Project
              </button>
              
              <button
                onClick={() => {
                  const element = document.getElementById('hospitality-projects-section');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    onNavigate('/portfolio');
                  }
                }}
                className="px-8 py-4 bg-transparent border border-[#1A1816]/30 text-[#1A1816] text-xs uppercase tracking-widest font-medium hover:bg-[#1A1816] hover:text-white hover:border-[#1A1816] transition-all text-center"
              >
                View Hospitality Work
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning & Guest Journey Philosophy */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Hospitality Positioning & Capability
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Atmosphere, Flow & Operational Rigor
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                {data.approach}
              </p>
              
              {/* Core Pillars Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Guest Journey & Flow</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Arrival sequence, acoustic transitions & intuitive circulation</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Brand Identity & Visual Impact</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Distinctive spatial storytelling tailored to your guest demographic</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Durability & Materials</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Contract-rated textiles, sealed hardwoods & commercial stone</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Lighting & Ambiance</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Layered dim-to-warm architectural illumination & mood scenes</p>
                </div>
              </div>

              {/* Trade & Compliance Notice */}
              <div className="p-4 bg-[#F2EDE5] border border-[#E2DBD1] flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                <div className="text-xs text-[#68625B] leading-relaxed">
                  <span className="font-semibold text-[#1A1816]">Commercial Project Coordination:</span> We collaborate closely with commercial general contractors, hospitality operators, and MEP engineers, delivering complete architectural interior CAD packages, egress clearances, and ADA compliance.
                </div>
              </div>
            </div>

            {/* Visual pairing */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="aspect-[4/5] overflow-hidden border border-[#E2DBD1] shadow-md">
                    <img
                      src="https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=85"
                      alt="Boutique hospitality arrival bar by Paula Ambrosio Interiors"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="text-[11px] text-[#7A746E] font-light">The Aurelia • Lounge & Bar Architecture</div>
                </div>
                <div className="space-y-2 pt-6">
                  <div className="aspect-[4/5] overflow-hidden border border-[#E2DBD1] shadow-md">
                    <img
                      src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85"
                      alt="Boutique hotel penthouse suite"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="text-[11px] text-[#7A746E] font-light">Signature Penthouse Hospitality Suite</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Flagship Hospitality Photography Gallery (4 Core Assets) */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                <Camera className="w-3.5 h-3.5" />
                <span>Hospitality Visual Portfolio</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Curated Hospitality & Commercial Archive
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Inspect our hotel, lounge, guest suite, and commercial material craftsmanship.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              Explore All Projects →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {flagshipHospitalityGallery.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(item)}
                className="group relative cursor-pointer bg-[#FAF9F6] border border-[#E5DFD7] hover:border-[#C9A986] transition-all shadow-xs overflow-hidden"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171513]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <div className="text-white flex items-center justify-between w-full">
                      <span className="text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-[#C9A986]" />
                        Expand Photo View
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-[#171513]/85 text-[#E8D8C8] text-[10px] uppercase tracking-widest px-2.5 py-1 backdrop-blur-xs border border-white/10">
                    {item.badge}
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-[11px] uppercase tracking-widest text-[#C9A986] font-semibold mb-1">
                    {item.category}
                  </div>
                  <h3 className="font-serif-luxury text-xl text-[#1A1816] group-hover:text-[#C9A986] transition-colors font-medium mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#7A746E] font-light leading-relaxed mb-3">
                    {item.description}
                  </p>
                  <div className="text-[11px] text-[#A8A199] flex items-center justify-between border-t border-[#EAE4DB] pt-3">
                    <span>{item.subtitle}</span>
                    <span className="text-[#C9A986] font-medium group-hover:underline">Inspect Atmosphere →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Sectors Supported by Portfolio & Capabilities */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Supported Sectors
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Hospitality & Guest-Focused Sectors
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light max-w-2xl mx-auto">
              We design exclusively for sectors where our studio has verified capability and portfolio evidence: boutique hotels, cocktail lounges, wellness spas, high-end beauty destinations, and private member salons.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Boutique Hotels & Suites',
                desc: 'Signature arrival lobbies, guest suites, and penthouse accommodations with residential warmth.',
                icon: '🏨'
              },
              {
                title: 'Lounges & Member Clubs',
                desc: 'Intimate cocktail pavilions, bespoke bar joinery, acoustic privacy, and layered mood lighting.',
                icon: '🍸'
              },
              {
                title: 'Wellness Spas & Beauty',
                desc: 'Hydrotherapy suites, aesthetic clinics, and sensory wellness sanctuaries with natural stone finishes.',
                icon: '🌿'
              },
              {
                title: 'Commercial FF&E Procurement',
                desc: 'Contract-grade materials, Crypton textiles, custom commercial millwork, and logistics oversight.',
                icon: '📦'
              }
            ].map((sector, idx) => (
              <div key={idx} className="p-6 bg-white border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-3">{sector.icon}</div>
                  <h3 className="font-serif-luxury text-lg text-[#1A1816] mb-2">{sector.title}</h3>
                  <p className="text-xs text-[#68625B] leading-relaxed font-light">{sector.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Process: Guest Journey to Launch */}
      <ProcessTimeline
        title="Hospitality Design Journey"
        subtitle="Brand Narrative & Guest Journey → Public & Private Space Planning → Material & Lighting Engineering → Contract FF&E Procurement → Installation & Launch Styling."
        steps={data.processSteps}
        onStartProject={() => onOpenConsultation('Discuss a Hospitality Project', 'Miami')}
      />

      {/* Featured Hospitality Work (Verified Project) */}
      <section id="hospitality-projects-section" className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Verified Hospitality Case Study
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Featured Hospitality Project
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Documented commercial case study highlighting property typology, guest journey, and scope.
              </p>
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
              <div key={p.id} className="flex flex-col h-full">
                <ProjectCard
                  project={p}
                  onNavigate={onNavigate}
                  aspectRatio="aspect-[16/10]"
                />
                <div className="mt-3 p-4 bg-white border border-[#E5DFD7] text-xs text-[#68625B] space-y-2">
                  <div className="flex items-center justify-between text-[#1A1816] font-medium">
                    <span>📍 {p.city || p.location}</span>
                    <span className="text-[#C9A986] text-[11px] uppercase tracking-wider">{p.propertyType}</span>
                  </div>
                  <p className="text-xs text-[#7A746E] font-light leading-relaxed">
                    <span className="font-semibold text-[#1A1816]">Scope:</span> {p.services.join(', ')}
                  </p>
                  <p className="text-xs text-[#7A746E] font-light leading-relaxed border-t border-[#EAE4DB] pt-2">
                    {p.clientVision}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Relevant Journal Articles Linked to Hospitality Service */}
      {relatedJournalArticles.length > 0 && (
        <section className="py-20 bg-white border-b border-[#EAE4DB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                  Journal & Insights
                </div>
                <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                  Hospitality Design Perspectives
                </h2>
                <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                  Architectural insights on sensory guest experience, durability engineering, and spatial storytelling in Miami.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/journal')}
                className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
              >
                Read All Articles →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedJournalArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => onNavigate(`/journal/${article.slug}`)}
                  className="group cursor-pointer bg-[#FAF9F6] border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex flex-col overflow-hidden"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold mb-2">
                        {article.category} • {article.readTime}
                      </div>
                      <h3 className="font-serif-luxury text-lg text-[#1A1816] group-hover:text-[#C9A986] transition-colors mb-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-[#7A746E] line-clamp-3 font-light leading-relaxed mb-4">
                        {article.excerpt}
                      </p>
                    </div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-[#1A1816] flex items-center gap-1.5 border-t border-[#EAE4DB] pt-3">
                      <span>Read Journal Article</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C9A986] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
            Hospitality Interior Design in Miami
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Memorable environments designed around experience, flow and identity for boutique hotels, lounges, and wellness sanctuaries.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Discuss a Hospitality Project', 'Miami')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              DISCUSS A HOSPITALITY PROJECT
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('hospitality-projects-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onNavigate('/portfolio');
                }
              }}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              VIEW HOSPITALITY WORK
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Hospitality Photography */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#171513] border border-[#332F2B] overflow-hidden text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/60 text-white hover:text-[#C9A986] flex items-center justify-center border border-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-[16/10] w-full bg-black">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6 bg-[#1C1A18] border-t border-[#332F2B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold">{selectedPhoto.type}</span>
                <h3 className="font-serif-luxury text-xl text-white font-medium mt-0.5">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs text-[#A8A199] mt-0.5 font-light">
                  {selectedPhoto.subtitle} • {selectedPhoto.description}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPhoto(null);
                  onOpenConsultation(`Hospitality Inquiry: ${selectedPhoto.type}`, 'Miami');
                }}
                className="px-5 py-2.5 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all whitespace-nowrap"
              >
                Inquire For Your Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
