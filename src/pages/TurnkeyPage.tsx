import React, { useState } from 'react';
import { ArrowRight, Check, Compass, Sparkles, Shield, Clock, Layers, Award, Camera, ZoomIn, X, Building, Home, CheckCircle2 } from 'lucide-react';
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
  const turnkeyProjects = projectsData.filter(p => p.category === 'Turnkey' || p.services.includes('Turnkey Furnishings') || p.services.includes('Turnkey Staging'));
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; subtitle: string; category: string } | null>(null);

  // Curated Turnkey Asset Showcases
  const turnkeyAssetShowcase = [
    {
      category: 'Final Styled Living Room',
      title: 'Monolithic Great Room & Sculptural Helical Staircase',
      subtitle: 'HOME KD • Miami, FL',
      description: 'Double-height volume styled with bespoke curved upholstery, honed stone, and layered indirect lighting.',
      url: '/assets/cRTC5lm1QD9HiCvnd7TYPrsOuY.avif',
      badge: 'Living Salon'
    },
    {
      category: 'Bedroom Fully Dressed & Styled',
      title: 'Primary Sanctuary with Fluted Wood Paneling & Custom Bedding',
      subtitle: 'HOME FL • Miami Waterfront',
      description: 'Acoustic oak headboard wall, tailored Italian linen layers, and custom bedside lighting.',
      url: '/assets/2Ssjz627D6EoynArvuU4h86sCc.avif',
      badge: 'Primary Suite'
    },
    {
      category: 'Custom Millwork Detail',
      title: 'Integrated Culinary Pavilion with Blackened Bronze & Oak',
      subtitle: 'HOME IT • Coral Gables / Miami',
      description: 'Bespoke concealed cabinetry, bookmatched marble waterfall island, and flush architectural joinery.',
      url: '/assets/X8XTDp3V2Z56VsOWfw8jCyBLpuk.webp',
      badge: 'Custom Millwork'
    },
    {
      category: 'Art & Accessory Installation Detail',
      title: 'Roman Travertine Spa Suite & Curated Sculpture Placement',
      subtitle: 'HOME S • Miami Beach',
      description: 'Hand-selected travertine surfaces, artisan vanity fixtures, custom mirrors, and organic vessels.',
      url: '/assets/uJDafV2OYdKY0ezWt4AhW3Dpj0.avif',
      badge: 'Art & Accessories'
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Turnkey Interior Design Miami | Paula Ambrosio Interiors"
        description="Complete turnkey interior design in Miami. From concept and construction selections to furniture, procurement, installation and final styling."
        faqs={data.faqs}
      />

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/cRTC5lm1QD9HiCvnd7TYPrsOuY.avif"
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
              Turnkey Interior Design in Miami
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              From Concept to Move-In Ready.
            </p>

            <p className="text-sm sm:text-base text-[#B8B1A8] font-light leading-relaxed max-w-xl">
              {data.intro}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onOpenConsultation('Start Your Turnkey Project', 'Miami')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg"
              >
                START YOUR TURNKEY PROJECT
              </button>
              
              <button
                onClick={() => onOpenConsultation('Request a Private Consultation', 'Miami')}
                className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all text-center"
              >
                REQUEST A PRIVATE CONSULTATION
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
                Turnkey means complete. The furniture is installed. The artwork is placed. The lighting has been considered. The accessories are styled. The rooms feel finished. Our role is to transform the design vision into a fully realized home.
              </p>

              {/* Miami International Lifestyle Box */}
              <div className="p-6 bg-white border border-[#E5DFD7] space-y-2">
                <div className="text-xs uppercase tracking-widest text-[#1A1816] font-semibold flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#C9A986]" />
                  <span>Miami International Lifestyle</span>
                </div>
                <p className="text-xs sm:text-sm text-[#615B54] font-light leading-relaxed">
                  Positioned specifically for second homes, vacation properties, and international clients who need a structured local design team while participating in major decisions remotely.
                </p>
              </div>

              {/* Team Notes & Project Coordination Compliance */}
              <div className="p-4 bg-[#F2EDE5] border border-[#E2DBD1] flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                <div className="text-xs text-[#68625B] leading-relaxed">
                  <span className="font-semibold text-[#1A1816]">Professional Project Coordination:</span> Paula Ambrosio Interiors provides full architectural interior design, millwork specification, and trade coordination. Construction services are performed in seamless coordination with licensed general contractors.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Zero Friction</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Complete logistics, freight & white-glove assembly</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Curated Down to Linens</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Bedding, scents, tableware, lighting & art</p>
                </div>
              </div>
            </div>

            {/* Before / After Empty-to-Finished Sequence */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#7A746E] px-1">
                <span className="uppercase tracking-wider font-semibold text-[#1A1816]">Empty-to-Finished Sequence</span>
                <span className="text-[#C9A986] font-medium">Interactive Before & After</span>
              </div>
              <BeforeAfterSlider
                beforeImage="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                afterImage="/assets/cRTC5lm1QD9HiCvnd7TYPrsOuY.avif"
                beforeLabel="Raw Developer Shell"
                afterLabel="Completed Turnkey Residence"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Turnkey Photography & Asset Showcase */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                <Camera className="w-3.5 h-3.5" />
                <span>Turnkey Visual Portfolio</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Signature Turnkey Elements & Details
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Inspect the craftsmanship, tailored upholstery, custom joinery, and fine accessory layers in our Miami residences.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              Explore All Case Studies →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {turnkeyAssetShowcase.map((item, idx) => (
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
                    <span className="text-[#C9A986] font-medium group-hover:underline">View Detail →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Scope of Turnkey Services */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Turnkey Inclusions
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Scope of Turnkey Interior Design
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light max-w-2xl mx-auto">
              Interior design, space planning, 3D visualization, materials, kitchens and bathrooms, lighting, custom millwork, custom furniture, furniture selection, procurement, vendor coordination, artwork, rugs, window treatments, accessories, installation coordination and final styling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { title: 'Interior Design & Space Planning', desc: 'Holistic spatial optimization, furniture layouts, and architectural circulation flow.' },
              { title: '3D Photorealistic Visualization', desc: 'High-definition 3D rendering sets to preview textures, lighting, and millwork in advance.' },
              { title: 'Materials, Kitchens & Bathrooms', desc: 'Curating natural stones, cabinetry, plumbing selections, and surface finishes.' },
              { title: 'Architectural & Decorative Lighting', desc: 'Layered lighting plans, statement fixtures, and dim-to-warm scene configurations.' },
              { title: 'Custom Millwork & Custom Furniture', desc: 'Bespoke built-ins, wall paneling, custom banquettes, and one-of-a-kind furniture.' },
              { title: 'Furniture Selection & Procurement', desc: 'Curating trade-only designer pieces, purchasing management, and warehouse intake.' },
              { title: 'Vendor & Project Coordination', desc: 'Collaborating with licensed contractors and managing specialized trade fabrication timelines.' },
              { title: 'Artwork, Rugs & Window Treatments', desc: 'Fine art curation, custom hand-knotted area rugs, and motorized acoustic drapery.' },
              { title: 'Accessories & Tabletop Styling', desc: 'Decorative objects, bespoke vessels, tabletop settings, and tailored home fragrances.' },
              { title: 'Installation Coordination & Final Styling', desc: 'White-glove delivery oversight, artwork hanging, luxury bed dressing, and reveal styling.' }
            ].map((item, idx) => (
              <div key={idx} className="p-5 bg-white border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 mb-3 bg-[#F2EDE5] text-[#C9A986] flex items-center justify-center text-xs font-bold">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1A1816] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#68625B] leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Eight-Step Turnkey Process: Understand → Design → Visualize → Source → Coordinate → Install → Style → Reveal */}
      <ProcessTimeline
        title="The Eight-Step Turnkey Sequence"
        subtitle="Understand → Design → Visualize → Source → Coordinate → Install → Style → Reveal."
        steps={data.processSteps}
        onStartProject={() => onOpenConsultation('Start Your Turnkey Project', 'Miami')}
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
                Featured Turnkey Case Studies
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
              Property Typologies
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Property Types We Turnkey
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
              Tailored architectural and furnishing solutions across South Florida's prestigious residential typologies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Luxury Condominiums',
              'Waterfront Homes',
              'Penthouses',
              'Second Residences',
              'Vacation Homes',
              'New Construction',
              'Complete Renovations'
            ].map((prop, idx) => (
              <div key={idx} className="p-5 bg-[#FAF9F6] border border-[#E5DFD7] flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#C9A986] shrink-0" />
                <span className="text-xs sm:text-sm text-[#1A1816] font-medium">{prop}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQAccordion
        title="Turnkey Interior Design FAQ"
        subtitle="Common questions regarding turnkey logistics, contractor coordination, remote client management, and move-in ready standards."
        faqs={data.faqs}
      />

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Turnkey Interior Design in Miami
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            From concept and construction selections to furniture, procurement, installation and final styling.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Start Your Turnkey Project', 'Miami')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              START YOUR TURNKEY PROJECT
            </button>
            <button
              onClick={() => onOpenConsultation('Request a Private Consultation', 'Miami')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              REQUEST A PRIVATE CONSULTATION
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Turnkey Photography */}
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
                <span className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold">{selectedPhoto.category}</span>
                <h3 className="font-serif-luxury text-xl text-white font-medium mt-0.5">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs text-[#A8A199] mt-0.5 font-light">
                  {selectedPhoto.subtitle}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPhoto(null);
                  onOpenConsultation(`Turnkey Inquiry: ${selectedPhoto.category}`, 'Miami');
                }}
                className="px-5 py-2.5 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all whitespace-nowrap"
              >
                Inquire For Your Residence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
