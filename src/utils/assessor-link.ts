/**
 * Utility to format and normalize the assessor onboarding profile link.
 * Ensures the link strictly conforms to: https://uninet-be.onrender.com/assess-onboarding/...
 */
export const ASSESSOR_ONBOARDING_BASE_URL = 'https://uninet-be.onrender.com';

export const formatAssessorOnboardingLink = (rawLink: string | null | undefined): string => {
  if (!rawLink || !rawLink.trim()) {
    return `${ASSESSOR_ONBOARDING_BASE_URL}/assess-onboarding/`;
  }

  const trimmed = rawLink.trim();

  // If already an absolute HTTP/HTTPS URL
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      let pathWithQuery = url.pathname + url.search + url.hash;

      // Strip leading /api prefix if backend prepended it
      if (pathWithQuery.startsWith('/api/assess-onboarding')) {
        pathWithQuery = pathWithQuery.replace(/^\/api/, '');
      }

      if (pathWithQuery.includes('assess-onboarding')) {
        const cleanPath = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
        return `${ASSESSOR_ONBOARDING_BASE_URL}${cleanPath}`;
      }

      // If pathname doesn't have assess-onboarding, prepend it
      const tokenPath = pathWithQuery.replace(/^\/+/, '');
      return `${ASSESSOR_ONBOARDING_BASE_URL}/assess-onboarding/${tokenPath}`;
    } catch {
      // Fall through to relative handling if URL parsing failed
    }
  }

  // Handle relative paths
  let cleanPath = trimmed;
  if (cleanPath.startsWith('/api/assess-onboarding')) {
    cleanPath = cleanPath.replace(/^\/api/, '');
  }

  if (cleanPath.includes('assess-onboarding')) {
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }
    return `${ASSESSOR_ONBOARDING_BASE_URL}${cleanPath}`;
  }

  // If it's a bare token or GUID
  const token = cleanPath.replace(/^\/+/, '');
  return `${ASSESSOR_ONBOARDING_BASE_URL}/assess-onboarding/${token}`;
};

