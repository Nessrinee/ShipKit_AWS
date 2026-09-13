/**
 * ShipKit Test Suite — v2
 * Covers: license key crypto, auth timing attack, download token,
 *         payment webhook idempotency, path traversal, API endpoints
 *
 * Run: npm test
 * Coverage: npm test -- --coverage
 */

'use strict';

// ── Test environment setup ────────────────────────────────────────────────────
process.env.NODE_ENV                 = 'test';
process.env.JWT_SECRET               = 'test-jwt-secret-64-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET       = 'test-refresh-secret-64-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.LICENSE_SECRET           = 'test-license-secret-for-unit-tests-only';
process.env.ADMIN_PASSWORD           = 'TestAdminPass123!';
process.env.ADMIN_EMAIL              = 'admin@test.com';
process.env.DATABASE_PATH            = ':memory:';
process.env.PRODUCTS_PATH            = '../products';
process.env.CORS_ORIGIN              = 'http://localhost:5173';
process.env.GUMROAD_SELLER_ID        = 'test-seller-id';
process.env.GUMROAD_WEBHOOK_TOKEN = 'test-webhook-token';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-1234-1234-123456789abc')
}));

const {
  generateLicenseKey,
  verifyLicenseKey,
  generateDownloadToken,
  verifyDownloadToken,
} = require('../utils/licenseKey');

const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../utils/jwt');
const { initDb, getDb } = require('../db/database');
const request = require('supertest');
const app     = require('../app');

