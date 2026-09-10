import React from 'react';
import { ArrowRight, Award, CheckCircle2, Compass, Globe, Heart, Layers, MapPin, Sparkles, Users } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

interface AboutPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onOpenConsultation }) => {
  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="About Amanda & Paula Ambrósio | Paula Ambrosio Interiors"
        description="Paula Ambrosio Interiors is a Miami-based luxury interior design studio specializing in high-end residential, turnkey transformations, and boutique commercial environments."
        canonicalUrl="https://paulaambrosiointeriors.com/about"
      />

      {/* Hero Section */}
      <section className="relative min-h-[55vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/cRTC5lm1QD9HiCvnd7TYPrsOuY.avif"
            alt="Paula & Amanda Ambrosio Interiors"
            className="w-full h-full object-cover object-center opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/95 via-[#171513]/75 to-[#171513]/55" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Founded by Amanda & Paula Ambrósio</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              About Paula Ambrosio Interiors
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              "Transforming properties into elegant, functional, and move-in-ready sanctuaries across South Florida and internationally."
            </p>
          </div>
        </div>
      </section>

      {/* Studio Track Record Milestones Bar */}
      <section className="bg-[#1A1816] text-[#FAF9F6] border-b border-[#2D2A26] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#2D2A26]">
            <div className="pt-4 md:pt-0">
              <div className="font-serif-luxury text-3xl sm:text-4xl text-[#C9A986] font-normal">Miami</div>
              <div className="text-xs uppercase tracking-widest text-[#A8A199] mt-1 font-medium">Headquarters</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="font-serif-luxury text-3xl sm:text-4xl text-[#C9A986] font-normal">Full-Service</div>
              <div className="text-xs uppercase tracking-widest text-[#A8A199] mt-1 font-medium">Design Studio</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="font-serif-luxury text-3xl sm:text-4xl text-[#C9A986] font-normal">Multidisciplinary</div>
              <div className="text-xs uppercase tracking-widest text-[#A8A199] mt-1 font-medium">In-House Team</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="font-serif-luxury text-3xl sm:text-4xl text-[#C9A986] font-normal">International</div>
              <div className="text-xs uppercase tracking-widest text-[#A8A199] mt-1 font-medium">Project Reach</div>
            </div>
          </div>
        </div>
      </section>

