import { useState, useEffect } from 'react';
import { fetchProducts, fetchProduct } from '@/lib/api';

// FIX [MEDIUM]: Module-level cache — prevents duplicate requests from multiple components
let _productsCache = null;
let _cacheTime     = 0;
const CACHE_TTL    = 5 * 60 * 1000;

export function useProducts() {
  const [products, setProducts] = useState(_productsCache || []);
  const [loading,  setLoading]  = useState(!_productsCache);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (_productsCache && (Date.now() - _cacheTime) < CACHE_TTL) {
      setProducts(_productsCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProducts()
      .then(({ data }) => {
        _productsCache = data.products;
        _cacheTime = Date.now();
        setProducts(data.products);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}

export function useProduct(slug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProduct(slug)
      .then(({ data }) => { setProduct(data.product); setError(null); })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load product.'))
      .finally(() => setLoading(false));
  }, [slug]);

  return { product, loading, error };
}
