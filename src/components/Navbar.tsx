import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, ArrowUpRight, Phone, MapPin, Sparkles } from 'lucide-react';
import { locationsData } from '../data/locationsData';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenConsultation }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setServicesOpen(false);
    setLocationsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8E2D8] py-3.5 shadow-xs' 
          : 'bg-[#FAF9F6]/80 backdrop-blur-sm border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/');
            }}
            className="group flex flex-col cursor-pointer"
          >
            <span className="font-serif-luxury text-xl sm:text-2xl tracking-[0.18em] uppercase text-[#1A1816] font-medium group-hover:text-[#C9A986] transition-colors">
              Paula Ambrosio
            </span>
            <span className="text-[9px] uppercase tracking-[0.35em] text-[#7A746E] font-medium">
              Interiors · Miami
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-7">
            {/* Services Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                className={`flex items-center space-x-1 text-xs uppercase tracking-widest transition-colors py-2 ${
                  currentPath.includes('interior-design') || currentPath.includes('turnkey') || currentPath.includes('luxury-residential') || currentPath.includes('hospitality')
                    ? 'text-[#C9A986] font-semibold'
                    : 'text-[#3E3935] hover:text-[#1A1816]'
                }`}
              >
                <span>Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180 text-[#C9A986]' : ''}`} />
              </button>

              {servicesOpen && (
                <div className="absolute top-full left-0 w-80 bg-[#FAF9F6] border border-[#E5DFD7] shadow-xl py-3 px-2 transition-all">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#9C948B] font-semibold border-b border-[#EFEAE2] mb-1">
                    Design Disciplines
                  </div>
                  <a
                    href="/turnkey-interior-design-miami"
                    onClick={(e) => { e.preventDefault(); handleLinkClick('/turnkey-interior-design-miami'); }}
                    className="block px-3 py-2.5 text-xs text-[#2A2623] hover:bg-[#F2ECE3] hover:text-[#1A1816] transition-colors"
                  >
                    <div className="font-medium">Turnkey Interior Design</div>
                    <div className="text-[11px] text-[#7A746E]">Concept to Move-In Ready for Second Homes</div>
                  </a>
                  <a
                    href="/luxury-residential-interior-design-miami"
                    onClick={(e) => { e.preventDefault(); handleLinkClick('/luxury-residential-interior-design-miami'); }}
                    className="block px-3 py-2.5 text-xs text-[#2A2623] hover:bg-[#F2ECE3] hover:text-[#1A1816] transition-colors"
                  >
                    <div className="font-medium">Luxury Residential Design</div>
                    <div className="text-[11px] text-[#7A746E]">Waterfront Estates, Penthouses & Renovations</div>
                  </a>
                  <a
                    href="/hospitality-interior-design-miami"
                    onClick={(e) => { e.preventDefault(); handleLinkClick('/hospitality-interior-design-miami'); }}
                    className="block px-3 py-2.5 text-xs text-[#2A2623] hover:bg-[#F2ECE3] hover:text-[#1A1816] transition-colors"
                  >
                    <div className="font-medium">Hospitality Interior Design</div>
                    <div className="text-[11px] text-[#7A746E]">Boutique Hotels, Lounges & Wellness Retreats</div>
                  </a>
                  <div className="pt-1 mt-1 border-t border-[#EFEAE2]">
                    <a
                      href="/interior-design-miami"
                      onClick={(e) => { e.preventDefault(); handleLinkClick('/interior-design-miami'); }}
                      className="block px-3 py-2 text-xs font-semibold text-[#C9A986] hover:bg-[#F2ECE3] transition-colors"
                    >
                      Miami Full-Service Hub →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Locations Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setLocationsOpen(true)}
              onMouseLeave={() => setLocationsOpen(false)}
            >
              <button
                className={`flex items-center space-x-1 text-xs uppercase tracking-widest transition-colors py-2 ${
                  currentPath.includes('interior-designer') || currentPath === '/locations'
                    ? 'text-[#C9A986] font-semibold'
                    : 'text-[#3E3935] hover:text-[#1A1816]'
                }`}
              >
                <span>Locations</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${locationsOpen ? 'rotate-180 text-[#C9A986]' : ''}`} />
              </button>

              {locationsOpen && (
                <div className="absolute top-full left-0 w-80 bg-[#FAF9F6] border border-[#E5DFD7] shadow-xl py-3 px-2 transition-all">
                  <div className="flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#9C948B] font-semibold border-b border-[#EFEAE2] mb-1">
                    <span>South Florida Enclaves</span>
                    <a 
                      href="/locations"
                      onClick={(e) => { e.preventDefault(); handleLinkClick('/locations'); }}
                      className="text-[#C9A986] hover:underline"
                    >
                      View Hub
                    </a>
                  </div>
                  {locationsData.map((loc) => (
                    <a
                      key={loc.id}
                      href={loc.url}
                      onClick={(e) => { e.preventDefault(); handleLinkClick(loc.url); }}
                      className="block px-3 py-2 text-xs text-[#2A2623] hover:bg-[#F2ECE3] hover:text-[#1A1816] transition-colors"
                    >
                      <div className="font-medium flex items-center justify-between">
                        <span>{loc.city}</span>
                        <span className="text-[10px] text-[#9C948B] font-light">Explore</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Portfolio Link */}
            <a
              href="/portfolio"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/portfolio'); }}
              className={`text-xs uppercase tracking-widest transition-colors py-2 ${
                currentPath.startsWith('/portfolio')
                  ? 'text-[#C9A986] font-semibold'
                  : 'text-[#3E3935] hover:text-[#1A1816]'
              }`}
            >
              Portfolio
            </a>

            {/* About Paula Link */}
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}
              className={`text-xs uppercase tracking-widest transition-colors py-2 ${
                currentPath === '/about'
                  ? 'text-[#C9A986] font-semibold'
                  : 'text-[#3E3935] hover:text-[#1A1816]'
              }`}
            >
              About Paula
            </a>

            {/* Journal Link */}
            <a
              href="/journal"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/journal'); }}
              className={`text-xs uppercase tracking-widest transition-colors py-2 ${
                currentPath.startsWith('/journal')
                  ? 'text-[#C9A986] font-semibold'
                  : 'text-[#3E3935] hover:text-[#1A1816]'
              }`}
            >
              Journal
            </a>

            {/* Contact / Consultation CTA */}
            <button
              onClick={() => onOpenConsultation()}
              className="px-5 py-2.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors shadow-xs"
            >
              Start Your Project
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-3 lg:hidden">
            <button
              onClick={() => onOpenConsultation()}
              className="px-3.5 py-1.5 bg-[#1A1816] text-[#FAF9F6] text-[10px] uppercase tracking-wider font-semibold hover:bg-[#C9A986]"
            >
              Consultation
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1A1816] hover:text-[#C9A986]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF9F6] border-b border-[#E5DFD7] px-6 py-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
          <div className="space-y-3 border-b border-[#EAE4DB] pb-4">
            <div className="text-[10px] uppercase tracking-widest text-[#9C948B] font-semibold">Services</div>
            <div className="grid grid-cols-1 gap-2 pl-2">
              <a
                href="/turnkey-interior-design-miami"
                onClick={(e) => { e.preventDefault(); handleLinkClick('/turnkey-interior-design-miami'); }}
                className="text-xs uppercase tracking-wider text-[#2A2623] hover:text-[#C9A986]"
              >
                Turnkey Interior Design (Miami)
              </a>
              <a
                href="/luxury-residential-interior-design-miami"
                onClick={(e) => { e.preventDefault(); handleLinkClick('/luxury-residential-interior-design-miami'); }}
                className="text-xs uppercase tracking-wider text-[#2A2623] hover:text-[#C9A986]"
              >
                Luxury Residential Design
              </a>
              <a
                href="/hospitality-interior-design-miami"
                onClick={(e) => { e.preventDefault(); handleLinkClick('/hospitality-interior-design-miami'); }}
                className="text-xs uppercase tracking-wider text-[#2A2623] hover:text-[#C9A986]"
              >
                Hospitality Interior Design
              </a>
              <a
                href="/interior-design-miami"
                onClick={(e) => { e.preventDefault(); handleLinkClick('/interior-design-miami'); }}
                className="text-xs uppercase tracking-wider text-[#C9A986] font-semibold"
              >
                Miami Landing Hub →
              </a>
            </div>
          </div>

          <div className="space-y-3 border-b border-[#EAE4DB] pb-4">
            <div className="text-[10px] uppercase tracking-widest text-[#9C948B] font-semibold">Locations Hub</div>
            <div className="grid grid-cols-2 gap-2 pl-2">
              <a
                href="/locations"
                onClick={(e) => { e.preventDefault(); handleLinkClick('/locations'); }}
                className="col-span-2 text-xs uppercase tracking-wider font-semibold text-[#C9A986]"
              >
                All Locations Overview →
              </a>
              {locationsData.map((loc) => (
                <a
                  key={loc.id}
                  href={loc.url}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(loc.url); }}
                  className="text-xs text-[#3E3935] hover:text-[#C9A986]"
                >
                  {loc.city}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <a
              href="/portfolio"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/portfolio'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              Portfolio Case Studies
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              About Paula Ambrosio
            </a>
            <a
              href="/journal"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/journal'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              Design Journal & Insights
            </a>
            <a
              href="/contact"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/contact'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              Contact Studio
            </a>
            <a
              href="/sitemap"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/sitemap'); }}
              className="text-xs uppercase tracking-widest text-[#C9A986] font-medium"
            >
              Sitemap & Index
            </a>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation();
              }}
              className="w-full py-3.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] text-center"
            >
              Start Your Project
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
