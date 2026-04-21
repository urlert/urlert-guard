import { getDomain } from 'tldts';

export const DISMISS_DURATIONS = {
  TEN_MINUTES: 10 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
  FOREVER: 0, // Special value for perpetual dismissal
} as const;

export type DismissalDuration = keyof typeof DISMISS_DURATIONS;

const STORAGE_KEY = 'urlert_dismissed_domains';

export interface DismissedDomain {
  domain: string;
  expiresAt: number; // 0 means forever
}

export async function getDismissedDomains(): Promise<Record<string, number>> {
  const data = await browser.storage.local.get(STORAGE_KEY);
  return (data[STORAGE_KEY] as Record<string, number>) || {};
}

export async function isDomainDismissed(domain: string): Promise<boolean> {
  const registered = getDomain(domain) ?? domain;
  const dismissed = await getDismissedDomains();
  const expiresAt = dismissed[registered];

  if (expiresAt === undefined) return false;
  if (expiresAt === 0) return true; // Forever

  if (Date.now() > expiresAt) {
    // Clean up expired entry
    await undismissDomain(registered);
    return false;
  }

  return true;
}

export async function dismissDomain(domain: string, durationMs: number): Promise<void> {
  const registered = getDomain(domain) ?? domain;
  const dismissed = await getDismissedDomains();
  
  const expiresAt = durationMs === 0 ? 0 : Date.now() + durationMs;
  dismissed[registered] = expiresAt;
  
  await browser.storage.local.set({ [STORAGE_KEY]: dismissed });
}

export async function undismissDomain(domain: string): Promise<void> {
  const registered = getDomain(domain) ?? domain;
  const dismissed = await getDismissedDomains();
  
  delete dismissed[registered];
  
  await browser.storage.local.set({ [STORAGE_KEY]: dismissed });
}

export async function clearAllDismissals(): Promise<void> {
  await browser.storage.local.remove(STORAGE_KEY);
}
