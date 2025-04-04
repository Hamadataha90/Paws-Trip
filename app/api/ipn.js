import crypto from 'crypto'

export default async function handler(req, res) {
  // التأكد من أن الـ request هو POST
  if (req.method === 'POST') {
    const ipnData = req.body // البيانات المرسلة من CoinPayments

    // لازم تتحقق من صحة البيانات باستخدام HMAC
    const hmac = crypto
      .createHmac('sha512', process.env.NEXT_PUBLIC_COINPAYMENTS_PRIVATE_KEY)
      .update(new URLSearchParams(ipnData).toString())
      .digest('hex')

    // إذا كانت الـ HMAC المتبادلة صحيحة
    if (ipnData.hmac === hmac) {
      // هنا ممكن تعمل تحديثات في قاعدة البيانات أو أي عملية أخرى
      // مثل: تحديث حالة الدفع، إتمام المعاملات، إلخ.

      // لو كل شيء تمام، رُد بـ OK
      res.status(200).send('OK')
    } else {
      // إذا كانت البيانات غير صحيحة
      res.status(400).send('Invalid HMAC')
    }
  } else {
    res.status(405).send('Method Not Allowed') // لو الـ method مش POST
  }
}
