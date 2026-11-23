/**
 * Utility to format and normalize the assessor onboarding profile link.
 * Ensures the link strictly conforms to: https://uninet-be.onrender.com/assessor-onboarding/profile.html#token=...
 * and eliminates duplicate/redundant path segments such as assess-onboarding or assessor-boarding.
 */
export const ASSESSOR_ONBOARDING_BASE_URL = 'https://uninet-be.onrender.com';

export const formatAssessorOnboardingLink = (rawLink: string | null | undefined): string => {
  if (!rawLink || !rawLink.trim()) {
    return `${ASSESSOR_ONBOARDING_BASE_URL}/assessor-onboarding/profile.html`;
  }

  const trimmed = rawLink.trim();

  let pathWithQueryAndHash = trimmed;

  // If already an absolute HTTP/HTTPS URL, extract the path, search, and hash
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      pathWithQueryAndHash = url.pathname + url.search + url.hash;
    } catch {
      pathWithQueryAndHash = trimmed.replace(/^https?:\/\/[^/]+/i, '');
    }
  }

  // Ensure leading slash
  if (!pathWithQueryAndHash.startsWith('/')) {
    pathWithQueryAndHash = `/${pathWithQueryAndHash}`;
  }

  // Strip leading /api prefix if present
  if (pathWithQueryAndHash.startsWith('/api/')) {
    pathWithQueryAndHash = pathWithQueryAndHash.replace(/^\/api/, '');
  }

  // Remove duplicate/extra prefixes (e.g. /assess-onboarding/assessor-onboarding/..., /assessor-boarding/assessor-onboarding/...)
  pathWithQueryAndHash = pathWithQueryAndHash.replace(
    /^\/(?:assess-onboarding|assessor-boarding|assessor-onboardings|assessor-onboarding)\/(assessor-onboarding\/.*)$/,
    '/$1'
  );

  // Normalize /assessor-boarding/ typo to /assessor-onboarding/
  pathWithQueryAndHash = pathWithQueryAndHash.replace(
    /^\/assessor-boarding\//,
    '/assessor-onboarding/'
  );

  // If input already has /assessor-onboarding/
  if (pathWithQueryAndHash.startsWith('/assessor-onboarding/')) {
    return `${ASSESSOR_ONBOARDING_BASE_URL}${pathWithQueryAndHash}`;
  }

  // If input has /assess-onboarding/ without assessor-onboarding
  if (pathWithQueryAndHash.startsWith('/assess-onboarding/')) {
    const after = pathWithQueryAndHash.replace(/^\/assess-onboarding\//, '');
    if (after.startsWith('profile.html')) {
      return `${ASSESSOR_ONBOARDING_BASE_URL}/assessor-onboarding/${after}`;
    }
    if (after.includes('#token=') || after.includes('token=')) {
      return `${ASSESSOR_ONBOARDING_BASE_URL}/assessor-onboarding/profile.html${after.startsWith('#') ? '' : '#'}${after}`;
    }
    return `${ASSESSOR_ONBOARDING_BASE_URL}/assessor-onboarding/profile.html#token=${after}`;
  }

  // If input is /profile.html...
  if (pathWithQueryAndHash.startsWith('/profile.html')) {
    return `${ASSESSOR_ONBOARDING_BASE_URL}/assessor-onboarding${pathWithQueryAndHash}`;
  }

  // If it's a bare token or GUID
  const token = pathWithQueryAndHash.replace(/^\/+/, '');
  return `${ASSESSOR_ONBOARDING_BASE_URL}/assessor-onboarding/profile.html#token=${token}`;
};
