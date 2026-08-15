# API Layer — Phase 6

A thin, backend-agnostic surface used by the app to fetch products,
categories and orders. Nothing here talks to a real backend yet.

```
import { api } from '@/lib/api';

const products = await api.products.list({ q: 'saffron' });
const product  = await api.products.bySlug('nangarhar-saffron-premium');
const cats     = await api.categories.list();
```

## How it works

- `apiConfig.baseUrl` is read from `NEXT_PUBLIC_API_BASE_URL`.
- When empty (default), every endpoint delegates to
  `src/lib/mock` — the in-memory adapter over the existing
  feature mocks. **No component needs to know.**
- When set, endpoint modules should switch to `apiFetch(...)`
  and hit the real backend. That's the only file to edit.

## Files

- `config.ts` — base URL + defaults.
- `client.ts` — fetch wrapper with timeout & typed errors.
- `errors.ts` — `ApiError` class + `isApiError` guard.
- `endpoints.ts` — canonical route paths.
- `products.ts` / `categories.ts` / `orders.ts` — domain endpoints.
- `index.ts` — public `api` object.
