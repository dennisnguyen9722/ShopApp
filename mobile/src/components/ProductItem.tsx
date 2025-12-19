import React from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency } from '../utils/formatCurrency'

const COLORS = {
  bg: '#FFFFFF',
  text: '#1F2937',
  sub: '#6B7280',
  border: '#E5E7EB',
  primary: '#3F3A5F',
  accent: '#F59E0B'
}

interface ProductItemProps {
  product: any
  onPress: () => void
}

export default function ProductItem({ product, onPress }: ProductItemProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* IMAGE */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* INFO */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.row}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>

          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden'
  },

  imageWrap: {
    height: 150,
    backgroundColor: '#FAFAFB'
  },

  image: {
    width: '100%',
    height: '100%'
  },

  info: {
    padding: 12
  },

  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
    height: 36
  },

  row: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary
  },

  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
