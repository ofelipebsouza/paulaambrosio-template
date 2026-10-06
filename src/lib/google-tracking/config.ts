import type { TrackingConfig } from './core';
/** Empty/disabled until IDs AND a reviewed published GTM version are approved. */
export const GOOGLE_TRACKING: TrackingConfig = {
 enabled: import.meta.env.PUBLIC_GOOGLE_TRACKING_ENABLED === 'true',
 containerId: String(import.meta.env.PUBLIC_GTM_CONTAINER_ID ?? '').trim(),
 reviewedVersion: String(import.meta.env.PUBLIC_GTM_REVIEWED_VERSION ?? '').trim(),
};
