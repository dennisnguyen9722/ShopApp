require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const productRoutes = require('./routes/productRoutes')

const app = express()
const PORT = process.env.PORT || 5001

// CORS - Cho phép TẤT CẢ
app.use(cors())

// Body parser
app.use(express.json())

// LOG REQUEST
app.use((req, res, next) => {
  console.log('📨', req.method, req.path)
  next()
})

// ROOT ROUTE
app.get('/', (req, res) => {
  console.log('✅ Root route HIT!')
  res.status(200).send('API Shop Backend đang chạy...')
})

// TEST ROUTE
app.get('/api/test', (req, res) => {
  console.log('✅ Test route HIT!')
  res.status(200).json({
    message: 'API working!',
    timestamp: new Date(),
    success: true
  })
})

// PRODUCTS ROUTES
app.use('/api/products', productRoutes)

// ✅ 404 HANDLER - Đặt CUỐI CÙNG, sau tất cả routes
app.use((req, res) => {
  console.log('⚠️ 404 - Route not found:', req.path)
  res.status(404).json({ error: 'Route not found' })
})

// Kết nối Database
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shop_local')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err))

// START SERVER
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
  console.log(`📡 Accessible from http://127.0.0.1:${PORT}`)
})
