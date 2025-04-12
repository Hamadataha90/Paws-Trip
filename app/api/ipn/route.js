import { sql } from '@vercel/postgres';
import { createHmac } from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const headers = req.headers;
    const receivedHmac = headers.get('hmac');
    const secret = process.env.IPN_SECRET;

    if (!secret) {
      console.error('❌ IPN_SECRET is not defined.');
      return new Response('Internal server error', { status: 500 });
    }

    const hmac = createHmac('sha512', secret).update(bodyText).digest('hex');

    if (receivedHmac !== hmac) {
      console.error('❌ Invalid HMAC signature. IPN rejected.');
      return new Response('Invalid signature', { status: 403 });
    }

    const params = new URLSearchParams(bodyText);
    const txn_id = params.get('txn_id');
    const buyer_email = params.get('buyer_email');
    const status = parseInt(params.get('status'));
    const status_text = params.get('status_text');
    const amount = params.get('amount1');
    const currency = params.get('currency1');

    console.log('📬 IPN Received:', {
      txn_id,
      status,
      status_text,
      amount,
      currency,
    });

    // ✅ تحديث قاعدة البيانات
    if (status >= 100 || status === 2) {
      await sql`
        UPDATE orders
        SET status = 'Completed'
        WHERE txn_id = ${txn_id} AND status = 'Pending'
      `;
      console.log(`✅ Order ${txn_id} marked as Completed.`);
    } else if (status === -1) {
      await sql`
        UPDATE orders
        SET status = 'Cancelled'
        WHERE txn_id = ${txn_id} AND status = 'Pending'
      `;
      console.log(`❌ Order ${txn_id} marked as Cancelled.`);
    } else {
      console.log(`⏳ Payment for order ${txn_id} still pending (status: ${status}).`);
    }

    // ✅ إرسال إيميل
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: buyer_email,
      subject: status >= 100 ? 'Payment Confirmation' : 'Payment Status Update',
      text: status >= 100
        ? `Your payment with transaction ID ${txn_id} has been successfully processed.`
        : `Your payment with transaction ID ${txn_id} was not completed. Status: ${status}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully.');
    } catch (error) {
      console.error('📧 Error sending email:', error.message);
    }

    return new Response('IPN received and processed.', { status: 200 });
  } catch (error) {
    console.error('🚨 Error in IPN handler:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
