const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  // 1. Cấu hình Transporter chuẩn cho Render + Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Dùng service mặc định cho tiện
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Mật khẩu ứng dụng (không khoảng trắng)
    },
    // 👇 QUAN TRỌNG: Cấu hình này giúp bypass lỗi timeout trên Render
    tls: {
      rejectUnauthorized: false
    }
  })

  // 2. Format tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // 3. HTML Template (Hóa đơn đẹp)
  const generateOrderTemplate = (order) => {
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">
            ${item.productName} <br/>
            <small style="color: #777;">${item.variant?.color || ''} ${
          item.variant?.storage || ''
        }</small>
        </td>
        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">${formatCurrency(
          item.price * item.quantity
        )}</td>
      </tr>
    `
      )
      .join('')

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: white;">
          <h1>Cảm ơn bạn đã mua hàng!</h1>
          <p>Đơn hàng #${order._id
            .toString()
            .slice(-6)
            .toUpperCase()} đã hoàn thành.</p>
        </div>
        <div style="padding: 20px;">
          <p>Xin chào <strong>${order.customer.name}</strong>,</p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center;">SL</th>
                <th style="padding: 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="text-align: right; padding: 10px; font-weight: bold;">Tổng cộng:</td>
                <td style="text-align: right; padding: 10px; font-weight: bold; color: #EF4444;">${formatCurrency(
                  order.totalAmount
                )}</td>
              </tr>
            </tfoot>
          </table>
          <p style="margin-top: 20px;">📍 Địa chỉ: ${order.customer.address}</p>
        </div>
      </div>
    `
  }

  // 4. Setup mail data
  const mailOptions = {
    from: `"SuperMall Admin" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: generateOrderTemplate(options.order)
  }

  // 5. Gửi (Có log để debug)
  console.log(`📨 Đang kết nối Gmail để gửi tới ${options.email}...`)
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Gửi mail thành công! ID:', info.messageId)
  } catch (error) {
    console.error('❌ Gửi mail thất bại:', error.message)
    // Không ném lỗi (throw) để tránh crash server
  }
}

module.exports = sendEmail
