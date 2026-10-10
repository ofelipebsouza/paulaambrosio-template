import type { TrackingConfig } from './core';
/** Reviewed receipt-based Google Ads release. This reference does not pin the remote GTM version. */
export function trackingConfig(enabled: string | undefined): TrackingConfig {
 return {
  enabled: enabled === undefined || enabled === 'true',
  containerId: 'GTM-T36P2G6X',
  reviewedVersion: '11',
 };
}
/** Set PUBLIC_GOOGLE_TRACKING_ENABLED=false and rebuild to disable the loader. */
export const GOOGLE_TRACKING = trackingConfig(import.meta.env.PUBLIC_GOOGLE_TRACKING_ENABLED);

