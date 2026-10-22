type MotionLibraries = {
	gsap: typeof import('gsap').gsap;
	ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
};

async function loadMotion(): Promise<MotionLibraries> {
	const [{ gsap }, { ScrollTrigger }] = await Promise.all([
		import('gsap'),
		import('gsap/ScrollTrigger'),
	]);
	return { gsap, ScrollTrigger };
}

/** Progressive enhancement scoped to Millwork. Nothing is hidden before JS loads.
 * GSAP lifecycle: https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/
 * Batched entrances: https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.batch()/
 */
export function initMillworkMotion(root: HTMLElement, load = loadMotion): () => void {
	const document = root.ownerDocument;
	const view = document.defaultView;
	if (!view) return () => {};

	const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
	let media: ReturnType<MotionLibraries['gsap']['matchMedia']> | undefined;
	let disposed = false;
	let loading = false;

	const start = async () => {
		// Reduced-motion visitors do not download GSAP or ScrollTrigger.
		if (disposed || reduced.matches || media || loading) return;
		loading = true;
		try {
			const { gsap, ScrollTrigger } = await load();
			if (disposed || reduced.matches) return;
			gsap.registerPlugin(ScrollTrigger);
			media = gsap.matchMedia();
			media.add({
				desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
				mobile: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
			}, (context) => {
				const desktop = Boolean(context.conditions?.desktop);
				let active = true;
				// One editorial sequence. CSS sticky follows normal document scrolling;
				// the timeline only crossfades approved studies and fills the step rules.
				const story = root.querySelector<HTMLElement>('.millwork-story');
				const storySteps = story?.querySelector<HTMLElement>('.millwork-story-steps');
				const frames = story ? [...story.querySelectorAll<HTMLElement>('.millwork-story-frame')] : [];
				const fills = story ? [...story.querySelectorAll<HTMLElement>('.millwork-story-fill')] : [];
				if (desktop && story && storySteps && frames.length === 3 && fills.length === 3) {
					// Register the layout restoration before any animation can fail.
					context.add(() => {
						story.setAttribute('data-story-motion', '');
						return () => story.removeAttribute('data-story-motion');
					});
					gsap.set(frames.slice(1), { opacity: 0 });
					gsap.set(fills, { scaleX: 0 });
					const narrative = gsap.timeline({
						defaults: { ease: 'none' },
						scrollTrigger: {
							id: 'millwork-material-story', trigger: storySteps,
							start: 'top 60%', end: 'bottom 60%', scrub: 0.45,
							invalidateOnRefresh: true,
						},
					});
					frames.forEach((frame, index) => {
						narrative.to(fills[index], { scaleX: 1, duration: 1 }, index);
						const image = frame.querySelector('img');
						if (image) narrative.fromTo(image, { scale: 1.035 }, {
							scale: 1, duration: 0.8, immediateRender: false,
						}, Math.max(0, index - 0.16));
						if (index > 0) {
							narrative.to(frames[index - 1], { opacity: 0, duration: 0.32 }, index - 0.16);
							narrative.to(frame, { opacity: 1, duration: 0.32 }, index - 0.16);
						}
					});
				}

				// Do not replay an entrance over content already in view or above it.
				const upcoming = [...root.querySelectorAll<HTMLElement>('.millwork-reveal')]
					.filter((item) => item.getBoundingClientRect().top >= view.innerHeight * 0.88);

				ScrollTrigger.batch(upcoming, {
					start: 'top 88%',
					once: true,
					interval: 0.08,
					batchMax: desktop ? 3 : 1,
					onEnter: (batch) => {
						if (!active || disposed || reduced.matches) return;
						// Register delayed callbacks too, so media.revert() owns every tween.
						context.add(() => {
							gsap.fromTo(batch, { y: desktop ? 24 : 12, opacity: 0.72 }, {
								y: 0, opacity: 1, duration: desktop ? 0.8 : 0.5,
								stagger: desktop ? 0.1 : 0, ease: 'power2.out',
								clearProps: 'transform,opacity', overwrite: 'auto',
							});
						});
					},
				});

				const progress = root.querySelector<HTMLElement>('.millwork-scroll-progress');
				if (progress) {
					gsap.set(progress, { autoAlpha: 1 });
					gsap.fromTo(progress, { scaleX: 0 }, {
						scaleX: 1, ease: 'none',
						scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.2 },
					});
				}

				const hero = root.querySelector<HTMLImageElement>('.millwork-hero-media img');
				if (desktop && hero && view.matchMedia('(hover: hover) and (pointer: fine)').matches) {
					// A small travel, with enough image overscan to avoid exposed edges.
					gsap.fromTo(hero, { y: 0, scale: 1.06 }, {
						y: 16, scale: 1.06, ease: 'none',
						scrollTrigger: { trigger: hero.parentElement, start: 'top top', end: 'bottom top', scrub: 0.6 },
					});
				}
				return () => { active = false; };
			}, root);
		} catch {
			// A failed animation chunk must leave the page readable and usable.
			media?.revert();
			media = undefined;
		} finally {
			loading = false;
		}
	};

	const cleanup = () => {
		if (disposed) return;
		disposed = true;
		media?.revert();
		reduced.removeEventListener('change', start);
		view.removeEventListener('pagehide', onPageHide);
		document.removeEventListener('astro:before-swap', cleanup);
	};
	const onPageHide = (event: PageTransitionEvent) => {
		// Keep the context for native back/forward-cache restoration.
		if (!event.persisted) cleanup();
	};
	reduced.addEventListener('change', start);
	view.addEventListener('pagehide', onPageHide);
	document.addEventListener('astro:before-swap', cleanup, { once: true });
	void start();
	return cleanup;
}
