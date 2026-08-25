import React, { useState } from 'react';
import { X, CheckCircle, Sparkles, Phone, Mail, MapPin } from 'lucide-react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
  initialLocation?: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  initialService = 'Turnkey Interior Design',
  initialLocation = 'Miami'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: initialService,
    location: initialLocation,
    propertyType: 'Waterfront Residence / Estate',
    timeline: 'Within 1–3 Months',
    estimatedBudget: '$150,000 – $300,000+',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#FAF9F6] border border-[#E5DFD7] rounded-none shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="h-1.5 bg-[#C9A986] w-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#7A746E] hover:text-[#1A1816] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-10">
          {submitted ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 mx-auto bg-[#F4EFEA] text-[#C9A986] rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif-luxury text-3xl font-medium text-[#1A1816]">
                  Consultation Request Received
                </h3>
                <p className="text-[#68625B] max-w-md mx-auto text-sm leading-relaxed">
                  Thank you, {formData.name}. Our studio team and Principal Designer Paula Ambrosio will review your project details and contact you within 24 business hours to arrange your private consultation.
                </p>
              </div>
              <div className="p-4 bg-[#F2EDE5] border border-[#E2DBD1] text-xs text-[#524D47] max-w-md mx-auto text-left space-y-1">
                <p><strong className="font-medium text-[#1A1816]">Requested Service:</strong> {formData.service}</p>
                <p><strong className="font-medium text-[#1A1816]">Location:</strong> {formData.location}</p>
                <p><strong className="font-medium text-[#1A1816]">Direct Concierge:</strong> +1 (305) 555-0198 | concierge@paulaambrosiointeriors.com</p>
              </div>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest hover:bg-[#C9A986] transition-colors"
              >
                Close & Return to Site
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6 space-y-1">
                <div className="flex items-center gap-2 text-[#C9A986] text-xs uppercase tracking-widest font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Paula Ambrosio Interiors</span>
                </div>
                <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1A1816] font-normal">
                  Request a Private Consultation
                </h2>
                <p className="text-sm text-[#736D65] font-light">
                  Tell us about your residence and vision. We will schedule a confidential discovery session with our design team.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#57514A] mb-1 font-medium">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD5CA] text-sm text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#57514A] mb-1 font-medium">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. eleanor@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD5CA] text-sm text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#57514A] mb-1 font-medium">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 (305) 555-0198"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD5CA] text-sm text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#57514A] mb-1 font-medium">
                      Service Scope *
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD5CA] text-sm text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                    >
                      <option value="Turnkey Interior Design">Turnkey Interior Design (Complete Move-In)</option>
                      <option value="Luxury Residential Interior Design">Full-Service Luxury Residential</option>
                      <option value="New Construction Interior Architecture">New Construction Interior Design</option>
                      <option value="High-End Renovation">High-End Renovation</option>
                      <option value="Hospitality / Boutique Commercial">Hospitality & Boutique Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#57514A] mb-1 font-medium">
                      Project Location *
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD5CA] text-sm text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                    >
                      <option value="Miami">Miami (Brickell, Coconut Grove, Coral Gables)</option>
                      <option value="Miami Beach">Miami Beach (Star Island, SoFi, Venetian)</option>
                      <option value="Sunny Isles Beach">Sunny Isles Beach (Oceanfront Towers)</option>
                      <option value="Bal Harbour">Bal Harbour (Oceana, St. Regis, Village)</option>
                      <option value="Aventura">Aventura (Williams Island, Marina)</option>
                      <option value="Boca Raton">Boca Raton (Royal Palm, Estates)</option>
                      <option value="Palm Beach">Palm Beach (North County Rd, Worth Ave)</option>
                      <option value="Other / International">Other / International</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#57514A] mb-1 font-medium">
                      Estimated Investment Budget
                    </label>
                    <select
                      value={formData.estimatedBudget}
                      onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD5CA] text-sm text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                    >
                      <option value="$100,000 – $250,000">$100,000 – $250,000</option>
                      <option value="$250,000 – $500,000">$250,000 – $500,000</option>
                      <option value="$500,000 – $1,000,000+">$500,000 – $1,000,000+</option>
                      <option value="$1,000,000+ (Estate / Full Turnkey)">$1,000,000+ (Whole Estate / Flagship)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#57514A] mb-1 font-medium">
                    Project Vision & Property Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about the property (square footage, new construction vs renovation, key rooms, desired aesthetic)..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD5CA] text-sm text-[#1A1816] focus:outline-none focus:border-[#C9A986]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E2D8]">
                  <div className="text-xs text-[#7A746E] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C9A986]" />
                    <span>Studio in Miami, FL | Available for travel globally</span>
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#1A1816] text-[#FAF9F6] text-xs uppercase tracking-widest font-semibold hover:bg-[#C9A986] transition-colors"
                  >
                    Submit Consultation Request
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
