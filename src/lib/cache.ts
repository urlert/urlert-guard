interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

type StorageCache<T> = Record<string, CacheEntry<T>>;

interface DomainCacheOptions {
  /** browser.storage.local key under which the cache object is stored */
  storageKey: string;
  /** TTL in ms for a non-null result */
  ttlHit: number;
  /** TTL in ms for a null result */
  ttlMiss: number;
}

/**
 * Two-layer cache (memory + browser.storage.local) with in-flight deduplication.
 *
 * - Memory layer: zero-overhead reads within the current service worker session.
 * - storage.local layer: survives service worker restarts (MV3).
 * - In-flight map: concurrent calls for the same key share one network request.
 */
export class DomainCache<T> {
  private memCache = new Map<string, CacheEntry<T | null>>();
  private inflight = new Map<string, Promise<T | null>>();
  private readonly opts: DomainCacheOptions;
  private lastPruneTime = 0;
  private static readonly PRUNE_INTERVAL = 2 * 60 * 1000; // 2 minutes

  constructor(opts: DomainCacheOptions) {
    this.opts = opts;
  }

  async get(key: string): Promise<T | null | undefined> {
    const now = Date.now();

    // 1. In-memory fast path
    const mem = this.memCache.get(key);
    if (mem && now < mem.expiresAt) {
      this.pruneIfNeeded(now);
      return mem.value;
    }
    // Remove expired in-memory entry eagerly
    if (mem) this.memCache.delete(key);

    // 2. Persistent storage (survives SW restarts)
    const storageCache = await this.readStorage();
    const stored = storageCache[key];
    if (stored && now < stored.expiresAt) {
      this.memCache.set(key, stored);
      this.pruneIfNeeded(now);
      return stored.value;
    }

    this.pruneIfNeeded(now);
    // Cache miss
    return undefined;
  }

  /**
   * Wrap a fetch function with caching + in-flight deduplication.
   * `fetchFn` is only called on a cache miss; concurrent callers share the promise.
   */
  async getOrFetch(
    key: string,
    fetchFn: () => Promise<T | null>,
  ): Promise<T | null> {
    const cached = await this.get(key);
    if (cached !== undefined) return cached;

    // Deduplicate concurrent requests for the same key
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = fetchFn().then((result) => {
      const ttl = result != null ? this.opts.ttlHit : this.opts.ttlMiss;
      const entry: CacheEntry<T | null> = {
        value: result,
        expiresAt: Date.now() + ttl,
      };
      this.memCache.set(key, entry);
      this.writeStorage(key, entry); // fire-and-forget
      this.inflight.delete(key);
      return result;
    });

    this.inflight.set(key, promise);
    return promise;
  }

  /**
   * Remove a specific key from both memory and persistent storage caches.
   * Use before a forced re-fetch to bypass a cached null (scanning state).
   */
  async invalidate(key: string): Promise<void> {
    this.memCache.delete(key);
    this.inflight.delete(key);
    try {
      const storageCache = await this.readStorage();
      delete storageCache[key];
      await browser.storage.local.set({ [this.opts.storageKey]: storageCache });
    } catch {
      // Non-fatal
    }
  }

  /**
   * Directly write a value into both cache layers with an explicit TTL.
   * Use after a forced re-fetch to store the result with the correct TTL.
   */
  async set(key: string, value: T | null, ttl: number): Promise<void> {
    const entry: CacheEntry<T | null> = { value, expiresAt: Date.now() + ttl };
    this.memCache.set(key, entry);
    await this.writeStorage(key, entry);
  }

  private async readStorage(): Promise<StorageCache<T | null>> {
    try {
      const data = await browser.storage.local.get({
        [this.opts.storageKey]: {},
      });
      return data[this.opts.storageKey] as StorageCache<T | null>;
    } catch {
      return {};
    }
  }

  private async writeStorage(
    key: string,
    entry: CacheEntry<T | null>,
  ): Promise<void> {
    try {
      const existing = await this.readStorage();
      const now = Date.now();
      // Prune expired entries to keep storage tidy
      const pruned = Object.fromEntries(
        Object.entries(existing).filter(([, e]) => e.expiresAt > now),
      );
      pruned[key] = entry;
      await browser.storage.local.set({ [this.opts.storageKey]: pruned });
    } catch {
      // Non-fatal – in-memory cache still works
    }
  }

  /**
   * Periodically prune expired entries from both cache layers.
   * Throttled to run at most once per PRUNE_INTERVAL to avoid overhead.
   */
  private pruneIfNeeded(now: number): void {
    if (now - this.lastPruneTime < DomainCache.PRUNE_INTERVAL) return;
    this.lastPruneTime = now;

    // Prune in-memory cache
    for (const [k, entry] of this.memCache) {
      if (entry.expiresAt <= now) this.memCache.delete(k);
    }

    // Prune persistent storage (fire-and-forget)
    this.pruneStorage(now);
  }

  private async pruneStorage(now: number): Promise<void> {
    try {
      const storageCache = await this.readStorage();
      const pruned = Object.fromEntries(
        Object.entries(storageCache).filter(([, e]) => e.expiresAt > now),
      );
      if (Object.keys(pruned).length < Object.keys(storageCache).length) {
        await browser.storage.local.set({ [this.opts.storageKey]: pruned });
      }
    } catch {
      // Non-fatal
    }
  }
}
