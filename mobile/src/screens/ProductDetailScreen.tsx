import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency } from '../utils/formatCurrency'
import { homeApi } from '../api/homeApi'
import { cartApi } from '../api/cartApi' // 👈 Nhớ import cartApi

const { width } = Dimensions.get('window')
const HERO_HEIGHT = width

const COLORS = {
  bg: '#F6F5F9',
  surface: '#FFFFFF',
  text: '#1F2937',
  sub: '#6B7280',
  border: '#E5E7EB',
  primary: '#3F3A5F',
  accent: '#F59E0B',
  lightGray: '#F9FAFB'
}

export default function ProductDetailScreen({ route, navigation }: any) {
  const { id } = route.params
  const [product, setProduct] = useState<any>(null)
  const scrollY = useRef(new Animated.Value(0)).current
  const [loading, setLoading] = useState(true)

  // State lưu lựa chọn (VD: { "Màu sắc": "Titan Xanh", "Dung lượng": "256GB" })
  const [selectedVariants, setSelectedVariants] = useState<any>({})

  // --- LOGIC XỬ LÝ BIẾN THỂ (Gom nhóm từ SKU) ---
  const processVariants = (variants: any[]) => {
    if (!variants || variants.length === 0) return []

    const groups = []

    // 1. Gom nhóm Màu sắc
    const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))]
    if (colors.length > 0) {
      groups.push({ name: 'Màu sắc', values: colors })
    }

    // 2. Gom nhóm Dung lượng
    const storages = [
      ...new Set(variants.map((v) => v.storage).filter(Boolean))
    ]
    if (storages.length > 0) {
      groups.push({ name: 'Dung lượng', values: storages })
    }

    // 3. Gom nhóm RAM
    const rams = [...new Set(variants.map((v) => v.ram).filter(Boolean))]
    if (rams.length > 0) {
      groups.push({ name: 'RAM', values: rams })
    }

    return groups
  }

  const fetchDetail = async () => {
    try {
      const res = await homeApi.getDetail(id)
      const data = res.data

      // Xử lý gom nhóm biến thể
      data.groupedVariants = processVariants(data.variants || [])

      setProduct(data)

      // Tự động chọn option đầu tiên
      if (data.groupedVariants.length > 0) {
        const defaultSelection: any = {}
        data.groupedVariants.forEach((group: any) => {
          if (group.values.length > 0) {
            defaultSelection[group.name] = group.values[0]
          }
        })
        setSelectedVariants(defaultSelection)
      }
    } catch (e) {
      console.log('Lỗi tải chi tiết:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [])

  // Xử lý chọn biến thể
  const handleSelectVariant = (groupName: string, value: string) => {
    setSelectedVariants((prev: any) => ({
      ...prev,
      [groupName]: value
    }))
  }

  // --- LOGIC THÊM VÀO GIỎ ---
  const handleAddToCart = async () => {
    // 1. Kiểm tra đăng nhập (đơn giản bằng cách check token trong storage nếu cần,
    // hoặc để backend trả lỗi 401 rồi catch)

    // 2. Kiểm tra xem đã chọn đủ biến thể chưa
    if (product.groupedVariants && product.groupedVariants.length > 0) {
      const missingVariants = product.groupedVariants.filter(
        (g: any) => !selectedVariants[g.name]
      )

      if (missingVariants.length > 0) {
        Alert.alert(
          'Chưa chọn phân loại',
          `Vui lòng chọn ${missingVariants.map((g: any) => g.name).join(', ')}`
        )
        return
      }
    }

    // 3. Gọi API
    try {
      // Demo số lượng = 1
      await cartApi.addToCart(product._id, 1, selectedVariants)

      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng! 🛒', [
        { text: 'Ở lại đây', style: 'cancel' },
        {
          text: 'Xem giỏ hàng',
          onPress: () => navigation.navigate('Main', { screen: 'CartTab' })
        }
      ])
    } catch (error: any) {
      console.log('Lỗi thêm giỏ hàng:', error)
      if (error.response?.status === 401) {
        Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để mua hàng', [
          { text: 'Hủy' },
          { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
        ])
      } else {
        Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng lúc này')
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!product) return null

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons
              name="share-social-outline"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Main', { screen: 'CartTab' })}
          >
            <Ionicons name="cart-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* IMAGE HERO */}
        <Animated.View
          style={[
            styles.imageWrap,
            {
              transform: [
                {
                  scale: scrollY.interpolate({
                    inputRange: [-100, 0, HERO_HEIGHT],
                    outputRange: [1.2, 1, 1],
                    extrapolate: 'clamp'
                  })
                },
                {
                  translateY: scrollY.interpolate({
                    inputRange: [-100, 0, HERO_HEIGHT],
                    outputRange: [0, 0, HERO_HEIGHT * 0.5],
                    extrapolate: 'clamp'
                  })
                }
              ]
            }
          ]}
        >
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        {/* CONTENT BODY */}
        <View style={styles.content}>
          {/* Tên & Giá */}
          <View style={styles.titleSection}>
            <Text style={styles.category}>
              {product.category || 'Sản phẩm'}
            </Text>
            <Text style={styles.title}>{product.title}</Text>

            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <Text style={styles.price}>{formatCurrency(product.price)}</Text>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <Text style={styles.originalPrice}>
                    {formatCurrency(product.originalPrice)}
                  </Text>
                )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* CHỌN BIẾN THỂ (Gom nhóm) */}
          {product.groupedVariants && product.groupedVariants.length > 0 && (
            <View style={styles.variantSection}>
              {product.groupedVariants.map((group: any, index: number) => (
                <View key={index} style={{ marginBottom: 16 }}>
                  <Text style={styles.variantLabel}>
                    {group.name}:{' '}
                    <Text style={{ fontWeight: 'normal', color: COLORS.text }}>
                      {selectedVariants[group.name]}
                    </Text>
                  </Text>

                  <View style={styles.variantOptionsRow}>
                    {group.values.map((opt: string, idx: number) => {
                      const isSelected = selectedVariants[group.name] === opt
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.optionBtn,
                            isSelected && styles.optionBtnSelected
                          ]}
                          onPress={() => handleSelectVariant(group.name, opt)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
              <View style={styles.divider} />
            </View>
          )}

          {/* THÔNG SỐ KỸ THUẬT */}
          <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
          {product.specs && product.specs.length > 0 ? (
            <View style={styles.specsContainer}>
              {product.specs.map((item: any, index: number) => (
                <View
                  key={index}
                  style={[styles.specRow, index % 2 !== 0 && styles.specRowAlt]}
                >
                  <Text style={styles.specLabel}>{item.k}</Text>
                  <Text style={styles.specValue}>{item.v}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: COLORS.sub, fontStyle: 'italic' }}>
              Đang cập nhật thông số...
            </Text>
          )}

          <View style={styles.divider} />

          {/* MÔ TẢ */}
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}
          {product.content && product.content !== product.description ? (
            <Text style={[styles.description, { marginTop: 12 }]}>
              {product.content}
            </Text>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* FOOTER */}
      <View style={styles.ctaWrap}>
        <View>
          <Text style={styles.ctaLabel}>Tổng tiền</Text>
          <Text style={styles.ctaPrice}>{formatCurrency(product.price)}</Text>
        </View>

        <TouchableOpacity style={styles.ctaBtn} onPress={handleAddToCart}>
          <Text style={styles.ctaText}>Thêm vào giỏ</Text>
          <Ionicons name="cart" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingTop: 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },

  imageWrap: {
    width,
    height: HERO_HEIGHT,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  image: { width: '100%', height: '100%' },

  content: {
    backgroundColor: COLORS.surface,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5
  },

  titleSection: { marginBottom: 10 },
  category: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 30
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8
  },
  starBadge: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    gap: 2
  },
  starText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  reviewCount: { color: COLORS.sub, fontSize: 13 },
  dot: { color: COLORS.border },
  soldText: { color: COLORS.sub, fontSize: 13 },

  price: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 16
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.sub,
    textDecorationLine: 'line-through',
    marginTop: 22
  },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16
  },

  /* Variant Styles */
  // 👇 ĐÃ BỔ SUNG variantSection Ở ĐÂY
  variantSection: { marginBottom: 16 },
  variantLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.sub,
    marginBottom: 8
  },
  variantOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  optionBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center'
  },
  optionBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  optionText: { color: COLORS.text, fontSize: 14 },
  optionTextSelected: { color: '#fff', fontWeight: 'bold' },

  /* Specs Table */
  specsContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden'
  },
  specRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fff'
  },
  specRowAlt: { backgroundColor: COLORS.lightGray },
  specLabel: { flex: 1, color: COLORS.sub, fontSize: 14 },
  specValue: { flex: 2, color: COLORS.text, fontSize: 14, fontWeight: '500' },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.sub,
    textAlign: 'justify'
  },

  /* CTA Footer */
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10
  },
  ctaLabel: { fontSize: 12, color: COLORS.sub },
  ctaPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
})
