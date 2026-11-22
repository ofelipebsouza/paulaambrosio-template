import type { CollectionEntry } from 'astro:content';

const firstProject = 'home-aa';

export function getHomeHeroProjects(projects: CollectionEntry<'projects'>[]) {
  const eligible = projects.filter(({ data }) => !data.draft && data.projectType !== 'Renders');
  const first = eligible.find(({ id }) => id === firstProject)
    ?? eligible.find(({ data }) => data.projectType === 'Residential');
  return (first ? [first, ...eligible.filter(({ id }) => id !== first.id)] : eligible).slice(0, 9);
}
