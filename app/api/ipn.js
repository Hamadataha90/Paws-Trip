import crypto from 'crypto';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { sql } from '@vercel/postgres';

// منع Next.js من تحويل body
export const config = {
  api: {
    bodyParser: false,
  },
};

// دالة لجلب الـ Raw Body
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', err => {
      reject(err);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // التأكد من أن POSTGRES_URL موجود
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    return res.status(500).send('POSTGRES_URL is not defined');
  }

  // اختبار الاتصال بقاعدة البيانات
  try {
    const testConnection = await sql`SELECT NOW();`; // اختبار استعلام بسيط
    console.log('Connected to PostgreSQL:', testConnection);
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    return res.status(500).send('Database connection failed');
  }

  // الحصول على البيانات الخام من الـ IPN
  const rawBody = await getRawBody(req);

  // الحصول على الـ HMAC من الهيدر
  const hmacHeader = req.headers['hmac'];
  const privateKey = process.env.COINPAYMENTS_PRIVATE_KEY;

  // تحقق من صحة الـ HMAC باستخدام الـ private key
  const hmac = crypto
    .createHmac('sha512', privateKey)
    .update(rawBody)
    .digest('hex');

  // إذا كانت الـ HMAC المتبادلة صحيحة
  if (hmac !== hmacHeader) {
    return res.status(400).send('Invalid HMAC');
  }

  const ipnData = new URLSearchParams(rawBody);
  const txnId = ipnData.get('txn_id');
  const buyerEmail = ipnData.get('buyer_email');
  const paymentStatus = parseInt(ipnData.get('status'), 10);

  // ✅ تحديث الحالة فقط إذا كانت العملية لم تُعالج من قبل
  if (paymentStatus >= 100) {
    try {
      const result = await sql`
        UPDATE orders
        SET txn_id = ${txnId}, status = 'Completed'
        WHERE txn_id IS NULL AND customer_email = ${buyerEmail} AND status = 'Pending'
      `;
      console.log(`Updated ${result.rowCount} rows for txn_id: ${txnId}`);
    } catch (error) {
      console.error('Error updating database:', error.message);
    }
  }

  // 🧪 لتتبع المدفوعات
  try {
    fs.appendFileSync('payment_logs.txt', JSON.stringify(Object.fromEntries(ipnData)) + '\n');
  } catch (error) {
    console.error('Failed to write to payment_logs.txt:', error.message);
  }

  // 📧 إرسال بريد التأكيد
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: buyerEmail,
    subject: 'Payment Confirmation',
    text: `Your payment with transaction ID ${txnId} has been successfully processed.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }

  res.status(200).send('Payment processed successfully');
}
