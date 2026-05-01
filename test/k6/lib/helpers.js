import { check, sleep } from 'k6';
import grpc from 'k6/net/grpc';

// Seed test users (matches 01-user-tracking-seed.sql)
export const USERS = [
  { id: 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', username: 'user1', lat: 10.776889, lon: 106.700981 },
  { id: '8c52c01e-42a7-45cc-9254-db8a7601c764', username: 'user2', lat: 21.028511, lon: 105.854167 },
  { id: '4405a37d-bc86-403e-b605-bedd7db88d37', username: 'user3', lat: 16.047079, lon: 108.220833 },
  { id: '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', username: 'user4', lat: 16.463713, lon: 107.590866 },
];

// circle_id → array of USERS indices that are members (admin excluded from test pool)
export const CIRCLES = {
  'cccccccc-1000-4000-8000-cccccccccccc': [0, 1, 2],
  'cccccccc-1001-4000-8000-cccccccccccc': [2, 3],
  'cccccccc-1002-4000-8000-cccccccccccc': [2],
  'cccccccc-1003-4000-8000-cccccccccccc': [0, 2],
  'cccccccc-1004-4000-8000-cccccccccccc': [3],
};

// user index → array of circle IDs the user belongs to
export const USER_CIRCLES = {
  0: ['cccccccc-1000-4000-8000-cccccccccccc', 'cccccccc-1003-4000-8000-cccccccccccc'],
  1: ['cccccccc-1000-4000-8000-cccccccccccc'],
  2: ['cccccccc-1000-4000-8000-cccccccccccc', 'cccccccc-1001-4000-8000-cccccccccccc',
      'cccccccc-1002-4000-8000-cccccccccccc', 'cccccccc-1003-4000-8000-cccccccccccc'],
  3: ['cccccccc-1001-4000-8000-cccccccccccc', 'cccccccc-1004-4000-8000-cccccccccccc'],
};

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Uniform random sleep in [minSec, maxSec] to simulate real user think time
export function thinkTime(minSec, maxSec) {
  sleep(minSec + Math.random() * (maxSec - minSec));
}

// Small coordinate noise so UpdateUserLocation creates distinct points each call
export function jitter(value, magnitude) {
  return value + (Math.random() - 0.5) * 2 * magnitude;
}

// Pick a peer member (different from userIdx) in the given circle
export function pickPeerInCircle(circleId, userIdx) {
  const members = CIRCLES[circleId];
  const peers = members.filter(idx => idx !== userIdx);
  return peers.length > 0 ? USERS[pickRandom(peers)] : USERS[members[0]];
}

// Assert gRPC response is OK and record to Rate metric (optional)
export function checkGrpcOk(res, successRate, label) {
  const ok = res !== null && res.status === grpc.StatusOK;
  check(res, { [`${label || 'gRPC'} status OK`]: () => ok });
  if (successRate) successRate.add(ok ? 1 : 0);
  if (!ok && res) {
    console.warn(`[${label}] error: ${JSON.stringify(res.error)}`);
  }
  return ok;
}
