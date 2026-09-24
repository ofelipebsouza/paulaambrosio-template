export const ANALYTICS_EVENTS = {
	CTA_START_PROJECT: 'cta_start_project',
	CTA_EXPLORE_SERVICES: 'cta_explore_services',
	CTA_VIEW_PROJECT: 'cta_view_project',
	CTA_TURNKEY: 'cta_turnkey',
	CTA_CONTACT: 'cta_contact',
	FORM_START: 'form_start',
	FORM_SUBMIT: 'form_submit',
	FORM_SUCCESS: 'form_success',
	FORM_ERROR: 'form_error',
	PHONE_CLICK: 'phone_click',
	EMAIL_CLICK: 'email_click',
	WHATSAPP_CLICK: 'whatsapp_click',
	INSTAGRAM_CLICK: 'instagram_click',
	PORTFOLIO_OPEN: 'portfolio_open',
	SERVICE_OPEN: 'service_open',
	FAQ_OPEN: 'faq_open',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsMetadata = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsTier = 'primary_conversion' | 'secondary_conversion' | 'engagement';

export const ANALYTICS_TIERS: Record<AnalyticsEvent, AnalyticsTier> = {
	cta_start_project: 'secondary_conversion',
	cta_explore_services: 'engagement',
	cta_view_project: 'engagement',
	cta_turnkey: 'engagement',
	cta_contact: 'secondary_conversion',
	form_start: 'engagement',
	form_submit: 'secondary_conversion',
	form_success: 'primary_conversion',
	form_error: 'engagement',
	phone_click: 'secondary_conversion',
	email_click: 'secondary_conversion',
	whatsapp_click: 'secondary_conversion',
	instagram_click: 'engagement',
	portfolio_open: 'engagement',
	service_open: 'engagement',
	faq_open: 'engagement',
};
