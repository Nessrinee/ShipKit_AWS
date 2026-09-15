import { useState, useEffect } from 'react';
import axios from 'axios';

// Module-level cache variables
let _productsCache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// API helper functions
async function fetchProducts() {
  const response = await axios.get('/api/products');
  return response.data;
}

async function fetchProduct(slug) {
  const response = await axios.get(`/api/products/${slug}`);
  return response.data;
}

export function useProducts() {
  const [products, setProducts] = useState(() => {
    if (_productsCache && (Date.now() - _cacheTime) < CACHE_TTL) {
      return _productsCache;
    }
    return [];
  });
  
  const [loading, setLoading] = useState(() => {
    return !(_productsCache && (Date.now() - _cacheTime) < CACHE_TTL);
  });
  
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_productsCache && (Date.now() - _cacheTime) < CACHE_TTL) {
      return;
    }

    let isMounted = true;
    fetchProducts()
      .then((data) => {
        if (isMounted) {
          _productsCache = data.products;
          _cacheTime = Date.now();
          setProducts(data.products);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load products.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { products, loading, error };
}

export function useProduct(slug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      return;
    }

    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    fetchProduct(slug)
      .then((data) => {
        if (isMounted) {
          setProduct(data.product);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load product.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { product, loading, error };
}