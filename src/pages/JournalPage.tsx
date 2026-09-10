import React from 'react';
import { ArrowRight, BookOpen, Calendar, Clock, Sparkles, User } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { journalData } from '../data/journalData';

interface JournalPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({ onNavigate, onOpenConsultation }) => {
  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Journal & Design Insights | Paula Ambrosio Interiors"
        description="Explore luxury interior design insights, turnkey living guides, architectural commentary, and material explorations by Paula Ambrosio Interiors."
        canonicalUrl="https://paulaambrosiointeriors.com/journal"
      />

      {/* Hero Section */}
      <section className="relative min-h-[45vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=85"
            alt="The Journal - Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Studio Perspectives</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              The Journal
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light max-w-2xl">
              Architectural reflections, turnkey guides, and materiality studies from our Miami studio.
            </p>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-24 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {journalData.map((article) => (
              <article
                key={article.id}
                onClick={() => onNavigate(`/journal/${article.slug}`)}
                className="bg-white border border-[#E5DFD7] hover:border-[#C9A986] transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md cursor-pointer group"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#E8E2D8]">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#1A1816]/80 text-white text-[10px] uppercase tracking-wider backdrop-blur-xs">
                    {article.category}
                  </div>
                </div>

                <div className="p-6 flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex items-center gap-3 text-[11px] text-[#8C847B] mb-2 font-light">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#C9A986]" />
                        {article.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C9A986]" />
                        {article.readTime}
                      </span>
                    </div>

                    <h2 className="font-serif-luxury text-xl sm:text-2xl text-[#1A1816] font-medium mb-2 group-hover:text-[#C9A986] transition-colors leading-snug">
                      {article.title}
                    </h2>

                    <p className="text-xs text-[#615B54] leading-relaxed font-light line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-[#F0EAE1] flex items-center justify-between">
                    <span className="text-[11px] text-[#8C847B] font-light">By {article.author}</span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#1A1816] group-hover:text-[#C9A986] transition-colors flex items-center gap-1">
                      <span>Read Essay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Banner */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Discuss Your Vision
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Whether building new or re-imagining an existing coastal residence, our studio is at your service.
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
