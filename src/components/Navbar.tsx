import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenConsultation: (service?: string, location?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenConsultation }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const leftLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/interior-design-miami', hasDropdown: true },
    { label: 'Projects', path: '/portfolio' },
  ];

  const rightLinks = [
    { label: 'Podcast', path: '/journal' },
    { label: 'Blog', path: '/journal' },
    { label: 'Articles', path: '/journal' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF9F6]/95 backdrop-blur-md shadow-xs'
          : 'bg-[#FAF9F6]/60 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">

          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {leftLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <button
                    className={`flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] transition-colors py-2 ${
                      isActive(link.path)
                        ? 'text-[#1A1816] font-semibold'
                        : 'text-[#5A5550] hover:text-[#1A1816]'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {servicesOpen && (
                    <div className="absolute top-full left-0 w-72 bg-[#FAF9F6] border border-[#E5DFD7] shadow-xl py-3 px-2 transition-all">
                      <a
                        href="/turnkey-interior-design-miami"
                        onClick={(e) => { e.preventDefault(); handleLinkClick('/turnkey-interior-design-miami'); }}
                        className="block px-3 py-2.5 text-xs text-[#2A2623] hover:bg-[#F2ECE3] hover:text-[#1A1816] transition-colors"
                      >
                        <div className="font-medium">Turnkey Interior Design</div>
                      </a>
                      <a
                        href="/luxury-residential-interior-design-miami"
                        onClick={(e) => { e.preventDefault(); handleLinkClick('/luxury-residential-interior-design-miami'); }}
                        className="block px-3 py-2.5 text-xs text-[#2A2623] hover:bg-[#F2ECE3] hover:text-[#1A1816] transition-colors"
                      >
                        <div className="font-medium">Luxury Residential Design</div>
                      </a>
                      <a
                        href="/hospitality-interior-design-miami"
                        onClick={(e) => { e.preventDefault(); handleLinkClick('/hospitality-interior-design-miami'); }}
                        className="block px-3 py-2.5 text-xs text-[#2A2623] hover:bg-[#F2ECE3] hover:text-[#1A1816] transition-colors"
                      >
                        <div className="font-medium">Hospitality Interior Design</div>
                      </a>
                      <div className="pt-1 mt-1 border-t border-[#EFEAE2]">
                        <a
                          href="/interior-design-miami"
                          onClick={(e) => { e.preventDefault(); handleLinkClick('/interior-design-miami'); }}
                          className="block px-3 py-2 text-xs font-semibold text-[#C9A986] hover:bg-[#F2ECE3] transition-colors"
                        >
                          Miami Hub →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  key={link.label}
                  href={link.path}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.path); }}
                  className={`text-[11px] uppercase tracking-[0.2em] transition-colors py-2 ${
                    isActive(link.path)
                      ? 'text-[#1A1816] font-semibold'
                      : 'text-[#5A5550] hover:text-[#1A1816]'
                  }`}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Center Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/');
            }}
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer"
          >
            <img
              src="/assets/logo-paula.avif"
              alt="Paula Ambrosio Interiors"
              className="h-10 w-auto object-contain"
            />
          </a>

          {/* Right Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {rightLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                onClick={(e) => { e.preventDefault(); handleLinkClick(link.path); }}
                className={`text-[11px] uppercase tracking-[0.2em] transition-colors py-2 ${
                  isActive(link.path)
                    ? 'text-[#1A1816] font-semibold'
                    : 'text-[#5A5550] hover:text-[#1A1816]'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
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
          <div className="flex flex-col items-center pb-4 border-b border-[#EAE4DB]">
            <img
              src="/assets/logo-paula.avif"
              alt="Paula Ambrosio Interiors"
              className="h-9 w-auto object-contain"
            />
          </div>

          <div className="space-y-3 border-b border-[#EAE4DB] pb-4">
            <div className="text-[10px] uppercase tracking-widest text-[#9C948B] font-semibold">Services</div>
            <div className="grid grid-cols-1 gap-2 pl-2">
              <a
                href="/interior-design-miami"
                onClick={(e) => { e.preventDefault(); handleLinkClick('/interior-design-miami'); }}
                className="text-xs uppercase tracking-wider text-[#C9A986] font-semibold"
              >
                Miami Hub →
              </a>
              <a
                href="/turnkey-interior-design-miami"
                onClick={(e) => { e.preventDefault(); handleLinkClick('/turnkey-interior-design-miami'); }}
                className="text-xs uppercase tracking-wider text-[#2A2623] hover:text-[#C9A986]"
              >
                Turnkey Interior Design
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
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              Home
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              About
            </a>
            <a
              href="/portfolio"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/portfolio'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              Projects
            </a>
            <a
              href="/journal"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/journal'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              Blog / Articles
            </a>
            <a
              href="/contact"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/contact'); }}
              className="text-xs uppercase tracking-widest text-[#1A1816] font-medium"
            >
              Contact
            </a>
            <a
              href="/locations"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/locations'); }}
              className="text-xs uppercase tracking-widest text-[#C9A986] font-medium"
            >
              Locations
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
