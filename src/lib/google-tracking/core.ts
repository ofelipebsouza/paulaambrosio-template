/** Privacy-first transport boundary. Never accepts form metadata or contact values. */
export interface ConsentChoice { analytics: boolean; advertising: boolean; }
export interface SavedConsent extends ConsentChoice { version: 1; at: number; }
export interface TrackingConfig { enabled: boolean; containerId: string; reviewedVersion: string; }
export interface TrackingPort {
 hostname(): string;
 pathname(): string;
 push(value: Record<string, unknown>): void;
 loadContainer(id: string): void;
 now(): number;
}
export const CONSENT_KEY = 'paula_optional_consent_v1';
export const CONSENT_MAX_AGE = 90 * 86_400_000;
const HOSTS = new Set(['www.paulaambrosio.com']);
const SERVICES: Record<string, string> = {
 '/design-consultation-miami/': 'design_consultation',
 '/design-express-miami/': 'design_express',
 '/turnkey-interior-design-miami/': 'turnkey_interiors',
 '/luxury-residential-interior-design-miami/': 'luxury_residential',
 '/hospitality-interior-design-miami/': 'hospitality_interiors',
};
const EVENTS = new Set(['page_view', 'cta_start_project', 'cta_explore_services', 'cta_view_project',
 'cta_turnkey', 'cta_contact', 'form_start', 'form_submit', 'form_error', 'phone_click',
 'email_click', 'whatsapp_click', 'instagram_click', 'portfolio_open', 'service_open', 'faq_open']);

export function parseConsent(raw: string | null, now: number): SavedConsent | null {
 try {
  const value = JSON.parse(raw ?? 'null');
  if (!value || value.version !== 1 || typeof value.analytics !== 'boolean' ||
   typeof value.advertising !== 'boolean' || typeof value.at !== 'number' ||
   !Number.isFinite(value.at) || value.at > now || now - value.at > CONSENT_MAX_AGE) return null;
  return { version: 1, analytics: value.analytics, advertising: value.advertising, at: value.at };
 } catch { return null; }
}

export function configReady(config: TrackingConfig, hostname: string): boolean {
 return config.enabled && /^GTM-[A-Z0-9]{6,}$/.test(config.containerId) &&
  /^[1-9]\d*$/.test(config.reviewedVersion) && HOSTS.has(hostname);
}

export function pageContext(pathname: string): { page_section: string; service_key: string } {
 const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') + '/';
 const service = SERVICES[path];
 if (service) return { page_section: 'service', service_key: service };
 if (path === '/') return { page_section: 'home', service_key: 'none' };
 const section = ['about', 'contact', 'services', 'projects', 'journal', 'locations', 'spaces', 'press', 'faq', 'privacy']
  .find((part) => path === `/${part}/` || path.startsWith(`/${part}/`));
 return { page_section: section ?? 'other', service_key: 'none' };
}

export function createTracking(config: TrackingConfig, port: TrackingPort) {
 let choice: ConsentChoice = { analytics: false, advertising: false };
 let loaded = false;
 let revoked = false;
 let pageViewed = false;
 let initialized = false;
 const active = () => configReady(config, port.hostname()) && !/^\/(admin|api|style-guides-and-branding)(\/|$)/.test(port.pathname());
 const consentEvent = () => ({
  event: 'paula_consent_update',
  paula_analytics_consent: choice.analytics ? 'granted' : 'denied',
  paula_advertising_consent: choice.advertising ? 'granted' : 'denied',
  paula_ad_personalization: 'denied',
 });
 return {
  ready: active,
  needsReload: () => revoked,
  containerFailed: () => { loaded = false; },
  /** Returns true when a fresh document is recommended after permission removal. */
  consent(next: ConsentChoice): boolean {
   const unchanged = choice.analytics === next.analytics && choice.advertising === next.advertising;
   const removed = (choice.analytics && !next.analytics) || (choice.advertising && !next.advertising);
   choice = { analytics: next.analytics === true, advertising: next.advertising === true };
   if (!active()) return false;
   if (loaded && removed) {
    // Stop first-party emission immediately. A reload removes already loaded tag code.
    revoked = true;
    port.push(consentEvent());
    return true;
   }
   if (revoked || (!choice.analytics && !choice.advertising) || (loaded && unchanged)) return false;
   port.push(consentEvent());
   if (!loaded) {
    if (!initialized) { port.push({ 'gtm.start': port.now(), event: 'gtm.js' }); initialized = true; }
    port.loadContainer(config.containerId);
    loaded = true;
   }
   // GTM applies consent API changes after the update event. Initialize tags on this NEXT event.
   port.push({ event: 'paula_consent_ready', ...pageContext(port.pathname()) });
   return false;
  },
  track(event: string): boolean {
   // Accepted-form/form_success is deliberately absent: generic 200 includes suppressed requests.
   if (!active() || revoked || !loaded || !EVENTS.has(event)) return false;
   if (event === 'whatsapp_click' ? !choice.advertising : !choice.analytics) return false;
   if (event === 'page_view' && pageViewed) return false;
   if (event === 'page_view') pageViewed = true;
   port.push({ event: `paula_${event}`, ...pageContext(port.pathname()) });
   return true;
  },
 };
}
