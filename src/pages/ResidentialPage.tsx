import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Compass, Layers, MapPin, Sparkles, Home, Shield, Award, Camera, ZoomIn, X, Building, CheckCircle2, ChevronRight } from 'lucide-react';
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

  // 3 to 6 linked residential case studies with actual city, property type and scope
  const residentialProjects = projectsData.filter(p => 
    p.category === 'Residential' || 
    p.id === 'home-s' || 
    p.propertyType.toLowerCase().includes('residence') || 
    p.propertyType.toLowerCase().includes('estate')
  ).slice(0, 6);

  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    subtitle: string;
    category: string;
    description: string;
  } | null>(null);

  // Selected 6 flagship residential images as specified:
  // - 1 waterfront residence
  // - 1 condominium/penthouse
  // - 1 custom home
  // - 2 detail/material shots
  // - 1 grand salon/architectural volume
  const flagshipResidentialGallery = [
    {
      type: 'Waterfront Residence',
      title: 'Waterfront Living Salon & Biscayne Bay Vistas',
      subtitle: 'Star Island • Miami Beach',
      category: 'Waterfront Residence',
      description: 'Expansive glass walls, custom low-slung Italian seating, and fluid indoor-outdoor connection to the water.',
      url: '/assets/2Ssjz627D6EoynArvuU4h86sCc.avif',
      badge: 'Waterfront Residence'
    },
    {
      type: 'Condominium & Penthouse',
      title: 'Serene Urban Sanctuary & Panoramic River Views',
      subtitle: 'Brickell Avenue • Miami',
      category: 'Condominium / Penthouse',
      description: 'Warm neutral palette, custom acoustic paneling, and tactile surfaces creating a peaceful sky retreat.',
      url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=85',
      badge: 'Condominium / Penthouse'
    },
    {
      type: 'Custom Home',
      title: 'Monolithic Great Room with Helical Staircase',
      subtitle: 'Coral Gables / Pinecrest • Miami',
      category: 'Custom Ground-Up Home',
      description: 'Double-height architectural volume, custom curved staircase, and floor-to-ceiling textured travertine.',
      url: '/assets/cRTC5lm1QD9HiCvnd7TYPrsOuY.avif',
      badge: 'Custom Home'
    },
    {
      type: 'Detail & Material Shot 01',
      title: 'Integrated Culinary Pavilion with Blackened Bronze & Oak',
      subtitle: 'Custom Millwork & Stone Joinery',
      category: 'Detail & Material',
      description: 'Bookmatched natural stone waterfall island paired with flush architectural oak joinery and concealed appliances.',
      url: '/assets/X8XTDp3V2Z56VsOWfw8jCyBLpuk.webp',
      badge: 'Material Detail'
    },
    {
      type: 'Detail & Material Shot 02',
      title: 'Honed Roman Travertine Primary Spa Suite',
      subtitle: 'Natural Stone & Custom Vanity Craft',
      category: 'Detail & Material',
      description: 'Sensory bathing sanctuary finished in hand-selected slab travertine, artisan patinated brass, and indirect lighting.',
      url: '/assets/uJDafV2OYdKY0ezWt4AhW3Dpj0.avif',
      badge: 'Material Detail'
    },
    {
      type: 'Architectural Volume',
      title: 'Bold Contrast Great Room with Monumental Stone Hearth',
      subtitle: 'Private Estate • Miami',
      category: 'Architectural Salon',
      description: 'Soaring 20-foot quarried slab fireplace surround balanced with fumed European oak ceiling claddings.',
      url: '/assets/VeQrhZ7P2LeFosBrLV887ZsFA.avif',
      badge: 'Architectural Volume'
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Luxury Residential Interior Design Miami | Paula Ambrosio Interiors"
        description="High-end residential interior design in Miami for luxury homes, waterfront residences, condominiums, penthouses, renovations and new construction."
        canonicalUrl="https://paulaambrosiointeriors.com/luxury-residential-interior-design-miami"
        faqs={data.faqs}
        serviceData={{ name: "Luxury Residential Interior Design Miami", description: "High-end residential interior design for luxury homes, waterfront residences, condominiums, penthouses, and new construction in Miami.", url: "https://paulaambrosiointeriors.com/luxury-residential-interior-design-miami" }}
        breadcrumbItems={[{ name: "Services", url: "https://paulaambrosiointeriors.com/luxury-residential-interior-design-miami" }]}
      />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-end justify-center overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Luxury Residential Interior Design Miami - Paula Ambrosio Interiors ${index + 1}`}
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
              Luxury Residential Interior Design in Miami
            </h1>

            <p className="font-serif-luxury text-lg sm:text-xl text-[#4A4540] font-light max-w-2xl mx-auto leading-relaxed">
              Personal residences shaped by architecture, materiality and the way you live.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenConsultation('Start Your Residential Project', 'Miami')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-[#171513] hover:text-white transition-all text-center"
              >
                Start Your Residential Project
              </button>
              
              <button
                onClick={() => {
                  const element = document.getElementById('residential-case-studies');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    onNavigate('/portfolio');
                  }
                }}
                className="px-8 py-4 bg-transparent border border-[#1A1816]/30 text-[#1A1816] text-xs uppercase tracking-widest font-medium hover:bg-[#1A1816] hover:text-white hover:border-[#1A1816] transition-all text-center"
              >
                View Residential Projects
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning & Design Authority */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Residential Design Authority
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Shaping South Florida's Most Distinctive Living Environments
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Paula Ambrosio Interiors connects architectural rigor with warm, tactile elegance. Whether designing an iconic Star Island waterfront estate, a skyline penthouse in Brickell, a ground-up residence in Coral Gables, or an extensive whole-home renovation, we compose spaces that embody understated sophistication.
              </p>
              
              <div className="p-6 bg-white border border-[#E5DFD7] space-y-2">
                <div className="text-xs uppercase tracking-widest text-[#1A1816] font-semibold flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#C9A986]" />
                  <span>Custom Rather Than Formulaic</span>
                </div>
                <p className="text-xs sm:text-sm text-[#615B54] font-light leading-relaxed">
                  We reject repetitive showroom packages. Every ceiling drop, wall paneling joint, custom upholstery profile, and stone slab is custom-composed for your specific floor plan and light orientation.
                </p>
              </div>

              {/* Project Coordination Notice */}
              <div className="p-4 bg-[#F2EDE5] border border-[#E2DBD1] flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                <div className="text-xs text-[#68625B] leading-relaxed">
                  <span className="font-semibold text-[#1A1816]">Integrated Project Coordination:</span> We provide architectural interior CAD plans, detailed finish schedules, and active site oversight, collaborating directly with your licensed general contractor and engineering team.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Architecture & Furniture Harmony</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Fluid transition from structural envelope to selected FF&E</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Authentic Materiality</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Honed limestones, European oak, unlacquered metals & natural linens</p>
                </div>
              </div>
            </div>

            {/* Visual pairing */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="aspect-[4/5] overflow-hidden border border-[#E2DBD1] shadow-md">
                    <img
                      src="/assets/2Ssjz627D6EoynArvuU4h86sCc.avif"
                      alt="Waterfront primary sanctuary by Paula Ambrosio Interiors"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="text-[11px] text-[#7A746E] font-light">Waterfront Primary Suite • Miami Beach</div>
                </div>
                <div className="space-y-2 pt-6">
                  <div className="aspect-[4/5] overflow-hidden border border-[#E2DBD1] shadow-md">
                    <img
                      src="/assets/X8XTDp3V2Z56VsOWfw8jCyBLpuk.webp"
                      alt="Architectural culinary pavilion with stone waterfall island"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="text-[11px] text-[#7A746E] font-light">Custom Architectural Millwork & Natural Stone</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Flagship Residential Photography Showcase (6 Images) */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                <Camera className="w-3.5 h-3.5" />
                <span>Flagship Visual Archive</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Residential Architecture, Light & Materiality
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Explore our signature residences across Miami, from waterfront salons and penthouses to custom homes and artisan millwork details.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              Explore Full Portfolio →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {flagshipResidentialGallery.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(item)}
                className="group relative cursor-pointer bg-[#FAF9F6] border border-[#E5DFD7] hover:border-[#C9A986] transition-all shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-[16/11] overflow-hidden relative">
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

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-[#C9A986] font-semibold mb-1">
                      {item.type}
                    </div>
                    <h3 className="font-serif-luxury text-xl text-[#1A1816] group-hover:text-[#C9A986] transition-colors font-medium mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#7A746E] font-light leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="text-[11px] text-[#A8A199] flex items-center justify-between border-t border-[#EAE4DB] pt-3">
                    <span>{item.subtitle}</span>
                    <span className="text-[#C9A986] font-medium group-hover:underline">Inspect Detail →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Core Services Scope */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Comprehensive Residential Scope
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Core Services & Disciplines
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light max-w-2xl mx-auto">
              Space planning, interior architecture/design, materials, kitchens and bathrooms, millwork, lighting, furniture, art, procurement, styling and project coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {data.scopeItems.map((item, idx) => (
              <div key={idx} className="p-5 bg-white border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 mb-3 bg-[#F2EDE5] text-[#C9A986] flex items-center justify-center text-xs font-bold">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1A1816] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#68625B] leading-relaxed font-light">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Design Approach Deep Dive */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Design Approach
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              The Architecture of Quiet Luxury
            </h2>
            <p className="text-sm text-[#5C564F] font-light leading-relaxed">
              {data.approach}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-[#FAF9F6] border border-[#E5DFD7] space-y-3">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">01 • Proportion & Light</div>
              <h3 className="font-serif-luxury text-xl text-[#1A1816]">Harmonious Spatial Volume</h3>
              <p className="text-xs sm:text-sm text-[#68625B] leading-relaxed font-light">
                We study natural solar angles in South Florida to balance direct sunlight with soft indirect glow, shaping ceiling heights, architectural drapery pockets, and intuitive circulation flow.
              </p>
            </div>

            <div className="p-8 bg-[#FAF9F6] border border-[#E5DFD7] space-y-3">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">02 • Materiality & Craft</div>
              <h3 className="font-serif-luxury text-xl text-[#1A1816]">Natural Stones & Noble Woods</h3>
              <p className="text-xs sm:text-sm text-[#68625B] leading-relaxed font-light">
                Honed Roman travertine, fumed European white oak, solid brass, and textured Belgian linens that age gracefully and ground expansive residential volumes in tactile serenity.
              </p>
            </div>

            <div className="p-8 bg-[#FAF9F6] border border-[#E5DFD7] space-y-3">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">03 • Cohesive Integration</div>
              <h3 className="font-serif-luxury text-xl text-[#1A1816]">Architecture & Furniture Synergy</h3>
              <p className="text-xs sm:text-sm text-[#68625B] leading-relaxed font-light">
                We conceive custom millwork, statement lighting, and made-to-order furniture as natural extensions of the building's architectural bones rather than disconnected decorative layers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <ProcessTimeline
        title="Residential Design Sequence"
        subtitle="Discovery & Programming → Concept & Architecture → Design Development & 3D Previews → Procurement & Trade Coordination → Installation & Reveal."
        steps={data.processSteps}
        onStartProject={() => onOpenConsultation('Start Your Residential Project', 'Miami')}
      />

      {/* Featured Residential Case Studies (3-6 Linked Case Studies with actual City, Property Type and Scope) */}
      <section id="residential-case-studies" className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Residential Case Studies
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Featured Residential Projects
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Documented case studies highlighting city location, property typology, and comprehensive scope of services.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              View Full Portfolio Archive →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {residentialProjects.map((p) => (
              <div key={p.id} className="flex flex-col h-full">
                <ProjectCard
                  project={p}
                  onNavigate={onNavigate}
                  aspectRatio="aspect-[4/3]"
                />
                <div className="mt-2 p-3 bg-white border border-[#E5DFD7] text-xs text-[#68625B] flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[#1A1816] font-medium">
                    <span>📍 {p.city || p.location}</span>
                    <span className="text-[#C9A986] text-[11px] uppercase tracking-wider">{p.propertyType}</span>
                  </div>
                  <div className="text-[11px] text-[#7A746E] line-clamp-1">
                    <span className="font-semibold text-[#1A1816]">Scope:</span> {p.services.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Typologies */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
              Residential Authority
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Property Typologies We Redesign
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
              Tailored architectural interior design across South Florida's premier residential sectors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.propertyTypes.map((prop, idx) => (
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
        title="Residential Interior Design FAQ"
        subtitle="Common questions regarding timing, new construction, renovations, procurement, remote client collaboration, and geographic coverage."
        faqs={data.faqs}
      />

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Refined Residential Interior Design in Miami
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            From waterfront estates and penthouses to new construction and whole-home renovations.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Start Your Residential Project', 'Miami')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              START YOUR RESIDENTIAL PROJECT
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('residential-case-studies');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onNavigate('/portfolio');
                }
              }}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              VIEW RESIDENTIAL PROJECTS
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Residential Photography */}
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
                  onOpenConsultation(`Residential Inquiry: ${selectedPhoto.type}`, 'Miami');
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