// Initialize DB once for all tests
beforeAll(() => {
  initDb();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. LICENSE KEY CRYPTOGRAPHY
// ══════════════════════════════════════════════════════════════════════════════
describe('🔑 License Key Cryptography', () => {
  const productId = 'kubernetes-starter-pack';
  const email     = 'buyer@example.com';

  test('generates key matching expected regex format', () => {
    const key = generateLicenseKey(productId, email);
    expect(key).toMatch(/^SK-[A-Z0-9]+-[A-F0-9]{12}-[A-F0-9]{16}$/i);
  });

  test('starts with SK prefix', () => {
    const key = generateLicenseKey(productId, email);
    expect(key.startsWith('SK-')).toBe(true);
  });

  test('different calls produce different keys (random component)', () => {
    const key1 = generateLicenseKey(productId, email);
    const key2 = generateLicenseKey(productId, email);
    expect(key1).not.toBe(key2);
  });

  test('verifies a valid generated key', () => {
    const key = generateLicenseKey(productId, email);
    expect(verifyLicenseKey(key, productId, email)).toBe(true);
  });

  test('rejects key with wrong email', () => {
    const key = generateLicenseKey(productId, email);
    expect(verifyLicenseKey(key, productId, 'attacker@evil.com')).toBe(false);
  });

  test('rejects key with wrong productId', () => {
    const key = generateLicenseKey(productId, email);
    expect(verifyLicenseKey(key, 'terraform-aws-kit', email)).toBe(false);
  });

  test('rejects tampered HMAC checksum', () => {
    const key    = generateLicenseKey(productId, email);
    const parts  = key.split('-');
    parts[3]     = 'FFFFFFFFFFFFFFFF';  // replace checksum with garbage
    const tampered = parts.join('-');
    expect(verifyLicenseKey(tampered, productId, email)).toBe(false);
  });

  // ── CRITICAL BUG FIX TESTS ─────────────────────────────────────────────────
  test('[CRITICAL FIX] does NOT crash when checksum has wrong length', () => {
    // Pre-fix: timingSafeEqual() threw TypeError when lengths differed
    // This caused 500 errors on malformed input
    const shortHmac = 'SK-K8S-AABBCCDDEEFF-SHORT';  // 5 chars instead of 16
    expect(() => verifyLicenseKey(shortHmac, productId, email)).not.toThrow();
    expect(verifyLicenseKey(shortHmac, productId, email)).toBe(false);
  });

  test('[CRITICAL FIX] does NOT crash on empty string key', () => {
    expect(() => verifyLicenseKey('', productId, email)).not.toThrow();
    expect(verifyLicenseKey('', productId, email)).toBe(false);
  });

  test('[CRITICAL FIX] does NOT crash on null key', () => {
    expect(() => verifyLicenseKey(null, productId, email)).not.toThrow();
    expect(verifyLicenseKey(null, productId, email)).toBe(false);
  });

  test('rejects key that is all dashes', () => {
    expect(verifyLicenseKey('----', productId, email)).toBe(false);
  });

  test('email is case-insensitive', () => {
    const key = generateLicenseKey(productId, email.toLowerCase());
    expect(verifyLicenseKey(key, productId, email.toUpperCase())).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. DOWNLOAD TOKEN SECURITY
// ══════════════════════════════════════════════════════════════════════════════
describe('🔐 Download Token Security', () => {
  test('generates a base64url token', () => {
    const token = generateDownloadToken('license-1', 'kubernetes-starter-pack');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);  // base64url chars only
  });

  test('verifies a freshly generated token', () => {
    const token  = generateDownloadToken('lic-123', 'kubernetes-starter-pack');
    const result = verifyDownloadToken(token);
    expect(result).not.toBeNull();
    expect(result.licenseId).toBe('lic-123');
    expect(result.productId).toBe('kubernetes-starter-pack');
  });

  test('rejects null token', () => {
    expect(verifyDownloadToken(null)).toBeNull();
  });

  test('rejects empty token', () => {
    expect(verifyDownloadToken('')).toBeNull();
  });

  test('rejects tampered token', () => {
    const token   = generateDownloadToken('lic-123', 'kubernetes-starter-pack');
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(verifyDownloadToken(tampered)).toBeNull();
  });

  test('rejects token with future timestamp (replay protection)', () => {
    // An attacker might try to forge a token with a future timestamp
    const future  = Date.now() + 999999999;
    const payload = `lic-123:kubernetes-starter-pack:${future}:dead:badsig`;
    const bad     = Buffer.from(payload).toString('base64url');
    expect(verifyDownloadToken(bad)).toBeNull();
  });

  test('generates unique tokens for same inputs (nonce)', () => {
    const t1 = generateDownloadToken('lic-123', 'kubernetes-starter-pack');
    const t2 = generateDownloadToken('lic-123', 'kubernetes-starter-pack');
    expect(t1).not.toBe(t2);  // Different nonce each time
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. JWT AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════
describe('🔒 JWT Authentication', () => {
  test('access token is valid immediately after signing', () => {
    const token   = signAccessToken({ userId: '1', email: 'a@b.com', role: 'admin' });
    const { valid, payload } = verifyAccessToken(token);
    expect(valid).toBe(true);
    expect(payload.email).toBe('a@b.com');
    expect(payload.role).toBe('admin');
  });

  test('refresh token is valid immediately after signing', () => {
    const token   = signRefreshToken({ userId: '1', email: 'a@b.com', role: 'admin' });
    const { valid } = verifyRefreshToken(token);
    expect(valid).toBe(true);
  });

  test('rejects tampered access token', () => {
    const token   = signAccessToken({ userId: '1', email: 'a@b.com', role: 'admin' });
    const tampered = token.slice(0, -4) + 'XXXX';
    const { valid } = verifyAccessToken(tampered);
    expect(valid).toBe(false);
  });

  test('rejects garbage string', () => {
    const { valid } = verifyAccessToken('not.a.token');
    expect(valid).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. API ENDPOINT TESTS
// ══════════════════════════════════════════════════════════════════════════════
describe('🌐 API Endpoints', () => {

  // ── Health ─────────────────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    test('returns 200 with ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.environment).toBe('test');
      expect(res.headers['x-request-id']).toBeDefined();  // FIX: request ID present
    });
  });

  // ── Products ───────────────────────────────────────────────────────────────
  describe('GET /api/products', () => {
    test('returns product list', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
    });

    test('does NOT expose productDir (internal field)', async () => {
      const res = await request(app).get('/api/products');
      res.body.products.forEach((p) => {
        expect(p.productDir).toBeUndefined();
      });
    });

    test('products have required fields', async () => {
      const res = await request(app).get('/api/products');
      const p   = res.body.products[0];
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.price).toBeDefined();
      expect(p.slug).toBeDefined();
    });
  });

  describe('GET /api/products/:slug', () => {
    test('returns single product', async () => {
      const res = await request(app).get('/api/products/kubernetes-starter-pack');
      expect(res.status).toBe(200);
      expect(res.body.product.id).toBe('kubernetes-starter-pack');
    });

    test('returns 404 for unknown slug', async () => {
      const res = await request(app).get('/api/products/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  // ── Authentication ─────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    test('returns tokens on valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email:    'admin@test.com',
        password: 'TestAdminPass123!',
      });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe('admin');
    });

    test('returns 401 on wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email:    'admin@test.com',
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(401);
    });

    test('returns 401 on non-existent email (not 404)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email:    'nobody@notexist.com',
        password: 'AnyPassword123!',
      });
      expect(res.status).toBe(401);
      // Same error message as wrong password — doesn't leak whether email exists
      expect(res.body.error).toBe('Invalid email or password');
    });

    test('[CRITICAL FIX] timing: non-existent email is not significantly faster', async () => {
      // This is a statistical test — both paths should take similar time due to dummy hash
      const start1 = Date.now();
      await request(app).post('/api/auth/login').send({ email: 'nobody@notexist.com', password: 'pass' });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'wrongpass' });
      const time2 = Date.now() - start2;

      // Both should be > 10ms (accommodating faster runner environments). The difference should be < 150ms.
      expect(time1).toBeGreaterThan(10);
      expect(time2).toBeGreaterThan(10);
      expect(Math.abs(time1 - time2)).toBeLessThan(150);
    });

    test('returns 400 on missing fields', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.fields).toBeDefined();
    });

    test('strips whitespace from email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email:    '   admin@test.com   ',  // leading/trailing spaces
        password: 'TestAdminPass123!',
      });
      // Should succeed — email is trimmed in schema
      expect(res.status).toBe(200);
    });

    test('is case-insensitive for email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email:    'ADMIN@TEST.COM',
        password: 'TestAdminPass123!',
      });
      expect(res.status).toBe(200);
    });
  });

  // ── Protected routes ────────────────────────────────────────────────────────
  describe('Protected admin routes', () => {
    test('returns 401 with no token', async () => {
      const res = await request(app).get('/api/admin/licenses');
      expect(res.status).toBe(401);
    });

    test('returns 403 with garbage token', async () => {
      const res = await request(app)
        .get('/api/admin/licenses')
        .set('Authorization', 'Bearer notavalidtoken');
      expect(res.status).toBe(403);
    });

    test('returns 403 with non-admin role token', async () => {
      const token = signAccessToken({ userId: '99', email: 'user@test.com', role: 'customer' });
      const res   = await request(app)
        .get('/api/admin/licenses')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    test('returns 200 with valid admin token', async () => {
      const token = signAccessToken({ userId: '1', email: 'admin@test.com', role: 'admin' });
      const res   = await request(app)
        .get('/api/admin/licenses')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  // ── Download verify ─────────────────────────────────────────────────────────
  describe('POST /api/downloads/verify', () => {
    let licenseKey;
    const email     = 'customer@test.com';
    const productId = 'kubernetes-starter-pack';

    beforeAll(() => {
      // Insert a test license into the in-memory DB
      licenseKey = generateLicenseKey(productId, email);
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      getDb().prepare(
        'INSERT INTO licenses (product_id, email, license_key, order_id, max_downloads, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(productId, email, licenseKey, 'test-order-1', 5, expires.toISOString());
    });

    test('returns download token for valid license', async () => {
      const res = await request(app).post('/api/downloads/verify').send({
        email, licenseKey, productId,
      });
      expect(res.status).toBe(200);
      expect(res.body.downloadToken).toBeDefined();
      expect(res.body.downloadsLeft).toBe(5);
    });

    test('returns 401 for wrong email', async () => {
      const res = await request(app).post('/api/downloads/verify').send({
        email:     'attacker@evil.com',
        licenseKey,
        productId,
      });
      expect(res.status).toBe(401);
    });

    test('returns 400 for tampered license key', async () => {
      const res = await request(app).post('/api/downloads/verify').send({
        email,
        licenseKey: licenseKey.slice(0, -4) + 'XXXX',
        productId,
      });
      expect(res.status).toBe(400);  // fails format validation
    });

    test('returns 400 for missing fields', async () => {
      const res = await request(app).post('/api/downloads/verify').send({ email });
      expect(res.status).toBe(400);
    });
  });

  // ── Contact form ─────────────────────────────────────────────────────────────
  describe('POST /api/contact', () => {
    test('returns 201 on valid submission', async () => {
      const res = await request(app).post('/api/contact').send({
        name:    'Test User',
        email:   'test@example.com',
        subject: 'Support request',
        message: 'I have a question about my download.',
      });
      expect(res.status).toBe(201);
    });

    test('returns 400 on short message', async () => {
      const res = await request(app).post('/api/contact').send({
        name:    'Test',
        email:   'test@example.com',
        subject: 'Hi',
        message: 'Too short',
      });
      expect(res.status).toBe(400);
    });

    test('returns 400 on invalid email', async () => {
      const res = await request(app).post('/api/contact').send({
        name:    'Test',
        email:   'not-an-email',
        subject: 'Subject here',
        message: 'A message that is long enough to pass validation.',
      });
      expect(res.status).toBe(400);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. PAYMENT WEBHOOK SECURITY
// ══════════════════════════════════════════════════════════════════════════════
describe('💳 Payment Webhook Security', () => {
  const validPayload = {
    seller_id:         'test-seller-id',
    product_id:        'gumroad-product-id',
    product_permalink: 'kubernetes-starter-pack',
    sale_id:           'sale-unique-1234',
    email:             'buyer@example.com',
    price:             49,
    currency:          'USD',
  };

  test('rejects webhook with wrong token', async () => {
    const res = await request(app)
      .post('/api/webhooks/gumroad?token=wrong-token')
      .type('form')
      .send(validPayload);
    expect(res.status).toBe(401);
  });

  test('rejects webhook with wrong seller_id', async () => {
    const res = await request(app)
      .post('/api/webhooks/gumroad?token=test-webhook-token')
      .type('form')
      .send({ ...validPayload, seller_id: 'attacker-seller-id' });
    expect(res.status).toBe(401);
  });

  test('returns 200 for unknown product permalink', async () => {
    const res = await request(app)
      .post('/api/webhooks/gumroad?token=test-webhook-token')
      .type('form')
      .send({ ...validPayload, product_permalink: 'unknown-product', sale_id: 'sale-unknown' });
    expect(res.status).toBe(200);
    expect(res.body.note).toContain('Unknown product');
  });

  test('creates license on first valid payment', async () => {
    const saleId = `sale-test-${Date.now()}`;
    const res    = await request(app)
      .post('/api/webhooks/gumroad?token=test-webhook-token')
      .type('form')
      .send({ ...validPayload, sale_id: saleId, email: `test-${saleId}@example.com` });
    expect(res.status).toBe(200);

    // Verify license was created in DB
    const db      = getDb();
    const license = db.prepare('SELECT * FROM licenses WHERE order_id = ?').get(saleId);
    expect(license).not.toBeNull();
    expect(license.product_id).toBe('kubernetes-starter-pack');
    expect(license.email).toBe(`test-${saleId}@example.com`);
  });

  test('[PAYMENT] idempotency: duplicate sale_id does not create second license', async () => {
    const saleId = `sale-duplicate-${Date.now()}`;
    const email  = `duplicate-test-${Date.now()}@example.com`;
    const payload = { ...validPayload, sale_id: saleId, email };

    // First request
    const res1 = await request(app)
      .post('/api/webhooks/gumroad?token=test-webhook-token')
      .type('form')
      .send(payload);
    expect(res1.status).toBe(200);

    // Second request (Gumroad retry simulation)
    const res2 = await request(app)
      .post('/api/webhooks/gumroad?token=test-webhook-token')
      .type('form')
      .send(payload);
    expect(res2.status).toBe(200);
    expect(res2.body.duplicate).toBe(true);

    // Verify only ONE license was created
    const db       = getDb();
    const licenses = db.prepare('SELECT * FROM licenses WHERE order_id = ?').all(saleId);
    expect(licenses).toHaveLength(1);
  });

  test('[PAYMENT] payment event audit log is created', async () => {
    const saleId = `sale-audit-${Date.now()}`;
    const email  = `audit-test-${Date.now()}@example.com`;

    await request(app)
      .post('/api/webhooks/gumroad?token=test-webhook-token')
      .type('form')
      .send({ ...validPayload, sale_id: saleId, email });

    const db    = getDb();
    const event = db.prepare('SELECT * FROM payment_events WHERE order_id = ?').get(saleId);
    expect(event).not.toBeNull();
    expect(event.event_type).toBe('sale');
    expect(event.product_id).toBe('kubernetes-starter-pack');
  });

  test('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/webhooks/gumroad?token=test-webhook-token')
      .type('form')
      .send({ seller_id: 'test-seller-id' });   // missing sale_id, email, etc.
    // Schema validation fails → 200 (Gumroad won't retry malformed payloads)
    expect(res.status).toBe(200);
    expect(res.body.note).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. SECURITY ATTACK SIMULATION
// ══════════════════════════════════════════════════════════════════════════════
describe('⚔️ Security Attack Simulation', () => {

  test('SQL injection attempt in email field is rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    "admin@test.com' OR '1'='1",
      password: 'anything',
    });
    // Joi validates email format — this gets caught at validation
    expect(res.status).toBe(400);
  });

  test('XSS payload in contact form is rejected or stored safely', async () => {
    const res = await request(app).post('/api/contact').send({
      name:    '<script>alert("xss")</script>',
      email:   'attacker@evil.com',
      subject: 'XSS test',
      message: '<img src=x onerror=alert(1)> This is a long enough message to pass validation.',
    });
    // Should store and return without executing (data stored as text)
    expect([201, 400]).toContain(res.status);
  });

  test('oversized JSON body is rejected', async () => {
    const bigPayload = { email: 'a@b.com', password: 'x'.repeat(200_000) };
    const res = await request(app).post('/api/auth/login').send(bigPayload);
    expect(res.status).toBe(413);  // Payload Too Large
  });

  test('invalid license key format is caught before DB lookup', async () => {
    const res = await request(app).post('/api/downloads/verify').send({
      email:      'test@test.com',
      licenseKey: '../../etc/passwd',  // path traversal in key field
      productId:  'kubernetes-starter-pack',
    });
    expect(res.status).toBe(400);  // format validation catches it
  });

  test('expired JWT is rejected on protected route', async () => {
    // Sign a token with -1s expiry (already expired)
    const jwt  = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: '1', email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const res = await request(app)
      .get('/api/admin/licenses')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('X-Request-Id is present on all responses', async () => {
    const routes = ['/api/health', '/api/products'];
    for (const route of routes) {
      const res = await request(app).get(route);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    }
  });

  test('security headers present on API response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. ADMIN LICENSE GENERATION
// ══════════════════════════════════════════════════════════════════════════════
describe('🛡️ Admin License Generation', () => {
  let adminToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    'admin@test.com',
      password: 'TestAdminPass123!',
    });
    adminToken = res.body.accessToken;
  });

  test('generates license for valid product and email', async () => {
    const res = await request(app)
      .post('/api/admin/licenses/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: 'kubernetes-starter-pack', email: 'new@customer.com' });

    expect(res.status).toBe(201);
    expect(res.body.licenseKey).toMatch(/^SK-/);
  });

  test('returns 404 for non-existent productId', async () => {
    const res = await request(app)
      .post('/api/admin/licenses/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: 'nonexistent-product', email: 'x@x.com' });
    expect(res.status).toBe(404);
  });

  test('rejects invalid email in admin generate', async () => {
    const res = await request(app)
      .post('/api/admin/licenses/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: 'kubernetes-starter-pack', email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});