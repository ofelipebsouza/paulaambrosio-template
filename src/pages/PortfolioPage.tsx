import React, { useState } from 'react';
import { ArrowUpRight, Filter, MapPin, Sparkles } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProjectCard } from '../components/ProjectCard';
import { projectsData } from '../data/projectsData';

interface PortfolioPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ onNavigate, onOpenConsultation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');

  const categories = ['All', 'Residential', 'Turnkey', 'Hospitality'];
  const cities = ['All', 'Miami', 'Miami Beach', 'Sunny Isles Beach', 'Bal Harbour', 'Boca Raton', 'Palm Beach', 'Aventura'];

  const filteredProjects = projectsData.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesCity = selectedCity === 'All' || p.city.toLowerCase() === selectedCity.toLowerCase() || p.location.toLowerCase().includes(selectedCity.toLowerCase());
    return matchesCategory && matchesCity;
  });

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Portfolio & Case Studies | Luxury Interior Design | Paula Ambrosio Interiors"
        description="Explore luxury residential, turnkey and hospitality case studies by Paula Ambrosio Interiors across Miami, Miami Beach, Sunny Isles, Palm Beach and South Florida."
      />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=85"
            alt="Portfolio of Luxury Residences - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Flagship Case Studies</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              Selected Works & Portfolio
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              A curated collection of bespoke residences, turnkey sky mansions, and boutique hospitality spaces.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[73px] z-30 bg-[#FAF9F6] border-b border-[#EAE4DB] py-4 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] uppercase tracking-widest text-[#7A746E] font-medium mr-2 hidden sm:inline">
              Discipline:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#1A1816] text-[#FAF9F6] font-semibold'
                    : 'bg-white border border-[#E5DFD7] text-[#5C564F] hover:border-[#C9A986]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Location Dropdown Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] uppercase tracking-widest text-[#7A746E] font-medium hidden sm:inline">
              Location:
            </span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3.5 py-2 bg-white border border-[#E5DFD7] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === 'All' ? 'All South Florida Locations' : city}
                </option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-[#FAF9F6] border border-[#E5DFD7] p-8">
              <p className="font-serif-luxury text-2xl text-[#1A1816]">No projects matched your criteria</p>
              <p className="text-xs text-[#7A746E] mt-2">Try selecting a different discipline or location filter.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedCity('All'); }}
                className="mt-4 px-6 py-2.5 bg-[#1A1816] text-white text-xs uppercase tracking-widest"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onNavigate={onNavigate}
                  aspectRatio="aspect-[4/3]"
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Consultation Banner */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Have a Specific Property in Mind?
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            We invite you to share your floor plans and vision for a confidential assessment with our design studio.
          </p>
          <div className="pt-4">
            <button
              onClick={() => onOpenConsultation()}
              className="px-8 py-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Start Your Project
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
