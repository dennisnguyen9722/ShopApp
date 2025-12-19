import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SvgUri } from 'react-native-svg' // 👈 Import thư viện SVG
import { homeApi } from '../api/homeApi'
import ProductItem from '../components/ProductItem'

export default function HomeScreen({ navigation }: any) {
  // 1. State chứa dữ liệu thật
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 2. Hàm gọi API
  const fetchData = async () => {
    try {
      const [resProducts, resCats, resBanners] = await Promise.all([
        homeApi.getProducts(),
        homeApi.getCategories(),
        homeApi.getBanners()
      ])

      setProducts(resProducts.data.products || resProducts.data)
      setCategories(resCats.data || [])
      setBanners(resBanners.data || [])
    } catch (error) {
      console.error('Lỗi tải trang chủ:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // --- Header Component ---
  const ListHeader = () => (
    <View style={{ marginBottom: 10 }}>
      {/* 1. Banner Quảng Cáo */}
      {banners.length > 0 ? (
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: banners[0]?.image }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>
      ) : (
        // Placeholder nếu chưa có banner
        <View style={[styles.bannerContainer, styles.bannerPlaceholder]}>
          <Text style={{ color: '#6366f1', fontWeight: 'bold' }}>
            SuperMall Xin Chào! 👋
          </Text>
        </View>
      )}

      {/* 2. Danh mục (Hỗ trợ SVG & PNG) */}
      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat: any, index) => {
            // Kiểm tra đuôi file để chọn cách render
            const isSvg = cat.image?.toLowerCase().endsWith('.svg')

            return (
              <TouchableOpacity key={cat._id || index} style={styles.catItem}>
                <View style={[styles.catIcon, { backgroundColor: '#e0f2fe' }]}>
                  {cat.image ? (
                    isSvg ? (
                      // Render SVG
                      <SvgUri width="60%" height="60%" uri={cat.image} />
                    ) : (
                      // Render Ảnh thường (PNG/JPG)
                      <Image
                        source={{ uri: cat.image }}
                        style={{ width: '60%', height: '60%' }}
                        resizeMode="contain"
                      />
                    )
                  ) : (
                    // Render Icon mặc định nếu không có ảnh
                    <Ionicons name="grid-outline" size={24} color="#333" />
                  )}
                </View>
                <Text style={styles.catName} numberOfLines={2}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Tiêu đề Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gợi ý hôm nay 🔥</Text>
        <Text style={styles.seeMore}>Xem tất cả</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Header Search Cố định */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={26} color="#fff" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>0</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4f46e5"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item: any) => item._id}
            renderItem={({ item }) => (
              <ProductItem
                product={item}
                onPress={() =>
                  navigation.navigate('ProductDetail', { id: item._id })
                }
              />
            )}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4f46e5']}
              />
            }
            ListHeaderComponent={ListHeader}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f6' },

  // Header Style
  header: {
    backgroundColor: '#4f46e5',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 42
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  cartBtn: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4f46e5'
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  // Body
  body: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between' },

  // Banner
  bannerContainer: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20
  },
  bannerPlaceholder: {
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bannerImage: { width: '100%', height: '100%' },

  // Categories
  catContainer: { marginBottom: 24 },
  catItem: { alignItems: 'center', marginRight: 16, width: 70 }, // Tăng width để text không bị cắt
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden' // Để ảnh không lòi ra ngoài vòng tròn
  },
  catName: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    lineHeight: 16
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  seeMore: { fontSize: 13, color: '#4f46e5', fontWeight: '600' }
})
