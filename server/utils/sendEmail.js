const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  // ✅ CẤU HÌNH BREVO (SENDINBLUE)
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Port 587 dùng STARTTLS
    auth: {
      user: process.env.BREVO_USER, // Email đăng ký Brevo
      pass: process.env.BREVO_API_KEY // API Key từ Brevo
    }
  })

  // ✅ HÀM FORMAT TIỀN TỆ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // ✅ TEMPLATE EMAIL ĐƠN HÀNG
  const generateOrderTemplate = (order) => {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">
            ${item.product?.title || 'Sản phẩm'}
            ${
              item.variant
                ? `<br><small style="color: #666;">${item.variant.color} - ${item.variant.storage}</small>`
                : ''
            }
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
            ${formatCurrency(item.price)}
          </td>
        </tr>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
          }
          .order-code {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            margin: 20px 0;
          }
          .order-code strong {
            font-size: 20px;
            color: #667eea;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          th { 
            background: #f8f9fa; 
            padding: 12px 10px; 
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #dee2e6;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
          }
          .total-row {
            background: #f8f9fa;
            font-weight: bold;
          }
          .total-row td {
            padding: 15px 10px;
            font-size: 18px;
            color: #667eea;
          }
          .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .info-box h3 {
            margin-top: 0;
            color: #667eea;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            background: #f8f9fa;
            color: #6c757d; 
            font-size: 13px; 
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Đơn hàng hoàn thành!</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Xin chào <strong>${
              order.customer?.name || 'Quý khách'
            }</strong>,</p>
            
            <p>Đơn hàng của bạn đã được giao thành công! Cảm ơn bạn đã tin tùng và mua hàng tại SuperMall.</p>
            
            <div class="order-code">
              Mã đơn hàng: <strong>#${order._id
                .toString()
                .slice(-6)
                .toUpperCase()}</strong>
            </div>
            
            <h3 style="color: #667eea;">📦 Chi tiết đơn hàng</h3>
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th style="text-align: center; width: 80px;">SL</th>
                  <th style="text-align: right; width: 120px;">Giá</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="2">Tổng tiền</td>
                  <td style="text-align: right;">${formatCurrency(
                    order.totalAmount
                  )}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="info-box">
              <h3>📍 Thông tin giao hàng</h3>
              <p style="margin: 5px 0;"><strong>Người nhận:</strong> ${
                order.customer?.name
              }</p>
              <p style="margin: 5px 0;"><strong>Số điện thoại:</strong> ${
                order.customer?.phone
              }</p>
              <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${
                order.customer?.address
              }</p>
              <p style="margin: 5px 0;"><strong>Thanh toán:</strong> ${
                order.paymentMethod === 'COD'
                  ? 'Tiền mặt (COD)'
                  : order.paymentMethod
              }</p>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              💝 Cảm ơn bạn đã mua hàng tại <strong>SuperMall</strong>!<br>
              Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ:<br>
              📞 Hotline: <strong>1900 xxxx</strong><br>
              📧 Email: <strong>${process.env.BREVO_USER}</strong>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">© 2024 SuperMall. All rights reserved.</p>
            <p style="margin: 5px 0;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // ✅ TẠO MAIL OPTIONS
  const mailOptions = {
    from: `"SuperMall" <${process.env.BREVO_USER}>`, // Email đã verify trên Brevo
    to: options.email,
    subject: options.subject,
    html: options.order ? generateOrderTemplate(options.order) : options.html
  }

  // ✅ GỬI MAIL VỚI XỬ LÝ LỖI
  console.log(`📨 [Brevo] Gửi mail tới ${options.email}...`)

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ [Brevo] Gửi mail thành công! MessageID:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ [Brevo] Lỗi gửi mail:', error.message)

    // Log chi tiết để debug
    if (error.responseCode === 535) {
      console.error('🔐 Lỗi xác thực: Kiểm tra BREVO_USER và BREVO_API_KEY')
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏱️ Timeout: Kiểm tra kết nối mạng')
    } else if (error.responseCode === 550) {
      console.error('📧 Email người nhận không hợp lệ hoặc bị chặn')
    }

    return { success: false, error: error.message }
  }
}

module.exports = sendEmail
