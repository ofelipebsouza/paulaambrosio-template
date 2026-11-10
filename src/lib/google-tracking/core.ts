/** Privacy-first transport boundary. Never accepts form metadata or contact values. */
import { isLeadAcceptance } from '../lead-acceptance';
export interface ConsentChoice { analytics: boolean; advertising: boolean; }
export interface SavedConsent extends ConsentChoice { version: 1; at: number; }
export interface TrackingConfig { enabled: boolean; containerId: string; reviewedVersion: string; }
export interface ConsentModeState {
 analytics_storage: 'granted' | 'denied';
 ad_storage: 'granted' | 'denied';
 ad_user_data: 'granted' | 'denied';
 ad_personalization: 'denied';
 wait_for_update?: number;
}
export interface TrackingPort {
 hostname(): string;
 pathname(): string;
 push(value: Record<string, unknown>): void;
 /** Consent Mode update. The document head owns the default and gtm.js. */
 updateConsent?(state: ConsentModeState): void;
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
 'email_click', 'whatsapp_click', 'sms_click', 'instagram_click', 'portfolio_open', 'service_open', 'faq_open']);

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

const PRIVATE_PATH = /^\/(admin|api|style-guides-and-branding)(\/|$)/;
export function trackingPathAllowed(pathname: string): boolean {
 return !PRIVATE_PATH.test(pathname.split(/[?#]/, 1)[0]);
}

/** Denied storage until a saved or banner choice. Personalization is never granted. */
export function consentModeState(choice: ConsentChoice, waitForUpdate?: number): ConsentModeState {
 return {
  analytics_storage: choice.analytics ? 'granted' : 'denied',
  ad_storage: choice.advertising ? 'granted' : 'denied',
  ad_user_data: choice.advertising ? 'granted' : 'denied',
  ad_personalization: 'denied',
  ...(waitForUpdate ? { wait_for_update: waitForUpdate } : {}),
 };
}

/**
 * Consent Mode v2 advanced head: default denied, optional saved update, then gtm.js.
 * No standalone gtag.js loader and no noscript iframe. Returns '' for an invalid id.
 */
export function googleHeadScripts(containerId: string): string {
 if (!/^GTM-[A-Z0-9]{6,}$/.test(containerId)) return '';
 const denied = JSON.stringify(consentModeState({ analytics: false, advertising: false }, 500));
 const key = JSON.stringify(CONSENT_KEY);
 const id = JSON.stringify(containerId);
 return `<script>
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function gtag(){window.dataLayer.push(arguments);};
window.gtag('consent','default',${denied});
try{var saved=JSON.parse(localStorage.getItem(${key})||'null');var now=Date.now();if(saved&&saved.version===1&&typeof saved.analytics==='boolean'&&typeof saved.advertising==='boolean'&&typeof saved.at==='number'&&Number.isFinite(saved.at)&&saved.at<=now&&now-saved.at<=${CONSENT_MAX_AGE}){window.gtag('consent','update',{analytics_storage:saved.analytics?'granted':'denied',ad_storage:saved.advertising?'granted':'denied',ad_user_data:saved.advertising?'granted':'denied',ad_personalization:'denied'});}}catch(e){}
</script>
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.referrerPolicy='origin';j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${id});
</script>`;
}

export function pageContext(pathname: string): { page_section: string; service_key: string } {
 const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') + '/';
 const service = SERVICES[path];
 if (service) return { page_section: 'service', service_key: service };
 if (path === '/') return { page_section: 'home', service_key: 'none' };
 const section = ['about', 'contact', 'services', 'projects', 'journal', 'locations', 'spaces', 'press', 'faq', 'privacy', 'millwork', 'new-york-clients']
  .find((part) => path === `/${part}/` || path.startsWith(`/${part}/`));
 return { page_section: section ?? 'other', service_key: 'none' };
}

export function createTracking(config: TrackingConfig, port: TrackingPort) {
 let choice: ConsentChoice = { analytics: false, advertising: false };
 let loaded = false;
 let revoked = false;
 let pageViewed = false;
 const accepted = new Set<string>();
 const active = () => configReady(config, port.hostname()) && trackingPathAllowed(port.pathname());
 const publishConsent = () => { if (active()) port.updateConsent?.(consentModeState(choice)); };
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
  /** Banner rejection never reaches the grant path; still updates Consent Mode once there. */
  publishConsent,
  /** Returns true when a fresh document is recommended after permission removal. */
  consent(next: ConsentChoice): boolean {
   const unchanged = choice.analytics === next.analytics && choice.advertising === next.advertising;
   const removed = (choice.analytics && !next.analytics) || (choice.advertising && !next.advertising);
   choice = { analytics: next.analytics === true, advertising: next.advertising === true };
   if (!active()) return false;
   if (loaded && removed) {
    // Stop first-party emission immediately. A reload clears tag code for other vendors.
    revoked = true;
    publishConsent();
    port.push(consentEvent());
    return true;
   }
   if (revoked || (!choice.analytics && !choice.advertising) || (loaded && unchanged)) return false;
   // Apply the Consent Mode command before any following dataLayer event.
   publishConsent();
   port.push(consentEvent());
   loaded = true;
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
  /** Only an opaque receipt from durable server acceptance can produce a lead. */
  acceptedLead(value: unknown): boolean {
   if (!isLeadAcceptance(value) || !active() || revoked || !loaded || !choice.advertising || accepted.has(value.eventId)) return false;
   port.push({ event: 'paula_lead_accepted', transaction_id: value.eventId, ...pageContext(port.pathname()) });
   accepted.add(value.eventId);
   return true;
  },
 };
}

