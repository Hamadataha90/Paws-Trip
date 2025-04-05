import crypto from 'crypto'

// منع Next.js من تحويل body
export const config = {
  api: {
    bodyParser: false,
  },
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    req.on('end', () => {
      resolve(data)
    })
    req.on('error', err => {
      reject(err)
    })
  })
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const rawBody = await getRawBody(req)

    // Get HMAC from the header
    const hmacHeader = req.headers['hmac']

    // تحقق من صحة الـ HMAC باستخدام الـ private key
    const privateKey = process.env.COINPAYMENTS_PRIVATE_KEY
    const hmac = crypto
      .createHmac('sha512', privateKey)
      .update(rawBody)
      .digest('hex')

    // إذا كانت الـ HMAC المتبادلة صحيحة
    if (hmac === hmacHeader) {
      const ipnData = new URLSearchParams(rawBody)

      // هنا ممكن تعمل تحديثات في قاعدة البيانات أو أي عملية أخرى
      // مثل: تحديث حالة الدفع، إتمام المعاملات، إلخ.

      res.status(200).send('OK')
    } else {
      res.status(400).send('Invalid HMAC')
    }
  } else {
    res.status(405).send('Method Not Allowed') // لو الـ method مش POST
  }
}
