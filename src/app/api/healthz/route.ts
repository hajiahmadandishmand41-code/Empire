/**
 * Compatibility health probe.
 *
 * Keep `/api/healthz` identical to `/api/health` so load balancers and
 * deployment platforms can use their conventional probe path.
 */
import { GET as healthGet } from '../health/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = healthGet;