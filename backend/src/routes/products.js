const express  = require('express');
const PRODUCTS = require('../data/products');

const router = express.Router();

/**
 * GET /api/products
 * Returns the product list (no sensitive fields)
 */
router.get('/', (req, res) => {
  const safe = PRODUCTS.map(({ id, slug, name, tagline, price, currency, tags, features, fileTree, gumroadId }) => ({
    id, slug, name, tagline, price, currency, tags, features, fileTree, gumroadId,
  }));
  res.json({ products: safe });
});

/**
 * GET /api/products/:slug
 * Returns full product details including code preview
 */
router.get('/:slug', (req, res) => {
  const product = PRODUCTS.find((p) => p.slug === req.params.slug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { productDir, ...safe } = product; // exclude internal productDir from response
  res.json({ product: safe });
});

module.exports = router;
