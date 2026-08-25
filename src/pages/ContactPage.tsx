import React, { useState } from 'react';
import { Building, CheckCircle2, Clock, Mail, MapPin, Phone, Send, Sparkles } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: 'Full-Service Interior Design',
    location: 'Miami',
    propertyType: 'Condominium / Penthouse',
    projectScope: 'Complete Interior Design & Furnishing',
    targetTimeline: '3–6 Months',
    estimatedBudget: '$150,000 – $300,000',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-20">
      <SEOHead
        title="Contact & Private Consultation | Paula Ambrosio Interiors"
        description="Schedule a private interior design consultation with Paula Ambrosio Interiors. Miami-based luxury design studio serving South Florida and international clients."
      />

      {/* Hero Section */}
      <section className="relative min-h-[45vh] flex items-center bg-[#171513] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=2200&q=85"
            alt="Contact Paula Ambrosio Interiors"
            className="w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171513]/90 via-[#171513]/70 to-[#171513]/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A986]/20 border border-[#C9A986]/40 text-[#E8D8C8] text-xs uppercase tracking-widest backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A986]" />
              <span>Private Consultation</span>
            </div>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-normal leading-tight text-white">
              Start Your Project
            </h1>

            <p className="font-serif-luxury text-xl sm:text-2xl text-[#DCD5CB] italic font-light">
              Schedule a confidential discovery conversation with our Miami design team.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content & Form Grid */}
      <section className="py-20 bg-[#FAF9F6] border-b border-[#EAE4DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Studio Info Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white border border-[#E5DFD7] p-8 space-y-6">
                <div>
                  <h2 className="font-serif-luxury text-2xl text-[#1A1816] mb-1">
                    Miami Design Studio
                  </h2>
                  <p className="text-xs text-[#7A746E] font-light">
                    By Appointment Only
                  </p>
                </div>

                <div className="space-y-4 text-xs text-[#524D47]">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#1A1816] block">Studio Address</strong>
                      <span>Miami Design District / Biscayne Corridor<br />Miami, Florida 33137</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#1A1816] block">Direct Concierge Line</strong>
                      <a href="tel:+13055550198" className="hover:text-[#C9A986] transition-colors">
                        +1 (305) 555-0198
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#1A1816] block">Direct Studio Inquiries</strong>
                      <a href="mailto:inquiries@paulaambrosiointeriors.com" className="hover:text-[#C9A986] transition-colors">
                        inquiries@paulaambrosiointeriors.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#C9A986] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#1A1816] block">Hours of Operation</strong>
                      <span>Monday – Friday: 9:00 AM – 6:00 PM EST<br />Weekend & Evening Consultations by Request</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EAE1]">
                  <p className="text-[11px] text-[#8C847B] font-light italic">
                    For clients residing out of state or internationally, we offer private high-definition video presentations.
                  </p>
                </div>
              </div>

              {/* Service Assurance */}
              <div className="bg-[#171513] text-white p-6 border border-[#2D2A26] space-y-3">
                <p className="font-serif-luxury text-lg text-[#C9A986]">Our Confidentiality Guarantee</p>
                <p className="text-xs text-[#A8A199] font-light leading-relaxed">
                  All consultations, project details, floor plans, and property locations are held under strict non-disclosure agreements to preserve client privacy.
                </p>
              </div>
            </div>

            {/* Comprehensive Consultation Questionnaire */}
            <div className="lg:col-span-8">
              <div className="bg-white border border-[#E5DFD7] p-8 sm:p-10 shadow-xs">
                
                {isSubmitted ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-[#F2EDE5] text-[#C9A986] rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif-luxury text-3xl text-[#1A1816]">
                      Consultation Request Received
                    </h3>
                    <p className="text-sm text-[#615B54] max-w-md mx-auto font-light leading-relaxed">
                      Thank you, {formData.name}. Our studio director will review your project parameters and contact you within one business day to coordinate your private consultation.
                    </p>
                    <div className="pt-4">
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="px-6 py-2.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h2 className="font-serif-luxury text-2xl sm:text-3xl text-[#1A1816]">
                        Project Consultation Questionnaire
                      </h2>
                      <p className="text-xs text-[#7A746E] mt-1 font-light">
                        Please provide preliminary details so we may prepare relevant case studies and material samples for our conversation.
                      </p>
                    </div>

                    {/* Personal Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                          placeholder="e.g. Alexandra Sterling"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                          placeholder="alexandra@domain.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                          placeholder="+1 (305) 555-0100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                          Service of Interest
                        </label>
                        <select
                          value={formData.serviceType}
                          onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                        >
                          <option value="Full-Service Interior Design">Full-Service Interior Design</option>
                          <option value="Turnkey Interior Design">Turnkey Interior Design (Move-in Ready)</option>
                          <option value="Luxury Renovation & Architecture">Luxury Renovation & Architecture</option>
                          <option value="New Construction Interior Architecture">New Construction Interior Architecture</option>
                          <option value="Hospitality & Commercial Design">Hospitality & Commercial Design</option>
                        </select>
                      </div>
                    </div>

                    {/* Location & Property Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                          Property Location
                        </label>
                        <select
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                        >
                          <option value="Miami (Brickell / Downtown / Edgewater)">Miami (Brickell / Downtown / Edgewater)</option>
                          <option value="Miami Beach / South of Fifth / Islands">Miami Beach / South of Fifth / Islands</option>
                          <option value="Sunny Isles Beach">Sunny Isles Beach</option>
                          <option value="Bal Harbour / Bay Harbor Islands">Bal Harbour / Bay Harbor Islands</option>
                          <option value="Aventura / Williams Island">Aventura / Williams Island</option>
                          <option value="Coral Gables / Coconut Grove">Coral Gables / Coconut Grove</option>
                          <option value="Key Biscayne">Key Biscayne</option>
                          <option value="Boca Raton / Royal Palm">Boca Raton / Royal Palm</option>
                          <option value="Palm Beach / Manalapan">Palm Beach / Manalapan</option>
                          <option value="Other South Florida Location">Other South Florida Location</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                          Property Type
                        </label>
                        <select
                          value={formData.propertyType}
                          onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                        >
                          <option value="Condominium / Penthouse">Condominium / Penthouse</option>
                          <option value="Single Family Estate / Waterfront Residence">Single Family Estate / Waterfront Residence</option>
                          <option value="New Construction Shell">New Construction Shell</option>
                          <option value="Historical Residence Renovation">Historical Residence Renovation</option>
                          <option value="Boutique Hotel / Lounge / Commercial">Boutique Hotel / Lounge / Commercial</option>
                        </select>
                      </div>
                    </div>

                    {/* Timeline & Budget */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                          Target Timeline
                        </label>
                        <select
                          value={formData.targetTimeline}
                          onChange={(e) => setFormData({ ...formData, targetTimeline: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                        >
                          <option value="Immediate (1–3 Months)">Immediate (1–3 Months)</option>
                          <option value="3–6 Months">3–6 Months</option>
                          <option value="6–12 Months">6–12 Months</option>
                          <option value="Future Planning (12+ Months)">Future Planning (12+ Months)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                          Estimated Furnishing & Renovation Budget
                        </label>
                        <select
                          value={formData.estimatedBudget}
                          onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                        >
                          <option value="$100,000 – $250,000">$100,000 – $250,000</option>
                          <option value="$250,000 – $500,000">$250,000 – $500,000</option>
                          <option value="$500,000 – $1,000,000">$500,000 – $1,000,000</option>
                          <option value="$1,000,000+">$1,000,000+</option>
                        </select>
                      </div>
                    </div>

                    {/* Message / Vision */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#1A1816] font-semibold mb-1.5">
                        Tell Us About Your Vision & Property
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#DDD5CA] text-xs text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                        placeholder="Please share any details regarding current architecture, specific rooms, lifestyle requirements, or architectural deadlines..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Transmitting Inquiry...</span>
                      ) : (
                        <>
                          <span>Request Private Consultation</span>
                          <Send className="w-3.5 h-3.5 text-[#C9A986]" />
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
