const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  // 👇 CẤU HÌNH LẠI TRANSPORTER DÙNG PORT 587
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Đổi sang 587
    secure: false, // Port 587 thì secure phải là FALSE
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false, // Bỏ qua lỗi chứng chỉ
      ciphers: 'SSLv3' // Thêm dòng này để tăng độ tương thích
    },
    // Tăng thời gian chờ lên tối đa
    connectionTimeout: 60000, // 60 giây
    greetingTimeout: 30000,
    socketTimeout: 60000
  })

  // ... (Phần generate template và mailOptions giữ nguyên không đổi) ...
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // (Copy lại hàm generateOrderTemplate cũ của bạn vào đây)
  const generateOrderTemplate = (order) => {
    // ... code html cũ ...
    return `<h1>Đơn hàng #${order._id}</h1>` // Demo ngắn
  }

  const mailOptions = {
    from: `"SuperMall Admin" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.order ? generateOrderTemplate(options.order) : options.html
  }

  console.log(`📨 Đang thử gửi mail qua Port 587 tới ${options.email}...`)

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Gửi thành công! ID:', info.messageId)
  } catch (error) {
    console.error('❌ Gửi thất bại:', error.message)
  }
}

module.exports = sendEmail
