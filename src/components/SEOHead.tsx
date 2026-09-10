import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  faqs?: { question: string; answer: string }[];
  breadcrumbItems?: { name: string; url: string }[];
  articleData?: {
    title: string;
    datePublished: string;
    author: string;
    image?: string;
    description?: string;
  };
  serviceData?: {
    name: string;
    description: string;
    url: string;
  };
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl = window.location.href,
  ogImage = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85',
  faqs = [],
  breadcrumbItems,
  articleData,
  serviceData
}) => {
  useEffect(() => {
    document.title = title;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description);
    }

    const baseSchemas: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        'name': 'Paula Ambrosio Interiors',
        'alternateName': 'Paula Ambrosio Interior Design',
        'image': ogImage,
        '@id': 'https://paulaambrosiointeriors.com',
        'url': 'https://paulaambrosiointeriors.com',
        'telephone': '+1-305-555-0198',
        'priceRange': '$$$$',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': 'Biscayne Boulevard & 38th Street',
          'addressLocality': 'Miami',
          'addressRegion': 'FL',
          'postalCode': '33137',
          'addressCountry': 'US'
        },
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': 25.8118,
          'longitude': -80.1903
        },
        'openingHoursSpecification': {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday'
          ],
          'opens': '09:00',
          'closes': '18:00'
        },
        'founder': {
          '@type': 'Person',
          'name': 'Paula Ambrosio',
          'jobTitle': 'Founder & Principal Designer',
          'description': 'With more than two decades of interior design experience creating sophisticated luxury residential, turnkey and hospitality interiors in Miami and South Florida.',
          'url': 'https://www.paulaambrosio.com',
          'sameAs': [
            'https://www.instagram.com/paulaambrosio_',
            'https://www.linkedin.com/in/paulaambrosio'
          ]
        },
        'areaServed': [
          'Miami',
          'Miami Beach',
          'Sunny Isles Beach',
          'Aventura',
          'Bal Harbour',
          'Boca Raton',
          'Palm Beach',
          'Brickell',
          'Key Biscayne',
          'Coral Gables',
          'Coconut Grove'
        ],
        'sameAs': [
          'https://www.instagram.com/paulaambrosiointeriors',
          'https://www.linkedin.com/in/paulaambrosio',
          'https://www.houzz.com/pro/paulaambrosio'
        ]
      }
    ];

    if (faqs.length > 0) {
      baseSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer
          }
        }))
      });
    }

    if (breadcrumbItems && breadcrumbItems.length > 0) {
      baseSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://paulaambrosiointeriors.com'
          },
          ...breadcrumbItems.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 2,
            'name': item.name,
            'item': item.url
          }))
        ]
      });
    }

    if (articleData) {
      baseSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': articleData.title,
        'datePublished': articleData.datePublished,
        'author': {
          '@type': 'Person',
          'name': articleData.author
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Paula Ambrosio Interiors',
          'logo': 'https://paulaambrosiointeriors.com/logo.png'
        },
        'image': articleData.image || ogImage,
        'description': articleData.description || description,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': canonicalUrl
        }
      });
    }

    if (serviceData) {
      baseSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': serviceData.name,
        'description': serviceData.description,
        'url': serviceData.url,
        'provider': {
          '@type': 'ProfessionalService',
          'name': 'Paula Ambrosio Interiors'
        },
        'areaServed': 'South Florida',
        'serviceType': 'Interior Design'
      });
    }

    const scriptId = 'seo-structured-data';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(baseSchemas);

    const canonicalId = 'seo-canonical';
    let canonicalTag = document.getElementById(canonicalId) as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.id = canonicalId;
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonicalUrl;

    const ogImageTag = document.querySelector('meta[property="og:image"]');
    if (ogImageTag) {
      ogImageTag.setAttribute('content', ogImage);
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) {
      twitterDesc.setAttribute('content', description);
    }
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      twitterImage.setAttribute('content', ogImage);
    }

    return () => {};
  }, [title, description, canonicalUrl, ogImage, faqs, breadcrumbItems, articleData, serviceData]);

  return null;
};
