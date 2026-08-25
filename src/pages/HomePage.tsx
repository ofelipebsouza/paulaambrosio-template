import React from 'react';
import { ArrowRight, ArrowUpRight, Check, Compass, Eye, Layers, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { ProjectCard } from '../components/ProjectCard';
import { projectsData } from '../data/projectsData';
import { locationsData } from '../data/locationsData';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenConsultation }) => {
  const flagshipProjects = projectsData.filter(p => p.featured).slice(0, 4);

  const homeProcess = [
    { step: '01', title: 'Discovery & Programming', description: 'Understanding your lifestyle, architectural aspirations, functional flow, and timeline parameters.' },
    { step: '02', title: 'Concept & Design', description: 'Establishing spatial palettes, tactile materiality, mood narratives, and custom furniture sketches.' },
    { step: '03', title: 'Design Development', description: 'Detailed CAD architectural drawings, 3D photorealistic renderings, finish schedules, and millwork sets.' },
    { step: '04', title: 'Procurement & Coordination', description: 'Directing global artisan production across Italy and the US, freight logistics, and contractor alignment.' },
    { step: '05', title: 'Installation & Staging', description: 'White-glove delivery, custom millwork installation, art hanging, fine accessory placement, and bed dressing.' },
    { step: '06', title: 'Turnkey Reveal', description: 'Handover of a fully realized, illuminated, and fragranced sanctuary ready for immediate move-in.' }
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Luxury Interior Designer Miami | Paula Ambrosio Interiors"
        description="Paula Ambrosio Interiors is a Miami luxury interior design studio specializing in high-end residential, turnkey interiors, renovations, custom homes and hospitality projects."
      />

      {/* Hero Section */}
      <section className="relative min-h-[88vh] flex items-center justify-center bg-[#171513] text-white overflow-hidden">
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=90"
            alt="Luxury Interior Design in Miami - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center scale-105 animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/60 to-[#171513]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171513] via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF9F6]/10 border border-white/20 backdrop-blur-md text-[#E8D8C8] text-xs uppercase tracking-[0.25em]">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Miami Luxury Interior Design Studio</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-tight text-white">
              Luxury Interior Design in Miami
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl leading-relaxed">
              Sophisticated interiors. Seamless execution. Designed around the way you live.
            </p>

            <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl font-light leading-relaxed">
              Paula Ambrosio Interiors is a Miami-based luxury interior design studio creating sophisticated residential and hospitality interiors in South Florida and internationally.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onOpenConsultation()}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg hover:shadow-xl"
              >
                Start Your Project
              </button>
              
              <button
                onClick={() => onNavigate('/turnkey-interior-design-miami')}
                className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 hover:border-white transition-all text-center"
              >
                Discover Turnkey Design
              </button>
            </div>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-[#171513]/80 backdrop-blur-md hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-[#C5BEB5]">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A986]" />
              Full-Service Residential Architecture
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A986]" />
              Turnkey Second-Home Execution
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A986]" />
              Boutique Hospitality & Wellness
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A986]" />
              Miami · Palm Beach · International
            </span>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Studio Philosophy
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl text-[#1A1816] font-normal leading-tight">
                Considered, Personal, & Utterly Complete
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Paula Ambrosio Interiors is a Miami-based luxury interior design studio creating sophisticated residential and hospitality interiors in South Florida and internationally. From concept to completion, our studio brings together interior design, custom detailing, material selection, procurement, project coordination and final styling to create spaces that feel considered, personal and complete.
              </p>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Whether orchestrating a complete waterfront estate build on Star Island, an oceanfront penthouse in Sunny Isles, or an estate restoration in Palm Beach, our team translates architectural volumes into tactile, harmonious sanctuaries.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('/interior-design-miami')}
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#1A1816] hover:text-[#C9A986] transition-colors border-b border-[#1A1816] pb-1"
                >
                  <span>Explore Miami Services</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('/about')}
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#7A746E] hover:text-[#1A1816] transition-colors pb-1"
                >
                  <span>Meet Paula Ambrosio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
                  alt="Paula Ambrosio Interiors - Miami Luxury Waterfront Residence"
                  className="w-full aspect-[4/3] object-cover border border-[#E2DBD1] shadow-xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-[#171513] text-white p-6 max-w-xs border border-[#2D2A26] shadow-xl hidden sm:block">
                  <p className="font-serif-luxury text-2xl text-[#C9A986] font-normal">19+ Years · 2,300+ Projects</p>
                  <p className="text-xs text-[#B8B1A8] mt-1 font-light">
                    Founded by Amanda & Paula Ambrósio, transforming spaces across Miami, the US, and internationally.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Design Pillars Section */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Signature Capabilities
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-5xl text-[#1A1816] font-normal">
              Our Core Design Disciplines
            </h2>
            <p className="text-sm sm:text-base text-[#6E6861] font-light">
              From visionary space planning to full turnkey handover, we tailor our involvement to your exact property requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Full-Service Residential */}
            <div className="bg-[#FAF9F6] border border-[#E5DFD7] p-8 flex flex-col justify-between hover:border-[#C9A986] transition-all group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#F0EAE1] text-[#1A1816] flex items-center justify-center border border-[#DED5C9]">
                  <Layers className="w-5 h-5 text-[#C9A986]" />
                </div>
                <h3 className="font-serif-luxury text-2xl text-[#1A1816] font-normal">
                  Full-Service Interior Design
                </h3>
                <p className="text-xs sm:text-sm text-[#615B54] leading-relaxed font-light">
                  From vision to a fully realized interior. Services include interior architecture and space planning, renovation design, new-construction interior design, custom millwork, kitchens and bathrooms, lighting, material selection, custom furniture, procurement, art, installation, and styling.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#EAE4DB]">
                <button
                  onClick={() => onNavigate('/luxury-residential-interior-design-miami')}
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#1A1816] group-hover:text-[#C9A986] transition-colors"
                >
                  <span>Explore Residential Projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Turnkey */}
            <div className="bg-[#FAF9F6] border border-[#C9A986] p-8 flex flex-col justify-between shadow-xs relative group">
              <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-[#C9A986] text-[#171513] text-[10px] uppercase tracking-widest font-semibold">
                Signature
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#F0EAE1] text-[#1A1816] flex items-center justify-center border border-[#DED5C9]">
                  <Compass className="w-5 h-5 text-[#C9A986]" />
                </div>
                <h3 className="font-serif-luxury text-2xl text-[#1A1816] font-normal">
                  Turnkey Interior Design
                </h3>
                <p className="text-xs sm:text-sm text-[#615B54] leading-relaxed font-light">
                  Arrive. Everything is ready. Our turnkey service is for clients who want an extraordinary home without managing hundreds of individual decisions. We oversee the design journey from concept through furnishings, lighting, custom pieces, procurement, installation, accessories, and final styling.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#EAE4DB]">
                <button
                  onClick={() => onNavigate('/turnkey-interior-design-miami')}
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#1A1816] group-hover:text-[#C9A986] transition-colors"
                >
                  <span>Discover Turnkey Design</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: Hospitality */}
            <div className="bg-[#FAF9F6] border border-[#E5DFD7] p-8 flex flex-col justify-between hover:border-[#C9A986] transition-all group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#F0EAE1] text-[#1A1816] flex items-center justify-center border border-[#DED5C9]">
                  <Eye className="w-5 h-5 text-[#C9A986]" />
                </div>
                <h3 className="font-serif-luxury text-2xl text-[#1A1816] font-normal">
                  Hospitality & Commercial
                </h3>
                <p className="text-xs sm:text-sm text-[#615B54] leading-relaxed font-light">
                  Memorable environments designed around experience, flow and identity. We curate boutique hotels, private lounges, wellness retreats, and upscale commercial spaces that balance captivating atmosphere with contract durability and operational flow.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#EAE4DB]">
                <button
                  onClick={() => onNavigate('/hospitality-interior-design-miami')}
                  className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#1A1816] group-hover:text-[#C9A986] transition-colors"
                >
                  <span>View Hospitality Work</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Flagship Projects Section */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Selected Case Studies
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl text-[#1A1816] font-normal">
                Featured Flagship Residences
              </h2>
              <p className="text-sm text-[#6E6861] font-light">
                Explore a selection of our recent luxury residential and turnkey completions across South Florida.
              </p>
            </div>
            
            <button
              onClick={() => onNavigate('/portfolio')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#1A1816] text-white text-xs uppercase tracking-widest hover:bg-[#C9A986] transition-colors shrink-0"
            >
              <span>View All Portfolio</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {flagshipProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onNavigate={onNavigate}
                aspectRatio="aspect-[16/10]"
              />
            ))}
          </div>

        </div>
      </section>

      {/* Interactive Transformation Feature (Turnkey In-Action) */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Turnkey Metamorphosis
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl text-[#1A1816] font-normal leading-tight">
                From Raw Concrete to Move-In Perfection
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Our turnkey process is designed to eliminate every friction point between property acquisition and luxurious living. We take raw developer shells or dated historical floor plans and transform them into seamlessly resolved residences.
              </p>
              
              <ul className="space-y-2.5 text-xs text-[#524D47]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C9A986] shrink-0" />
                  <span>Custom Italian millwork, acoustic wall panels, and bespoke lighting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C9A986] shrink-0" />
                  <span>Complete white-glove FF&E procurement, delivery, and staging</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C9A986] shrink-0" />
                  <span>Curated art collections, fine linens, accessories, and automated scenes</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/turnkey-interior-design-miami')}
                  className="px-8 py-3.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors"
                >
                  Discover Turnkey Design
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <BeforeAfterSlider
                beforeImage="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                afterImage="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
                beforeLabel="Raw Developer Shell"
                afterLabel="Finished Turnkey Great Room"
              />
            </div>

          </div>
        </div>
      </section>

      {/* About Paula Ambrosio Section */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=85"
                  alt="Paula Ambrosio - Founder & Principal Designer of Paula Ambrosio Interiors"
                  className="w-full aspect-[4/5] object-cover object-top border border-[#E2DBD1] shadow-xl"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-[#1A1816]/80 text-[#FAF9F6] text-[10px] uppercase tracking-widest backdrop-blur-xs">
                  Founded by Amanda & Paula Ambrósio
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Studio Leadership & Heritage
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl text-[#1A1816] font-normal leading-tight">
                About Amanda & Paula Ambrósio
              </h2>
              
              <div className="space-y-4 text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                <p className="font-serif-luxury text-xl text-[#1A1816] italic font-normal">
                  "With nearly two decades of interior design mastery and over 2,300 completed projects worldwide, we transform properties into move-in-ready sanctuaries of timeless luxury."
                </p>
                <p>
                  Co-founded by sisters Amanda and Paula Ambrósio, our Miami studio brings together a 15-person team of interior architects, designers, and project managers. We specialize in high-end residential, turnkey transformations for international homeowners, and strategic consulting for developers.
                </p>
                <p>
                  From Miami, New York, and California to Brazil, Portugal, Mexico, and Panama, we deliver bespoke, turnkey execution with unparalleled aesthetic rigor and personal care.
                </p>
              </div>

              <div className="pt-2 flex items-center space-x-6">
                <button
                  onClick={() => onNavigate('/about')}
                  className="px-8 py-3.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors"
                >
                  Meet Amanda, Paula & The Studio
                </button>
                <button
                  onClick={() => onOpenConsultation()}
                  className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:underline"
                >
                  Request Consultation →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Disciplined Process Section */}
      <ProcessTimeline
        title="Our Six-Stage Design Journey"
        subtitle="Discovery → Concept & Design → Design Development → Procurement & Coordination → Installation → Reveal."
        steps={homeProcess}
        onStartProject={() => onOpenConsultation()}
      />

      {/* Locations Hub Grid Preview */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                South Florida Territory
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-5xl text-[#1A1816] font-normal">
                Luxury Interior Design Across South Florida
              </h2>
              <p className="text-sm text-[#6E6861] font-light">
                Miami-based. International perspective. Deep local project expertise across South Florida’s premier waterfront enclaves.
              </p>
            </div>
            
            <button
              onClick={() => onNavigate('/locations')}
              className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors shrink-0"
            >
              <span>Explore Locations Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {locationsData.map((loc) => (
              <div
                key={loc.id}
                onClick={() => onNavigate(loc.url)}
                className="group cursor-pointer bg-[#FAF9F6] border border-[#E5DFD7] hover:border-[#C9A986] p-6 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{loc.city}</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#7A746E] group-hover:text-[#C9A986] transition-colors" />
                  </div>
                  <h3 className="font-serif-luxury text-2xl text-[#1A1816] font-normal mb-2">
                    {loc.title}
                  </h3>
                  <p className="text-xs text-[#68625B] leading-relaxed font-light line-clamp-3">
                    {loc.hubOneLiner}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EAE4DB] flex items-center justify-between text-[11px] text-[#8C847B]">
                  <span>Explore Projects</span>
                  <span className="text-[#C9A986] font-medium group-hover:underline">View Page →</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Conversion Banner Section */}
      <section className="py-20 bg-[#171513] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[#E8D8C8] text-xs uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
            <span>Schedule Your Private Consultation</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Ready to Begin Your Design Journey?
          </h2>

          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-2xl mx-auto font-light leading-relaxed">
            Whether you are building a custom estate, acquiring an oceanfront penthouse, or seeking complete turnkey ease, our studio welcomes the opportunity to discuss your vision.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation()}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Start Your Project
            </button>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 hover:border-white transition-all"
            >
              Explore Our Portfolio
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
