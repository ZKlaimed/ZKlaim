/**
 * Application Constants
 * Centralized configuration values
 */

// Site metadata
export const SITE_NAME = 'ZKLAIM';
export const SITE_DESCRIPTION = 'Privacy-preserving insurance on Aleo blockchain';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zklaim.io';

// Navigation links
export const NAV_LINKS = {
  main: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Policies', href: '/policies' },
    { label: 'Claims', href: '/claims' },
    { label: 'Pools', href: '/pools' },
  ],
  products: [
    { label: 'Flight Delay', href: '/products/flight-delay', description: 'Coverage for flight delays and cancellations', disabled: false },
    { label: 'Weather Events', href: '/products/weather', description: 'Protection against weather-related losses', disabled: false },
    { label: 'Auto Insurance', href: '/products/auto', description: 'Coming soon', disabled: true },
  ],
  footer: {
    product: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Coverage Types', href: '/coverage' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Get a Quote', href: '/quote' },
    ],
    resources: [
      { label: 'Documentation', href: '/docs', external: true },
      { label: 'Developer API', href: '/api', external: true },
      { label: 'FAQ', href: '/faq' },
      { label: 'Support', href: '/support' },
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Security', href: '/security' },
    ],
  },
} as const;

// Social links
export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/zklaim',
  discord: 'https://discord.gg/zklaim',
  github: 'https://github.com/zklaim',
} as const;

// Coverage type display names
export const COVERAGE_TYPE_LABELS: Record<string, string> = {
  flight_delay: 'Flight Delay',
  weather_event: 'Weather Event',
  auto_collision: 'Auto Collision',
  health_basic: 'Health Basic',
};

// Policy status display config
export const POLICY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'secondary' },
  pending_proof: { label: 'Pending Proof', color: 'warning' },
  pending_payment: { label: 'Pending Payment', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  expired: { label: 'Expired', color: 'muted' },
  claimed: { label: 'Claimed', color: 'info' },
  cancelled: { label: 'Cancelled', color: 'destructive' },
};

// Claim status display config
export const CLAIM_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: 'secondary' },
  validating: { label: 'Validating', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'destructive' },
  paid: { label: 'Paid', color: 'success' },
  disputed: { label: 'Disputed', color: 'warning' },
};
