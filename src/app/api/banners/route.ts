import { listActiveBanners } from '@/server/services/banner.service';
import { jsonOk } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const placement = new URL(req.url).searchParams.get('placement') ?? 'hero';
  return jsonOk(await listActiveBanners(placement, 12));
}
