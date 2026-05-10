import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const careersRequiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CAREERS_RECEIVER_EMAIL'];
const brochureRequiredEnvVars = ['BROCHURE_SMTP_USER', 'BROCHURE_SMTP_PASS', 'BROCHURE_RECEIVER_EMAIL'];

function getMissingEnvVars(keys) {
  return keys.filter((key) => !process.env[key]);
}

function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port || 465),
    secure: String(config.secure || 'true').toLowerCase() === 'true',
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

function getCareersMailConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_SECURE || 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    receiver: process.env.CAREERS_RECEIVER_EMAIL,
  };
}

function getBrochureMailConfig() {
  return {
    host: process.env.BROCHURE_SMTP_HOST || process.env.SMTP_HOST,
    port: process.env.BROCHURE_SMTP_PORT || process.env.SMTP_PORT || 465,
    secure: process.env.BROCHURE_SMTP_SECURE || process.env.SMTP_SECURE || 'true',
    user: process.env.BROCHURE_SMTP_USER,
    pass: process.env.BROCHURE_SMTP_PASS,
    receiver: process.env.BROCHURE_RECEIVER_EMAIL,
  };
}

function getAllowedOrigins() {
  const rawOrigins = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  if (rawOrigins.trim() === '*') {
    return '*';
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    if (!origin || allowedOrigins === '*') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/careers/apply', upload.single('resume'), async (req, res) => {
  const missingEnvVars = getMissingEnvVars(careersRequiredEnvVars);
  if (missingEnvVars.length > 0) {
    return res.status(500).json({
      message: `Missing backend email configuration: ${missingEnvVars.join(', ')}`,
    });
  }

  const { fullName, email, phone, role, linkedin } = req.body;

  if (!fullName || !email || !phone || !role || !linkedin || !req.file) {
    return res.status(400).json({ message: 'Please provide all required fields and a resume.' });
  }

  try {
    const mailConfig = getCareersMailConfig();
    const transporter = createTransporter(mailConfig);

    await transporter.sendMail({
      from: `Naxatra Careers <${mailConfig.user}>`,
      to: mailConfig.receiver,
      replyTo: email,
      subject: `New career application: ${role}`,
      text: [
        'A new careers form has been submitted.',
        '',
        `Full Name: ${fullName}`,
        `Email: ${email}`,
        `Contact Number: ${phone}`,
        `Role: ${role}`,
        `LinkedIn: ${linkedin}`,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2 style="margin-bottom: 16px;">New career application received</h2>
          <p><strong>Full Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Contact Number:</strong> ${phone}</p>
          <p><strong>Applying For:</strong> ${role}</p>
          <p><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></p>
        </div>
      `,
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
          contentType: req.file.mimetype,
        },
      ],
    });

    return res.status(200).json({ message: 'Application submitted successfully.' });
  } catch (error) {
    console.error('Failed to send careers email:', error);
    return res.status(500).json({ message: 'Failed to send application email.' });
  }
});

app.post('/api/brochure/request', async (req, res) => {
  const missingEnvVars = getMissingEnvVars(brochureRequiredEnvVars);
  if (missingEnvVars.length > 0) {
    return res.status(500).json({
      message: `Missing brochure email configuration: ${missingEnvVars.join(', ')}`,
    });
  }

  const { firstName, lastName, companyName, email } = req.body;

  if (!firstName || !lastName || !companyName || !email) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    const mailConfig = getBrochureMailConfig();
    const transporter = createTransporter(mailConfig);

    await transporter.sendMail({
      from: `Naxatra Brochure <${mailConfig.user}>`,
      to: mailConfig.receiver,
      replyTo: email,
      subject: 'New brochure request',
      text: [
        'A new brochure request has been submitted.',
        '',
        `First Name: ${firstName}`,
        `Last Name: ${lastName}`,
        `Company Name: ${companyName}`,
        `Email: ${email}`,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2 style="margin-bottom: 16px;">New brochure request received</h2>
          <p><strong>First Name:</strong> ${firstName}</p>
          <p><strong>Last Name:</strong> ${lastName}</p>
          <p><strong>Company Name:</strong> ${companyName}</p>
          <p><strong>Email:</strong> ${email}</p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Brochure request submitted successfully.' });
  } catch (error) {
    console.error('Failed to send brochure email:', error);
    return res.status(500).json({ message: 'Failed to send brochure email.' });
  }
});

export default app;
