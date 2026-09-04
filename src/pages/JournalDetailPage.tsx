import React from 'react';
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, Clock, Share2, Sparkles, User } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { journalData } from '../data/journalData';

interface JournalDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const JournalDetailPage: React.FC<JournalDetailPageProps> = ({ slug, onNavigate, onOpenConsultation }) => {
  const article = journalData.find(a => a.slug === slug) || journalData[0];
  const nextArticles = journalData.filter(a => a.slug !== article.slug);

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title={`${article.title} | Paula Ambrosio Interiors Journal`}
        description={article.excerpt}
        ogImage={article.coverImage}
      />

      {/* Breadcrumbs */}
      <div className="bg-[#FAF9F6] border-b border-[#EAE4DB] py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-[#7A746E]">
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
              href="/journal"
              onClick={(e) => { e.preventDefault(); onNavigate('/journal'); }}
              className="hover:text-[#1A1816]"
            >
              Journal
            </a>
            <ChevronRight className="w-3 h-3 text-[#B8B1A8]" />
            <span className="text-[#1A1816] font-medium truncate max-w-xs">{article.category}</span>
          </div>

          <button
            onClick={() => onNavigate('/journal')}
            className="inline-flex items-center gap-1 text-[#1A1816] hover:text-[#C9A986] font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Essays</span>
          </button>
        </div>
      </div>

      {/* Article Header */}
      <article className="py-16 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white border border-[#DDD5CA] text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold">
              {article.category}
            </span>
            <span className="text-xs text-[#8C847B] font-light flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {article.date}
            </span>
            <span className="text-xs text-[#8C847B] font-light flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>

          <h1 className="font-serif-luxury text-3xl sm:text-5xl text-[#1A1816] font-normal leading-tight">
            {article.title}
          </h1>

          <p className="font-serif-luxury text-xl sm:text-2xl text-[#615B54] italic font-light">
            {article.subtitle}
          </p>

          <div className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A1816] text-[#FAF9F6] flex items-center justify-center font-serif-luxury text-sm">
              PA
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1A1816]">By {article.author}</p>
              <p className="text-[11px] text-[#8C847B] font-light">Founder & Principal Designer, Paula Ambrosio Interiors</p>
            </div>
          </div>
        </div>
      </article>

      {/* Hero Image */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full aspect-[16/9] object-cover border border-[#E5DFD7] shadow-xl"
        />
      </div>

      {/* Article Body */}
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-[#4A453F] text-base leading-relaxed font-light">
          
          <div className="text-lg text-[#1A1816] font-serif-luxury italic border-l-2 border-[#C9A986] pl-6 py-2 my-8">
            "{article.excerpt}"
          </div>

          {article.content.map((paragraph, idx) => (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          ))}

          {/* Strategic Contextual Internal Links */}
          <div className="p-8 bg-[#FAF9F6] border border-[#E5DFD7] my-12 space-y-4">
            <h3 className="font-serif-luxury text-xl text-[#1A1816]">
              Explore Related Services & Locations
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('/turnkey-interior-design-miami')}
                className="px-4 py-2 bg-white border border-[#DDD5CA] text-xs text-[#1A1816] hover:border-[#C9A986]"
              >
                Turnkey Interior Design Miami →
              </button>
              <button
                onClick={() => onNavigate('/interior-design-miami')}
                className="px-4 py-2 bg-white border border-[#DDD5CA] text-xs text-[#1A1816] hover:border-[#C9A986]"
              >
                Miami Full-Service Design →
              </button>
              <button
                onClick={() => onNavigate('/interior-designer-sunny-isles')}
                className="px-4 py-2 bg-white border border-[#DDD5CA] text-xs text-[#1A1816] hover:border-[#C9A986]"
              >
                Sunny Isles Beach Residences →
              </button>
            </div>
          </div>

          {/* Author Bio Card */}
          <div className="p-8 bg-white border border-[#E5DFD7] flex flex-col sm:flex-row items-center gap-6 mt-12">
            <img
              src="/assets/PJnrVScMHWsoOcbfk4NqnXYjMyU.webp"
              alt="Paula Ambrosio - Principal Interior Designer"
              className="w-20 h-20 rounded-full object-cover object-top shrink-0 border border-[#E5DFD7]"
            />
            <div className="text-center sm:text-left space-y-1">
              <h4 className="font-serif-luxury text-lg text-[#1A1816]">About Paula Ambrosio</h4>
              <p className="text-xs text-[#68625B] font-light leading-relaxed">
                Co-Founder and Principal Interior Designer of Paula Ambrosio Interior Design. With nearly two decades of interior design mastery crafting bespoke residences and turnkey interiors across Miami, South Florida, and internationally.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Further Reading */}
      <section className="py-20 bg-[#FAF9F6] border-t border-[#EAE4DB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-luxury text-2xl text-[#1A1816]">Further Essays & Insights</h3>
            <button
              onClick={() => onNavigate('/journal')}
              className="text-xs uppercase tracking-wider text-[#C9A986] hover:underline"
            >
              All Essays →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {nextArticles.map((nextArt) => (
              <div
                key={nextArt.id}
                onClick={() => onNavigate(`/journal/${nextArt.slug}`)}
                className="bg-white border border-[#E5DFD7] p-6 hover:border-[#C9A986] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A986] font-semibold">{nextArt.category}</span>
                  <h4 className="font-serif-luxury text-xl text-[#1A1816] group-hover:text-[#C9A986] transition-colors mt-1 mb-2">
                    {nextArt.title}
                  </h4>
                  <p className="text-xs text-[#7A746E] line-clamp-2">{nextArt.excerpt}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#1A1816] font-medium">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A986]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Banner */}
      <section className="py-20 bg-[#171513] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-normal text-white">
            Transform Your Residence
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A8] max-w-xl mx-auto font-light">
            Contact Paula Ambrosio Interiors to schedule your private consultation.
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
