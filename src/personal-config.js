import { resolveCloudConfig } from './cloud-config.js';
// Deliberately NO fallback to the team/story project's environment variables.
export function resolvePersonalConfig(env = {}) {
  const config = resolveCloudConfig({
    VITE_SUPABASE_URL: env.VITE_ARCHISPACE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_ARCHISPACE_SUPABASE_PUBLISHABLE_KEY,
  });
  if (config.enabled) {
    const team = resolveCloudConfig(env);
    if (team.enabled && team.url === config.url)
      throw Error('The personal workspace must use a different Supabase project from team stories.');
  }
  return config;
}
export const personalConfig =
  typeof __PERSONAL_CLOUD_CONFIG__ !== 'undefined'
    ? __PERSONAL_CLOUD_CONFIG__
    : { enabled: false, url: '', key: '' };
export function publicHeaders() {
  const h = { apikey: personalConfig.key };
  if (personalConfig.key.startsWith('eyJ')) h.Authorization = 'Bearer ' + personalConfig.key;
  return h;
}
export async function publicPersonalRpc(name, args = {}) {
  if (!personalConfig.enabled) throw Error('The personal Supabase project is not connected yet.');
  const response = await fetch(personalConfig.url + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { ...publicHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    credentials: 'omit',
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok)
    throw Error(
      name === 'read_archispace_share'
        ? 'This link is invalid, expired, revoked or unavailable.'
        : 'The public profile is temporarily unavailable.',
    );
  return response.json();
}
