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

const careersRequiredEnvVars = ['CAREERS_SMTP_HOST', 'CAREERS_SMTP_PORT', 'CAREERS_SMTP_USER', 'CAREERS_SMTP_PASS', 'CAREERS_RECEIVER_EMAIL'];
const brochureRequiredEnvVars = ['BROCHURE_SMTP_USER', 'BROCHURE_SMTP_PASS', 'BROCHURE_RECEIVER_EMAIL'];
const specSheetRequiredEnvVars = ['SPEC_SHEET_SMTP_USER', 'SPEC_SHEET_SMTP_PASS', 'SPEC_SHEET_RECEIVER_EMAIL'];
const contactRequiredEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'CONTACT_MOTORS_RECEIVER_EMAIL',
  'CONTACT_INVESTMENT_RECEIVER_EMAIL',
  'CONTACT_PARTNERSHIP_RECEIVER_EMAIL',
  'CONTACT_OTHER_RECEIVER_EMAIL',
];

const EMAIL_LOGO_URL = 'https://res.cloudinary.com/dgr33gxhd/image/upload/v1779904862/Layer_1_y7nzqm.svg';
const EMAIL_NAV_BG = '#0065E1';
const EMAIL_HEADING_COLOR = '#0065E1';
const EMAIL_BODY_COLOR = '#6B7179';

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
    host: process.env.CAREERS_SMTP_HOST,
    port: process.env.CAREERS_SMTP_PORT || 465,
    secure: process.env.CAREERS_SMTP_SECURE || 'true',
    user: process.env.CAREERS_SMTP_USER,
    pass: process.env.CAREERS_SMTP_PASS,
    receiver: process.env.CAREERS_RECEIVER_EMAIL,
  };
}

