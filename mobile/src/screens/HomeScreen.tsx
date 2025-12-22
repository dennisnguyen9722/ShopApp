import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'

// Import API & Components
import { homeApi } from '../api/homeApi'
import ProductItem from '../components/ProductItem'

// 👇 Import Service & Hook để xử lý giỏ hàng
import { CartService } from '../services/CartService'
import { useCartCount } from '../hooks/useCartCount'

const { width } = Dimensions.get('window')

const COLORS = {
  primary: '#5B50F5',
  secondary: '#8C85FF',
  bg: '#F5F5FA',
  white: '#FFFFFF',
  text: '#1F2937',
  subText: '#9CA3AF',
  red: '#EF4444',
  border: '#E5E7EB'
}

export default function HomeScreen({ navigation }: any) {
  // --- STATE ---
  const [products, setProducts] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 👇 Hook tự động lấy số lượng giỏ hàng
  const cartCount = useCartCount()

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const [resProducts, resBanners, resCategories] = await Promise.all([
        homeApi.getProducts(),
        homeApi.getBanners(),
        homeApi.getCategories()
      ])

      setProducts(
        Array.isArray(resProducts.data?.products)
          ? resProducts.data.products
          : Array.isArray(resProducts.data)
          ? resProducts.data
          : []
      )
      setBanners(Array.isArray(resBanners.data) ? resBanners.data : [])
      setCategories(Array.isArray(resCategories.data) ? resCategories.data : [])
    } catch (e) {
      console.log('Error fetching data:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- HANDLERS ---

  // 🔥 ĐÃ SỬA: Xử lý thêm vào giỏ hàng thông minh hơn
  const handleAddToCart = async (item: any) => {
    // 1. Kiểm tra xem sản phẩm có biến thể không
    if (item.variants && item.variants.length > 0) {
      // Nếu có biến thể -> Chuyển người dùng sang trang chi tiết để chọn
      navigation.navigate('ProductDetail', { id: item._id })
      return
    }

    // 2. Nếu là sản phẩm đơn giản -> Thêm ngay vào giỏ
    try {
      console.log('Đang thêm:', item.title)
      await CartService.addToCart(item, 1, {})

      // Optional: Rung nhẹ hoặc báo toast nhỏ nếu muốn
    } catch (error) {
      console.log('Lỗi thêm giỏ:', error)
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm này')
    }
  }

  // Lọc sản phẩm theo danh mục
  const getProductsByCategory = (catSlug: string, catId: string) => {
    return products.filter((p) => {
      const pCat = p.category
      if (!pCat) return false
      if (typeof pCat === 'object')
        return pCat.slug === catSlug || pCat._id === catId
      return pCat === catSlug || pCat === catId
    })
  }

  // --- SUB COMPONENTS ---

  const Header = () => (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerContainer}
    >
      <SafeAreaView edges={['top', 'left', 'right']}>
        <View style={styles.headerContent}>
          {/* Top Row: Logo & Icons */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.welcomeText}>Xin chào,</Text>
              <Text style={styles.logoText}>SuperMall 👋</Text>
            </View>

            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications" size={22} color="#FFF" />
                <View style={styles.notiBadge} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  navigation.navigate('Main', { screen: 'CartTab' })
                }
              >
                <Ionicons name="cart" size={22} color="#FFF" />

                {/* 👇 BADGE GIỎ HÀNG (Chỉ hiện khi > 0) */}
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <TouchableOpacity activeOpacity={0.9} style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Bạn muốn tìm gì hôm nay?"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              editable={false}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )

  const BannerSlider = () => {
    if (banners.length === 0) return null
    return (
      <View style={styles.bannerSection}>
        <FlatList
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.bannerWrapper}>
              <Image
                source={{ uri: item.image }}
                style={styles.bannerImage}
                contentFit="contain" // Hoặc 'cover' tùy chỉnh theo file trước
              />
            </View>
          )}
        />
      </View>
    )
  }

  const CategoryList = () => (
    <View style={styles.catSection}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.catItem}
            onPress={() =>
              navigation.navigate('CategoryDetail', {
                id: item.slug || item.name || item._id,
                name: item.name
              })
            }
          >
            <View style={styles.catIconBox}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={{ width: 32, height: 32 }}
                  contentFit="contain"
                />
              ) : (
                <Ionicons name="grid" size={24} color={COLORS.primary} />
              )}
            </View>
            <Text style={styles.catText} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )

  const ProductSection = ({
    title,
    items,
    isHot
  }: {
    title: string
    items: any[]
    isHot?: boolean
  }) => {
    if (!items || items.length === 0) return null

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isHot && <Ionicons name="flame" size={20} color="#EF4444" />}
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
          keyExtractor={(item, index) => item._id || index.toString()}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <ProductItem
              product={item}
              horizontal={true}
              onPress={() =>
                navigation.navigate('ProductDetail', { id: item._id })
              }
              // 👇 Kết nối sự kiện thêm giỏ hàng đã sửa
              onAddToCart={() => handleAddToCart(item)}
            />
          )}
        />
      </View>
    )
  }

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                fetchData()
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          <BannerSlider />
          <CategoryList />

          <View style={{ marginTop: 8 }}>
            <ProductSection
              title="Gợi ý cho bạn"
              items={products.slice(0, 6)}
              isHot
            />
          </View>

          {categories.map((cat) => {
            const catProducts = getProductsByCategory(cat.slug, cat._id)
            if (catProducts.length > 0) {
              return (
                <ProductSection
                  key={cat._id}
                  title={cat.name}
                  items={catProducts}
                />
              )
            }
            return null
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  )
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header Styles
  headerContainer: {
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  headerContent: { paddingHorizontal: 20, marginTop: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500'
  },
  logoText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5
  },

  iconRow: { flexDirection: 'row', gap: 12 },
  iconBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    position: 'relative'
  },

  // Badge thông báo
  notiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red,
    borderWidth: 1.5,
    borderColor: COLORS.primary
  },

  // Badge giỏ hàng
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.red,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    height: '100%',
    fontWeight: '500'
  },

  // Banner
  bannerSection: { marginTop: 20 },
  bannerWrapper: {
    width: width - 40,
    marginHorizontal: 20,
    aspectRatio: 3, // Giữ tỷ lệ như bạn đã chỉnh
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  bannerImage: { width: '100%', height: '100%' },

  // Categories
  catSection: { marginTop: 24 },
  catItem: { alignItems: 'center', marginRight: 20, width: 68 },
  catIconBox: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  catText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16
  },

  // Sections
  sectionContainer: { marginTop: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' }
})
