import crypto from 'crypto'
import nodemailer from 'nodemailer'
import fs from 'fs'

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
    // الحصول على البيانات الخام من الـ IPN
    const rawBody = await getRawBody(req)

    // الحصول على الـ HMAC من الهيدر
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

      // كتابة البيانات في ملف النصي (مؤقتًا)
      fs.appendFileSync('payment_logs.txt', JSON.stringify(ipnData) + '\n')

      // إعداد Nodemailer للإرسال
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,  // استخدم متغير البيئة للبريد الإلكتروني
          pass: process.env.EMAIL_PASS,  // استخدم متغير البيئة للباسورد
        },
      })

      const mailOptions = {
        from: process.env.EMAIL_USER,  // نفس البريد المستخدم للإرسال
        to: ipnData.get('buyer_email'),  // بريد العميل الذي دفع
        subject: 'Payment Confirmation',
        text: `Your payment with transaction ID ${ipnData.get('txn_id')} has been successfully processed.`,
      }

      // إرسال البريد الإلكتروني
      try {
        await transporter.sendMail(mailOptions)
        console.log('Email sent successfully')
      } catch (error) {
        console.error('Error sending email:', error.message)
      }

      // إرسال الرد بـ OK
      res.status(200).send('Payment processed successfully')
    } else {
      res.status(400).send('Invalid HMAC')
    }
  } else {
    res.status(405).send('Method Not Allowed') // لو الـ method مش POST
  }
}
