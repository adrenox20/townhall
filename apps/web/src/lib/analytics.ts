import posthog from 'posthog-js';
import { API_URL } from './constants';
import type { SessionUser } from './permissions';

export const POSTHOG_KEY = 'phc_oLm8fb7L4CXDqGdJcc7a6boCtR8rVjf6dNx7G995eGdy';
export const POSTHOG_APP = 'townhall';
export const POSTHOG_API_HOST = `${new URL(API_URL).origin}/ingest`;

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function captureEvent(event: string, properties?: EventProperties) {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}

// Grievances are sensitive: identify by internal user id only, never email or name.
export function identifyUser(user: SessionUser) {
  if (!posthog.__loaded) return;
  posthog.identify(user.id, { roles: user.roles.join(',') });
}

export function resetUser() {
  if (!posthog.__loaded) return;
  posthog.reset();
}
