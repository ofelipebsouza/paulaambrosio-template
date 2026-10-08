/** Public build-time kill switch; rebuild to disable the base Pixel. */
export const OPENAI_PIXEL_ENABLED = import.meta.env.PUBLIC_OPENAI_PIXEL_ENABLED !== 'false';
