import React from 'react';
import { ArrowUpRight, Instagram, Linkedin, MapPin, Phone, Mail, Sparkles } from 'lucide-react';
import { locationsData } from '../data/locationsData';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenConsultation }) => {
  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#171513] text-[#FAF9F6] pt-16 pb-12 border-t border-[#2D2A26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-[#2D2A26]">
          
          {/* Col 1 & 2: Entity & Verified Bio */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#C9A986] text-xs uppercase tracking-widest font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Miami Luxury Interior Design</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl font-normal tracking-wide text-white">
                Paula Ambrosio Interiors
              </h2>
            </div>

            <p className="text-sm text-[#A8A199] leading-relaxed max-w-md font-light">
              Founded by sisters Amanda and Paula Ambrósio, our Miami-based studio brings nearly two decades of mastery and over 2,300 completed projects worldwide, delivering bespoke residential, turnkey second-home, and luxury commercial interiors.
            </p>

            <div className="pt-2 space-y-2.5 text-xs text-[#C5BEB5]">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-[#C9A986] shrink-0" />
                <span>Biscayne Boulevard & 38th St, Miami, FL 33137</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[#C9A986] shrink-0" />
                <span>+1 (305) 555-0198</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#C9A986] shrink-0" />
                <span>concierge@paulaambrosiointeriors.com</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-2">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-[#3A3632] flex items-center justify-center text-[#C9A986] hover:bg-[#C9A986] hover:text-[#171513] transition-colors"
                aria-label="Instagram Profile"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-[#3A3632] flex items-center justify-center text-[#C9A986] hover:bg-[#C9A986] hover:text-[#171513] transition-colors"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 3: Strategic Services */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">
              Design Services
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A8A199]">
              <li>
                <a
                  href="/turnkey-interior-design-miami"
                  onClick={(e) => handleLinkClick('/turnkey-interior-design-miami', e)}
                  className="hover:text-white transition-colors"
                >
                  Turnkey Interior Design
                </a>
              </li>
              <li>
                <a
                  href="/luxury-residential-interior-design-miami"
                  onClick={(e) => handleLinkClick('/luxury-residential-interior-design-miami', e)}
                  className="hover:text-white transition-colors"
                >
                  Luxury Residential Design
                </a>
              </li>
              <li>
                <a
                  href="/hospitality-interior-design-miami"
                  onClick={(e) => handleLinkClick('/hospitality-interior-design-miami', e)}
                  className="hover:text-white transition-colors"
                >
                  Hospitality Interior Design
                </a>
              </li>
              <li>
                <a
                  href="/interior-design-miami"
                  onClick={(e) => handleLinkClick('/interior-design-miami', e)}
                  className="hover:text-[#C9A986] transition-colors font-medium"
                >
                  Miami Full-Service Hub
                </a>
              </li>
              <li>
                <a
                  href="/portfolio"
                  onClick={(e) => handleLinkClick('/portfolio', e)}
                  className="hover:text-white transition-colors"
                >
                  Flagship Case Studies
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: South Florida Locations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">
                Locations Hub
              </h3>
              <a
                href="/locations"
                onClick={(e) => handleLinkClick('/locations', e)}
                className="text-[10px] text-[#A8A199] hover:text-[#C9A986] uppercase tracking-wider"
              >
                All (7)
              </a>
            </div>
            <ul className="space-y-2 text-xs text-[#A8A199]">
              {locationsData.map((loc) => (
                <li key={loc.id}>
                  <a
                    href={loc.url}
                    onClick={(e) => handleLinkClick(loc.url, e)}
                    className="hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span>{loc.city}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#C9A986] transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Studio & Directory */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#C9A986] font-semibold">
              Studio & Directory
            </h3>
            <ul className="space-y-2.5 text-xs text-[#A8A199]">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLinkClick('/about', e)}
                  className="hover:text-white transition-colors"
                >
                  About Paula & Amanda
                </a>
              </li>
              <li>
                <a
                  href="/journal"
                  onClick={(e) => handleLinkClick('/journal', e)}
                  className="hover:text-white transition-colors"
                >
                  Design Journal & Insights
                </a>
              </li>
              <li>
                <a
                  href="/sitemap"
                  onClick={(e) => handleLinkClick('/sitemap', e)}
                  className="hover:text-[#C9A986] transition-colors flex items-center gap-1 font-medium"
                >
                  <span>Sitemap & Index</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLinkClick('/contact', e)}
                  className="hover:text-white transition-colors"
                >
                  Contact & Inquiries
                </a>
              </li>
            </ul>

            <div className="pt-3">
              <button
                onClick={() => onOpenConsultation()}
                className="w-full py-2.5 px-4 bg-[#C9A986] text-[#171513] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-colors text-center"
              >
                Request Consultation
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Entity, Sitemap & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A746E] gap-4">
          <p>© {new Date().getFullYear()} Paula Ambrosio Interiors LLC. All Rights Reserved. Miami, FL.</p>
          <div className="flex flex-wrap items-center gap-6">
            <span>Verified Founder: Paula Ambrosio</span>
            <span>Licensed & Insured Studio</span>
            <a
              href="/sitemap"
              onClick={(e) => handleLinkClick('/sitemap', e)}
              className="text-[#C9A986] hover:underline font-medium"
            >
              HTML Sitemap
            </a>
            <a
              href="/privacy"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/contact', e); }}
              className="hover:text-[#A8A199]"
            >
              Privacy & Legal
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
