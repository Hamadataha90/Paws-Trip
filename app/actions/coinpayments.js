'use server'

import crypto from 'crypto'
import axios from 'axios'

export async function createCoinPaymentTransaction(formData) {
  const amount = formData.get('amount')
  const email = formData.get('email')
  const currency2 = formData.get("currency2");

  const publicKey = process.env.NEXT_PUBLIC_COINPAYMENTS_PUBLIC_KEY
  const privateKey = process.env.NEXT_PUBLIC_COINPAYMENTS_PRIVATE_KEY

  const payload = {
    version: "1",
    cmd: "create_transaction",
    key: publicKey,
    amount,
    currency1: "USD",
    currency2: currency2 || "USDT.TRC20", // قيمة افتراضية لو حصلت مشكلة
    buyer_email: email,
    ipn_url: "https://humidity-zone.vercel.app//api/ipn",
    format: "json",
  };

  const encodedPayload = new URLSearchParams(payload).toString()

  const hmac = crypto
    .createHmac('sha512', privateKey)
    .update(encodedPayload)
    .digest('hex')

  try {
    const response = await axios.post(
      'https://www.coinpayments.net/api.php',
      encodedPayload,
      {
        headers: {
          HMAC: hmac,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const result = response.data

    if (result.error === 'ok') {
      return {
        success: true,
        checkout_url: result.result.checkout_url,
        txn_id: result.result.txn_id,
      }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('CoinPayments Error:', error.response?.data || error.message)
    return { success: false, error: 'Something went wrong with the payment.' }
  }
}
