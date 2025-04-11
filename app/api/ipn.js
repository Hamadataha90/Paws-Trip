import crypto from 'crypto';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { sql } from '@vercel/postgres';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

  const rawBody = await getRawBody(req);
  const hmacHeader = req.headers['hmac'];
  const privateKey = process.env.COINPAYMENTS_PRIVATE_KEY;

  const hmac = crypto
    .createHmac('sha512', privateKey)
    .update(rawBody)
    .digest('hex');

  // التحقق من صحة HMAC
  if (hmac !== hmacHeader) {
    return res.status(400).send('Invalid HMAC');
  }

  const ipnData = new URLSearchParams(rawBody);
  const txnId = ipnData.get('txn_id');
  const buyerEmail = ipnData.get('buyer_email');
  const paymentStatus = parseInt(ipnData.get('status'), 10);

  // تحديث حالة الطلب بناءً على حالة الدفع
  if (paymentStatus >= 100) {
    try {
      const result = await sql`
        UPDATE "public"."orders"
        SET status = 'Completed'
        WHERE transaction_id = ${txnId} AND status = 'Pending'
      `;
      console.log(`Updated ${result.rowCount} rows for txn_id: ${txnId}`);
      if (result.rowCount === 0) {
        console.warn(`No rows updated for txn_id: ${txnId}. Check if it exists or status is already updated.`);
      }

      // بعد تحديث قاعدة البيانات، إعادة التوجيه إلى صفحة الشكر
      res.writeHead(302, {
        Location: `https://paws-trip.vercel.app/thanks?txn_id=${txnId}&status=completed`
      });
      res.end();

    } catch (error) {
      console.error('Error updating database:', error.message);
    }
  } else if (paymentStatus === -1) {
    // حالة الإلغاء أو الفشل
    try {
      const result = await sql`
        UPDATE "public"."orders"
        SET status = 'Cancelled'
        WHERE transaction_id = ${txnId} AND status = 'Pending'
      `;
      console.log(`Cancelled ${result.rowCount} rows for txn_id: ${txnId}`);
    } catch (error) {
      console.error('Error cancelling order:', error.message);
    }
  }

  // سجل البيانات الواردة في IPN
  try {
    fs.appendFileSync('payment_logs.txt', JSON.stringify(Object.fromEntries(ipnData)) + '\n');
  } catch (error) {
    console.error('Failed to write to payment_logs.txt:', error.message);
  }

  // إرسال إيميل التأكيد
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
    subject: paymentStatus >= 100 ? 'Payment Confirmation' : 'Payment Status Update',
    text: paymentStatus >= 100
      ? `Your payment with transaction ID ${txnId} has been successfully processed.`
      : `Your payment with transaction ID ${txnId} was not completed. Status: ${paymentStatus}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }

  res.status(200).send('Payment processed successfully');
}
