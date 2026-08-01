import { SITE_NAME, SITE_URL } from '@/lib/constants';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
}

export default function SEOHead({ title, description, canonicalPath, ogImage }: SEOHeadProps) {
  const canonicalURL = `${SITE_URL}${canonicalPath}`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const image = ogImage || `${SITE_URL}/images/og-default.jpg`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalURL} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <link rel="canonical" href={canonicalURL} />
    </>
  );
}
