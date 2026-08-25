export interface Project {
  id: string;
  slug: string;
  title: string;
  subTitle: string;
  seoTitle: string;
  metaDescription: string;
  category: 'Residential' | 'Turnkey' | 'Hospitality';
  location: string;
  city: string;
  propertyType: string;
  services: string[];
  completionYear: string;
  coverImage: string;
  heroImage: string;
  galleryImages: {
    url: string;
    alt: string;
    caption?: string;
  }[];
  beforeAfter?: {
    beforeImage: string;
    afterImage: string;
    beforeLabel: string;
    afterLabel: string;
  };
  clientVision: string;
  designChallenge: string;
  approach: string;
  materialsDetails: string[];
  result: string;
  featured?: boolean;
}

export interface ServiceData {
  id: string;
  slug: string;
  url: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  intro: string;
  whatItMeans?: string;
  scopeItems: {
    title: string;
    description: string;
  }[];
  lifestyleStatement?: string;
  approach: string;
  processSteps: {
    step: string;
    title: string;
    description: string;
  }[];
  propertyTypes: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
  coverImage: string;
  accentImages: string[];
}

export interface LocationData {
  id: string;
  slug: string;
  url: string;
  city: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  hubOneLiner: string;
  localIntro: string;
  services: string[];
  featuredProjectSlug: string;
  processSteps: {
    step: string;
    title: string;
    description: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  heroImage: string;
  galleryImages: {
    url: string;
    alt: string;
  }[];
  highlights: string[];
}

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  coverImage: string;
  excerpt: string;
  content: string[];
  relatedServices: string[];
  relatedLocations: string[];
}
