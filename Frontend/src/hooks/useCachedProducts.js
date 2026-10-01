import { useState, useEffect } from 'react';
import { fetchProducts } from '../api/productApi';

const productsCache = new Map();

export function useCachedProducts(apiParams, user) {
  const key = JSON.stringify(apiParams || {});
  
  // Initialize state synchronously with cache if available
  const [data, setData] = useState(productsCache.get(key) || []);
  const [loading, setLoading] = useState(!productsCache.has(key));
  const [hasLoaded, setHasLoaded] = useState(productsCache.has(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    
    // We fetch if it's not in cache. If it IS in cache, we could still
    // optionally fetch in background to keep data fresh, but since
    // scroll restoration requires stable DOM immediately, we rely on the cached data
    // for the first render. We'll fetch in background anyway to update stock/prices.
    
    setLoading(!productsCache.has(key));
    
    fetchProducts(apiParams).then(res => {
      if (active) {
        productsCache.set(key, res.data || []);
        setData(res.data || []);
        setLoading(false);
        setHasLoaded(true);
      }
    }).catch(err => {
      if (active) {
        setError(err);
        setLoading(false);
        setHasLoaded(true);
      }
    });
    
    return () => { active = false; };
  }, [key, user]); // User is dependency in case auth changes what products are visible

  return { data, loading, hasLoaded, error };
}
