import React from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Product } from '../types'
import { formatCurrency } from '../utils/formatCurrency'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width / 2 - 24

const COLORS = {
  bg: '#FFFFFF',
  text: '#1F2937',
  sub: '#6B7280',
  border: '#E5E7EB',
  accent: '#F59E0B',
  primary: '#3F3A5F'
}

interface Props {
  product: Product
  onPress: () => void
}

const ProductCard: React.FC<Props> = ({ product, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="contain"
        />

        <TouchableOpacity style={styles.heart}>
          <Ionicons name="heart-outline" size={18} color={COLORS.sub} />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        {product.category ? (
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
        ) : null}

        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>

          <View style={styles.rating}>
            <Ionicons name="star" size={12} color={COLORS.accent} />
            <Text style={styles.ratingText}>{product.rating?.rate || 4.8}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden'
  },
  imageWrap: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    position: 'relative'
  },
  image: {
    width: '90%',
    height: '90%'
  },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  info: { padding: 12 },
  category: {
    fontSize: 10,
    color: COLORS.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
    height: 40
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.sub,
    fontWeight: '500'
  }
})

export default ProductCard