      {/* Founders & Studio Narrative */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <div className="relative">
                <img
                  src="/assets/PJnrVScMHWsoOcbfk4NqnXYjMyU.webp"
                  alt="Amanda & Paula Ambrósio - Founders of Paula Ambrosio Interiors"
                  className="w-full aspect-[4/5] object-cover object-top border border-[#E2DBD1] shadow-xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-[#171513] text-white p-6 border border-[#2D2A26] max-w-xs shadow-xl hidden sm:block">
                  <p className="font-serif-luxury text-xl text-[#C9A986]">Amanda & Paula Ambrósio</p>
                  <p className="text-xs text-[#A8A199] mt-0.5 font-light">Co-Founders & Studio Directors</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Studio Leadership & Heritage
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl text-[#1A1816] font-normal leading-tight">
                A Studio Built on Design Precision
              </h2>
              
              <div className="space-y-4 text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                <p>
                  Co-founded by sisters <strong>Amanda and Paula Ambrósio</strong>, Paula Ambrosio Interiors is a Miami-based full-service studio specializing in high-end residential design, turnkey transformations, and boutique commercial environments.
                </p>
                <p>
                  Our multidisciplinary team of interior designers, 3D visualization artists, FF&E specialists, and project managers works closely with licensed general contractors, European ateliers, and master craftsmen. From custom millwork in Star Island estates to oceanfront penthouses in Sunny Isles Beach, we manage every detail from concept through final installation.
                </p>
              </div>

              <div className="pt-2 flex items-center space-x-6">
                <button
                  onClick={() => onOpenConsultation('Studio Consultation')}
                  className="px-8 py-3.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors"
                >
                  Schedule Private Meeting
                </button>
                <button
                  onClick={() => onNavigate('/portfolio')}
                  className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:underline"
                >
                  View Selected Works →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Global Footprint & International Experience */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Global Perspective
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              An International Design Presence
            </h2>
            <p className="text-sm sm:text-base text-[#6E6861] font-light">
              While rooted in Miami's coastal light and architectural vibrancy, our studio coordinates residences and commercial spaces for discerning clients across the globe.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] text-center space-y-2">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">United States</div>
              <div className="font-serif-luxury text-lg text-[#1A1816]">Miami & Florida</div>
              <div className="text-[11px] text-[#7A746E]">HQ & Flagship Enclaves</div>
            </div>
            <div className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] text-center space-y-2">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">United States</div>
              <div className="font-serif-luxury text-lg text-[#1A1816]">New York</div>
              <div className="text-[11px] text-[#7A746E]">Urban Residences & Lofts</div>
            </div>
            <div className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] text-center space-y-2">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">United States</div>
              <div className="font-serif-luxury text-lg text-[#1A1816]">California</div>
              <div className="text-[11px] text-[#7A746E]">Coastal Luxury Estates</div>
            </div>
            <div className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] text-center space-y-2">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">South America</div>
              <div className="font-serif-luxury text-lg text-[#1A1816]">Brazil</div>
              <div className="text-[11px] text-[#7A746E]">Custom Private Homes</div>
            </div>
            <div className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] text-center space-y-2">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">Europe</div>
              <div className="font-serif-luxury text-lg text-[#1A1816]">Portugal</div>
              <div className="text-[11px] text-[#7A746E]">Historic & Modern Villas</div>
            </div>
            <div className="p-6 bg-[#FAF9F6] border border-[#E5DFD7] text-center space-y-2">
              <div className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">Americas</div>
              <div className="font-serif-luxury text-lg text-[#1A1816]">Mexico & Panama</div>
              <div className="text-[11px] text-[#7A746E]">Resort & Second Homes</div>
            </div>
          </div>

        </div>
      </section>

      {/* Core Studio Pillars */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Our Design Tenets
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Aesthetic Harmony, Comfort & Functionality
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white border border-[#E5DFD7] space-y-3">
              <div className="w-10 h-10 bg-[#F0EAE1] text-[#C9A986] flex items-center justify-center font-serif-luxury text-xl">
                I
              </div>
              <h3 className="font-serif-luxury text-2xl text-[#1A1816]">Material Sincerity</h3>
              <p className="text-xs sm:text-sm text-[#615B54] leading-relaxed font-light">
                We champion authentic natural stones, live-finish bronzes, solid hardwoods, and raw organic textiles that age with grace and develop a rich patina over time.
              </p>
            </div>

            <div className="p-8 bg-white border border-[#E5DFD7] space-y-3">
              <div className="w-10 h-10 bg-[#F0EAE1] text-[#C9A986] flex items-center justify-center font-serif-luxury text-xl">
                II
              </div>
              <h3 className="font-serif-luxury text-2xl text-[#1A1816]">Seamless White-Glove Rigor</h3>
              <p className="text-xs sm:text-sm text-[#615B54] leading-relaxed font-light">
                Luxury without operational discipline is a compromise. We manage every phase with cloud-backed tracking, strict budget transparency, and flawless logistical timing.
              </p>
            </div>

            <div className="p-8 bg-white border border-[#E5DFD7] space-y-3">
              <div className="w-10 h-10 bg-[#F0EAE1] text-[#C9A986] flex items-center justify-center font-serif-luxury text-xl">
                III
              </div>
              <h3 className="font-serif-luxury text-2xl text-[#1A1816]">Client-Centric Legacy</h3>
              <p className="text-xs sm:text-sm text-[#615B54] leading-relaxed font-light">
                We do not stamp a uniform house style. We unearth your personal rituals, family traditions, and taste to compose a residence that feels uniquely yours.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Global Sourcing & Artisan Network */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Direct Atelier Access
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                European & American Master Ateliers
              </h2>
              <p className="text-sm text-[#5C564F] leading-relaxed font-light">
                Across 19+ years, our studio has established direct relationships with artisanal family-owned workshops in Milan, Florence, Paris, and high-end North American manufacturers.
              </p>
              <p className="text-sm text-[#5C564F] leading-relaxed font-light">
                This allows us to bypass commercial middlemen, offering our clients custom-milled cabinetry, custom-quarried Italian travertines, and hand-woven silk rugs at extraordinary levels of craftsmanship.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onOpenConsultation()}
                  className="px-8 py-3.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors"
                >
                  Inquire With Our Studio
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <img
                src="https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=85"
                alt="Custom Millwork & Art Curation by Paula Ambrosio"
                className="w-full aspect-[4/3] object-cover border border-[#E2DBD1] shadow-lg"
              />
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Schedule a Private Consultation
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            We invite you to connect with Amanda & Paula Ambrósio at our Miami studio or via private digital discovery.
          </p>
          <div className="pt-4">
            <button
              onClick={() => onOpenConsultation('Discovery Meeting')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Request Private Consultation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
