import React, { useState } from 'react';
import { ArrowUpRight, Compass, FileText, Globe, Layers, MapPin, Search, Sparkles, FolderTree } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { locationsData } from '../data/locationsData';
import { projectsData } from '../data/projectsData';
import { journalData } from '../data/journalData';

interface SitemapPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const siteStructure = [
    {
      category: 'Primary Architecture',
      description: 'Core brand entry points, founder narrative, and client inquiry channels.',
      icon: Globe,
      pages: [
        {
          title: 'Home / Global Overview',
          url: '/',
          description: 'Official flagship homepage featuring signature capabilities, featured residences, turnkey transformation slider, and studio philosophy.',
          badge: 'Core'
        },
        {
          title: 'About Paula & Amanda Ambrósio',
          url: '/about',
          description: 'Studio heritage, 19+ years track record, 2,300+ completed projects globally, design tenets, and European atelier sourcing network.',
          badge: 'Entity'
        },
        {
          title: 'Portfolio & Flagship Case Studies',
          url: '/portfolio',
          description: 'Curated gallery of bespoke private homes, oceanfront sky penthouses, and hospitality lounges across South Florida.',
          badge: 'Work'
        },
        {
          title: 'Design Journal & Insights',
          url: '/journal',
          description: 'Editorial essays on turnkey convenience for international buyers, organic travertine materials, and luxury high-rise engineering.',
          badge: 'Editorial'
        },
        {
          title: 'Contact & Start Your Project',
          url: '/contact',
          description: 'Studio address, direct concierge line, confidentiality guarantee, and comprehensive project consultation questionnaire.',
          badge: 'Inquire'
        },
        {
          title: 'Start Your Project (Direct Portal)',
          url: '/start-your-project',
          description: 'Direct consultation booking and space planning project onboarding.',
          badge: 'Booking'
        },
        {
          title: 'HTML Sitemap & Directory',
          url: '/sitemap',
          description: 'Complete organized hierarchical index of all pages, disciplines, locations, case studies, and resources.',
          badge: 'Index'
        }
      ]
    },
    {
      category: 'Design Disciplines & Flagship Services',
      description: 'Specialized architectural, turnkey, and luxury residential services.',
      icon: Layers,
      pages: [
        {
          title: 'Miami Interior Design (Flagship Hub)',
          url: '/interior-design-miami',
          description: 'Full-service luxury interior design hub for Greater Miami, including 6-stage process, typologies, and regional FAQs.',
          badge: 'Flagship'
        },
        {
          title: 'Turnkey Interior Design (Miami)',
          url: '/turnkey-interior-design-miami',
          description: 'Complete concept-to-move-in-ready design for second-home buyers and executives, from 3D visualization to linens and tableware.',
          badge: 'Turnkey'
        },
        {
          title: 'Luxury Residential Interior Design',
          url: '/luxury-residential-interior-design-miami',
          description: 'Bespoke design for waterfront estates, penthouses, architectural renovations, custom millwork, and high-end kitchens.',
          badge: 'Residential'
        },
        {
          title: 'Hospitality Interior Design',
          url: '/hospitality-interior-design-miami',
          description: 'Boutique hotels, sky suites, cocktail lounges, and private wellness destinations engineered for guest experience and contract durability.',
          badge: 'Commercial'
        }
      ]
    },
    {
      category: 'South Florida Regional Enclaves & Hubs',
      description: 'Dedicated location hubs exploring local coastal architecture and zoning expertise.',
      icon: MapPin,
      pages: [
        {
          title: 'South Florida Locations Overview (Hub)',
          url: '/locations',
          description: 'Regional overview of all South Florida coastal enclaves, private islands, and luxury developments served.',
          badge: 'Territory'
        },
        ...locationsData.map((loc) => ({
          title: `Interior Designer ${loc.city}`,
          url: loc.url,
          description: `${loc.heroSubheadline} ${loc.hubOneLiner}`,
          badge: loc.city
        }))
      ]
    },
    {
      category: 'Flagship Portfolio Case Studies',
      description: 'In-depth architectural case studies with client vision, challenges, materials, and gallery.',
      icon: Compass,
      pages: projectsData.map((p) => ({
        title: `${p.title} (${p.category})`,
        url: `/portfolio/${p.slug}`,
        description: `${p.subTitle} Located in ${p.location}. Scope: ${p.services.slice(0, 3).join(', ')}.`,
        badge: p.city
      }))
    },
    {
      category: 'Design Journal & Editorial Articles',
      description: 'Expert publications on materials, high-rise logistics, and second-home ownership.',
      icon: FileText,
      pages: journalData.map((art) => ({
        title: art.title,
        url: `/journal/${art.slug}`,
        description: `${art.subtitle} (${art.readTime}) - Published by ${art.author}.`,
        badge: art.category
      }))
    }
  ];

  // Filter sections by search query
  const filteredSections = siteStructure.map((sec) => {
    const matchedPages = sec.pages.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.badge.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...sec, pages: matchedPages };
  }).filter((sec) => sec.pages.length > 0);

  const totalPagesCount = siteStructure.reduce((acc, curr) => acc + curr.pages.length, 0);

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Sitemap & Complete Directory | Paula Ambrosio Interiors"
        description="Explore the complete page directory of Paula Ambrosio Interiors, including luxury residential services, Miami locations, portfolio case studies, and design journal."
      />

      {/* Hero Section */}
      <section className="relative min-h-[45vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/cRTC5lm1QD9HiCvnd7TYPrsOuY.avif"
            alt="Paula Ambrosio Interiors Sitemap"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/95 via-[#171513]/80 to-[#171513]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <FolderTree className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Full Site Directory</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              Sitemap & Navigation Index
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              An exhaustive architectural directory of all pages, design disciplines, regional enclaves, and project case studies.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Quick Stats Bar */}
      <section className="sticky top-[73px] z-30 bg-[#FAF9F6] border-b border-[#EAE4DB] py-4 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 text-[#8C847B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages, services, locations, or case studies..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986] rounded-none shadow-2xs"
            />
          </div>

          <div className="flex items-center space-x-4 text-xs text-[#7A746E]">
            <span>Total Index: <strong className="text-[#1A1816] font-semibold">{totalPagesCount} Pages</strong></span>
            <span>•</span>
            <button
              onClick={() => onOpenConsultation()}
              className="text-[#C9A986] font-semibold hover:underline uppercase tracking-wider text-[11px]"
            >
              Start Your Project →
            </button>
          </div>

        </div>
      </section>

      {/* Main Sitemap Tree Grid */}
      <section className="py-20 bg-white border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {filteredSections.length === 0 ? (
            <div className="text-center py-20 bg-[#FAF9F6] border border-[#E5DFD7] p-8">
              <p className="font-serif-luxury text-2xl text-[#1A1816]">No pages match "{searchQuery}"</p>
              <p className="text-xs text-[#7A746E] mt-2">Try clearing your search query to see the entire site index.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-6 py-2.5 bg-[#1A1816] text-white text-xs uppercase tracking-widest"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredSections.map((sec, secIdx) => {
              const IconComp = sec.icon;
              return (
                <div key={secIdx} className="space-y-6">
                  
                  {/* Category Header */}
                  <div className="flex items-start gap-4 pb-4 border-b border-[#EAE4DB]">
                    <div className="w-10 h-10 bg-[#F0EAE1] text-[#C9A986] flex items-center justify-center shrink-0 mt-1">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#1A1816] font-normal">
                        {sec.category}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#7A746E] font-light mt-0.5">
                        {sec.description}
                      </p>
                    </div>
                  </div>

                  {/* Links List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sec.pages.map((pg, pgIdx) => (
                      <a
                        key={pgIdx}
                        href={pg.url}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(pg.url);
                        }}
                        className="group p-5 bg-[#FAF9F6] border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex flex-col justify-between hover:shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-white border border-[#E0D9CE] text-[#8C847B] font-semibold">
                              {pg.badge}
                            </span>
                            <ArrowUpRight className="w-4 h-4 text-[#A8A199] group-hover:text-[#C9A986] transition-colors" />
                          </div>

                          <h3 className="font-serif-luxury text-xl text-[#1A1816] group-hover:text-[#C9A986] transition-colors font-medium mb-1.5">
                            {pg.title}
                          </h3>

                          <p className="text-xs text-[#68625B] leading-relaxed font-light line-clamp-2">
                            {pg.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#EAE4DB] flex items-center justify-between text-[11px] text-[#A8A199]">
                          <span className="font-mono text-[10px] text-[#8C847B]">{pg.url}</span>
                          <span className="text-[#C9A986] font-medium group-hover:underline">Navigate →</span>
                        </div>
                      </a>
                    ))}
                  </div>

                </div>
              );
            })
          )}

        </div>
      </section>

      {/* Consultation Banner */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Schedule a Studio Discovery Session
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            We invite you to connect directly with Amanda and Paula Ambrósio at our Miami studio or via private digital video consultation.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenConsultation('Sitemap Discovery Meeting')}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Start Your Project
            </button>
            <button
              onClick={() => onNavigate('/portfolio')}
              className="px-8 py-4 bg-transparent border border-white/40 text-white text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all"
            >
              Explore Portfolio
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