function getContactMailConfig(receiverEnvKey) {
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_SECURE || 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    receiver: process.env[receiverEnvKey],
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

function getSpecSheetMailConfig() {
  return {
    host: process.env.SPEC_SHEET_SMTP_HOST || process.env.SMTP_HOST,
    port: process.env.SPEC_SHEET_SMTP_PORT || process.env.SMTP_PORT || 465,
    secure: process.env.SPEC_SHEET_SMTP_SECURE || process.env.SMTP_SECURE || 'true',
    user: process.env.SPEC_SHEET_SMTP_USER,
    pass: process.env.SPEC_SHEET_SMTP_PASS,
    receiver: process.env.SPEC_SHEET_RECEIVER_EMAIL,
  };
}

function renderEmailLayout(innerHtml) {
  return `
    <div style="margin: 0; padding: 24px 0; background: #f2f2f2;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e6e6e6;">
        <div style="background: ${EMAIL_NAV_BG}; padding: 18px 38px;">
          <img src="${EMAIL_LOGO_URL}" alt="Naxatra Labs" style="display: block; height: 20px; width: auto;" />
        </div>
        <div style="padding: 30px 38px 24px; font-family: Arial, sans-serif;">
          ${innerHtml}
        </div>
        <div style="padding: 0 38px 24px;">
          <div style="border-top: 1px solid #d9d9d9; padding-top: 18px; text-align: center; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #9aa0a6;">
            &copy; ${new Date().getFullYear()} Naxatra Labs. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildBrochureUserEmailTemplate({ firstName }) {
  return renderEmailLayout(`
    <h1 style="margin: 0 0 28px; font-family: Arial, sans-serif; font-size: 24px; line-height: 1.28; font-weight: 400; color: ${EMAIL_HEADING_COLOR};">
      Thank You for Your<br />
      Interest in Naxatra Labs
    </h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Hi ${firstName},</p>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Thank you for your interest in Naxatra Labs.</p>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">We've received your request for the Naxatra Labs brochure. Our team will share the brochure with you shortly.</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Best regards,<br />Naxatra Labs</p>
  `);
}

function buildBrochureTeamEmailTemplate({ firstName, lastName, companyName, email }) {
  return renderEmailLayout(`
    <h1 style="margin: 0 0 28px; font-family: Arial, sans-serif; font-size: 24px; line-height: 1.28; font-weight: 400; color: ${EMAIL_HEADING_COLOR};">
      New Brochure Request<br />
      Received
    </h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Hi Team,</p>
    <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">A new brochure request has been received through the Naxatra Labs website.</p>
    <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Requester Details:</p>
    <ul style="margin: 0 0 18px 18px; padding: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">
      <li>Name: ${firstName} ${lastName}</li>
      <li>Email: ${email}</li>
      <li>Company: ${companyName}</li>
    </ul>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Please share the requested brochure with the user at the earliest.</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Best,<br />Naxatra Labs</p>
  `);
}

function buildSpecSheetUserEmailTemplate({ firstName, productInterestedIn }) {
  return renderEmailLayout(`
    <h1 style="margin: 0 0 28px; font-family: Arial, sans-serif; font-size: 24px; line-height: 1.28; font-weight: 400; color: ${EMAIL_HEADING_COLOR};">
      Thank You for Your<br />
      Interest in Naxatra Labs
    </h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Hi ${firstName},</p>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Thank you for your interest in Naxatra Labs.</p>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">We've received your request for the ${productInterestedIn} spec sheet. Our team will share the spec sheet with you shortly.</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Best regards,<br />Naxatra Labs</p>
  `);
}

function buildSpecSheetTeamEmailTemplate({ firstName, lastName, companyName, email, productInterestedIn }) {
  return renderEmailLayout(`
    <h1 style="margin: 0 0 28px; font-family: Arial, sans-serif; font-size: 24px; line-height: 1.28; font-weight: 400; color: ${EMAIL_HEADING_COLOR};">
      New Spec Sheet Request<br />
      Received
    </h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Hi Team,</p>
    <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">A new spec sheet request has been received through the Naxatra Labs website.</p>
    <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Requester Details:</p>
    <ul style="margin: 0 0 18px 18px; padding: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">
      <li>Name: ${firstName} ${lastName}</li>
      <li>Email: ${email}</li>
      <li>Product Interested In: ${productInterestedIn}</li>
    </ul>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Please share the requested spec sheet with the user at the earliest.</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Best,<br />Naxatra Labs</p>
  `);
}

function buildCareersUserEmailTemplate({ fullName }) {
  return renderEmailLayout(`
    <h1 style="margin: 0 0 28px; font-family: Arial, sans-serif; font-size: 24px; line-height: 1.28; font-weight: 400; color: ${EMAIL_HEADING_COLOR};">
      Thank you for applying to<br />
      Naxatra Labs.
    </h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Hi ${fullName},</p>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Thank you for applying to Naxatra Labs.</p>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">We've received your application and our team is currently reviewing it. If your profile matches our requirements, we'll reach out to you regarding the next steps in the hiring process.</p>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">We appreciate your interest in joining Naxatra Labs and the time you took to apply.</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Best regards,<br />Naxatra Labs</p>
  `);
}

function buildCareersTeamEmailTemplate({ fullName, email, phone, role, linkedin }) {
  return renderEmailLayout(`
    <h1 style="margin: 0 0 28px; font-family: Arial, sans-serif; font-size: 24px; line-height: 1.28; font-weight: 400; color: ${EMAIL_HEADING_COLOR};">
      New Job Application<br />
      Received (Role: ${role})
    </h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Hi Team,</p>
    <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">A new application has been received for the ${role} position at Naxatra Labs.</p>
    <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Candidate Details:</p>
    <ul style="margin: 0 0 18px 18px; padding: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">
      <li>Name: ${fullName}</li>
      <li>Email: ${email}</li>
      <li>Phone: ${phone}</li>
      <li>Role: ${role}</li>
      <li>LinkedIn: <a href="${linkedin}" style="color: ${EMAIL_HEADING_COLOR}; text-decoration: none;">${linkedin}</a></li>
      <li>Application: Resume attached with this email</li>
    </ul>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Please review the application and proceed with the next steps accordingly.</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${EMAIL_BODY_COLOR};">Best,<br />Naxatra Labs</p>
  `);
}

async function sendAutoReplyEmail({
  transporter,
  from,
  to,
  subject,
  recipientName,
  messageLines,
}) {
  if (!to) {
    return;
  }

  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,';

  await transporter.sendMail({
    from,
    to,
    subject,
    text: [
      greeting,
      '',
      ...messageLines,
      '',
      'Regards,',
      'Team Naxatra',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <p>${greeting}</p>
        ${messageLines.map((line) => `<p>${line}</p>`).join('')}
        <p style="margin-top: 20px;">Regards,<br />Team Naxatra</p>
      </div>
    `,
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
    const sender = `Naxatra Careers <${mailConfig.user}>`;

    await transporter.sendMail({
      from: sender,
      to: mailConfig.receiver,
      replyTo: email,
      subject: `New career application: ${role}`,
      text: [
        'New job application received.',
        '',
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Role: ${role}`,
        `LinkedIn: ${linkedin}`,
        'Application: Resume attached with this email',
      ].join('\n'),
      html: buildCareersTeamEmailTemplate({
        fullName,
        email,
        phone,
        role,
        linkedin,
      }),
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
          contentType: req.file.mimetype,
        },
      ],
    });

    await transporter.sendMail({
      from: sender,
      to: email,
      subject: 'Thank you for applying to Naxatra Labs',
      html: buildCareersUserEmailTemplate({ fullName }),
      text: [
        `Hi ${fullName},`,
        '',
        'Thank you for applying to Naxatra Labs.',
        '',
        "We've received your application and our team is currently reviewing it. If your profile matches our requirements, we'll reach out to you regarding the next steps in the hiring process.",
        '',
        'We appreciate your interest in joining Naxatra Labs and the time you took to apply.',
        '',
        'Best regards,',
        'Naxatra Labs',
      ].join('\n'),
    });

    return res.status(200).json({ message: 'Application submitted successfully.' });
  } catch (error) {
    console.error('Failed to send careers email:', error);
    return res.status(500).json({ message: 'Failed to send application email.' });
  }
});

app.post('/api/spec-sheet/request', async (req, res) => {
  const missingEnvVars = getMissingEnvVars(specSheetRequiredEnvVars);
  if (missingEnvVars.length > 0) {
    return res.status(500).json({
      message: `Missing spec sheet email configuration: ${missingEnvVars.join(', ')}`,
    });
  }

  const { firstName, lastName, companyName, email, productInterestedIn } = req.body;

  if (!firstName || !lastName || !companyName || !email || !productInterestedIn) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    const mailConfig = getSpecSheetMailConfig();
    const transporter = createTransporter(mailConfig);
    const sender = `Naxatra Spec Sheet <${mailConfig.user}>`;

    await transporter.sendMail({
      from: sender,
      to: mailConfig.receiver,
      replyTo: email,
      subject: 'New spec sheet request',
      text: [
        'New spec sheet request received.',
        '',
        `Name: ${firstName} ${lastName}`,
        `Email: ${email}`,
        `Company: ${companyName}`,
        `Product Interested In: ${productInterestedIn}`,
      ].join('\n'),
      html: buildSpecSheetTeamEmailTemplate({
        firstName,
        lastName,
        companyName,
        email,
        productInterestedIn,
      }),
    });

    await transporter.sendMail({
      from: sender,
      to: email,
      subject: 'Thank you for your interest in Naxatra Labs',
      html: buildSpecSheetUserEmailTemplate({
        firstName,
        productInterestedIn,
      }),
      text: [
        `Hi ${firstName},`,
        '',
        'Thank you for your interest in Naxatra Labs.',
        '',
        `We have received your request for the ${productInterestedIn} spec sheet. Our team will share the spec sheet with you shortly.`,
        '',
        'Best regards,',
        'Naxatra Labs',
      ].join('\n'),
    });

    return res.status(200).json({ message: 'Spec sheet request submitted successfully.' });
  } catch (error) {
    console.error('Failed to send spec sheet email:', error);
    return res.status(500).json({ message: 'Failed to send spec sheet email.' });
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
    const sender = `Naxatra Brochure <${mailConfig.user}>`;
    const recipientName = `${firstName} ${lastName}`.trim();

    await transporter.sendMail({
      from: sender,
      to: mailConfig.receiver,
      replyTo: email,
      subject: 'New brochure request',
      text: [
        'New brochure request received.',
        '',
        `Name: ${firstName} ${lastName}`,
        `Email: ${email}`,
        `Company: ${companyName}`,
      ].join('\n'),
      html: buildBrochureTeamEmailTemplate({
        firstName,
        lastName,
        companyName,
        email,
      }),
    });

    await transporter.sendMail({
      from: sender,
      to: email,
      subject: 'Thank you for your interest in Naxatra Labs',
      html: buildBrochureUserEmailTemplate({ firstName }),
      text: [
        `Hi ${firstName},`,
        '',
        'Thank you for your interest in Naxatra Labs.',
        '',
        "We've received your request for the Naxatra Labs brochure. Our team will share the brochure with you shortly.",
        '',
        'Best regards,',
        'Naxatra Labs',
      ].join('\n'),
    });

    return res.status(200).json({ message: 'Brochure request submitted successfully.' });
  } catch (error) {
    console.error('Failed to send brochure email:', error);
    return res.status(500).json({ message: 'Failed to send brochure email.' });
  }
});

app.post('/api/contact/motors', async (req, res) => {
  const missing = getMissingEnvVars(contactRequiredEnvVars);
  if (missing.length) {
    return res.status(500).json({ message: `Missing config: ${missing.join(', ')}` });
  }

  const { motorApplication, fullName, email, phone, company, message } = req.body;
  if (!motorApplication || !fullName || !email || !phone || !company || !message) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  try {
    const cfg = getContactMailConfig('CONTACT_MOTORS_RECEIVER_EMAIL');
    const transporter = createTransporter(cfg);
    const sender = `Naxatra Contact <${cfg.user}>`;

    await transporter.sendMail({
      from: sender,
      to: cfg.receiver,
      replyTo: email,
      subject: `Motors Enquiry - ${motorApplication}`,
      text: [
        'New motors enquiry received.',
        '',
        `Motor Application: ${motorApplication}`,
        `Full Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Company: ${company}`,
        `Message: ${message}`,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <h2>New Motors Enquiry</h2>
          <p><strong>Motor Application:</strong> ${motorApplication}</p>
          <p><strong>Full Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Message:</strong> ${message}</p>
        </div>
      `,
    });

    await sendAutoReplyEmail({
      transporter,
      from: sender,
      to: email,
      subject: 'Thanks for contacting Naxatra about motors',
      recipientName: fullName,
      messageLines: [
        'Thank you for reaching out to Naxatra about your motor requirement.',
        `We have received your enquiry for ${motorApplication}.`,
        'Our team will review your request and get back to you soon.',
      ],
    });

    return res.status(200).json({ message: 'Enquiry submitted successfully.' });
  } catch (err) {
    console.error('Motors contact email failed:', err);
    return res.status(500).json({ message: 'Failed to send enquiry.' });
  }
});

