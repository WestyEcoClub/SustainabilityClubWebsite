const DEFAULT_SITE_URL = 'http://localhost:3000';

export const SITE_NAME = 'Sustainability Club';

export const getSiteUrl = () => {
  const value = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL;
  return value.replace(/\/$/, '');
};

