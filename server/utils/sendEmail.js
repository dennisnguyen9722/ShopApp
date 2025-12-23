const Brevo = require('@getbrevo/brevo')

// Khởi tạo API instance
const apiInstance = new Brevo.TransactionalEmailsApi()

// Gán API key từ .env
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
)

/**
 * Gửi email xác nhận đơn hàng hoàn thành
 */
async function sendEmail({ email, subject, order }) {
  if (!email) return console.warn('❌ Không có email khách hàng để gửi.')

  try {
    const orderCode = order._id.toString().slice(-6).toUpperCase()

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
        <h2 style="color:#2563eb;">Cảm ơn bạn đã mua hàng tại <strong>SuperMall</strong>!</h2>
        <p>Xin chào <strong>${order.customer?.name || 'Quý khách'}</strong>,</p>
        <p>Đơn hàng <strong>#${orderCode}</strong> của bạn đã được <strong>hoàn thành</strong>.</p>
        <hr/>
        <h3>Chi tiết đơn hàng</h3>
        <ul>
          ${order.items
            .map(
              (item) => `
              <li>
                ${item.title || item.product?.title || 'Sản phẩm'} 
                ${
                  item.variant
                    ? `(${item.variant.color || ''} ${
                        item.variant.storage || ''
                      })`
                    : ''
                } - 
                SL: ${item.quantity} 
                - Giá: ${new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(item.price)}
              </li>`
            )
            .join('')}
        </ul>
        <p><strong>Tổng thanh toán:</strong> ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(order.totalAmount)}</p>
        <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod}</p>
        <p><strong>Địa chỉ giao hàng:</strong> ${
          order.customer?.address || 'Không có'
        }</p>
        <br/>
        <p>Chúng tôi hy vọng bạn hài lòng với sản phẩm và mong được phục vụ bạn trong lần mua sắm tiếp theo 💙</p>
        <p>— SuperMall Team</p>
      </div>
    `

    const sendSmtpEmail = new Brevo.SendSmtpEmail({
      subject,
      htmlContent,
      sender: { name: 'SuperMall', email: process.env.BREVO_USER },
      to: [{ email }]
    })

    await apiInstance.sendTransacEmail(sendSmtpEmail)
    console.log(`✅ Email xác nhận đã gửi đến: ${email}`)
  } catch (error) {
    console.error(
      '❌ Lỗi gửi email Brevo:',
      error.response?.text || error.message
    )
  }
}

module.exports = sendEmail
