const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  // 1. Tạo transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Hoặc host SMTP khác
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  // 2. Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // 3. Tạo nội dung HTML cho hóa đơn
  const generateOrderTemplate = (order) => {
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; color: #333;">
            ${item.productName} <br/>
            <small style="color: #777;">${item.variant?.color || ''} ${
          item.variant?.storage || ''
        }</small>
        </td>
        <td style="padding: 10px; text-align: center; color: #333;">${
          item.quantity
        }</td>
        <td style="padding: 10px; text-align: right; color: #333;">${formatCurrency(
          item.price * item.quantity
        )}</td>
      </tr>
    `
      )
      .join('')

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">Xác Nhận Đơn Hàng</h1>
          <p style="color: #e0e7ff; margin-top: 5px;">Cảm ơn bạn đã mua sắm tại SuperMall!</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Xin chào <strong>${order.customer.name}</strong>,</p>
          <p>Đơn hàng <strong>#${order._id
            .toString()
            .slice(-6)
            .toUpperCase()}</strong> của bạn đã được tiếp nhận.</p>
          
          <h3 style="border-bottom: 2px solid #4F46E5; padding-bottom: 5px; color: #4F46E5;">Chi tiết đơn hàng</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center;">SL</th>
                <th style="padding: 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Tổng cộng:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #EF4444; font-size: 18px;">
                  ${formatCurrency(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 20px; background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">Thông tin giao hàng:</p>
            <p style="margin: 5px 0 0; color: #555;">📍 ${
              order.customer.address
            }</p>
            <p style="margin: 5px 0 0; color: #555;">📞 ${
              order.customer.phone
            }</p>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          <p>Đây là email tự động, vui lòng không trả lời email này.</p>
        </div>
      </div>
    `
  }

  // 4. Cấu hình mail options
  const mailOptions = {
    from: `"SuperMall Admin" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: generateOrderTemplate(options.order)
  }

  // 5. Gửi
  await transporter.sendMail(mailOptions)
}

module.exports = sendEmail
