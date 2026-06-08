const express = require('express');
const Joi     = require('joi');
const { getDb }         = require('../db/database');
const { contactLimiter } = require('../middleware/rateLimiter');
const config  = require('../config');
const logger  = require('../utils/logger');

const router = express.Router();

const contactSchema = Joi.object({
  name:    Joi.string().min(2).max(100).required(),
  email:   Joi.string().email().required(),
  subject: Joi.string().min(4).max(200).required(),
  message: Joi.string().min(10).max(2000).required(),
});

router.post('/', contactLimiter, async (req, res, next) => {
  try {
    const { error, value } = contactSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error:  'Validation failed',
        fields: error.details.map((d) => ({ field: d.context.key, message: d.message })),
      });
    }

    const db = getDb();
    db.prepare(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)'
    ).run(value.name, value.email, value.subject, value.message);

    // Optional: send email notification via SMTP
    if (config.smtp.host && config.smtp.user) {
      try {
        const nodemailer = require('nodemailer');
        const transport = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.port === 465,
          auth: { user: config.smtp.user, pass: config.smtp.pass },
        });
        await transport.sendMail({
          from:    config.smtp.user,
          to:      config.smtp.recipient || config.admin.email,
          subject: `[ShipKit Contact] ${value.subject}`,
          text:    `From: ${value.name} <${value.email}>\n\n${value.message}`,
        });
      } catch (emailErr) {
        logger.warn('Failed to send contact email', emailErr);
      }
    }

    res.status(201).json({ success: true, message: 'Message received. We\'ll reply within 24 hours.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
