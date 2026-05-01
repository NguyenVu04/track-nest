import http from 'k6/http';

const KEYCLOAK_URL         = __ENV.KEYCLOAK_URL             || 'https://api.tracknestapp.org/auth';
const PUBLIC_CLIENT_ID     = __ENV.PUBLIC_CLIENT_ID         || 'mobile';
const RESTRICTED_CLIENT_ID = __ENV.RESTRICTED_CLIENT_ID     || 'web';

const PUBLIC_REALM     = 'public-dev';
const RESTRICTED_REALM = 'restricted-dev';

// ── Core ──────────────────────────────────────────────────────────────────────

function getToken(username, password, realm) {
  const clientId = realm === RESTRICTED_REALM ? RESTRICTED_CLIENT_ID : PUBLIC_CLIENT_ID;
  const url      = `${KEYCLOAK_URL}/realms/${realm}/protocol/openid-connect/token`;
  const res = http.post(url, {
    grant_type: 'password',
    client_id:  clientId,
    username:   username,
    password:   password,
  });
  if (res.status !== 200) {
    const body = typeof res.body === 'string' ? res.body : '';
    console.error(`[auth] token fetch failed for ${username}@${realm}: HTTP ${res.status} — ${body}`);
    return null;
  }
  return JSON.parse(res.body).access_token;
}

// ── Public realm (public-dev) ─────────────────────────────────────────────────
// Users follow the pattern: username = password (e.g. user1/user1)

export function getUserToken(username) {
  return getToken(username, username, PUBLIC_REALM);
}

// Backward-compatible: accepts array of { username } objects (used by user-tracking)
export function getTokensForUsers(users) {
  const tokens = {};
  for (const user of users) {
    tokens[user.username] = getUserToken(user.username);
  }
  return tokens;
}

// ── Restricted realm (restricted-dev) ────────────────────────────────────────
// Emergency services: emgser1/emgser1, emgser2/emgser2, …
// Reporters:         reporter1/reporter1, reporter2/reporter2, …

export function getEmergencyServiceToken(username) {
  return getToken(username, username, RESTRICTED_REALM);
}

export function getReporterToken(username) {
  return getToken(username, username, RESTRICTED_REALM);
}

// Returns a { username → token } map for an array of emergency-service usernames
export function getEmergencyServiceTokens(usernames) {
  const tokens = {};
  for (const username of usernames) {
    tokens[username] = getEmergencyServiceToken(username);
  }
  return tokens;
}

// Returns a { username → token } map for an array of reporter usernames
export function getReporterTokens(usernames) {
  const tokens = {};
  for (const username of usernames) {
    tokens[username] = getReporterToken(username);
  }
  return tokens;
}
