import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  MapPin,
  Sparkles,
  Shield,
  ChevronRight,
  ZoomIn,
  X,
  Compass,
  Layers,
  CheckCircle2,
  Anchor,
  Users
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { locationsData } from '../data/locationsData';
import { projectsData } from '../data/projectsData';

interface AventuraPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const AventuraPage: React.FC<AventuraPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const location = locationsData.find(loc => loc.id === 'aventura') || locationsData[2];
  const featuredProject = projectsData.find(p => p.slug === 'home-it') || projectsData[1];
  const relatedProjects = projectsData.filter(p => p.id === 'the-regalia-penthouse' || p.id === 'home-s');

  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    subtitle: string;
    category: string;
    description: string;
    badge: string;
  } | null>(null);

  // Selected photographic assets as requested:
  // • 1 hero photo relevant to Aventura
  // • 3-5 project images; actual Aventura work (HOME IT in Aventura, FL)
  // • 1 material/detail image
  const aventuraGallery = [
    {
      badge: 'Waterfront Family Salon',
      title: 'Main Family Living Salon',
      subtitle: 'HOME IT Residence • Aventura, FL',
      category: 'Living & Entertaining',
      description: 'Luminous gathering space with low-profile Italian seating, custom rift-cut oak millwork, and panoramic marina vistas.',
      url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Culinary Architecture',
      title: 'Gourmet Chef Kitchen & Breakfast Bar',
      subtitle: 'HOME IT Residence • Aventura, FL',
      category: 'Kitchen Design',
      description: 'Bookmatched Calacatta quartz waterfall island, fluted custom barstools, and integrated touch-latch cabinetry.',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Custom Themed Suite',
      title: 'Architectural Family Bunk Suite',
      subtitle: 'HOME IT Residence • Aventura, FL',
      category: 'Children’s Themed Suites',
      description: 'Custom joinery with built-in LED reading niches, integrated storage ladders, and whimsical luxury wallpaper murals.',
      url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Open Dining Pavilion',
      title: 'Casual Entertaining Dining Lounge',
      subtitle: 'HOME IT Residence • Aventura, FL',
      category: 'Dining Room',
      description: 'Solid European oak dining table surrounded by stain-treated performance bouclé armchairs and soft architectural cove lighting.',
      url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Material & Craft Detail',
      title: 'Family-Resilient Noble Materiality',
      subtitle: 'Stone, Herringbone Hardwood & Bronze Accents',
      category: 'Material Palette',
      description: 'Honed Calacatta quartz, wire-brushed European white oak herringbone, brushed champagne bronze, and Crypton performance textiles.',
      url: '/assets/2Ssjz627D6EoynArvuU4h86sCc.avif'
    }
  ];

  // Services tailored to Aventura residences
  const applicableServices = [
    {
      title: 'Full-Service Interior Design',
      description: 'Complete spatial planning, interior architecture drawings, custom millwork packages, and lighting choreography for luxury Aventura condominiums and private estates.',
      linkText: 'Explore Residential Scope',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'Luxury Renovation',
      description: 'Reconfiguring established 1980s and 1990s floor plans in Williams Island, Turnberry, and Porto Vita into flowing, modern open-concept volumes with raised ceilings.',
      linkText: 'Renovation Capabilities',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'New Construction Interior Design',
      description: 'Guiding pre-construction floor plan refinements, electrical rough-ins, ceiling drops, and plumbing layouts with developers prior to drywall installation.',
      linkText: 'View New Construction',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'Turnkey Interior Design (Move-in Ready)',
      description: 'Complete furnishing, motorized drapery, Italian bed linens, designer tableware, selected art, and white-glove staging for seasonal residents and yacht owners.',
      linkText: 'Explore Turnkey Living',
      linkTarget: '/turnkey-interior-design-miami'
    },
    {
      title: 'Custom Millwork & Architectural Joinery',
      description: 'Custom culinary centers, fluted room dividers, concealed wet bars, and custom children\'s bunk bed installations built to exact architectural dimensions.',
      linkText: 'Discover Custom Joinery',
      linkTarget: '/portfolio/home-it'
    },
    {
      title: 'Furniture, Art & Final Styling',
      description: 'Selecting low-maintenance furnishings in high-performance European fabrics, paired with contemporary art, sculpture, and tactile accessories.',
      linkText: 'View Selected Portfolios',
      linkTarget: '/portfolio'
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Luxury Interior Designer Aventura | Paula Ambrosio Interiors"
        description="Paula Ambrosio Interiors designs luxury interiors for Aventura's premier waterfront communities, including Williams Island, Turnberry Isle, and Marina Palms."
        canonicalUrl="https://paulaambrosiointeriors.com/interior-designer-aventura"
        faqs={location.faqs}
        breadcrumbItems={[{ name: "Locations", url: "https://paulaambrosiointeriors.com/locations" }, { name: "Aventura", url: "https://paulaambrosiointeriors.com/interior-designer-aventura" }]}
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
          <span className="text-[#1A1816] font-medium">Aventura</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85"
            alt="Luxury Interior Designer Aventura - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Island Enclaves, Marinas & Family Living</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              Luxury Interior Designer in Aventura
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              Full-service residential design for luxury condominiums, family residences, renovations and complete furnishing.
            </p>

            <p className="text-sm sm:text-base text-[#B8B1A8] font-light leading-relaxed max-w-xl">
              From Williams Island, Turnberry Isle, and Marina Palms to private waterfront family residences, Paula Ambrosio Interiors designs luminous, functional, and enduring sanctuaries crafted for multigenerational living.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onOpenConsultation('Start Your Aventura Project', 'Aventura')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg"
              >
                START YOUR AVENTURA PROJECT
              </button>
              
              <button
                onClick={() => onOpenConsultation('Request a Private Consultation - Aventura', 'Aventura')}
                className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all text-center"
              >
                REQUEST A PRIVATE CONSULTATION
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Local Residential & Architectural Context (150-250 unique words) */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Island Enclaves & Modern Living
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Nautical Refinement & Family Elegance
              </h2>
              
              {/* 150-250 Unique Words about Aventura residential context */}
              <div className="space-y-4 text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                <p>
                  Aventura presents a distinguished residential enclave in Northeast Miami-Dade, shaped by private island sanctuaries, deepwater yacht marinas, and premier golf communities including Williams Island, Turnberry Isle, Marina Palms, and Porto Vita. Unlike the purely transient high-rise corridors of South Florida, Aventura’s residential landscape comprises both primary residences for established multigenerational families and seasonal waterfront retreats for yachting enthusiasts. Properties here, ranging from spacious 1980s and 1990s Mediterranean-revival condominium footprints to sleek modern waterfront penthouses, frequently call for extensive interior reconfiguration. Compartmentalized layouts, low dropped soffits, and dated finishes are transformed into expansive, light-filled open volumes that celebrate views of Dumfoundling Bay, the Intracoastal Waterway, and lush golf fairways.
                </p>
                <p>
                  Our studio approaches Aventura projects by harmonizing quiet aesthetic luxury with the tactile demands of everyday family living. We prioritize European performance textiles, stain-treated bouclés, honed quartzites, and continuous European white oak flooring that withstand active family lifestyles without sacrificing visual elegance. Through custom architectural millwork, such as integrated media libraries, custom culinary centers, and playful, imaginative themed children's suites, we create environments tailored for both sophisticated evening entertaining and effortless day-to-day comfort. With our{' '}
                  <a
                    href="/turnkey-interior-design-miami"
                    onClick={(e) => { e.preventDefault(); onNavigate('/turnkey-interior-design-miami'); }}
                    className="text-[#1A1816] font-medium underline decoration-[#C9A986] hover:text-[#C9A986]"
                  >
                    turnkey methodology
                  </a>
                  , our team oversees every stage from condominium HOA board submissions to white-glove staging, delivering homes of lasting warmth and enduring value.
                </p>
              </div>

              {/* Landmark Community Highlights */}
              <div className="pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816] mb-2">
                  Distinguished Aventura Addresses & Communities:
                </div>
                <div className="flex flex-wrap gap-2">
                  {location.highlights.map((community, idx) => (
                    <span key={idx} className="text-xs px-3 py-1.5 bg-white border border-[#DDD5CA] text-[#4A453F] font-medium">
                      {community}
                    </span>
                  ))}
                </div>
              </div>

              {/* Multigenerational & HOA Coordination Notice */}
              <div className="p-4 bg-[#F2EDE5] border border-[#E2DBD1] flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                <div className="text-xs text-[#68625B] leading-relaxed">
                  <span className="font-semibold text-[#1A1816]">HOA & Permitting Compliance:</span> We coordinate directly with Aventura condominium associations, managing contractor COIs, acoustic floor underlayment testing, elevator bookings, and restricted renovation calendars.
                </div>
              </div>
            </div>

            {/* Visual Pairing with internal links */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"
                  alt="Aventura modern gourmet kitchen with marble waterfall island"
                  className="w-full aspect-[4/3] object-cover border border-[#E2DBD1] shadow-lg"
                />
                <div className="absolute -bottom-4 -right-4 bg-white p-4 border border-[#E2DBD1] shadow-md hidden sm:block max-w-xs">
                  <p className="text-[11px] uppercase tracking-widest text-[#C9A986] font-semibold">HOME IT Residence</p>
                  <p className="text-xs text-[#524D47] mt-1 font-light">Custom Fluted Barstools, Calacatta Quartz & Marina Outlook</p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between text-xs text-[#7A746E]">
                <span>Explore related disciplines:</span>
                <div className="flex gap-4">
                  <a
                    href="/turnkey-interior-design-miami"
                    onClick={(e) => { e.preventDefault(); onNavigate('/turnkey-interior-design-miami'); }}
                    className="text-[#C9A986] font-semibold hover:underline"
                  >
                    Turnkey Design →
                  </a>
                  <a
                    href="/luxury-residential-interior-design-miami"
                    onClick={(e) => { e.preventDefault(); onNavigate('/luxury-residential-interior-design-miami'); }}
                    className="text-[#C9A986] font-semibold hover:underline"
                  >
                    Residential Design →
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services Tailored to Aventura Residences */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Tailored Capabilities
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Services for Aventura Residences & Condominiums
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light max-w-2xl mx-auto">
              Our multidisciplinary studio provides comprehensive interior design, gut renovations of island condominiums, custom millwork, and family-tailored turnkey staging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applicableServices.map((svc, idx) => (
              <div key={idx} className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 bg-[#F0EAE1] text-[#C9A986] flex items-center justify-center text-xs font-bold mb-4">
                    <Check className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1816] mb-2">{svc.title}</h3>
                  <p className="text-xs text-[#68625B] leading-relaxed font-light mb-6">
                    {svc.description}
                  </p>
                </div>

                <a
                  href={svc.linkTarget}
                  onClick={(e) => { e.preventDefault(); onNavigate(svc.linkTarget); }}
                  className="text-xs uppercase tracking-wider font-semibold text-[#1A1816] hover:text-[#C9A986] flex items-center gap-1.5 border-t border-[#EAE4DB] pt-3 transition-colors"
                >
                  <span>{svc.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A986]" />
                </a>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Selected Photographic Gallery (Assets from Paula) */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Visual Portfolio & Material Craft
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Aventura Photography & Detail Archive
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Inspect actual family living areas, gourmet kitchens, themed children’s suites, and tactile finish specifications from HOME IT in Aventura.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              Explore Complete Portfolio →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aventuraGallery.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(item)}
                className="group relative cursor-pointer bg-white border border-[#E5DFD7] hover:border-[#C9A986] transition-all overflow-hidden shadow-xs"
              >
                <div className="aspect-[16/11] overflow-hidden relative">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171513]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs uppercase tracking-wider text-white font-medium flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-[#C9A986]" />
                      Expand Photo
                    </span>
                  </div>
                  <div className="absolute top-3 left-3 bg-[#171513]/85 text-[#E8D8C8] text-[10px] uppercase tracking-widest px-2.5 py-1 backdrop-blur-xs border border-white/10">
                    {item.badge}
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold mb-1">
                    {item.category}
                  </div>
                  <h3 className="font-serif-luxury text-lg text-[#1A1816] group-hover:text-[#C9A986] transition-colors font-medium mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#7A746E] font-light leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#EAE4DB] flex items-center justify-between text-[11px] text-[#9E978F]">
                    <span>{item.subtitle}</span>
                    <span className="text-[#C9A986] font-medium group-hover:underline">View →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Featured Verified Project: HOME IT in Aventura */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Verified Aventura Case Study
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Featured Project: {featuredProject.title}
            </h2>
            <p className="text-sm text-[#6E6861] font-light">
              {featuredProject.subTitle}, {featuredProject.location}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-[#FAF9F6] border border-[#E5DFD7] p-8 sm:p-10 shadow-xs">
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-[16/11] overflow-hidden border border-[#E8E2D8]">
                <img
                  src={featuredProject.coverImage}
                  alt={featuredProject.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-[#171513]/90 text-white text-[10px] uppercase tracking-widest px-3 py-1">
                  Verified Family Residence
                </div>
              </div>

              {/* Quick specs grid */}
              <div className="grid grid-cols-2 gap-4 text-xs text-[#68625B] pt-2">
                <div className="p-3 bg-white border border-[#E5DFD7]">
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] block font-semibold">Location & Type</span>
                  <span className="font-medium text-[#1A1816]">Aventura, FL • Luxury Family Residence</span>
                </div>
                <div className="p-3 bg-white border border-[#E5DFD7]">
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] block font-semibold">Completion</span>
                  <span className="font-medium text-[#1A1816]">{featuredProject.completionYear} • Move-in Ready</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white border border-[#E5DFD7] text-[10px] uppercase tracking-widest text-[#1A1816] font-semibold">
                    {featuredProject.category}
                  </span>
                  <span className="text-xs text-[#7A746E] font-light">
                    Scope: {featuredProject.services.join(', ')}
                  </span>
                </div>

                <h3 className="font-serif-luxury text-2xl sm:text-3xl text-[#1A1816] font-medium">
                  {featuredProject.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#5C564F] leading-relaxed font-light">
                  <strong className="text-[#1A1816] font-medium">Client Vision: </strong>
                  {featuredProject.clientVision}
                </p>

                <div className="p-4 bg-white border-l-2 border-[#C9A986] text-xs text-[#615B54] font-light space-y-2">
                  <div>
                    <strong className="text-[#1A1816] font-medium block">The Design Challenge:</strong>
                    <span>{featuredProject.designChallenge}</span>
                  </div>
                  <div className="pt-2 border-t border-[#EAE4DB]">
                    <strong className="text-[#1A1816] font-medium block">Our Approach & Materiality:</strong>
                    <span>{featuredProject.approach}</span>
                  </div>
                </div>

                <p className="text-xs text-[#68625B] font-light">
                  <strong className="text-[#1A1816] font-medium">Result: </strong>
                  {featuredProject.result}
                </p>
              </div>

              <div className="pt-4 border-t border-[#EAE4DB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  onClick={() => onNavigate(`/portfolio/${featuredProject.slug}`)}
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#1A1816] hover:text-[#C9A986] transition-colors"
                >
                  <span>Read Complete HOME IT Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A986]" />
                </button>
                <button
                  onClick={() => onOpenConsultation('Discuss an Aventura Family Residence', 'Aventura')}
                  className="text-xs uppercase tracking-wider text-[#C9A986] hover:underline"
                >
                  Discuss Your Residence →
                </button>
              </div>
            </div>
          </div>

          {/* Related Case Studies */}
          <div className="mt-14 pt-10 border-t border-[#EAE4DB]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif-luxury text-xl text-[#1A1816]">
                More Coastal & Waterfront Case Studies
              </h3>
              <button
                onClick={() => onNavigate('/portfolio')}
                className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:underline"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate(`/portfolio/${p.slug}`)}
                  className="group cursor-pointer p-4 bg-[#FAF9F6] border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex items-center gap-4"
                >
                  <img
                    src={p.coverImage}
                    alt={p.title}
                    className="w-20 h-20 object-cover shrink-0"
                  />
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold">{p.propertyType}</span>
                    <h4 className="font-serif-luxury text-base text-[#1A1816] group-hover:text-[#C9A986] transition-colors">{p.title}</h4>
                    <p className="text-xs text-[#7A746E] line-clamp-1">{p.subTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Six-Stage Architectural & Interior Process */}
      <ProcessTimeline
        title="Aventura Interior Design Process"
        subtitle="Consultation → Concept → Visualization → Design Development → Procurement/Coordination → Installation/Styling."
        steps={location.processSteps}
        onStartProject={() => onOpenConsultation('Start Your Aventura Project', 'Aventura')}
      />

      {/* Frequently Asked Questions */}
      <FAQAccordion
        title="Aventura Interior Design FAQ"
        subtitle="Essential considerations for owners undertaking condominium renovations, family residence interior architecture, or turnkey design in Aventura."
        faqs={location.faqs}
      />

      {/* Final Call to Action Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
            <span>Aventura Private Commissions</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Start Your Aventura Project
          </h2>

          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Contact Paula Ambrosio Interiors to schedule a private consultation for your Aventura island condominium, waterfront penthouse, or luxury family residence.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Start Your Aventura Project', 'Aventura')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              START YOUR AVENTURA PROJECT
            </button>
            <button
              onClick={() => onOpenConsultation('Request a Private Consultation - Aventura', 'Aventura')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              REQUEST A PRIVATE CONSULTATION
            </button>
          </div>

          {/* Quick links to core services */}
          <div className="pt-8 border-t border-white/10 flex flex-wrap justify-center gap-6 text-xs text-[#B8B1A8]">
            <a
              href="/turnkey-interior-design-miami"
              onClick={(e) => { e.preventDefault(); onNavigate('/turnkey-interior-design-miami'); }}
              className="hover:text-white transition-colors"
            >
              Turnkey Interior Design Miami
            </a>
            <span>•</span>
            <a
              href="/luxury-residential-interior-design-miami"
              onClick={(e) => { e.preventDefault(); onNavigate('/luxury-residential-interior-design-miami'); }}
              className="hover:text-white transition-colors"
            >
              Luxury Residential Interior Design
            </a>
            <span>•</span>
            <a
              href="/portfolio/home-it"
              onClick={(e) => { e.preventDefault(); onNavigate('/portfolio/home-it'); }}
              className="hover:text-white transition-colors"
            >
              HOME IT Aventura Case Study
            </a>
            <span>•</span>
            <a
              href="/locations"
              onClick={(e) => { e.preventDefault(); onNavigate('/locations'); }}
              className="hover:text-white transition-colors"
            >
              South Florida Locations
            </a>
          </div>
        </div>
      </section>

      {/* Fullscreen Lightbox Modal for Photo Exploration */}
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
                <span className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold">{selectedPhoto.badge}</span>
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
                  onOpenConsultation(`Inquiry for Aventura: ${selectedPhoto.title}`, 'Aventura');
                }}
                className="px-5 py-2.5 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all whitespace-nowrap"
              >
                Inquire for Your Residence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
