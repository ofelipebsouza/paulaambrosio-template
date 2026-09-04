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
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const nextProjects = projectsData.filter(p => p.slug !== project.slug).slice(0, 2);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeImageIndex !== null) {
      setActiveImageIndex(activeImageIndex === 0 ? project.galleryImages.length - 1 : activeImageIndex - 1);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeImageIndex !== null) {
      setActiveImageIndex(activeImageIndex === project.galleryImages.length - 1 ? 0 : activeImageIndex + 1);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title={project.seoTitle}
        description={project.metaDescription}
        ogImage={project.coverImage}
      />

      {/* Lightbox Modal with Index Navigation */}
      {activeImageIndex !== null && project.galleryImages[activeImageIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 select-none"
          onClick={() => setActiveImageIndex(null)}
        >
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-6 right-6 z-20 p-2 text-white/70 hover:text-white bg-black/40 border border-white/20 transition-colors"
            aria-label="Close image viewer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          <button
            onClick={handlePrevImage}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/20 transition-all"
            aria-label="Previous image"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNextImage}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/20 transition-all"
            aria-label="Next image"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={project.galleryImages[activeImageIndex].url}
              alt={project.galleryImages[activeImageIndex].alt}
              className="max-w-full max-h-[72vh] object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-4 text-center max-w-2xl px-4">
              <div className="text-[11px] uppercase tracking-widest text-[#C9A986] font-semibold mb-1">
                Image {activeImageIndex + 1} of {project.galleryImages.length}
              </div>
              <p className="text-sm text-white font-serif-luxury font-light">
                {project.galleryImages[activeImageIndex].caption || project.galleryImages[activeImageIndex].alt}
              </p>
              <p className="text-xs text-[#A8A199] mt-1 font-light">
                {project.galleryImages[activeImageIndex].alt}
              </p>
            </div>
          </div>
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
              alt={`${project.title} - Main Architectural Overview`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Project Facts Matrix (Location | Category | Property Type | Services | Completion Year) */}
      <section className="bg-[#FAF9F6] border-b border-[#EAE4DB] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#8C847B] block font-semibold">Location</span>
              <p className="text-sm font-medium text-[#1A1816] mt-0.5">{project.location}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#8C847B] block font-semibold">Category</span>
              <p className="text-sm font-medium text-[#1A1816] mt-0.5">{project.category}</p>
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
            <div className="md:col-span-8 space-y-4">
              {project.materialsNarrative && (
                <p className="text-sm sm:text-base text-[#524D47] leading-relaxed font-light">
                  {project.materialsNarrative}
                </p>
              )}
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

      {/* High-Resolution Project Gallery (12-25 images) */}
      <section className="py-24 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#C9A986] font-semibold mb-1">
                Visual Documentation
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                Curated Photographic Gallery
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#FAF9F6] border border-[#EAE4DB] text-xs text-[#7A746E] font-medium">
                {project.galleryImages.length} Architectural & Detail Views
              </span>
              <span className="text-xs text-[#9E978F] hidden md:inline font-light">
                Click any image to expand
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.galleryImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className="group relative cursor-pointer aspect-[4/3] bg-[#E8E2D8] overflow-hidden border border-[#E5DFD7] hover:border-[#C9A986] transition-all shadow-xs"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold mb-0.5">
                    View {idx + 1}
                  </span>
                  <span className="text-xs text-white font-medium line-clamp-1">
                    {img.caption || img.alt}
                  </span>
                  <span className="text-[11px] text-white/80 font-light line-clamp-1 mt-0.5">
                    {img.alt}
                  </span>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/60 text-white backdrop-blur-xs">
                  <Eye className="w-3.5 h-3.5 text-[#C9A986]" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTAs as mandated by Template 13 */}
      <section className="py-20 bg-[#171513] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
            <span>Private Architectural Commissions</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Discuss a Similar Project
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Whether you are considering a property in {project.location} or elsewhere in South Florida, we welcome a private discussion about your architectural and interior aspirations.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation(`Discuss a Similar Project inspired by ${project.title}`, project.city)}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              DISCUSS A SIMILAR PROJECT
            </button>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              VIEW MORE PROJECTS
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
              View All Projects →
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
