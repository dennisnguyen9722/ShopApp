import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { homeApi } from '../api/homeApi'
import ProductItem from '../components/ProductItem'

const { width } = Dimensions.get('window')

/* ==================== THEME ==================== */
const COLORS = {
  primary: '#3F3A5F',
  accent: '#F59E0B',
  bg: '#F6F5F9',
  surface: '#FFFFFF',
  text: '#1F2937',
  sub: '#6B7280',
  border: '#E5E7EB'
}

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeBanner, setActiveBanner] = useState(0)

  const bannerRef = useRef<FlatList>(null)

  const fetchData = async () => {
    try {
      const [resProducts, resBanners, resCategories] = await Promise.all([
        homeApi.getProducts(),
        homeApi.getBanners(),
        homeApi.getCategories()
      ])

      setProducts(resProducts.data.products || resProducts.data || [])
      setBanners(resBanners.data || [])
      setCategories(resCategories.data || [])
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  /* ==================== AUTO SLIDE ==================== */
  useEffect(() => {
    if (!banners.length) return

    const timer = setInterval(() => {
      const next = (activeBanner + 1) % banners.length
      bannerRef.current?.scrollToIndex({
        index: next,
        animated: true
      })
      setActiveBanner(next)
    }, 4000)

    return () => clearInterval(timer)
  }, [activeBanner, banners.length])

  /* ==================== HERO BANNER ==================== */
  const Hero = () => {
    if (!banners.length) return null

    return (
      <View style={styles.heroWrap}>
        <FlatList
          ref={bannerRef}
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width)
            setActiveBanner(index)
          }}
          renderItem={({ item }) => (
            <Image source={{ uri: item.image }} style={styles.heroImage} />
          )}
        />

        {/* DOT INDICATOR */}
        <View style={styles.dotWrap}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeBanner && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    )
  }

  /* ==================== CATEGORIES ==================== */
  const Categories = () => (
    <FlatList
      data={categories}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.categoryList}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.categoryChip}>
          <Text style={styles.categoryText}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  )

  /* ==================== DEAL ==================== */
  const HighlightDeal = () => (
    <View style={styles.dealWrap}>
      <View>
        <Text style={styles.dealTitle}>Deal nổi bật hôm nay</Text>
        <Text style={styles.dealSub}>Số lượng có hạn</Text>
      </View>

      <View style={styles.dealPriceBox}>
        <Text style={styles.dealPrice}>-25%</Text>
      </View>
    </View>
  )

  const ListHeader = () => (
    <>
      <Hero />
      <Categories />
      <HighlightDeal />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
        <Text style={styles.sectionLink}>Xem tất cả</Text>
      </View>
    </>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.sub} />
          <TextInput
            placeholder="Tìm kiếm sản phẩm"
            placeholderTextColor={COLORS.sub}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 100 }} size="large" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <ProductItem
              product={item}
              onPress={() =>
                navigation.navigate('ProductDetail', { id: item._id })
              }
            />
          )}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
          }
        />
      )}
    </View>
  )
}

/* ==================== STYLES ==================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },

  /* HEADER */
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },

  searchBar: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text
  },

  cartBtn: {
    padding: 6
  },

  /* HERO */
  heroWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    aspectRatio: 16 / 9
  },

  heroImage: {
    width,
    height: '100%',
    resizeMode: 'contain'
  },

  dotWrap: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB'
  },

  dotActive: {
    backgroundColor: COLORS.primary,
    width: 14
  },

  /* CATEGORY */
  categoryList: {
    paddingHorizontal: 16,
    marginTop: 20
  },

  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text
  },

  /* DEAL */
  dealWrap: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },

  dealSub: {
    fontSize: 12,
    color: COLORS.sub,
    marginTop: 2
  },

  dealPriceBox: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14
  },

  dealPrice: {
    fontWeight: '700'
  },

  /* PRODUCT */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text
  },

  sectionLink: {
    fontSize: 13,
    color: COLORS.sub
  },

  column: {
    justifyContent: 'space-between',
    paddingHorizontal: 16
  }
})
