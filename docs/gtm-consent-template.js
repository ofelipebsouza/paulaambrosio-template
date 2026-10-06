// REVIEW SOURCE ONLY, not an importable/published container. Configure sandbox
// permissions for consent access + these exact dataLayer keys. No network APIs.
// Trigger: Consent Initialization AND Custom Event paula_consent_update.
const setDefaultConsentState = require('setDefaultConsentState');
const updateConsentState = require('updateConsentState');
const copyFromDataLayer = require('copyFromDataLayer');
const templateStorage = require('templateStorage');
if (!templateStorage.getItem('paulaDefaultsSet')) {
 setDefaultConsentState({
  analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
 });
 templateStorage.setItem('paulaDefaultsSet', true);
}
updateConsentState({
 analytics_storage: copyFromDataLayer('paula_analytics_consent') === 'granted' ? 'granted' : 'denied',
 ad_storage: copyFromDataLayer('paula_advertising_consent') === 'granted' ? 'granted' : 'denied',
 ad_user_data: copyFromDataLayer('paula_advertising_consent') === 'granted' ? 'granted' : 'denied',
 ad_personalization: 'denied',
});
data.gtmOnSuccess();
