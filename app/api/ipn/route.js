import { sql } from '@vercel/postgres';

export async function POST(req) {
  try {
    const bodyText = await req.text(); // نقرأ النص الكامل للـ body
    const headers = req.headers;

    // Secret اللي جاية في الهيدر من CoinPayments
    const receivedHmac = headers.get('hmac');
    const secret = process.env.IPN_SECRET;
    if (!secret) {
      console.error('❌ IPN_SECRET is not defined.');
      return new Response('Internal server error', { status: 500 });
    }

    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(bodyText);
    const expectedHmac = hmac.digest('hex');

    if (receivedHmac !== expectedHmac) {
      console.error('❌ Invalid HMAC signature. IPN rejected.');
      return new Response('Invalid signature', { status: 403 });
    }

    // تحويل bodyText إلى formData
    const params = new URLSearchParams(bodyText);

    const txn_id = params.get('txn_id');
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

    if (status >= 100 || status === 2) {
      await sql`
        UPDATE orders
        SET status = 'Paid'
        WHERE txn_id = ${txn_id}
      `;
      console.log(`✅ Order ${txn_id} marked as Paid.`);
    } else if (status < 0) {
      await sql`
        UPDATE orders
        SET status = 'Cancelled'
        WHERE txn_id = ${txn_id}
      `;
      console.log(`❌ Order ${txn_id} marked as Cancelled.`);
    } else {
      console.log(`⏳ Payment for order ${txn_id} still pending (status: ${status}).`);
    }

    return new Response('IPN received and verified.', { status: 200 });
  } catch (error) {
    console.error('🚨 Error in IPN handler:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
