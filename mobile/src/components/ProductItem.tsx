import React, { useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency } from '../utils/formatCurrency' // Hàm format tiền (nếu bạn tách riêng)

// Nếu chưa tách hàm format thì dùng tạm hàm này:
// const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2 // Trừ padding để chia 2 cột

interface ProductItemProps {
  product: any
  onPress: () => void
  onAddToCart: () => void
  horizontal?: boolean
}

export default function ProductItem({
  product,
  onPress,
  onAddToCart,
  horizontal = false
}: ProductItemProps) {
  // Animation Scale cho nút bấm
  const scaleAnim = useRef(new Animated.Value(1)).current

  // 👇 KIỂM TRA BIẾN THỂ
  const hasVariants = product.variants && product.variants.length > 0

  const handleButtonPress = () => {
    // 1. Nếu có biến thể -> Chuyển hướng luôn, KHÔNG chạy animation bay vào giỏ
    if (hasVariants) {
      onPress() // Chuyển sang trang chi tiết
      return
    }

    // 2. Nếu là sản phẩm đơn -> Chạy Animation nút nảy lên 1 cái cho vui mắt
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease
      })
    ]).start()

    // Gọi hàm thêm vào giỏ
    onAddToCart()
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        horizontal
          ? { width: 150, marginRight: 0 }
          : { width: CARD_WIDTH, marginBottom: 16 }
      ]}
    >
      {/* Ảnh sản phẩm */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          contentFit="contain" // Dùng contain để thấy hết sản phẩm
          transition={500}
        />

        {/* Badge giảm giá (nếu có) */}
        {product.originalPrice > product.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              -
              {Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100
              )}
              %
            </Text>
          </View>
        )}
      </View>

      {/* Thông tin */}
      <View style={styles.info}>
        <Text style={styles.category} numberOfLines={1}>
          {typeof product.category === 'object'
            ? product.category?.name
            : 'Sản phẩm'}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.priceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                {formatCurrency(product.originalPrice)}
              </Text>
            )}
          </View>

          {/* 👇 NÚT HÀNH ĐỘNG THÔNG MINH */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleButtonPress} // Dùng hàm xử lý riêng
          >
            <Animated.View
              style={[
                styles.addBtn,
                // Đổi màu nút: Biến thể (Xám/Đen) - Mua ngay (Xanh chủ đạo)
                {
                  backgroundColor: hasVariants ? '#F3F4F6' : '#5B50F5',
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              {/* Đổi Icon: Biến thể (Mũi tên/Option) - Mua ngay (Giỏ hàng/Cộng) */}
              <Ionicons
                name={hasVariants ? 'options' : 'add'}
                size={20}
                color={hasVariants ? '#4B5563' : '#FFF'}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  imageWrapper: {
    width: '100%',
    height: 150,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  discountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  info: {
    padding: 10
  },
  category: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    height: 36 // Giữ chiều cao cố định cho 2 dòng
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#5B50F5'
  },
  originalPrice: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 1
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
