# features/

Each business capability gets its own folder under `features/`. This keeps
phases 2+ (Home, Catalog, Cart, Auth, Checkout…) isolated from the global
components and design system.

Conventions:

```
features/
└── catalog/
    ├── components/      # Catalog-only React components (client + server)
    ├── hooks/           # Domain hooks (useCart, useProducts, …)
    ├── lib/             # Domain helpers (fetchers, mappers)
    ├── types.ts         # Catalog-only TypeScript types
    └── index.ts         # Public surface — only export what's needed externally
```

In foundation phase this folder is intentionally empty.
