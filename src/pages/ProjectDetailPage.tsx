import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Eye, MapPin, Share2, Sparkles, X } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { projectsData } from '../data/projectsData';

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ slug, onNavigate, onOpenConsultation }) => {
  const project = projectsData.find(p => p.slug === slug) || projectsData[0];
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const nextProjects = projectsData.filter(p => p.slug !== project.slug).slice(0, 2);

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title={project.seoTitle}
        description={project.metaDescription}
        ogImage={project.coverImage}
      />

      {/* Lightbox Modal */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-6 right-6 p-2 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeImage}
            alt="Full size view"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="bg-[#FAF9F6] border-b border-[#EAE4DB] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-[#7A746E]">
          <div className="flex items-center space-x-2">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
              className="hover:text-[#1A1816]"
            >
              Home
            </a>
            <ChevronRight className="w-3 h-3 text-[#B8B1A8]" />
            <a
              href="/portfolio"
              onClick={(e) => { e.preventDefault(); onNavigate('/portfolio'); }}
              className="hover:text-[#1A1816]"
            >
              Portfolio
            </a>
            <ChevronRight className="w-3 h-3 text-[#B8B1A8]" />
            <span className="text-[#1A1816] font-medium">{project.title}</span>
          </div>

          <button
            onClick={() => onNavigate('/portfolio')}
            className="inline-flex items-center gap-1 text-[#1A1816] hover:text-[#C9A986] font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Projects</span>
          </button>
        </div>
      </div>

      {/* Project Hero / Header */}
      <section className="relative bg-[#171513] text-white pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-[10px] uppercase tracking-widest font-semibold">
                {project.category} Case Study
              </span>
              <span className="text-xs text-[#A8A199] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#C9A986]" />
                {project.location}
              </span>
            </div>

            {/* VISIBLE PROJECT TITLE */}
            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal text-white">
              {project.title}
            </h1>

            {/* SEO SUBTITLE */}
            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light">
              {project.subTitle}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="relative aspect-[21/10] overflow-hidden border border-[#2D2A26] shadow-2xl">
            <img
              src={project.heroImage || project.coverImage}
              alt={`${project.title} - Main View`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Project Facts Matrix */}
      <section className="bg-[#FAF9F6] border-b border-[#EAE4DB] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#8C847B] block font-semibold">Location</span>
              <p className="text-sm font-medium text-[#1A1816] mt-0.5">{project.location}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#8C847B] block font-semibold">Property Type</span>
              <p className="text-sm font-medium text-[#1A1816] mt-0.5">{project.propertyType}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#8C847B] block font-semibold">Scope & Services</span>
              <p className="text-sm font-medium text-[#1A1816] mt-0.5">{project.services.join(', ')}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#8C847B] block font-semibold">Completion</span>
              <p className="text-sm font-medium text-[#1A1816] mt-0.5">{project.completionYear}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Case Study Content */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* THE CLIENT & VISION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                01 / The Client & Vision
              </h2>
              <p className="font-serif-luxury text-2xl text-[#1A1816] mt-1">
                Lifestyle & Core Aspirations
              </p>
            </div>
            <div className="md:col-span-8 text-sm sm:text-base text-[#524D47] leading-relaxed font-light">
              <p>{project.clientVision}</p>
            </div>
          </div>

          <div className="h-[1px] bg-[#EAE4DB]" />

          {/* THE DESIGN CHALLENGE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                02 / The Design Challenge
              </h2>
              <p className="font-serif-luxury text-2xl text-[#1A1816] mt-1">
                Spatial & Technical Complexities
              </p>
            </div>
            <div className="md:col-span-8 text-sm sm:text-base text-[#524D47] leading-relaxed font-light">
              <p>{project.designChallenge}</p>
            </div>
          </div>

          <div className="h-[1px] bg-[#EAE4DB]" />

          {/* OUR APPROACH */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                03 / Our Approach
              </h2>
              <p className="font-serif-luxury text-2xl text-[#1A1816] mt-1">
                Layout, Light & Architectural Logic
              </p>
            </div>
            <div className="md:col-span-8 text-sm sm:text-base text-[#524D47] leading-relaxed font-light space-y-4">
              <p>{project.approach}</p>
            </div>
          </div>

          <div className="h-[1px] bg-[#EAE4DB]" />

          {/* MATERIALS & DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                04 / Materials & Details
              </h2>
              <p className="font-serif-luxury text-2xl text-[#1A1816] mt-1">
                Artisan Finishes & Sourcing
              </p>
            </div>
            <div className="md:col-span-8">
              <ul className="space-y-3 text-xs sm:text-sm text-[#524D47] font-light">
                {project.materialsDetails.map((mat, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A986] mt-2 shrink-0" />
                    <span>{mat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="h-[1px] bg-[#EAE4DB]" />

          {/* THE RESULT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold">
                05 / The Result
              </h2>
              <p className="font-serif-luxury text-2xl text-[#1A1816] mt-1">
                Transformative Spatial Impact
              </p>
            </div>
            <div className="md:col-span-8 text-sm sm:text-base text-[#524D47] leading-relaxed font-light">
              <p>{project.result}</p>
            </div>
          </div>

        </div>
      </section>

      {/* Before / After Interactive Demonstration if available */}
      {project.beforeAfter && (
        <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="font-serif-luxury text-3xl text-[#1A1816]">
                Spatial Transformation
              </h2>
              <p className="text-xs sm:text-sm text-[#7A746E] font-light">
                Interactive comparison demonstrating the progression from raw shell to final completed reveal.
              </p>
            </div>

            <BeforeAfterSlider
              beforeImage={project.beforeAfter.beforeImage}
              afterImage={project.beforeAfter.afterImage}
              beforeLabel={project.beforeAfter.beforeLabel}
              afterLabel={project.beforeAfter.afterLabel}
              aspectRatio="aspect-[16/10]"
            />
          </div>
        </section>
      )}

      {/* High-Resolution Project Gallery */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Visual Documentation
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Curated Gallery
              </h2>
            </div>
            <span className="text-xs text-[#7A746E] font-light">
              Click any photo to view in full resolution
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.galleryImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(img.url)}
                className="group relative cursor-pointer aspect-[4/3] bg-[#E8E2D8] overflow-hidden border border-[#E5DFD7]"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-[11px] text-white backdrop-blur-xs bg-black/60 px-2.5 py-1">
                    {img.caption || img.alt}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTAs as mandated by Template 13 */}
      <section className="py-20 bg-[#171513] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Discuss a Similar Project
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Whether you are considering a property in {project.location} or elsewhere in South Florida, we welcome a private discussion about your vision.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation(`Inquiry inspired by ${project.title}`, project.city)}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Discuss a Similar Project
            </button>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              View More Projects
            </button>
          </div>
        </div>
      </section>

      {/* Next Projects Carousel */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif-luxury text-2xl text-[#1A1816]">Explore Further Projects</h3>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="text-xs uppercase tracking-wider text-[#C9A986] hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {nextProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate(`/portfolio/${p.slug}`)}
                className="group cursor-pointer bg-white border border-[#E5DFD7] p-4 hover:border-[#C9A986] transition-all flex gap-4 items-center"
              >
                <img
                  src={p.coverImage}
                  alt={p.title}
                  className="w-28 h-20 object-cover shrink-0"
                />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold">{p.category}</span>
                  <h4 className="font-serif-luxury text-lg text-[#1A1816] group-hover:text-[#C9A986] transition-colors">{p.title}</h4>
                  <p className="text-xs text-[#7A746E] line-clamp-1">{p.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
