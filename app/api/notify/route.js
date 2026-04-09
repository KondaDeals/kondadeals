import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, order, phone, email } = body

    // Email notification via SMTP
    if (email && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendEmail({ type, order, email })
    }

    // SMS via MSG91
    if (phone && process.env.MSG91_AUTH_KEY) {
      await sendSMS({ type, order, phone })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Notification error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function sendEmail({ type, order, email }) {
  const nodemailer = await import('nodemailer')

  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const subjects = {
    order_placed: `✅ Order Confirmed - #${order.order_number}`,
    order_shipped: `🚚 Your Order is Shipped - #${order.order_number}`,
    order_delivered: `🎉 Order Delivered - #${order.order_number}`,
  }

  const messages = {
    order_placed: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#e53935;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px">✅ Order Confirmed!</h1>
        </div>
        <div style="background:white;padding:24px;border:1px solid #f0f0f0">
          <p>Dear <strong>${order.full_name}</strong>,</p>
          <p>Your order has been placed successfully!</p>
          <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:16px 0">
            <p><strong>Order ID:</strong> #${order.order_number}</p>
            <p><strong>Amount:</strong> ₹${order.final_amount}</p>
            <p><strong>Payment:</strong> ${order.payment_method?.toUpperCase()}</p>
            <p><strong>Delivery to:</strong> ${order.city}, ${order.state}</p>
          </div>
          <p>Expected delivery: <strong>3-5 business days</strong></p>
          <p>Track your order at: <a href="https://kondadeals.com/track" style="color:#e53935">kondadeals.com/track</a></p>
        </div>
        <div style="background:#f8f8f8;padding:16px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#999">
          KondaDeals | kondadeals.com | kondadeals@gmail.com
        </div>
      </div>
    `,
    order_shipped: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#1565c0;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0">🚚 Your Order is on the Way!</h1>
        </div>
        <div style="background:white;padding:24px;border:1px solid #f0f0f0">
          <p>Dear <strong>${order.full_name}</strong>,</p>
          <p>Great news! Your order has been shipped.</p>
          <div style="background:#e3f2fd;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #1565c0">
            <p><strong>Order ID:</strong> #${order.order_number}</p>
            ${order.tracking_number ? `<p><strong>🔍 Tracking Number:</strong> <span style="font-size:18px;font-weight:900;letter-spacing:1px">${order.tracking_number}</span></p>` : ''}
            ${order.courier_name ? `<p><strong>Courier:</strong> ${order.courier_name}</p>` : ''}
          </div>
          <p>Track your order: <a href="https://kondadeals.com/track?order=${order.order_number}" style="color:#e53935;font-weight:700">Click here to track</a></p>
        </div>
        <div style="background:#f8f8f8;padding:16px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#999">
          KondaDeals | kondadeals.com
        </div>
      </div>
    `,
    order_delivered: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#2e7d32;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0">🎉 Order Delivered!</h1>
        </div>
        <div style="background:white;padding:24px;border:1px solid #f0f0f0">
          <p>Dear <strong>${order.full_name}</strong>,</p>
          <p>Your order <strong>#${order.order_number}</strong> has been delivered successfully!</p>
          <p>We hope you love your purchase. Please share your feedback!</p>
          <a href="https://kondadeals.com/account" style="display:inline-block;background:#e53935;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px">Write a Review</a>
        </div>
        <div style="background:#f8f8f8;padding:16px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#999">
          KondaDeals | kondadeals.com
        </div>
      </div>
    `,
  }

  await transporter.sendMail({
    from: `"KondaDeals" <${process.env.SMTP_USER}>`,
    to: email,
    subject: subjects[type] || 'Order Update - KondaDeals',
    html: messages[type] || `<p>Your order #${order.order_number} has been updated.</p>`,
  })
}

async function sendSMS({ type, order, phone }) {
  const messages = {
    order_placed: `KondaDeals: Your order #${order.order_number} is confirmed! Amount: Rs.${order.final_amount}. Track at kondadeals.com/track`,
    order_shipped: `KondaDeals: Order #${order.order_number} shipped!${order.tracking_number ? ` Tracking: ${order.tracking_number}` : ''} Track at kondadeals.com/track`,
    order_delivered: `KondaDeals: Order #${order.order_number} delivered! Thank you for shopping with us.`,
  }

  const message = messages[type] || `Order #${order.order_number} updated.`
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const phoneWith91 = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone

  // MSG91 API
  const response = await fetch('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'authkey': process.env.MSG91_AUTH_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID || '',
      sender: process.env.MSG91_SENDER_ID || 'KDDEALS',
      mobiles: phoneWith91,
      var1: order.order_number,
      var2: order.tracking_number || '',
    })
  })

  const result = await response.json()
  console.log('SMS result:', result)
}