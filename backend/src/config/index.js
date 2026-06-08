require('dotenv').config();

const required = (name) => {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
};

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  isProd: process.env.NODE_ENV === 'production',

  jwt: {
    secret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },

  license: {
    secret: required('LICENSE_SECRET'),
    maxDownloads: 5,
    expiryDays: 365,
  },

  gumroad: {
    webhookToken: process.env.GUMROAD_WEBHOOK_TOKEN || '',
    sellerId: process.env.GUMROAD_SELLER_ID || '',
  },

  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },

  db: {
    path: process.env.DATABASE_PATH || './data/shipkit.db',
  },

  products: {
    path: process.env.PRODUCTS_PATH || '../products',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: required('ADMIN_PASSWORD'),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    recipient: process.env.CONTACT_RECIPIENT,
  },
};