app.post('/api/contact/investment', async (req, res) => {
  const missing = getMissingEnvVars(contactRequiredEnvVars);
  if (missing.length) {
    return res.status(500).json({ message: `Missing config: ${missing.join(', ')}` });
  }

  const { investmentCompanyName, companyWebsite, fullName, phone, email } = req.body;
  if (!investmentCompanyName || !companyWebsite || !phone) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  try {
    const cfg = getContactMailConfig('CONTACT_INVESTMENT_RECEIVER_EMAIL');
    const transporter = createTransporter(cfg);
    const sender = `Naxatra Contact <${cfg.user}>`;

    await transporter.sendMail({
      from: sender,
      to: cfg.receiver,
      replyTo: email || undefined,
      subject: `Investment Enquiry - ${investmentCompanyName}`,
      text: [
        'New investment enquiry received.',
        '',
        `Investment Company Name: ${investmentCompanyName}`,
        `Company Website: ${companyWebsite}`,
        `Full Name: ${fullName || '-'}`,
        `Phone: ${phone}`,
        `Business Email: ${email || '-'}`,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <h2>New Investment Enquiry</h2>
          <p><strong>Investment Company Name:</strong> ${investmentCompanyName}</p>
          <p><strong>Company Website:</strong> ${companyWebsite}</p>
          <p><strong>Full Name:</strong> ${fullName || '-'}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Business Email:</strong> ${email || '-'}</p>
        </div>
      `,
    });

    await sendAutoReplyEmail({
      transporter,
      from: sender,
      to: email,
      subject: 'Thanks for contacting Naxatra about investment',
      recipientName: fullName,
      messageLines: [
        'Thank you for reaching out to Naxatra regarding an investment enquiry.',
        `We have received your details for ${investmentCompanyName}.`,
        'Our team will review your submission and connect with you soon.',
      ],
    });

    return res.status(200).json({ message: 'Enquiry submitted successfully.' });
  } catch (err) {
    console.error('Investment contact email failed:', err);
    return res.status(500).json({ message: 'Failed to send enquiry.' });
  }
});

app.post('/api/contact/partnership', async (req, res) => {
  const missing = getMissingEnvVars(contactRequiredEnvVars);
  if (missing.length) {
    return res.status(500).json({ message: `Missing config: ${missing.join(', ')}` });
  }

  const { company, websiteLink, partnershipType, fullName, phone, email, message } = req.body;
  if (!company || !websiteLink || !fullName || !phone || !email || !message) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  try {
    const cfg = getContactMailConfig('CONTACT_PARTNERSHIP_RECEIVER_EMAIL');
    const transporter = createTransporter(cfg);
    const sender = `Naxatra Contact <${cfg.user}>`;

    await transporter.sendMail({
      from: sender,
      to: cfg.receiver,
      replyTo: email,
      subject: `Partnership Enquiry - ${company}`,
      text: [
        'New partnership enquiry received.',
        '',
        `Company Name: ${company}`,
        `Website Link: ${websiteLink}`,
        `Type of Partnership: ${partnershipType || '-'}`,
        `Your Name: ${fullName}`,
        `Phone: ${phone}`,
        `Business Email: ${email}`,
        `Partnership Area: ${message}`,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <h2>New Partnership Enquiry</h2>
          <p><strong>Company Name:</strong> ${company}</p>
          <p><strong>Website Link:</strong> ${websiteLink}</p>
          <p><strong>Type of Partnership:</strong> ${partnershipType || '-'}</p>
          <p><strong>Your Name:</strong> ${fullName}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Business Email:</strong> ${email}</p>
          <p><strong>Partnership Area:</strong> ${message}</p>
        </div>
      `,
    });

    await sendAutoReplyEmail({
      transporter,
      from: sender,
      to: email,
      subject: 'Thanks for contacting Naxatra about partnership',
      recipientName: fullName,
      messageLines: [
        'Thank you for reaching out to Naxatra for a partnership enquiry.',
        `We have received your submission for ${company}.`,
        'Our team will review it and get back to you soon.',
      ],
    });

    return res.status(200).json({ message: 'Enquiry submitted successfully.' });
  } catch (err) {
    console.error('Partnership contact email failed:', err);
    return res.status(500).json({ message: 'Failed to send enquiry.' });
  }
});

app.post('/api/contact/other', async (req, res) => {
  const missing = getMissingEnvVars(contactRequiredEnvVars);
  if (missing.length) {
    return res.status(500).json({ message: `Missing config: ${missing.join(', ')}` });
  }

  const { company, fullName, email, phone, websiteLink, message } = req.body;
  if (!company || !fullName || !email || !phone || !websiteLink || !message) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  try {
    const cfg = getContactMailConfig('CONTACT_OTHER_RECEIVER_EMAIL');
    const transporter = createTransporter(cfg);
    const sender = `Naxatra Contact <${cfg.user}>`;

    await transporter.sendMail({
      from: sender,
      to: cfg.receiver,
      replyTo: email,
      subject: `Other Enquiry - ${company}`,
      text: [
        'New "other" enquiry received.',
        '',
        `Company Name: ${company}`,
        `Your Name: ${fullName}`,
        `Business Email: ${email}`,
        `Phone: ${phone}`,
        `Website Link: ${websiteLink}`,
        `Message: ${message}`,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
          <h2>New Other Enquiry</h2>
          <p><strong>Company Name:</strong> ${company}</p>
          <p><strong>Your Name:</strong> ${fullName}</p>
          <p><strong>Business Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Website Link:</strong> ${websiteLink}</p>
          <p><strong>Message:</strong> ${message}</p>
        </div>
      `,
    });

    await sendAutoReplyEmail({
      transporter,
      from: sender,
      to: email,
      subject: 'Thanks for contacting Naxatra',
      recipientName: fullName,
      messageLines: [
        'Thank you for reaching out to Naxatra.',
        `We have received your enquiry from ${company}.`,
        'Our team will review your message and get back to you soon.',
      ],
    });

    return res.status(200).json({ message: 'Enquiry submitted successfully.' });
  } catch (err) {
    console.error('Other contact email failed:', err);
    return res.status(500).json({ message: 'Failed to send enquiry.' });
  }
});

export default app;
