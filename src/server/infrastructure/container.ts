/**
 * Lightweight Dependency Injection Container
 *
 * Follows the Service Locator / IoC pattern without external libraries.
 * All services and repositories are registered once and resolved lazily.
 * This allows easy swapping of implementations for testing or new providers.
 *
 * Usage:
 *   container.register('ProductRepository', () => new PrismaProductRepository(prisma));
 *   const repo = container.resolve<IProductRepository>('ProductRepository');
 */

type Factory<T> = () => T;

class DIContainer {
  private readonly registry = new Map<string, Factory<unknown>>();
  private readonly singletons = new Map<string, unknown>();

  /**
   * Register a factory function for a token.
   * @param token  Unique string key
   * @param factory Function that creates the dependency
   * @param singleton Whether to cache after first resolution (default: true)
   */
  register<T>(token: string, factory: Factory<T>, singleton = true): void {
    if (singleton) {
      this.registry.set(token, () => {
        if (!this.singletons.has(token)) {
          this.singletons.set(token, factory());
        }
        return this.singletons.get(token) as T;
      });
    } else {
      this.registry.set(token, factory as Factory<unknown>);
    }
  }

  /**
   * Resolve a registered dependency by token.
   * Throws if the token is not registered.
   */
  resolve<T>(token: string): T {
    const factory = this.registry.get(token);
    if (!factory) {
      throw new Error(`[DI] Token not registered: "${token}". Did you forget to call register()?`);
    }
    return factory() as T;
  }

  /** True if the given token has a registered factory. */
  has(token: string): boolean {
    return this.registry.has(token);
  }

  /** Remove a registration (useful in tests). */
  unregister(token: string): void {
    this.registry.delete(token);
    this.singletons.delete(token);
  }

  /** Reset all registrations (useful in tests). */
  reset(): void {
    this.registry.clear();
    this.singletons.clear();
  }
}

/** Global container instance — import and use everywhere. */
export const container = new DIContainer();

// ── Token constants ────────────────────────────────────────────────────────────
// Use these instead of raw strings to avoid typos.
export const TOKENS = {
  // Repositories
  ProductRepository: 'ProductRepository',
  CategoryRepository: 'CategoryRepository',
  OrderRepository: 'OrderRepository',
  UserRepository: 'UserRepository',
  ReviewRepository: 'ReviewRepository',
  WishlistRepository: 'WishlistRepository',
  SellerRepository: 'SellerRepository',

  // Services
  ProductService: 'ProductService',
  SearchService: 'SearchService',
  OrderService: 'OrderService',
  CategoryService: 'CategoryService',
  ReviewService: 'ReviewService',
  SellerService: 'SellerService',
  AdminService: 'AdminService',
} as const;

export type ContainerToken = typeof TOKENS[keyof typeof TOKENS];
