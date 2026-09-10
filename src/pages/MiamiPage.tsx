import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Compass, Layers, MapPin, Sparkles, Building, Home, Shield, Award, Camera, Eye, X, ZoomIn } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { ProjectCard } from '../components/ProjectCard';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { projectsData } from '../data/projectsData';

interface MiamiPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const MiamiPage: React.FC<MiamiPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; subtitle: string; location: string } | null>(null);

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

  // Completed Miami projects to feature as linked cards
  const miamiProjects = projectsData.filter(p => p.city === 'Miami' || p.city === 'Miami Beach' || p.city === 'Coral Gables');

  // 8 Best Miami Project Photos
  const miamiGalleryPhotos = [
    {
      url: '/assets/cRTC5lm1QD9HiCvnd7TYPrsOuY.avif',
      title: 'Monolithic Great Room & Helical Staircase',
      subtitle: 'HOME KD • Miami, FL',
      location: 'Miami (Pinecrest / Brickell)',
      tag: 'Grand Volume'
    },
    {
      url: '/assets/2Ssjz627D6EoynArvuU4h86sCc.avif',
      title: 'Waterfront Living Salon & Biscayne Vistas',
      subtitle: 'HOME FL • Miami Waterfront',
      location: 'Miami Waterfront Estate',
      tag: 'Waterfront'
    },
    {
      url: '/assets/VeQrhZ7P2LeFosBrLV887ZsFA.avif',
      title: 'Monumental 20-Foot Stone Fireplace Salon',
      subtitle: 'HOME DR • Miami, FL',
      location: 'Miami Architectural Estate',
      tag: 'Stone Millwork'
    },
    {
      url: '/assets/uJDafV2OYdKY0ezWt4AhW3Dpj0.avif',
      title: 'Honed Roman Travertine Primary Spa',
      subtitle: 'HOME S • Miami Beach',
      location: 'Miami Beach Penthouse',
      tag: 'Spa Architecture'
    },
    {
      url: '/assets/X8XTDp3V2Z56VsOWfw8jCyBLpuk.webp',
      title: 'Culinary Pavilion with Integrated Oak & Bronze',
      subtitle: 'HOME IT • Coral Gables / Miami',
      location: 'Coral Gables Estate',
      tag: 'Custom Kitchen'
    },
    {
      url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
      title: 'Covered Loggia & Outdoor Entertaining Pavilion',
      subtitle: 'Indoor-Outdoor Synthesis',
      location: 'Key Biscayne Residence',
      tag: 'Outdoor Living'
    },
    {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
      title: 'Sky Residence Dining Salon with Architectural Lighting',
      subtitle: 'Brickell Avenue Sky Penthouse',
      location: 'Brickell Financial District',
      tag: 'Penthouse'
    },
    {
      url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85',
      title: 'Custom Primary Sanctuary & Acoustic Fluting',
      subtitle: 'Tailored Upholstery & Neutral Palette',
      location: 'Coconut Grove Residence',
      tag: 'Primary Suite'
    }
  ];

  const miamiProcess = [
    { step: '01', title: 'Private Consultation', description: 'Comprehensive discovery of your goals, lifestyle requirements, and spatial objectives.' },
    { step: '02', title: 'Concept Development', description: 'Establishing the design direction, mood, color palettes, and preliminary space allocations.' },
    { step: '03', title: '3D Visualization', description: 'Photorealistic renderings allowing you to visualize materials, lighting, and custom millwork before construction.' },
    { step: '04', title: 'Technical Development', description: 'Comprehensive construction documents, electrical plans, tile layouts, and specifications.' },
    { step: '05', title: 'Procurement & Coordination', description: 'Managing global orders, custom fabrications, vendor logistics, and on-site contractor collaboration.' },
    { step: '06', title: 'Installation & Styling', description: 'White-glove placement, fine art hanging, decorative styling, and the final reveal.' }
  ];

  const miamiFaqs = [
    {
      question: 'What distinguishes Paula Ambrosio Interiors from other Miami interior design firms?',
      answer: 'Our studio combines more than two decades of verified interior design mastery with an architectural discipline. We do not rely on standard showroom packages; every project is 100% custom, utilizing natural stones, custom European millwork, tailored lighting engineering, and coordinated white-glove project management.'
    },
    {
      question: 'What is the difference between Full-Service Design and Turnkey Interior Design?',
      answer: 'Full-Service Design encompasses the complete architectural and aesthetic planning for new construction or renovation projects, working in tandem with your builder. Turnkey Design includes everything in full-service PLUS complete procurement, delivery, assembly, accessorizing, bed linens, tableware, and art installation, so the home is move-in ready the moment you turn the key.'
    },
    {
      question: 'How do you collaborate with architects and general contractors in Miami?',
      answer: 'We view collaboration as a core strength. We supply complete CAD and Revit interior architectural drawing packages, attend weekly on-site coordination meetings, verify field dimensions, and review contractor shop drawings to ensure design intent is faithfully achieved.'
    },
    {
      question: 'How do you support clients who live out of state or internationally?',
      answer: 'Over 60% of our clients reside outside of Florida during project execution. We use cloud-based project management portals, high-definition digital presentations, video walkthroughs, and detailed milestone reports so you stay informed without needing to be on-site.'
    },
    {
      question: 'When is the best time to hire a designer for a new construction or major renovation in Miami?',
      answer: 'The ideal time is during early schematic design with your architect, prior to permitting. This ensures interior partitions, ceiling coves, recessed lighting, and plumbing placements are optimized from the outset, avoiding costly change orders later.'
    }
  ];

  const residencesDesigned = [
    { title: 'Premium High-Rise Condominiums', desc: 'Corner residences and penthouses in Brickell, Edgewater, and SoFi.' },
    { title: 'Waterfront Residences & Mansions', desc: 'Expansive bayfront and oceanfront estates in Key Biscayne & Star Island.' },
    { title: 'Penthouses & Sky Mansions', desc: 'Multi-level sky residences with private terraces and custom plunge pools.' },
    { title: 'Custom Single-Family Homes', desc: 'Ground-up contemporary and modern estates in Coral Gables and Coconut Grove.' },
    { title: 'Vacation & Second Residences', desc: 'Fully realized turnkey sanctuaries designed for seasonal ease and remote living.' },
    { title: 'Complete Gut Renovations', desc: 'Comprehensive architectural redesigns of prestigious older properties.' }
  ];

  const areasServed = [
    'Miami (Brickell & Downtown)',
    'Miami Beach & South of Fifth',
    'Star, Palm & Venetian Islands',
    'Key Biscayne',
    'Coral Gables',
    'Coconut Grove',
    'Bal Harbour & Bay Harbor Islands',
    'Sunny Isles Beach',
    'Aventura & Williams Island',
    'Golden Beach',
    'Design District & Wynwood'
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Miami Interior Design Studio | Full-Service Residential & Turnkey | Paula Ambrosio Interiors"
        description="Premium interior design in Miami by Paula Ambrosio Interiors. Full-service residential design, renovations, custom homes, turnkey interiors and project coordination."
        canonicalUrl="https://paulaambrosiointeriors.com/interior-design-miami"
        faqs={miamiFaqs}
        serviceData={{ name: "Full-Service Interior Design Miami", description: "Complete interior design direction from concept through execution for luxury homes, renovations, and new construction in Miami.", url: "https://paulaambrosiointeriors.com/interior-design-miami" }}
        breadcrumbItems={[{ name: "Services", url: "https://paulaambrosiointeriors.com/interior-design-miami" }]}
      />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-end justify-center overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Luxury Interior Designer Miami - Paula Ambrosio Interiors ${index + 1}`}
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
              Luxury Interior Designer in Miami
            </h1>

            <p className="font-serif-luxury text-lg sm:text-xl text-[#4A4540] font-light max-w-2xl mx-auto leading-relaxed">
              Full-Service Interior Design & Turnkey Solutions for Distinguished Miami Residences
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenConsultation('Miami Full-Service Design', 'Miami')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-[#171513] hover:text-white transition-all text-center"
              >
                Start Your Miami Project
              </button>
              
              <button
                onClick={() => onOpenConsultation('Private Consultation', 'Miami')}
                className="px-8 py-4 bg-transparent border border-[#1A1816]/30 text-[#1A1816] text-xs uppercase tracking-widest font-medium hover:bg-[#1A1816] hover:text-white hover:border-[#1A1816] transition-all text-center"
              >
                Request a Private Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Founder & On-Site Consultation in Miami */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <div className="relative">
                <img
                  src="/assets/PJnrVScMHWsoOcbfk4NqnXYjMyU.webp"
                  alt="Paula & Amanda Ambrosio - On-Site Interior Design in Miami"
                  className="w-full aspect-[4/5] object-cover object-top border border-[#E2DBD1] shadow-xl"
                />
                <div className="absolute -bottom-5 -right-5 bg-[#171513] text-white p-5 hidden sm:block max-w-xs border border-[#C9A986]/30 shadow-xl">
                  <p className="font-serif-luxury text-sm italic text-[#C9A986]">
                    "Every residence is personally directed from initial architectural plan to white-glove reveal."
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-[#A8A199] mt-2 font-medium">
                    Amanda & Paula Ambrósio
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Hands-On Studio Leadership
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Direct Principal Involvement Across Every Miami Residence
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Unlike oversized agencies where client projects are passed to junior draftsmen, Paula & Amanda Ambrósio remain intimately engaged at every step. From walking active construction sites in Brickell and Key Biscayne to hand-selecting marble slabs at private quarries, your home benefits from over two decades of European-trained architectural rigor.
              </p>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Whether coordinating structural permit sets with Miami general contractors or overseeing the white-glove arrival of custom Italian millwork, our on-the-ground presence ensures flawless execution and zero compromises.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                <div className="p-4 bg-[#FAF9F6] border border-[#E5DFD7]">
                  <Shield className="w-5 h-5 text-[#C9A986] mb-2" />
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">On-Site Oversight</div>
                  <p className="text-[11px] text-[#7A746E] mt-1 font-light">Direct job-site walkthroughs & field checks</p>
                </div>
                <div className="p-4 bg-[#FAF9F6] border border-[#E5DFD7]">
                  <Award className="w-5 h-5 text-[#C9A986] mb-2" />
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">19+ Years Mastery</div>
                  <p className="text-[11px] text-[#7A746E] mt-1 font-light">2,300+ residences crafted globally</p>
                </div>
                <div className="p-4 bg-[#FAF9F6] border border-[#E5DFD7]">
                  <Building className="w-5 h-5 text-[#C9A986] mb-2" />
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Miami Studio</div>
                  <p className="text-[11px] text-[#7A746E] mt-1 font-light">Dedicated South Florida presence</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Miami Photography Gallery: 8 Best Miami Project Photos */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                <Camera className="w-3.5 h-3.5" />
                <span>Miami Visual Portfolio</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Signature Miami Project Photography
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Explore selected architectural moments, custom millwork details, and spatial compositions across South Florida.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              View All Case Studies →
            </button>
          </div>

          {/* 8-Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {miamiGalleryPhotos.map((photo, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative cursor-pointer overflow-hidden bg-white border border-[#E5DFD7] hover:border-[#C9A986] transition-all shadow-xs"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171513]/80 via-[#171513]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="text-white flex items-center justify-between w-full">
                      <span className="text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-[#C9A986]" />
                        Expand View
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 bg-[#171513]/80 text-[#E8D8C8] text-[10px] uppercase tracking-widest px-2 py-0.5 backdrop-blur-xs border border-white/10">
                    {photo.tag}
                  </div>
                </div>

                <div className="p-4 bg-white">
                  <h3 className="font-serif-luxury text-base text-[#1A1816] group-hover:text-[#C9A986] transition-colors line-clamp-1 font-medium">
                    {photo.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#7A746E]">
                    <span>{photo.subtitle}</span>
                    <span className="text-[#C9A986] font-mono text-[10px]">{photo.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Completed Miami Projects to Feature as Linked Cards */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Completed Case Studies
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Featured Miami Completed Projects
              </h2>
              <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
                Comprehensive case studies showcasing client goals, architectural challenges, custom materials, and final reveals.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              Explore Full Portfolio ({projectsData.length} Projects) →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {miamiProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onNavigate={onNavigate}
                aspectRatio="aspect-[16/10]"
              />
            ))}
          </div>

        </div>
      </section>

      {/* Miami Turnkey Transformation: Before & After Slider */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Transformation in Action
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                From Developer Shell to Turnkey Masterpiece
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Witness the spatial shift from raw concrete floors and bare perimeter walls to an acoustically tuned, refined Miami sanctuary.
              </p>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Drag the interactive slider to inspect our precision millwork alignments, integrated ceiling cove lighting, and smooth floor transitions.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onOpenConsultation('Miami Turnkey Transformation', 'Miami')}
                  className="px-6 py-3 bg-[#171513] text-white text-xs uppercase tracking-widest hover:bg-[#C9A986] hover:text-[#171513] transition-colors font-medium"
                >
                  Inquire About Your Property
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <BeforeAfterSlider
                beforeImage="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                afterImage="/assets/cRTC5lm1QD9HiCvnd7TYPrsOuY.avif"
                beforeLabel="Raw Developer Shell"
                afterLabel="Completed Turnkey Great Room"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Miami Core Services Grid */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Comprehensive Capabilities
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Miami Studio Services
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] font-light">
              From schematic architecture to white-glove finishing, we deliver cohesive, refined environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Full-Service Interior Design', desc: 'Complete design direction, architectural drawings, lighting schemes, and finish selections from concept to execution.' },
              { title: 'New Construction Design', desc: 'Collaborating from the ground up with your architect and builder to optimize interior layouts and finishes.' },
              { title: 'Luxury Renovations', desc: 'Reconfiguring existing floor plans into open, light-filled spaces with state-of-the-art materials.' },
              { title: 'Turnkey Interior Design', desc: 'White-glove furnishing, procurement, accessories, linens, and styling for a completely move-in ready home.' },
              { title: 'Custom Millwork & Cabinetry', desc: 'Custom architectural woodwork, kitchen design, dressing salons, wine rooms, and library walls.' },
              { title: 'Furniture & Art Curation', desc: 'Sourcing custom designer furniture, rare vintage pieces, custom rugs, and fine contemporary art.' }
            ].map((svc, i) => (
              <div key={i} className="p-7 bg-[#FAF9F6] border border-[#E8E2D8] hover:border-[#C9A986] transition-all">
                <h3 className="font-serif-luxury text-xl text-[#1A1816] font-medium mb-2">
                  {svc.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#615B54] leading-relaxed font-light">
                  {svc.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Residences We Design */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
              Property Typologies
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Residences We Design in Miami
            </h2>
            <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-light">
              Our studio handles high-value residential properties across all major Miami architectural types.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {residencesDesigned.map((res, i) => (
              <div key={i} className="p-6 bg-white border border-[#E5DFD7]">
                <h3 className="text-base font-semibold text-[#1A1816] mb-1.5">{res.title}</h3>
                <p className="text-xs text-[#68625B] font-light leading-relaxed">{res.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Process Section */}
      <ProcessTimeline
        title="Miami Project Process"
        subtitle="Private Consultation → Concept Development → 3D Visualization → Technical Development → Procurement & Coordination → Installation & Styling."
        steps={miamiProcess}
        onStartProject={() => onOpenConsultation('Miami Project', 'Miami')}
      />

      {/* Areas Served in Greater Miami */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
              Geographic Coverage
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
              Miami Neighborhoods & South Florida Communities Served
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
            {areasServed.map((area, i) => (
              <div
                key={i}
                className="px-4 py-2.5 bg-white border border-[#DDD5CA] text-xs text-[#2A2623] flex items-center gap-2 hover:border-[#C9A986] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C9A986]" />
                <span>{area}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => onNavigate('/locations')}
              className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:underline"
            >
              <span>Explore Dedicated Location Pages (Miami Beach, Star Island, Fisher Island, Coral Gables, Palm Beach)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <FAQAccordion
        title="Miami Interior Design FAQ"
        subtitle="Answers to common questions regarding timelines, contractor coordination, remote client management, and turnkey execution in Miami."
        faqs={miamiFaqs}
      />

      {/* CTA Section */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Start Your Miami Project
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Contact our Miami studio to schedule a private consultation with Founder & Principal Designer Paula Ambrosio.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Miami Project', 'Miami')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Start Your Miami Project
            </button>
            <button
              onClick={() => onOpenConsultation('Private Consultation', 'Miami')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              Request a Private Consultation
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Photo Gallery */}
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
                <h3 className="font-serif-luxury text-xl text-white font-medium">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs text-[#A8A199] mt-0.5 font-light">
                  {selectedPhoto.subtitle} • <span className="text-[#C9A986]">{selectedPhoto.location}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPhoto(null);
                  onOpenConsultation(`Inquiry for ${selectedPhoto.title}`, 'Miami');
                }}
                className="px-5 py-2.5 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all whitespace-nowrap"
              >
                Inquire About This Style
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
