import React from 'react';
import { ArrowRight, Check, Compass, Layers, MapPin, Sparkles, Building, Home, Shield, Award } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { FAQAccordion } from '../components/FAQAccordion';
import { ProjectCard } from '../components/ProjectCard';
import { projectsData } from '../data/projectsData';

interface MiamiPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const MiamiPage: React.FC<MiamiPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const miamiProjects = projectsData.filter(p => p.city === 'Miami' || p.city === 'Miami Beach').slice(0, 2);

  const miamiProcess = [
    { step: '01', title: 'Private Consultation', description: 'Comprehensive discovery of your vision, lifestyle requirements, and spatial objectives.' },
    { step: '02', title: 'Concept Development', description: 'Establishing the design direction, mood, color palettes, and preliminary space allocations.' },
    { step: '03', title: '3D Visualization', description: 'Photorealistic renderings allowing you to experience materials, lighting, and custom millwork before construction.' },
    { step: '04', title: 'Technical Development', description: 'Comprehensive construction documents, electrical plans, tile layouts, and specifications.' },
    { step: '05', title: 'Procurement & Coordination', description: 'Managing global orders, custom fabrications, vendor logistics, and on-site contractor collaboration.' },
    { step: '06', title: 'Installation & Styling', description: 'White-glove placement, fine art hanging, decorative styling, and the final reveal.' }
  ];

  const miamiFaqs = [
    {
      question: 'What distinguishes Paula Ambrosio Interiors from other Miami interior design firms?',
      answer: 'Our studio combines more than two decades of verified interior design mastery with an architectural discipline. We do not rely on standard showroom packages; every project is 100% custom, utilizing natural stones, custom European millwork, tailored lighting engineering, and seamless white-glove project management.'
    },
    {
      question: 'What is the difference between Full-Service Design and Turnkey Interior Design?',
      answer: 'Full-Service Design encompasses the complete architectural and aesthetic planning for new construction or renovation projects, working in tandem with your builder. Turnkey Design includes everything in full-service PLUS complete procurement, delivery, assembly, accessorizing, bed linens, tableware, and art installation—so the home is move-in ready the moment you turn the key.'
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
    { title: 'Luxury High-Rise Condominiums', desc: 'Corner residences and penthouses in Brickell, Edgewater, and SoFi.' },
    { title: 'Waterfront Residences & Mansions', desc: 'Expansive bayfront and oceanfront estates in Key Biscayne & Star Island.' },
    { title: 'Penthouses & Sky Mansions', desc: 'Multi-level sky residences with private terraces and custom plunge pools.' },
    { title: 'Custom Single-Family Homes', desc: 'Ground-up contemporary and modern estates in Coral Gables and Coconut Grove.' },
    { title: 'Vacation & Second Residences', desc: 'Fully realized turnkey sanctuaries designed for seasonal ease and remote living.' },
    { title: 'Complete Gut Renovations', desc: 'Transformative architectural redesigns of prestigious older properties.' }
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
        title="Luxury Interior Designer Miami | Paula Ambrosio Interiors"
        description="Luxury interior design in Miami by Paula Ambrosio Interiors. Full-service residential design, renovations, custom homes, turnkey interiors and project coordination."
        faqs={miamiFaqs}
      />

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=85"
            alt="Luxury Interior Designer Miami - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Flagship Miami Studio</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              Luxury Interior Designer in Miami
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              Full-Service Interior Design & Turnkey Solutions for Exceptional Miami Residences
            </p>

            <p className="text-sm sm:text-base text-[#B8B1A8] font-light leading-relaxed max-w-xl">
              Paula Ambrosio Interiors is a Miami-based luxury interior design studio specializing in high-end residential interiors, renovations, new construction and complete turnkey transformations.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => onOpenConsultation('Miami Full-Service Design', 'Miami')}
                className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all text-center shadow-lg"
              >
                Start Your Miami Project
              </button>
              
              <button
                onClick={() => onOpenConsultation('Private Consultation', 'Miami')}
                className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 hover:border-white transition-all text-center"
              >
                Request a Private Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Intro & Philosophy */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                Tailored Approach
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal leading-tight">
                Luxury Interior Design Tailored to Your Life
              </h2>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Miami architecture offers extraordinary possibilities: waterfront homes filled with natural light, sophisticated high-rise residences, contemporary estates and international second homes. Our approach begins by understanding how our clients live.
              </p>
              <p className="text-sm sm:text-base text-[#5C564F] leading-relaxed font-light">
                Whether creating custom kitchen elevations with honed Calacatta marble, designing acoustic millwork for high-rise living rooms, or sourcing bespoke furniture in Italy, our studio coordinates every phase with rigorous care.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Bespoke Craft</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Italian artisan millwork & rare stones</p>
                </div>
                <div className="p-4 bg-white border border-[#E5DFD7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#1A1816]">Turnkey Mastery</div>
                  <p className="text-xs text-[#7A746E] mt-1 font-light">Move-in ready convenience</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85"
                  alt="Miami Waterfront Residence by Paula Ambrosio Interiors"
                  className="w-full aspect-[4/3] object-cover border border-[#E2DBD1] shadow-lg"
                />
              </div>
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
              From schematic architecture to white-glove finishing, we deliver cohesive luxury environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Full-Service Interior Design', desc: 'Complete design direction, architectural drawings, lighting schemes, and finish selections from concept to execution.' },
              { title: 'New Construction Design', desc: 'Collaborating from the ground up with your architect and builder to optimize interior layouts and finishes.' },
              { title: 'Luxury Renovations', desc: 'Reconfiguring existing floor plans into open, light-filled spaces with state-of-the-art materials.' },
              { title: 'Turnkey Interior Design', desc: 'White-glove furnishing, procurement, accessories, linens, and styling for a completely move-in ready home.' },
              { title: 'Custom Millwork & Cabinetry', desc: 'Bespoke architectural woodwork, kitchen design, dressing salons, wine rooms, and library walls.' },
              { title: 'Furniture & Art Curation', desc: 'Sourcing bespoke designer furniture, rare vintage pieces, custom rugs, and fine contemporary art.' }
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

      {/* Featured Miami Projects */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Completed Work
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Featured Miami Project Case Studies
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-widest font-semibold text-[#C9A986] hover:text-[#1A1816] transition-colors"
            >
              View Full Portfolio →
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

      {/* Residences We Design */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
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
              <div key={i} className="p-6 bg-[#FAF9F6] border border-[#E5DFD7]">
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
              <span>Explore Dedicated Location Pages (Miami Beach, Sunny Isles, Aventura, Bal Harbour, Boca Raton, Palm Beach)</span>
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
    </div>
  );
};
