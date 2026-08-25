import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  title?: string;
  subtitle?: string;
  faqs: FAQItem[];
  locationOrService?: string;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  title = 'Frequently Asked Questions',
  subtitle = 'Clear guidance regarding our design scope, timelines, contractor collaboration, and turnkey execution.',
  faqs
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[#C9A986] text-xs uppercase tracking-widest font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Advisory & Insights</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#736D65] font-light">
            {subtitle}
          </p>
        </div>

        <div className="divide-y divide-[#EAE4DB] border-y border-[#EAE4DB]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-5 transition-colors">
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-medium text-[#1A1816] group-hover:text-[#C9A986] transition-colors pr-6">
                    {faq.question}
                  </span>
                  <div className="w-7 h-7 shrink-0 border border-[#DCD5CB] flex items-center justify-center text-[#736D65] group-hover:border-[#C9A986] group-hover:text-[#C9A986] transition-colors">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>
                
                {isOpen && (
                  <div className="mt-3.5 pr-8 text-xs sm:text-sm text-[#615B54] leading-relaxed font-light">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
