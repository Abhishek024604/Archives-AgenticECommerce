import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProducts, fetchProductSuggestions } from "../api/productApi";
import { formatPrice } from "../utils/currency";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const params = {};

    if (debouncedQuery) {
      params.q = debouncedQuery;
    }

    if (minPrice) {
      params.minPrice = minPrice;
    }

    if (maxPrice) {
      params.maxPrice = maxPrice;
    }

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, maxPrice, minPrice, setSearchParams]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetchProducts(debouncedQuery ? { q: debouncedQuery } : undefined);

        if (active) {
          setItems(res.data || []);
        }
      } catch (e) {
        if (active) {
          setError(e?.response?.data?.message || "Failed to load products");
        }
      } finally {
        if (active) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    let active = true;

    if (query.trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }

    (async () => {
      try {
        const res = await fetchProductSuggestions({ q: query.trim(), limit: 6 });

        if (active) {
          setSuggestions(res.data || []);
        }
      } catch {
        if (active) {
          setSuggestions([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [query]);

  const submitSearch = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setDebouncedQuery(nextQuery);
    setShowSuggestions(false);
  };

  const selectSuggestion = (suggestion) => {
    const nextQuery = suggestion.productName;
    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
    setMinPrice("");
    setMaxPrice("");
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const highestPrice = useMemo(() => {
    const highestItemPrice = items.reduce(
      (highest, item) => Math.max(highest, Number(item.price) || 0),
      0,
    );

    return Math.max(500, Math.ceil(highestItemPrice / 500) * 500);
  }, [items]);

  const priceOptions = useMemo(
    () =>
      Array.from(
        { length: highestPrice / 500 + 1 },
        (_, index) => index * 500,
      ),
    [highestPrice],
  );

  const filteredItems = useMemo(() => {
    const minimum = minPrice === "" ? 0 : Number(minPrice);
    const maximum =
      maxPrice === "" ? Number.POSITIVE_INFINITY : Number(maxPrice);

    return items.filter((item) => {
      const price = Number(item.price) || 0;
      return price >= minimum && price <= maximum;
    });
  }, [items, maxPrice, minPrice]);

  const clearPriceFilter = () => {
    setMinPrice("");
    setMaxPrice("");
  };

  if (loading && !hasLoaded) {
    return (
      <main className="bg-surface px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1440px] text-on-surface-variant">
          Loading products...
        </div>
      </main>
    );
  }

  if (error && !hasLoaded) {
    return (
      <main className="bg-surface px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1440px] text-error">{error}</div>
      </main>
    );
  }

  return (
    <main className="bg-surface px-6 pb-24 pt-12 md:px-12 md:pt-16">
      <header className="mx-auto mb-12 flex max-w-[1440px] flex-col gap-6 border-b border-outline-variant/15 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
            Shop
          </p>
          <h1 className="mt-3 font-headline text-4xl leading-tight tracking-tight text-on-background md:text-6xl">
            The Archive
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-on-surface-variant">
          Curated pieces with a restrained palette, archival proportions, and
          everyday utility.
        </p>
      </header>

      <section ref={searchRef} className="mx-auto mb-10 max-w-[1440px]">
        <form onSubmit={submitSearch} className="relative max-w-3xl">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <div className="flex min-h-14 items-center border border-outline-variant/30 bg-surface-container-lowest px-4 transition-colors focus-within:border-primary">
            <span className="material-symbols-outlined mr-3 text-xl text-on-surface-variant">
              search
            </span>
            <input
              id="product-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="h-14 flex-1 bg-transparent text-sm text-on-background outline-none placeholder:text-on-surface-variant"
              placeholder="Search for shirts, boots, watches, brands"
              type="text"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="mr-3 inline-flex h-9 w-9 items-center justify-center text-on-surface-variant transition-colors hover:text-on-background"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            ) : null}
            <button
              type="submit"
              className="h-10 bg-inverse-surface px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 border border-outline-variant/20 bg-surface-container-lowest shadow-[0px_24px_48px_rgba(0,0,0,0.16)]">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion._id}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="flex w-full items-center gap-4 border-b border-outline-variant/10 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-container-low"
                >
                  <span className="flex h-12 w-10 shrink-0 overflow-hidden bg-surface-container">
                    <img
                      src={suggestion.images?.[0]}
                      alt=""
                      className="h-full w-full object-cover object-top"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-headline text-lg leading-tight text-on-background">
                      {suggestion.productName}
                    </span>
                    <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      {suggestion.brandName}
                    </span>
                  </span>
                  <span className="text-sm text-on-surface">
                    {formatPrice(suggestion.price)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </form>

        <div className="mt-4 flex min-h-5 items-center justify-between gap-4 text-xs text-on-surface-variant">
          <span>
            {debouncedQuery
              ? `${filteredItems.length} results for "${debouncedQuery}"`
              : `${filteredItems.length} products`}
          </span>
          {loading ? <span>Searching...</span> : null}
        </div>
      </section>

      {error ? (
        <section className="mx-auto mb-6 max-w-[1440px] border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </section>
      ) : null}

      {items.length === 0 && !loading ? (
        <section className="mx-auto max-w-[1440px] border border-outline-variant/20 bg-surface-container-lowest px-6 py-12 text-center">
          <h2 className="font-headline text-3xl text-on-background">
            No matching products
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
            Try a different search or price range.
          </p>
        </section>
      ) : (
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit border border-outline-variant/20 bg-surface-container-lowest p-6 lg:sticky lg:top-28">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-on-background">
                Filter by price
              </h2>
              {minPrice || maxPrice ? (
                <button
                  type="button"
                  onClick={clearPriceFilter}
                  className="text-[9px] font-bold uppercase tracking-[0.16em] text-on-surface-variant hover:text-on-background"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Minimum
                </span>
                <select
                  value={minPrice}
                  onChange={(event) => {
                    const nextMinimum = event.target.value;
                    setMinPrice(nextMinimum);
                    if (
                      maxPrice &&
                      Number(nextMinimum) > Number(maxPrice)
                    ) {
                      setMaxPrice(nextMinimum);
                    }
                  }}
                  className="h-11 w-full border border-outline-variant/30 bg-surface px-3 text-sm text-on-background outline-none focus:border-primary"
                >
                  <option value="">No minimum</option>
                  {priceOptions.slice(0, -1).map((price) => (
                    <option key={price} value={price}>
                      {formatPrice(price)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Maximum
                </span>
                <select
                  value={maxPrice}
                  onChange={(event) => {
                    const nextMaximum = event.target.value;
                    setMaxPrice(nextMaximum);
                    if (
                      nextMaximum &&
                      minPrice &&
                      Number(nextMaximum) < Number(minPrice)
                    ) {
                      setMinPrice(nextMaximum);
                    }
                  }}
                  className="h-11 w-full border border-outline-variant/30 bg-surface px-3 text-sm text-on-background outline-none focus:border-primary"
                >
                  <option value="">No maximum</option>
                  {priceOptions.slice(1).map((price) => (
                    <option key={price} value={price}>
                      {formatPrice(price)}
                    </option>
                  ))}
                </select>
              </label>

              <p className="text-xs leading-5 text-on-surface-variant">
                Price options increase in {formatPrice(500)} intervals.
              </p>
            </div>
          </aside>

          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.length === 0 ? (
              <section className="border border-outline-variant/20 bg-surface-container-lowest px-6 py-12 text-center sm:col-span-2 xl:col-span-3">
                <h2 className="font-headline text-3xl text-on-background">
                  No products in this price range
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
                  Change the minimum or maximum price to see more products.
                </p>
              </section>
            ) : (
              filteredItems.map((p) => (
              <Link
                key={p._id}
                to={`/product/${p._id}`}
                className="group block bg-surface-container-lowest"
              >
                <div className="aspect-[4/5] overflow-hidden bg-surface-container-low">
                  <img
                    src={p.images?.[0]}
                    alt={p.productName}
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="border-x border-b border-outline-variant/15 px-4 py-5 transition-colors group-hover:bg-surface-container-low">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                    {p.brandName}
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-4">
                    <h2 className="font-headline text-xl leading-snug text-on-background">
                      {p.productName}
                    </h2>
                    <div className="shrink-0 pt-1 text-sm text-on-surface">
                      {formatPrice(p.price)}
                    </div>
                  </div>
                </div>
              </Link>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}
