import { checkoutUrl } from '../change-order/checkout';

const pendingButton = '<span class="button cream buy" aria-disabled="true">Inscrições em breve</span>';
const pendingNote = 'As inscrições serão disponibilizadas em breve. Nenhuma compra é realizada nesta página.';
const pendingFaq = 'O link de compra será disponibilizado em breve. Quando as inscrições abrirem, você poderá consultar o preço, os conteúdos incluídos e as condições de acesso antes de comprar.';
const pendingContents = 'A inclusão dos guias na compra ainda será confirmada.';

/** Render at build time: no client script, cookies or tracking required to buy. */
export function hostUpCheckout(body: string, configuredUrl: unknown): string {
  const url = checkoutUrl(configuredUrl);
  if (!url) return body;
  // Keep copy and CTA in sync; fail the build if the source contract changes.
  for (const marker of [pendingButton, pendingNote, pendingFaq, pendingContents]) {
    if (body.split(marker).length !== 2) throw new Error('HOST UP checkout markup changed; review the offer and FAQ.');
  }
  const href = url.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return body
    .replace(pendingButton, () => `<a class="button cream buy" href="${href}">Comprar na Hotmart · R$49</a>`)
    .replace(pendingContents, 'Confira na Hotmart quais guias estão incluídos na sua compra.')
    .replace(pendingNote, 'Você continuará para a Hotmart para consultar as condições e finalizar a compra.')
    .replace(pendingFaq, 'Use o botão “Comprar na Hotmart” nesta página. Confira o preço de R$49, os conteúdos incluídos e as condições de acesso na Hotmart antes de finalizar a compra.');
}
