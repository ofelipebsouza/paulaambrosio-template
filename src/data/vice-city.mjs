/**
 * The final PDF and matching Stan Store product were confirmed for launch.
 * Never substitute a storefront or an invented URL.
 * See docs/vice-city-launch.md before changing these launch controls.
 */
export const viceCity = Object.freeze({
  name: 'Vice City',
  subtitle: 'Interior Design Guide',
  price: '5.99',
  currency: 'USD',
  format: 'PDF',
  language: 'English',
  readyForSale: true,
  checkoutUrl: 'https://stan.store/Paulaambrosio_/p/miami-style-made-simple?lang=en',
});

/**
 * Fail closed for unfinished products, invalid URLs and off-platform links.
 * This validates URL shape only; a human must verify the actual product first.
 * @param {{ readyForSale: boolean, checkoutUrl: string | null }} product
 * @returns {string | null}
 */
export function getViceCityCheckoutUrl(product = viceCity) {
  if (product.readyForSale !== true || typeof product.checkoutUrl !== 'string') return null;
  try {
    const url = new URL(product.checkoutUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'stan.store' || url.port || url.username || url.password) return null;
    // A seller storefront is not the product checkout. Require its product path.
    if (!/^\/[^/]+\/p\/[^/]+\/?$/.test(url.pathname)) return null;
    return url.href;
  } catch {
    return null;
  }
}
