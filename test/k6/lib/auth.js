/**
 * Keycloak authentication helpers for k6 performance tests.
 *
 * Auth flow: Resource Owner Password Credentials (ROPC) grant.
 * Each VU caches its token for the lifetime of the test iteration loop.
 *
 * Usage:
 *   import { getToken, bearerHeaders, decodeUserId } from '../../lib/auth.js';
 *
 *   const token = getToken('username', 'password');
 *   const userId = decodeUserId(token);          // JWT sub claim
 *   const headers = bearerHeaders(token);
 *   const headers = bearerHeaders(token, { 'X-User-Id': userId });
 */

import http from 'k6/http';
import encoding from 'k6/encoding';
import { check } from 'k6';

const KEYCLOAK_URL = __ENV.KEYCLOAK_URL || 'http://localhost/auth';
const REALM       = __ENV.KEYCLOAK_REALM || 'public-dev';
const CLIENT_ID   = __ENV.KEYCLOAK_CLIENT_ID || 'tracknest';

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;

/**
 * Obtain a Keycloak access token via ROPC grant.
 * Returns the raw JWT string, or null on failure.
 */
export function getToken(username, password) {
  const res = http.post(
    TOKEN_ENDPOINT,
    {
      grant_type: 'password',
      client_id:  CLIENT_ID,
      username,
      password,
      scope: 'openid profile email',
    },
    { tags: { name: 'keycloak_token' } }
  );

  const ok = check(res, { 'auth: 200 OK': (r) => r.status === 200 });
  if (!ok) {
    console.error(`getToken failed for ${username}: HTTP ${res.status} – ${res.body}`);
    return null;
  }
  return res.json('access_token');
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
