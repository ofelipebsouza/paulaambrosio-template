import React from 'react';
import { ArrowRight, ArrowUpRight, Compass, MapPin, Sparkles, Building, Landmark, ShieldCheck } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { locationsData } from '../data/locationsData';
import { projectsData } from '../data/projectsData';

interface LocationsHubPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const LocationsHubPage: React.FC<LocationsHubPageProps> = ({ onNavigate, onOpenConsultation }) => {
  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Luxury Interior Design South Florida | Paula Ambrosio Interiors"
        description="Explore Paula Ambrosio Interiors' luxury interior design services across Miami and selected South Florida communities."
        canonicalUrl="https://paulaambrosiointeriors.com/locations"
      />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=85"
            alt="Luxury Interior Design South Florida - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>South Florida Strategic Territory</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              Luxury Interior Design Across South Florida
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              Miami-based. International perspective. Local project expertise.
            </p>

            <p className="text-sm sm:text-base text-[#B8B1A8] font-light leading-relaxed max-w-xl">
              Explore Paula Ambrosio Interiors' luxury interior design services across Miami and selected South Florida communities. Every community possesses its own architectural tempo and coastal considerations.
            </p>
          </div>
        </div>
      </section>

      {/* Locations Hub Grid */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Selected Communities
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              South Florida Luxury Enclaves
            </h2>
            <p className="text-sm text-[#68625B] font-light">
              Select a location below to discover our specialized residential approaches, local case studies, and tailored turnkey solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {locationsData.map((loc) => {
              const matchedProject = projectsData.find(p => p.slug === loc.featuredProjectSlug);

              return (
                <div
                  key={loc.id}
                  className="bg-white border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md group"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#E8E2D8]">
                    <img
                      src={loc.heroImage}
                      alt={`Luxury Interior Design in ${loc.city}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#1A1816]/80 text-white text-[10px] uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#C9A986]" />
                      <span>{loc.city}</span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-serif-luxury text-2xl text-[#1A1816] font-medium mb-2 group-hover:text-[#C9A986] transition-colors">
                        {loc.title}
                      </h3>
                      <p className="text-xs text-[#615B54] leading-relaxed font-light mb-4">
                        {loc.hubOneLiner}
                      </p>

                      {/* Highlights */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {loc.highlights.slice(0, 3).map((hl, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-[#FAF9F6] border border-[#EAE4DB] text-[#7A746E]">
                            {hl}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#F0EAE1] flex items-center justify-between">
                      <button
                        onClick={() => onNavigate(loc.url)}
                        className="text-xs uppercase tracking-widest font-semibold text-[#1A1816] group-hover:text-[#C9A986] transition-colors flex items-center gap-1"
                      >
                        <span>Explore {loc.city}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenConsultation(`Project in ${loc.city}`, loc.city)}
                        className="text-[11px] text-[#C9A986] hover:underline"
                      >
                        Inquire
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Entity Authority & Location Approach */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Strategic Entity Positioning
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Authentic Local Context, Not Generic Templates
              </h2>
              <p className="text-sm text-[#5C564F] leading-relaxed font-light">
                Each South Florida municipality and private island has distinct building codes, environmental microclimates, and architectural cultures. We believe true luxury interior design begins with a deep, verified understanding of these local nuances.
              </p>
              <p className="text-sm text-[#5C564F] leading-relaxed font-light">
                From high-rise acoustic regulations in Bal Harbour and Sunny Isles Beach to historic estate preservation along Palm Beach’s Lake Trail and country club requirements in Boca Raton, our studio navigates every logistical requirement with finesse.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onOpenConsultation()}
                  className="px-8 py-3.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors"
                >
                  Start Your Regional Project
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 bg-[#FAF9F6] border border-[#E5DFD7] space-y-6">
                <h3 className="font-serif-luxury text-2xl text-[#1A1816]">
                  Paula Ambrosio Interiors Footprint
                </h3>
                <div className="space-y-4 text-xs text-[#615B54]">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#C9A986] text-white flex items-center justify-center rounded-full shrink-0 text-[10px]">1</div>
                    <div>
                      <strong className="text-[#1A1816] block">Flagship Miami Studio:</strong>
                      Serving Brickell, Coconut Grove, Coral Gables, Key Biscayne, and Greater Miami.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#C9A986] text-white flex items-center justify-center rounded-full shrink-0 text-[10px]">2</div>
                    <div>
                      <strong className="text-[#1A1816] block">Island & Coastal Enclaves:</strong>
                      Miami Beach (Star & Venetian Islands), Sunny Isles Beach, Bal Harbour, and Aventura.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#C9A986] text-white flex items-center justify-center rounded-full shrink-0 text-[10px]">3</div>
                    <div>
                      <strong className="text-[#1A1816] block">Palm Beach County Estates:</strong>
                      Boca Raton (Royal Palm) and Palm Beach (North County Road & Worth Ave).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Schedule a Regional Consultation
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Discuss your South Florida residence with Founder & Principal Designer Paula Ambrosio.
          </p>
          <div className="pt-4">
            <button
              onClick={() => onOpenConsultation()}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Request a Private Consultation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
