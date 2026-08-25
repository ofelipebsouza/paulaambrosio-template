import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ConsultationModal } from './components/ConsultationModal';

// Pages
import { HomePage } from './pages/HomePage';
import { MiamiPage } from './pages/MiamiPage';
import { TurnkeyPage } from './pages/TurnkeyPage';
import { ResidentialPage } from './pages/ResidentialPage';
import { HospitalityPage } from './pages/HospitalityPage';
import { LocationsHubPage } from './pages/LocationsHubPage';
import { LocationDetailPage } from './pages/LocationDetailPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { JournalPage } from './pages/JournalPage';
import { JournalDetailPage } from './pages/JournalDetailPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [consultationModalState, setConsultationModalState] = useState<{
    isOpen: boolean;
    initialService?: string;
    initialLocation?: string;
  }>({
    isOpen: false,
  });

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    if (path === currentPath) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const handleOpenConsultation = (service?: string, location?: string) => {
    setConsultationModalState({
      isOpen: true,
      initialService: service,
      initialLocation: location,
    });
  };

  const handleCloseConsultation = () => {
    setConsultationModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Route Resolver
  const renderCurrentView = () => {
    const path = currentPath.toLowerCase().replace(/\/+$/, '') || '/';

    // Home
    if (path === '/' || path === '') {
      return (
        <HomePage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Flagship Miami Page
    if (path === '/interior-design-miami') {
      return (
        <MiamiPage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Service Pages
    if (path === '/turnkey-interior-design-miami') {
      return (
        <TurnkeyPage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    if (path === '/luxury-residential-interior-design-miami') {
      return (
        <ResidentialPage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    if (path === '/hospitality-interior-design-miami') {
      return (
        <HospitalityPage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Locations Hub
    if (path === '/locations') {
      return (
        <LocationsHubPage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Direct Location URLs (as defined in Section 06)
    if (path === '/interior-designer-miami-beach') {
      return (
        <LocationDetailPage
          slug="miami-beach"
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    if (path === '/interior-designer-sunny-isles') {
      return (
        <LocationDetailPage
          slug="sunny-isles"
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    if (path === '/interior-designer-aventura') {
      return (
        <LocationDetailPage
          slug="aventura"
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    if (path === '/interior-designer-bal-harbour') {
      return (
        <LocationDetailPage
          slug="bal-harbour"
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    if (path === '/interior-designer-boca-raton') {
      return (
        <LocationDetailPage
          slug="boca-raton"
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    if (path === '/interior-designer-palm-beach') {
      return (
        <LocationDetailPage
          slug="palm-beach"
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Dynamic /locations/:slug
    if (path.startsWith('/locations/')) {
      const slug = path.replace('/locations/', '');
      return (
        <LocationDetailPage
          slug={slug}
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Portfolio
    if (path === '/portfolio') {
      return (
        <PortfolioPage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Portfolio Case Study Detail
    if (path.startsWith('/portfolio/')) {
      const slug = path.replace('/portfolio/', '');
      return (
        <ProjectDetailPage
          slug={slug}
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // About
    if (path === '/about') {
      return (
        <AboutPage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Contact & Start Your Project
    if (path === '/contact' || path === '/start-your-project') {
      return <ContactPage onNavigate={handleNavigate} />;
    }

    // Journal
    if (path === '/journal') {
      return (
        <JournalPage
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Journal Detail
    if (path.startsWith('/journal/')) {
      const slug = path.replace('/journal/', '');
      return (
        <JournalDetailPage
          slug={slug}
          onNavigate={handleNavigate}
          onOpenConsultation={handleOpenConsultation}
        />
      );
    }

    // Fallback default
    return (
      <HomePage
        onNavigate={handleNavigate}
        onOpenConsultation={handleOpenConsultation}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1816] flex flex-col font-sans-clean selection:bg-[#C9A986]/30 selection:text-[#1A1816]">
      {/* Global Navigation Header */}
      <Navbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onOpenConsultation={handleOpenConsultation}
      />

      {/* Main Page View */}
      <main className="flex-grow">
        {renderCurrentView()}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenConsultation={handleOpenConsultation}
      />

      {/* Lead Generation Consultation Modal */}
      <ConsultationModal
        isOpen={consultationModalState.isOpen}
        onClose={handleCloseConsultation}
        initialService={consultationModalState.initialService}
        initialLocation={consultationModalState.initialLocation}
      />
    </div>
  );
}
