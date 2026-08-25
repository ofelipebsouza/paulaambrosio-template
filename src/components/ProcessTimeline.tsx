import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

interface ProcessTimelineProps {
  title?: string;
  subtitle?: string;
  steps: ProcessStep[];
  onStartProject?: () => void;
}

export const ProcessTimeline: React.FC<ProcessTimelineProps> = ({
  title = 'Our Architectural Design Process',
  subtitle = 'A structured, disciplined methodology from initial discovery to the turnkey reveal.',
  steps,
  onStartProject
}) => {
  return (
    <section className="py-20 bg-[#FAF9F6] border-y border-[#EAE4DB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-[#C9A986] text-xs uppercase tracking-widest font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Disciplined Execution</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal tracking-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-[#6E6861] mt-2 font-light leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E5DFD7] p-7 flex flex-col justify-between hover:border-[#C9A986] transition-all hover:shadow-xs group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif-luxury text-2xl text-[#C9A986] font-medium">
                    {item.step}
                  </span>
                  <div className="w-6 h-[1px] bg-[#D6CEC4] group-hover:w-10 group-hover:bg-[#C9A986] transition-all" />
                </div>
                <h3 className="text-base font-semibold text-[#1A1816] mb-2 tracking-wide">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#68625B] leading-relaxed font-light">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {onStartProject && (
          <div className="mt-12 text-center">
            <button
              onClick={onStartProject}
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors"
            >
              <span>Begin Your Design Discovery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
