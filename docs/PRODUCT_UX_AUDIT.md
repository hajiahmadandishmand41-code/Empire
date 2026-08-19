# EmpireShop — Product UX Audit & Premium Marketplace Direction

## Product thesis

EmpireShop should feel like a calm, fast and trusted marketplace built specifically for Afghanistan. The product is not optimized by copying competitors; every surface earns its place by reducing time-to-product, increasing confidence, or improving conversion.

## Homepage decision

The chosen desktop/mobile direction is a compact **Split Hero** rather than a full-bleed campaign video or a floating-card collage. It keeps real product proof visible, works well with weak connections, and gives the brand a premium feel without consuming the first screen with decoration.

Final flow:

`Header → Hero → Popular categories → Special offers → Best sellers → Picked for you → New arrivals → Afghan products → Become a seller → Trust → Footer`

We intentionally removed separate **Popular** and **Featured** homepage blocks from the primary flow because they overlapped with best sellers/personalized discovery and increased page length without a distinct user job.

## Afghanistan-first UX rules

- Mobile first; thumb-reachable controls and horizontal product rails.
- AFN is the primary display currency.
- Search is a first-class navigation surface.
- Product discovery should normally take 2–3 interactions or fewer from Home.
- No critical journey depends on animation or localStorage; degraded environments must remain usable.
- Heavy imagery is lazy-loaded below the fold and remote image sizes are explicit.
- Motion is restrained and should respect reduced-motion preferences.
- Empty states should explain the next useful action instead of leaving blank sections.

## Personalization

The homepage now has a lightweight **Picked for you** rail. It uses recent product categories stored locally, then chooses from existing real homepage product data. This is intentionally a low-JavaScript, privacy-light first step; server-side recommendation ranking can be introduced later after event data is reliable.

## Trust model

The trust section is deliberately compact: purchase confidence, shipping, returns/guarantee, secure payment, and verified sellers. The same ideas should not be repeated as a second large trust wall inside the footer.

## Product page priorities

The product page should answer these questions in order:

1. What is it?
2. How much is it in AFN?
3. Is it available?
4. Who sells it?
5. Can I trust it?
6. How do I buy it now?
7. What do other buyers say?
8. What else is relevant?

The existing product page already has gallery, sticky purchase information on desktop, a mobile purchase bar, seller, stock, reviews and related products. Product structured data has also been added for SEO.

## Performance checklist

- `next/image` with explicit responsive `sizes`.
- Lazy loading for non-hero product images.
- Streaming/Suspense on asynchronous homepage sections.
- Compact mobile header; announcement bar is hidden on small screens.
- No decorative video in the Hero.
- Small, transform/opacity-focused motion surfaces.
- Skeleton cards remain available for async product rails.

## SEO checklist

- Locale-aware canonical product URLs.
- `hreflang` alternates for `fa`, `ps`, and `en` on product pages.
- Product JSON-LD with AFN offer price, availability, seller, and aggregate rating when real reviews exist.
- Independent product URLs for crawlable product detail pages.
- Category/shop routes remain navigable through semantic links.

## Quality scorecard (target)

| Area | Target |
|---|---:|
| Visual quality | 9/10 |
| Ease of use | 9/10 |
| Speed | 9/10 |
| Trust | 9/10 |
| Conversion readiness | 9/10 |
| Mobile UX | 9.5/10 |
| Shopping journey | 9/10 |
| Seller readiness | 8/10 |
| Scalability | 9/10 |
| Brand distinctiveness | 9/10 |

Seller workflows remain a separate phase after buyer-facing foundations and production CI are stable.
