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

const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CAREERS_RECEIVER_EMAIL'];

function getMissingEnvVars() {
  return requiredEnvVars.filter((key) => !process.env[key]);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
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
  const missingEnvVars = getMissingEnvVars();
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
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `Naxatra Careers <${process.env.SMTP_USER}>`,
      to: process.env.CAREERS_RECEIVER_EMAIL,
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

export default app;
