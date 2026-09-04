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
  Palette,
  Eye,
  Layers,
  Award
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { locationsData } from '../data/locationsData';
import { projectsData } from '../data/projectsData';

interface BalHarbourPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const BalHarbourPage: React.FC<BalHarbourPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const location = locationsData.find(loc => loc.id === 'bal-harbour') || locationsData[3];
  const featuredProject = projectsData.find(p => p.slug === 'bal-harbour-sanctuary') || projectsData[projectsData.length - 1];
  const relatedProjects = projectsData.filter(p => p.id === 'home-fl' || p.id === 'home-s');

  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    subtitle: string;
    category: string;
    description: string;
    badge: string;
  } | null>(null);

  // Curated photographic assets as requested:
  // • 1 hero photo relevant to Bal Harbour
  // • 3-5 project images; preferably actual Bal Harbour work
  // • 1 material/detail image
  const balHarbourGallery = [
    {
      badge: 'Oceanfront Living Salon',
      title: 'Oceanfront Horizon Living Salon',
      subtitle: 'Bal Harbour Sanctuary • Oceana Bal Harbour',
      category: 'Living & Entertaining',
      description: 'Expansive flow-through living salon framing the Atlantic horizon with low-profile Italian modular seating and Navona travertine plinths.',
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Art-Centric Dining',
      title: 'Curated Gallery Dining Salon',
      subtitle: 'Bal Harbour Sanctuary • Bal Harbour, FL',
      category: 'Dining & Art Display',
      description: 'Custom fluted white oak millwork with museum-grade 2700K CRI 95+ directional lighting illuminating a private contemporary canvas.',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Primary Suite Sanctuary',
      title: 'Acoustic Primary Suite Retreat',
      subtitle: 'Bal Harbour Sanctuary • Bal Harbour, FL',
      category: 'Primary Suite',
      description: 'Acoustic silk wall panels, whisper-quiet motorized solar sheer drapery, and custom rift-cut floating nightstands overlooking the ocean inlet.',
      url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Monolithic Stone Spa',
      title: 'Navona Travertine Primary Spa Bath',
      subtitle: 'Bal Harbour Sanctuary • Bal Harbour, FL',
      category: 'Spa Bathroom',
      description: 'Bookmatched Navona Roman travertine slabs, freestanding sculpted soaking tub, and brushed champagne bronze fixtures.',
      url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Material & Craft Detail',
      title: 'Quiet Luxury Noble Materiality',
      subtitle: 'Travertine, Silk, Wire-Brushed Oak & Champagne Bronze',
      category: 'Material Palette',
      description: 'Honed Navona Roman travertine, wire-brushed European white oak with bronze shadowline reveals, and acoustic Loro Piana fabrics.',
      url: '/assets/2Ssjz627D6EoynArvuU4h86sCc.avif'
    }
  ];

  // Applicable services tailored to Bal Harbour residences
  const applicableServices = [
    {
      title: 'Full-Service Interior Design',
      description: 'Comprehensive interior architecture, spatial reconfiguration, museum-calibrated lighting design, and bespoke furniture curation for luxury Bal Harbour residences.',
      linkText: 'Explore Residential Scope',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'Luxury Renovation',
      description: 'Re-engineering older footprint condominiums in Bal Harbour 101, Bal Harbour Tower, or Bellini into luminous, contemporary open volumes with upgraded infrastructure.',
      linkText: 'Renovation Capabilities',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'New Construction Interior Design',
      description: 'Collaborating during pre-construction and framing stages to refine floor plans, ceiling reveals, electrical rough-ins, and stone specifications before developer delivery.',
      linkText: 'View New Construction',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'Turnkey Interior Design (Move-in Ready)',
      description: 'Complete white-glove furnishing, motorized solar shading, Italian bed linens, designer tableware, curated art, and styling for international and second-home owners.',
      linkText: 'Explore Turnkey Living',
      linkTarget: '/turnkey-interior-design-miami'
    },
    {
      title: 'Custom Millwork & Architectural Joinery',
      description: 'Bespoke Italian joinery, fluted room dividers, concealed bar credenzas, library paneling, and acoustic wall cladding fabricated with shadowline bronze accents.',
      linkText: 'Discover Custom Joinery',
      linkTarget: '/portfolio/bal-harbour-sanctuary'
    },
    {
      title: 'Furniture, Art & Final Styling',
      description: 'Curating rare atelier pieces from Milan and Paris, custom artisan upholstery, blue-chip contemporary art placement, and tactile accessories.',
      linkText: 'View Curated Portfolios',
      linkTarget: '/portfolio'
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Luxury Interior Designer Bal Harbour | Paula Ambrosio Interiors"
        description="Paula Ambrosio Interiors provides luxury residential and turnkey interior design for discerning clients in Bal Harbour and South Florida."
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
          <span className="text-[#1A1816] font-medium">Bal Harbour</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=85"
            alt="Luxury Interior Designer Bal Harbour - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Quiet Luxury & Oceanfront Sanctuaries</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              Luxury Interior Designer in Bal Harbour
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              Full-service residential design for high-end condominiums, refined residential interiors, art, custom furniture and turnkey execution.
            </p>

            <p className="text-sm sm:text-base text-[#B8B1A8] font-light leading-relaxed max-w-xl">
              From landmark towers like Oceana Bal Harbour and The St. Regis to gated private estates in Bal Harbour Village, Paula Ambrosio Interiors composes whisper-quiet sanctuaries defined by museum-grade illumination, noble organic materiality, and bespoke European craft.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onOpenConsultation('Start Your Bal Harbour Project', 'Bal Harbour')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg"
              >
                START YOUR BAL HARBOUR PROJECT
              </button>
              
              <button
                onClick={() => onOpenConsultation('Request a Private Consultation - Bal Harbour', 'Bal Harbour')}
                className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all text-center"
              >
                REQUEST A PRIVATE CONSULTATION
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Local Residential Context Section (150-250 unique words) */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Oceanfront Discretion & Art Curation
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Quiet Luxury for Discerning Collectors
              </h2>
              
              {/* 150-250 Unique Words about Bal Harbour residential context */}
              <div className="space-y-4 text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                <p>
                  Bal Harbour stands at the global pinnacle of understated residential prestige, distinguished by ultra-exclusive oceanfront towers—such as Oceana Bal Harbour, The St. Regis Bal Harbour Resort & Residences, and Bellini—alongside the secluded, guard-gated estate enclaves of Bal Harbour Village. The architectural context here is defined by extraordinary discretion, expansive ocean-to-bay flow-through residences, and a discerning international clientele whose lifestyle demands museum-level precision and refined living. Unlike louder coastal enclaves, Bal Harbour celebrates "quiet luxury"—a philosophy where elegance is expressed through authentic materiality, bespoke proportions, and serene spatial balance rather than ostentation.
                </p>
                <p>
                  Many residents in Bal Harbour are avid collectors of blue-chip contemporary art, haute couture patrons of the Bal Harbour Shops, and seasonal bi-coastal or international homeowners. Our studio approaches Bal Harbour residences with architectural reverence: integrating flush perimeter baseboards, hand-applied Venetian marmorino plasters, honed Navona travertine, and custom 2700K museum-grade CRI 95+ lighting calibrated to protect and celebrate private art collections. Through full-service interior architecture and{' '}
                  <a
                    href="/turnkey-interior-design-miami"
                    onClick={(e) => { e.preventDefault(); onNavigate('/turnkey-interior-design-miami'); }}
                    className="text-[#1A1816] font-medium underline decoration-[#C9A986] hover:text-[#C9A986]"
                  >
                    turnkey execution
                  </a>
                  , we coordinate every detail—from condominium board technical approvals and acoustic decoupling to white-glove custom Italian millwork and art placement—delivering serene, move-in-ready sanctuaries of timeless distinction.
                </p>
              </div>

              {/* Landmark Community Highlights */}
              <div className="pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816] mb-2">
                  Distinguished Bal Harbour Addresses:
                </div>
                <div className="flex flex-wrap gap-2">
                  {location.highlights.map((community, idx) => (
                    <span key={idx} className="text-xs px-3 py-1.5 bg-white border border-[#DDD5CA] text-[#4A453F] font-medium">
                      {community}
                    </span>
                  ))}
                </div>
              </div>

              {/* Private Collection & Building Protocol Notice */}
              <div className="p-4 bg-[#F2EDE5] border border-[#E2DBD1] flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                <div className="text-xs text-[#68625B] leading-relaxed">
                  <span className="font-semibold text-[#1A1816]">Condominium Board & Art Protection:</span> We manage all technical submittals for Bal Harbour towers, including acoustic IIC/STC membrane testing, freight logistics, and specialized UV solar controls to safeguard private art collections.
                </div>
              </div>
            </div>

            {/* Visual Pairing with internal links */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"
                  alt="Bal Harbour private art dining salon with bespoke fluted millwork"
                  className="w-full aspect-[4/3] object-cover border border-[#E2DBD1] shadow-lg"
                />
                <div className="absolute -bottom-4 -right-4 bg-white p-4 border border-[#E2DBD1] shadow-md hidden sm:block max-w-xs">
                  <p className="text-[11px] uppercase tracking-widest text-[#C9A986] font-semibold">Bal Harbour Sanctuary</p>
                  <p className="text-xs text-[#524D47] mt-1 font-light">Custom Fluted Oak, Museum Lighting & Ocean Viewpoint</p>
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

      {/* Applicable Services Tailored to Bal Harbour */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Tailored Capabilities
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Services for Bal Harbour Residences & Condominiums
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light max-w-2xl mx-auto">
              Our multidisciplinary studio provides comprehensive interior architecture, luxury renovations of oceanfront towers, custom Italian millwork, and turnkey execution.
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

      {/* Curated Photographic Gallery (Assets from Paula) */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Visual Portfolio & Material Craft
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Bal Harbour Photography & Detail Archive
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Explore flow-through ocean salons, bespoke Italian dining joinery, acoustic primary suites, and noble stone details from Bal Harbour Sanctuary.
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
            {balHarbourGallery.map((item, idx) => (
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

      {/* Featured Verified Project: Bal Harbour Sanctuary */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Verified Bal Harbour Case Study
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Featured Project: {featuredProject.title}
            </h2>
            <p className="text-sm text-[#6E6861] font-light">
              {featuredProject.subTitle} — {featuredProject.location}
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
                  Oceanfront Flow-Through Residence
                </div>
              </div>

              {/* Quick specs grid */}
              <div className="grid grid-cols-2 gap-4 text-xs text-[#68625B] pt-2">
                <div className="p-3 bg-white border border-[#E5DFD7]">
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] block font-semibold">Location & Building</span>
                  <span className="font-medium text-[#1A1816]">Oceana Bal Harbour • Florida</span>
                </div>
                <div className="p-3 bg-white border border-[#E5DFD7]">
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] block font-semibold">Execution Scope</span>
                  <span className="font-medium text-[#1A1816]">Turnkey Design & Art Curation</span>
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
                  <span>Read Complete Bal Harbour Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A986]" />
                </button>
                <button
                  onClick={() => onOpenConsultation('Discuss a Bal Harbour Oceanfront Commission', 'Bal Harbour')}
                  className="text-xs uppercase tracking-wider text-[#C9A986] hover:underline"
                >
                  Inquire for Your Residence →
                </button>
              </div>
            </div>
          </div>

          {/* Related Case Studies */}
          <div className="mt-14 pt-10 border-t border-[#EAE4DB]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif-luxury text-xl text-[#1A1816]">
                More Art-Centric & Quiet Luxury Case Studies
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
        title="Bal Harbour Interior Design Process"
        subtitle="Consultation → Concept → Visualization → Design Development → Procurement/Coordination → Installation/Styling."
        steps={location.processSteps}
        onStartProject={() => onOpenConsultation('Start Your Bal Harbour Project', 'Bal Harbour')}
      />

      {/* Frequently Asked Questions */}
      <FAQAccordion
        title="Bal Harbour Interior Design FAQ"
        subtitle="Essential considerations for owners undertaking oceanfront high-rise renovations, art collection integration, or turnkey design in Bal Harbour."
        faqs={location.faqs}
      />

      {/* Final Call to Action Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
            <span>Bal Harbour Private Commissions</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Start Your Bal Harbour Project
          </h2>

          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Contact Paula Ambrosio Interiors to schedule a private consultation for your Bal Harbour oceanfront condominium, private village residence, or art collection sanctuary.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Start Your Bal Harbour Project', 'Bal Harbour')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              START YOUR BAL HARBOUR PROJECT
            </button>
            <button
              onClick={() => onOpenConsultation('Request a Private Consultation - Bal Harbour', 'Bal Harbour')}
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
              href="/portfolio/bal-harbour-sanctuary"
              onClick={(e) => { e.preventDefault(); onNavigate('/portfolio/bal-harbour-sanctuary'); }}
              className="hover:text-white transition-colors"
            >
              Bal Harbour Sanctuary Case Study
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
                  onOpenConsultation(`Inquiry for Bal Harbour: ${selectedPhoto.title}`, 'Bal Harbour');
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
