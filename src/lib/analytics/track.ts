import { trackGoogleEvent } from '../google-tracking/browser';
import { track as vercelTrack } from '@vercel/analytics';
import type { AnalyticsEvent, AnalyticsMetadata } from './events';

const PRIVATE_KEYS = new Set([
	'name',
	'email',
	'phone',
	'message',
	'address',
	'token',
	'secret',
	'password',
]);

function sanitizeMetadata(metadata: AnalyticsMetadata = {}): AnalyticsMetadata {
	return Object.fromEntries(
		Object.entries(metadata).filter(([key, value]) => {
			if (PRIVATE_KEYS.has(key.toLowerCase())) return false;
			if (value === undefined || typeof value === 'object') return false;
			return true;
		}),
	);
}

export function trackEvent(event: AnalyticsEvent, metadata: AnalyticsMetadata = {}): void {
	// Google receives only an allowlisted event name and public catalog context, never this metadata.
	trackGoogleEvent(event);
	try {
		vercelTrack(event, sanitizeMetadata(metadata));
	} catch {
		// Analytics must never interrupt navigation, forms, or other business flows.
	}
}
