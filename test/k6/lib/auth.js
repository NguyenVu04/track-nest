/**
 * Keycloak authentication helpers for k6 performance tests.
 *
 * Auth flow: Resource Owner Password Credentials (ROPC) grant.
 * Each VU caches its token for the lifetime of the test iteration loop.
 *
 * Usage:
 *   import { getMobileToken, getWebToken, bearerHeaders, decodeUserId } from '../../lib/auth.js';
 *
 *   const mobileToken = getMobileToken('username', 'password');
 *   const webToken = getWebToken('username', 'password');
 *   const userId = decodeUserId(mobileToken);    // JWT sub claim
 *   const headers = bearerHeaders(mobileToken);
 *   const headers = bearerHeaders(mobileToken, { 'X-User-Id': userId });
 */

import http from 'k6/http';
import encoding from 'k6/encoding';
import { check } from 'k6';

const env = JSON.parse(open('./data/env.json'));
const KEYCLOAK_URL = env.KEYCLOAK_URL || 'http://localhost/auth';
const PUBLIC_REALM = env.KEYCLOAK_PUBLIC_REALM || 'public-dev';
const RESTRICTED_REALM = env.KEYCLOAK_RESTRICTED_REALM || 'restricted-dev';
const MOBILE_CLIENT_ID = env.KEYCLOAK_MOBILE_CLIENT_ID || 'mobile';
const WEB_CLIENT_ID = env.KEYCLOAK_WEB_CLIENT_ID || 'web';

const TOKEN_PUBLIC_ENDPOINT = `${KEYCLOAK_URL}/realms/${PUBLIC_REALM}/protocol/openid-connect/token`;
const TOKEN_RESTRICTED_ENDPOINT = `${KEYCLOAK_URL}/realms/${RESTRICTED_REALM}/protocol/openid-connect/token`;

/**
 * Obtain a Keycloak access token via ROPC grant.
 * Returns the raw JWT string, or null on failure.
 */
export function getPublicToken(username, password) {
  const res = http.post(
    TOKEN_PUBLIC_ENDPOINT,
    {
      grant_type: 'password',
      client_id:  MOBILE_CLIENT_ID,
      username,
      password,
      scope: 'openid profile email',
    },
    { tags: { name: 'keycloak_token' } }
  );

  const ok = check(res, { 'auth: 200 OK': (r) => r.status === 200 });
  if (!ok) {
    console.error(`getPublicToken failed for ${username}: HTTP ${res.status} – ${res.body}`);
    return null;
  }
  return res.json('access_token');
}

export function getRestrictedToken(username, password) {
  const res = http.post(
    TOKEN_RESTRICTED_ENDPOINT,
    {
      grant_type: 'password',
      client_id:  WEB_CLIENT_ID,
      username,
      password,
      scope: 'openid profile email',
    },
    { tags: { name: 'keycloak_token' } }
  );

  const ok = check(res, { 'auth: 200 OK': (r) => r.status === 200 });
  if (!ok) {
    console.error(`getRestrictedToken failed for ${username}: HTTP ${res.status} – ${res.body}`);
    return null;
  }
  return res.json('access_token');
}

// Backward-compatible aliases used in older scripts.
export function getMobileToken(username, password) {
  return getPublicToken(username, password);
}

export function getWebToken(username, password) {
  return getRestrictedToken(username, password);
}

/**
 * Generic token helper with explicit realm selection.
 * realm: 'public' | 'restricted'
 */
export function getToken(username, password, realm = 'public') {
  return realm === 'restricted'
    ? getRestrictedToken(username, password)
    : getPublicToken(username, password);
}

/**
 * Decode the JWT payload and return the `sub` claim (user UUID).
 * k6 does not have atob(), so we use k6/encoding.
 */
export function decodeUserId(token) {
  if (!token) return null;
  try {
    const payloadB64 = token.split('.')[1];
    const payload = JSON.parse(encoding.b64decode(payloadB64, 'rawurl', 's'));
    return payload.sub || null;
  } catch (_) {
    return null;
  }
}

/**
 * Build an HTTP headers object for authenticated requests.
 *
 * @param {string} token - Bearer JWT
 * @param {Object} extra - additional headers to merge (e.g. { 'X-User-Id': id })
 */
export function bearerHeaders(token, extra = {}) {
  return Object.assign(
    {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type':  'application/json',
    },
    extra
  );
}
