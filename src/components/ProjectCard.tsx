import React from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onNavigate: (path: string) => void;
  aspectRatio?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onNavigate,
  aspectRatio = 'aspect-[4/3]'
}) => {
  return (
    <div
      onClick={() => onNavigate(`/portfolio/${project.slug}`)}
      className="group cursor-pointer flex flex-col bg-white border border-[#E8E2D8] hover:border-[#C9A986] transition-all duration-300 hover:shadow-md"
    >
      {/* Image Container */}
      <div className={`relative w-full ${aspectRatio} overflow-hidden bg-[#ECE8E1]`}>
        <img
          src={project.coverImage}
          alt={`${project.title} - ${project.subTitle} in ${project.location}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        
        {/* Category Pill */}
        <div className="absolute top-3.5 left-3.5 px-3 py-1 bg-[#FAF9F6]/90 backdrop-blur-xs text-[10px] uppercase tracking-widest text-[#1A1816] font-semibold">
          {project.category}
        </div>

        {/* Location Badge */}
        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1816]/80 text-[#FAF9F6] text-[10px] tracking-wide backdrop-blur-xs">
          <MapPin className="w-3 h-3 text-[#C9A986]" />
          <span>{project.location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif-luxury text-xl sm:text-2xl text-[#1A1816] font-medium group-hover:text-[#C9A986] transition-colors">
              {project.title}
            </h3>
            <div className="w-7 h-7 shrink-0 border border-[#DDD5CA] rounded-full flex items-center justify-center text-[#1A1816] group-hover:bg-[#C9A986] group-hover:border-[#C9A986] group-hover:text-white transition-all">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs text-[#7A746E] mt-1 line-clamp-1 font-light">
            {project.subTitle}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-[11px] text-[#8C847B]">
          <span>{project.propertyType}</span>
          <span className="text-[#C9A986] font-medium group-hover:underline">View Case Study →</span>
        </div>
      </div>
    </div>
  );
};
