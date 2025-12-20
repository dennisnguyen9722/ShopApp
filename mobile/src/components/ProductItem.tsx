import React, { useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'

// Format tiền tệ
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}

const COLORS = {
  bg: '#FFFFFF',
  text: '#1F2937',
  primary: '#5B50F5',
  sub: '#9CA3AF',
  border: '#E5E7EB'
}

interface ProductItemProps {
  product: any
  onPress: () => void
  onAddToCart?: (item: any) => void // 👇 Prop nhận hàm xử lý thêm giỏ
  horizontal?: boolean
  customWidth?: number
}

export default function ProductItem({
  product,
  onPress,
  onAddToCart,
  horizontal = false,
  customWidth
}: ProductItemProps) {
  // Xác định chiều rộng
  const cardWidth = horizontal ? 160 : customWidth || '100%'

  // Animation Values
  const scaleAnim = useRef(new Animated.Value(1)).current // Nút nảy
  const flyAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current // Ảnh bay
  const flyOpacity = useRef(new Animated.Value(0)).current // Độ mờ ảnh bay

  const handleAddToCart = () => {
    // 1. Hiệu ứng nảy nút (Bounce)
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start()

    // 2. Hiệu ứng bay ảnh (Fly)
    flyAnim.setValue({ x: 0, y: 0 })
    flyOpacity.setValue(1)

    Animated.parallel([
      Animated.timing(flyAnim, {
        toValue: { x: 60, y: -150 }, // Bay lên và sang phải
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(flyOpacity, {
        toValue: 0, // Mờ dần
        duration: 600,
        delay: 100,
        useNativeDriver: true
      })
    ]).start()

    // 3. Gọi hàm callback ra bên ngoài
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  return (
    <View style={{ width: cardWidth, marginBottom: 6 }}>
      {/* CARD CHÍNH */}
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.9}
        onPress={onPress}
      >
        {/* Ảnh sản phẩm */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            contentFit="contain"
            transition={500}
          />
          <View style={styles.heartBtn}>
            <Ionicons name="heart-outline" size={14} color="#9CA3AF" />
          </View>
        </View>

        {/* Thông tin */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>

          <View style={styles.row}>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>

            {/* Nút cộng có Animation */}
            <TouchableOpacity
              onPress={handleAddToCart}
              activeOpacity={0.8}
              style={{ padding: 4 }}
            >
              <Animated.View
                style={[styles.addBtn, { transform: [{ scale: scaleAnim }] }]}
              >
                <Ionicons name="add" size={18} color="#FFF" />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={10} color="#FBBF24" />
            <Text style={styles.ratingText}>4.9 | Đã bán 200</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ẢNH BAY (Animation Layer) */}
      <Animated.View
        style={[
          styles.flyingItem,
          {
            opacity: flyOpacity,
            transform: [
              { translateX: flyAnim.x },
              { translateY: flyAnim.y },
              { scale: 0.5 }
            ]
          }
        ]}
      >
        <Image
          source={{ uri: product.image }}
          style={styles.flyImage}
          contentFit="cover"
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative'
  },
  image: { width: '100%', height: '100%' },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 4,
    borderRadius: 20
  },
  content: { padding: 10 },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 6,
    height: 36
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  price: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 10, color: '#9CA3AF' },
  flyingItem: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 999,
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  flyImage: { width: '100%', height: '100%' }
})
