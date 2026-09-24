/// <reference types="astro/client" />

/**
 * Server-side environment variables.
 *
 * Only `PUBLIC_`-prefixed variables reach the browser bundle. Everything listed
 * below without that prefix stays on the server and must be configured in the
 * Vercel project (Production, Preview and Development), never in the repository.
 */
interface ImportMetaEnv {
	/** SMTP host. GoDaddy Professional Email (Titan): smtpout.secureserver.net */
	readonly SMTP_HOST?: string;
	/** 465 (TLS) for Titan, 587 (STARTTLS) for Microsoft 365. */
	readonly SMTP_PORT?: string;
	/** 'true' for implicit TLS (port 465), 'false' to require STARTTLS (587). */
	readonly SMTP_SECURE?: string;
	/** Mailbox that authenticates with SMTP — usually info@paulaambrosio.com */
	readonly SMTP_USER?: string;
	/** Mailbox password or app password. Server only. */
	readonly SMTP_PASSWORD?: string;
	/** Inbox that receives the inquiries. Defaults to SMTP_USER. */
	readonly CONTACT_RECIPIENT_EMAIL?: string;
	/** 'json' serialises emails to the server log instead of sending them (testing). */
	readonly CONTACT_MAIL_MODE?: 'smtp' | 'json';
	/** Requests allowed per window and the window length in seconds. */
	readonly CONTACT_RATE_LIMIT?: string;
	readonly CONTACT_RATE_LIMIT_WINDOW?: string;
	/** Optional pepper for the hashed rate-limit key. */
	readonly CONTACT_RATE_LIMIT_PEPPER?: string;
	/** Upstash Redis REST credentials — enable distributed rate limiting. */
	readonly UPSTASH_REDIS_REST_URL?: string;
	readonly UPSTASH_REDIS_REST_TOKEN?: string;
	/** Cloudflare Turnstile. Both keys are required to activate the challenge. */
	readonly TURNSTILE_SECRET_KEY?: string;
	readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}
