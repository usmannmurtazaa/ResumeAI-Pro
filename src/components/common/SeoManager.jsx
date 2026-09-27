import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { siteConfig, getSeoForPath } from '../../config/siteConfig';

/**
 * SeoManager
 *
 * Injects per-route metadata into <head> using react-helmet-async.
 * Renders nothing. Mounted once inside the router in App.jsx.
 *
 * Reads route-specific titles, descriptions, robots directives, and
 * canonical URLs from siteConfig.seo.routes via getSeoForPath().
 *
 * Any page that renders its own <Helmet> (e.g. BlogPost with a specific
 * article title) will override these defaults - that is intentional.
 */
const SeoManager = () => {
  const { pathname } = useLocation();

  const seo = getSeoForPath(pathname);

  const siteUrl = siteConfig.seo.siteUrl;
  const canonicalUrl = pathname === '/' ? `${siteUrl}/` : `${siteUrl}${pathname}`;
  const image = siteConfig.seo.defaultImage;

  return (
    <Helmet>
      {/* Primary */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="robots" content={seo.robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteConfig.seo.siteName} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={siteConfig.seo.defaultImageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteConfig.seo.twitterHandle} />
      <meta name="twitter:creator" content={siteConfig.seo.twitterCreator} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SeoManager;
