export const registerCredentials = {
  outlookEmail: process.env.OUTLOOK_EMAIL ?? '',
  outlookPassword: process.env.OUTLOOK_PASSWORD ?? '',
  outlookInboxUrl: process.env.OUTLOOK_INBOX_URL ?? '',
  accountPassword: process.env.ACCOUNT_PASSWORD ?? 'changeme',
  emailPrefix: process.env.EMAIL_PREFIX ?? 'demo+',
  emailDomain: process.env.EMAIL_DOMAIN ?? '@example.com',
};

export const adminCredentials = {
  email: process.env.ADMIN_EMAIL ?? '',
  password: process.env.ADMIN_PASSWORD ?? '',
};

export const urls = {
  register: process.env.APP_REGISTER_URL ?? 'https://example.com/register',
  home: process.env.APP_HOME_URL ?? 'https://example.com/',
  login: process.env.APP_LOGIN_URL ?? 'https://example.com/login',
  verifyProfile: process.env.APP_VERIFY_PROFILE_URL ?? 'https://example.com/verify-profile',
  admin: process.env.ADMIN_URL ?? 'https://example.com/admin/',
  verifications: process.env.ADMIN_VERIFICATIONS_URL ?? 'https://example.com/admin/verifications',
  users: process.env.ADMIN_USERS_URL ?? 'https://example.com/admin/users',
  app: process.env.APP_HOME_URL ?? 'https://example.com/',
};

/** Hostname helpers derived from configured URLs (no hardcoded company domains). */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'example.com';
  }
}

export function cookieDomainsFor(url: string): string[] {
  const host = hostnameOf(url);
  const parts = host.split('.').filter(Boolean);
  const root =
    parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : host.startsWith('.') ? host : `.${host}`;
  return Array.from(new Set([host, root, host.replace(/^\./, '')]));
}

export const appHostname = hostnameOf(urls.app);
export const adminHostname = hostnameOf(urls.admin);

export const registerFields = {
  woman: 'Woman',
  orientation: 'Straight',
  birthDay: '15',
  birthMonth: 'Jun',
  birthYear: '1990',
  relationshipStatus: 'Single',
  bodyType: 'Athletic',
  height: '170cm (5 ft 7 in)',
  bio: 'I enjoy meeting new people, exploring meaningful connections, and sharing authentic conversations.',
  emailExistsMessage: 'An account with this email already exists.',
  otpVerificationHeading: 'Enter the 6-digit code',
  lookingForOptions: ['Woman', 'Couple', 'Couple FF'],
  relationshipPreferences: ['Dating', 'Hookup', 'FWB'],
};

export const adminFields = {
  approvalReason: 'Identity documents verified successfully for automated woman test.',
};

export const verifyProfileFields = {
  idVerificationImageFolder: process.env.ID_VERIFICATION_IMAGE_FOLDER ?? '',
  submissionSuccessMessage: 'verification submit successfully',
};
