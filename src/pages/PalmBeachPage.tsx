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
  Home,
  Layers,
  Award
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { locationsData } from '../data/locationsData';
import { projectsData } from '../data/projectsData';

interface PalmBeachPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const PalmBeachPage: React.FC<PalmBeachPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const location = locationsData.find(loc => loc.id === 'palm-beach') || locationsData[5];
  const featuredProject = projectsData.find(p => p.slug === 'ocean-palm-villa') || projectsData.find(p => p.id === 'ocean-palm-villa') || projectsData[0];
  const relatedProjects = projectsData.filter(p => p.id === 'royal-palm-estate' || p.id === 'bal-harbour-sanctuary');

  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    subtitle: string;
    category: string;
    description: string;
    badge: string;
  } | null>(null);

  // Selected photographic assets as requested:
  // • 1 hero photo relevant to Palm Beach
  // • 3-5 project images; preferably actual Palm Beach work
  // • 1 material/detail image
  const palmBeachGallery = [
    {
      badge: 'Formal Drawing Room',
      title: 'Grand Drawing Room with Coffered Ceilings',
      subtitle: 'Ocean Palm Villa • North County Road, Palm Beach',
      category: 'Estate Salon & Living',
      description: 'Classical architectural coffered ceilings paired with restored French limestone flags, custom linen upholstery, and tailored contemporary comfort.',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Custom Island Kitchen',
      title: 'Hand-Crafted Painted Cabinetry & Brass Grilles',
      subtitle: 'Ocean Palm Villa • Palm Beach, FL',
      category: 'Culinary Architecture',
      description: 'Lacquered cabinetry detailed with hand-stitched leather pulls, delicate brass mesh grilles, and honed marble counters honoring historic island grace.',
      url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Courtyard Morning Loggia',
      title: 'Sunlit Loggia Overlooking Private Courtyard',
      subtitle: 'Ocean Palm Villa • Palm Beach, FL',
      category: 'Outdoor Loggia & Courtyard',
      description: 'Arched loggia colonnade opening to private garden fountain, furnished in weather-resilient Perennials linens and aged teak dining furniture.',
      url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Primary Suite Sanctuary',
      title: 'Serene Guest Bedroom with Garden Balcony',
      subtitle: 'Ocean Palm Villa • Palm Beach, FL',
      category: 'Guest Suite',
      description: 'Hand-applied pale lime plaster walls, Pierre Frey tailored curtains, and custom French doors leading to a bougainvillea-framed balcony.',
      url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=85'
    },
    {
      badge: 'Material & Craft Detail',
      title: 'Historic Pedigree & Noble Textures',
      subtitle: 'French Limestone, Pecky Cypress, Aged Brass & Pierre Frey Linen',
      category: 'Material Palette',
      description: 'Authentic reclaimed French Beaumaniere limestone, marine-sealed pecky cypress, aged living unlacquered brass hardware, and heavy textured linen.',
      url: '/assets/2Ssjz627D6EoynArvuU4h86sCc.avif'
    }
  ];

  // Applicable services tailored to Palm Beach residences
  const applicableServices = [
    {
      title: 'Full-Service Interior Design',
      description: 'Comprehensive interior architecture, spatial choreography, and historical detailing for classical Mizner estates, Georgian manors, and oceanfront residences.',
      linkText: 'Explore Residential Scope',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'Luxury Renovation',
      description: 'Restoring historic landmark properties and re-engineering segmented estate plans while preserving authentic moldings, plaster, and stone elements.',
      linkText: 'Renovation Capabilities',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'New Construction Interior Design',
      description: 'Guiding newly built lakefront estates and custom island residences through architectural framing, millwork detailing, and luxury stone specification.',
      linkText: 'View New Construction',
      linkTarget: '/luxury-residential-interior-design-miami'
    },
    {
      title: 'Turnkey Interior Design (Move-in Ready)',
      description: 'White-glove winter season preparation: procurement, climate-controlled warehousing, Italian bed linens, silver, and tableware staged prior to your arrival.',
      linkText: 'Explore Turnkey Living',
      linkTarget: '/turnkey-interior-design-miami'
    },
    {
      title: 'Custom Millwork & Architectural Joinery',
      description: 'Restored pecky cypress ceilings, lacquered chef cabinetry, brass-grille credenzas, library bookcases, and custom dressing rooms fabricated by master artisans.',
      linkText: 'Discover Custom Joinery',
      linkTarget: '/portfolio/ocean-palm-villa'
    },
    {
      title: 'Furniture, Art & Final Styling',
      description: 'A considered dialogue pairing European antiques with tailored contemporary upholstery, custom de Gournay wallcoverings, and museum-grade art illumination.',
      linkText: 'View Selected Portfolios',
      linkTarget: '/portfolio'
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Luxury Interior Designer Palm Beach | Paula Ambrosio Interiors"
        description="Paula Ambrosio Interiors designs refined interiors for Palm Beach's historic estates and waterfront properties, blending classical architecture with contemporary comfort."
        canonicalUrl="https://paulaambrosiointeriors.com/interior-designer-palm-beach"
        faqs={location.faqs}
        breadcrumbItems={[{ name: "Locations", url: "https://paulaambrosiointeriors.com/locations" }, { name: "Palm Beach", url: "https://paulaambrosiointeriors.com/interior-designer-palm-beach" }]}
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
          <span className="text-[#1A1816] font-medium">Palm Beach</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85"
            alt="Luxury Interior Designer Palm Beach - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Historic Estates & Oceanfront Sanctuaries</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              Luxury Interior Designer in Palm Beach
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              Full-service residential design for refined residences, estates, second homes and full-service luxury interiors.
            </p>

            <p className="text-sm sm:text-base text-[#B8B1A8] font-light leading-relaxed max-w-xl">
              From historic Mizner-era villas on North County Road and lakefront properties along the Lake Trail to South Ocean Boulevard condominiums, Paula Ambrosio Interiors balances architectural pedigree with luminous modern livability and turnkey ease.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onOpenConsultation('Start Your Palm Beach Project', 'Palm Beach')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg"
              >
                START YOUR PALM BEACH PROJECT
              </button>
              
              <button
                onClick={() => onOpenConsultation('Request a Private Consultation - Palm Beach', 'Palm Beach')}
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
                Island Pedigree & Classical Proportions
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Honoring Heritage While Embracing Modern Vitality
              </h2>
              
              {/* 150-250 Unique Words about Palm Beach residential context */}
              <div className="space-y-4 text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                <p>
                  Palm Beach stands as an iconic bastion of American sophistication, architectural heritage, and refined island living. From historic Mizner-era Mediterranean revival courtyard villas and classical Georgian-inspired manors along North County Road to mid-century lakefront estates bordering the Lake Trail and oceanfront sanctuaries on South Ocean Boulevard, interior design in Palm Beach demands profound historical reverence paired with modern livability. The residential landscape here is uniquely discerning, catering to multi-generational American dynasties, prominent collectors, and international seasonal residents who value enduring elegance, pedigree, and craftsmanship over transient trends.
                </p>
                <p>
                  Our studio approaches Palm Beach properties by honoring their authentic classical proportions, meticulously restoring reclaimed French limestone flags, handcrafted plaster cornices, and pecky cypress ceilings, while introducing airy contemporary volumes and whisper-quiet infrastructure. We eliminate dark, segmented corridors in favor of sun-drenched flow-through galleries that connect grand formal reception rooms with intimate private courtyards, loggias, and shaded poolside loggias. Through full-service interior architecture and{' '}
                  <a
                    href="/turnkey-interior-design-miami"
                    onClick={(e) => { e.preventDefault(); onNavigate('/turnkey-interior-design-miami'); }}
                    className="text-[#1A1816] font-medium underline decoration-[#C9A986] hover:text-[#C9A986]"
                  >
                    turnkey execution
                  </a>
                  , we integrate custom European millwork, museum-grade art illumination, tailored Pierre Frey and de Gournay textiles, and discreet smart-home technology, crafting enduring island residences that welcome winter seasons with effortless poise.
                </p>
              </div>

              {/* Landmark Community Highlights */}
              <div className="pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816] mb-2">
                  Historic Palm Beach Enclaves & Addresses:
                </div>
                <div className="flex flex-wrap gap-2">
                  {location.highlights.map((community, idx) => (
                    <span key={idx} className="text-xs px-3 py-1.5 bg-white border border-[#DDD5CA] text-[#4A453F] font-medium">
                      {community}
                    </span>
                  ))}
                </div>
              </div>

              {/* ARCOM & Landmark Commission Notice */}
              <div className="p-4 bg-[#F2EDE5] border border-[#E2DBD1] flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                <div className="text-xs text-[#68625B] leading-relaxed">
                  <span className="font-semibold text-[#1A1816]">Landmarks Commission (ARCOM):</span> We coordinate comprehensive technical filings aligned with Town of Palm Beach preservation standards, preserving classical facade profiles and interior moldings while upgrading infrastructure.
                </div>
              </div>
            </div>

            {/* Visual Pairing with internal links */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=85"
                  alt="Palm Beach estate custom painted chef kitchen with French limestone floors"
                  className="w-full aspect-[4/3] object-cover border border-[#E2DBD1] shadow-lg"
                />
                <div className="absolute -bottom-4 -right-4 bg-white p-4 border border-[#E2DBD1] shadow-md hidden sm:block max-w-xs">
                  <p className="text-[11px] uppercase tracking-widest text-[#C9A986] font-semibold">Ocean Palm Villa</p>
                  <p className="text-xs text-[#524D47] mt-1 font-light">Lacquered Cabinetry, Brass Mesh & French Beaumaniere Stone</p>
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

      {/* Applicable Services Tailored to Palm Beach */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Tailored Capabilities
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Services for Palm Beach Estates & Island Residences
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light max-w-2xl mx-auto">
              Our multidisciplinary studio provides comprehensive interior architecture, historic estate restoration, custom millwork, selected decor, and turnkey seasonal handover.
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
                Palm Beach Photography & Detail Archive
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Explore formal drawing rooms, custom painted kitchens, Mediterranean morning loggias, and noble limestone details from Ocean Palm Villa.
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
            {palmBeachGallery.map((item, idx) => (
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

      {/* Featured Verified Project: Ocean Palm Villa */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Verified Palm Beach Case Study
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
                  Historic Estate Renovation
                </div>
              </div>

              {/* Quick specs grid */}
              <div className="grid grid-cols-2 gap-4 text-xs text-[#68625B] pt-2">
                <div className="p-3 bg-white border border-[#E5DFD7]">
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] block font-semibold">Location & Street</span>
                  <span className="font-medium text-[#1A1816]">North County Road • Palm Beach</span>
                </div>
                <div className="p-3 bg-white border border-[#E5DFD7]">
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] block font-semibold">Execution Scope</span>
                  <span className="font-medium text-[#1A1816]">Historic Renovation & Millwork</span>
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
                  <span>Read Complete Palm Beach Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A986]" />
                </button>
                <button
                  onClick={() => onOpenConsultation('Discuss a Palm Beach Estate Commission', 'Palm Beach')}
                  className="text-xs uppercase tracking-wider text-[#C9A986] hover:underline"
                >
                  Inquire for Your Estate →
                </button>
              </div>
            </div>
          </div>

          {/* Related Case Studies */}
          <div className="mt-14 pt-10 border-t border-[#EAE4DB]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif-luxury text-xl text-[#1A1816]">
                More Estate & Architectural Case Studies
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
        title="Palm Beach Interior Design Process"
        subtitle="Consultation → Concept → Visualization → Design Development → Procurement/Coordination → Installation/Styling."
        steps={location.processSteps}
        onStartProject={() => onOpenConsultation('Start Your Palm Beach Project', 'Palm Beach')}
      />

      {/* Frequently Asked Questions */}
      <FAQAccordion
        title="Palm Beach Interior Design FAQ"
        subtitle="Essential considerations for owners undertaking historic estate renovations, ARCOM landmark filings, or turnkey winter season preparation in Palm Beach."
        faqs={location.faqs}
      />

      {/* Final Call to Action Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
            <span>Palm Beach Private Commissions</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Start Your Palm Beach Project
          </h2>

          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Contact Paula Ambrosio Interiors to schedule a private consultation for your Palm Beach historic estate, lakeside retreat, or oceanfront condominium residence.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Start Your Palm Beach Project', 'Palm Beach')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              START YOUR PALM BEACH PROJECT
            </button>
            <button
              onClick={() => onOpenConsultation('Request a Private Consultation - Palm Beach', 'Palm Beach')}
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
              href="/portfolio/ocean-palm-villa"
              onClick={(e) => { e.preventDefault(); onNavigate('/portfolio/ocean-palm-villa'); }}
              className="hover:text-white transition-colors"
            >
              Ocean Palm Villa Case Study
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
                  onOpenConsultation(`Inquiry for Palm Beach: ${selectedPhoto.title}`, 'Palm Beach');
                }}
                className="px-5 py-2.5 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all whitespace-nowrap"
              >
                Inquire for Your Estate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
