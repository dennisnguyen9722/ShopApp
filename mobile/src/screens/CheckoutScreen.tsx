import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { CartService } from '../services/CartService'
import { orderApi } from '../api/orderApi'
import { formatCurrency } from '../utils/formatCurrency'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'

// API Hành chính Việt Nam (Miễn phí)
const API_HOST = 'https://esgoo.net/api-tinhthanh'

export default function CheckoutScreen({ navigation }: any) {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  // --- STATE ĐỊA CHỈ ---
  const [specificAddress, setSpecificAddress] = useState('') // Số nhà, tên đường

  // Data cho Modal
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])

  // Selected Items
  const [selectedCity, setSelectedCity] = useState<any>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null)
  const [selectedWard, setSelectedWard] = useState<any>(null)

  // Modal Control
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'CITY' | 'DISTRICT' | 'WARD'>(
    'CITY'
  )
  const [modalData, setModalData] = useState<any[]>([])
  const [loadingLocation, setLoadingLocation] = useState(false)

  useEffect(() => {
    loadCart()
    fetchCities() // Load Tỉnh/Thành ngay khi vào
  }, [])

  // --- LOGIC LOAD ĐỊA CHỈ ---
  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_HOST}/1/0.htm`)
      const data = await response.json()
      if (data.error === 0) setCities(data.data)
    } catch (error) {
      console.log('Lỗi lấy tỉnh thành:', error)
    }
  }

  const fetchDistricts = async (cityId: string) => {
    try {
      setLoadingLocation(true)
      const response = await fetch(`${API_HOST}/2/${cityId}.htm`)
      const data = await response.json()
      if (data.error === 0) setDistricts(data.data)
    } catch (error) {
      console.log('Lỗi lấy quận huyện:', error)
    } finally {
      setLoadingLocation(false)
    }
  }

  const fetchWards = async (districtId: string) => {
    try {
      setLoadingLocation(true)
      const response = await fetch(`${API_HOST}/3/${districtId}.htm`)
      const data = await response.json()
      if (data.error === 0) setWards(data.data)
    } catch (error) {
      console.log('Lỗi lấy phường xã:', error)
    } finally {
      setLoadingLocation(false)
    }
  }

  const openModal = (type: 'CITY' | 'DISTRICT' | 'WARD') => {
    if (type === 'DISTRICT' && !selectedCity)
      return Alert.alert('Lưu ý', 'Vui lòng chọn Tỉnh/Thành trước')
    if (type === 'WARD' && !selectedDistrict)
      return Alert.alert('Lưu ý', 'Vui lòng chọn Quận/Huyện trước')

    setModalType(type)
    if (type === 'CITY') setModalData(cities)
    if (type === 'DISTRICT') setModalData(districts)
    if (type === 'WARD') setModalData(wards)
    setModalVisible(true)
  }

  const handleSelectLocation = (item: any) => {
    if (modalType === 'CITY') {
      setSelectedCity(item)
      setSelectedDistrict(null) // Reset cấp dưới
      setSelectedWard(null)
      fetchDistricts(item.id)
    } else if (modalType === 'DISTRICT') {
      setSelectedDistrict(item)
      setSelectedWard(null) // Reset cấp dưới
      fetchWards(item.id)
    } else {
      setSelectedWard(item)
    }
    setModalVisible(false)
  }

  // --- LOGIC CŨ ---
  const loadCart = async () => {
    const items = await CartService.getCart()
    setCartItems(items)
    const total = items.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0
    )
    setTotalAmount(total)
  }

  const handleOrder = async () => {
    // 1. Validate Form (Check kỹ địa chỉ)
    if (
      !name.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !specificAddress.trim() ||
      !selectedCity ||
      !selectedDistrict ||
      !selectedWard
    ) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng điền đầy đủ thông tin và chọn địa chỉ chính xác.'
      )
      return
    }

    setLoading(true)

    try {
      // Ghép địa chỉ full để lưu vào DB
      const fullAddress = `${specificAddress}, ${selectedWard.full_name}, ${selectedDistrict.full_name}, ${selectedCity.full_name}`

      let userId = null
      const userJson = await AsyncStorage.getItem('user')
      if (userJson) {
        const user = JSON.parse(userJson)
        userId = user._id || user.id
      }

      const orderData = {
        customer: {
          name,
          email,
          phone,
          address: fullAddress // Gửi chuỗi địa chỉ đã ghép
        },
        userId: userId,
        items: cartItems.map((item) => ({
          product: item.product._id,
          productName: item.product.title,
          productImage: item.product.image,
          quantity: item.quantity,
          price: item.product.price,
          variant: {
            color: item.variants?.['Màu sắc'] || item.variants?.['Color'] || '',
            storage:
              item.variants?.['Dung lượng'] || item.variants?.['Storage'] || '',
            ram: item.variants?.['RAM'] || ''
          }
        })),
        totalAmount,
        paymentMethod: 'COD',
        note
      }

      await orderApi.createOrder(orderData)
      await CartService.clearCart()

      Alert.alert(
        'Đặt hàng thành công! 🎉',
        'Cảm ơn bạn đã mua sắm tại SuperMall.',
        [
          {
            text: 'Về trang chủ',
            onPress: () => navigation.navigate('Main', { screen: 'HomeTab' })
          }
        ]
      )
    } catch (error: any) {
      console.log('Lỗi đặt hàng:', error)
      const msg =
        error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
      Alert.alert('Lỗi đặt hàng', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* --- FORM THÔNG TIN CÁ NHÂN --- */}
        <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên (*)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email (*)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại (*)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* --- FORM ĐỊA CHỈ (CHỌN TỈNH/THÀNH) --- */}
        <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
        <View style={styles.formCard}>
          {/* 1. Chọn Tỉnh/Thành */}
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => openModal('CITY')}
          >
            <Text
              style={[styles.selectText, !selectedCity && { color: '#999' }]}
            >
              {selectedCity
                ? selectedCity.full_name
                : 'Chọn Tỉnh / Thành phố (*)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {/* 2. Chọn Quận/Huyện */}
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => openModal('DISTRICT')}
          >
            <Text
              style={[
                styles.selectText,
                !selectedDistrict && { color: '#999' }
              ]}
            >
              {selectedDistrict
                ? selectedDistrict.full_name
                : 'Chọn Quận / Huyện (*)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {/* 3. Chọn Phường/Xã */}
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => openModal('WARD')}
          >
            <Text
              style={[styles.selectText, !selectedWard && { color: '#999' }]}
            >
              {selectedWard ? selectedWard.full_name : 'Chọn Phường / Xã (*)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {/* 4. Nhập số nhà */}
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="Số nhà, tên đường (*)"
            value={specificAddress}
            onChangeText={setSpecificAddress}
          />
        </View>

        {/* Ghi chú */}
        <View style={[styles.formCard, { marginTop: 12 }]}>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="Ghi chú cho shipper (nếu có)"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* --- TÓM TẮT ĐƠN HÀNG & THANH TOÁN (GIỮ NGUYÊN) --- */}
        <Text style={styles.sectionTitle}>Sản phẩm ({cartItems.length})</Text>
        <View style={styles.formCard}>
          {cartItems.map((item, index) => {
            const variantStr = Object.values(item.variants || {}).join(', ')
            return (
              <View key={index} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.title}
                  </Text>
                  {variantStr ? (
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      Phân loại: {variantStr}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 13, color: '#333', marginTop: 2 }}>
                    x{item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.product.price * item.quantity)}
                </Text>
              </View>
            )
          })}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.formCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="cash-outline" size={24} color="#F59E0B" />
            <Text style={{ fontSize: 14, fontWeight: '500' }}>
              Thanh toán khi nhận hàng (COD)
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnOrder, loading && { opacity: 0.7 }]}
          onPress={handleOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>ĐẶT HÀNG NGAY</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- MODAL CHỌN ĐỊA CHỈ --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'CITY'
                  ? 'Chọn Tỉnh/Thành'
                  : modalType === 'DISTRICT'
                  ? 'Chọn Quận/Huyện'
                  : 'Chọn Phường/Xã'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingLocation ? (
              <ActivityIndicator
                size="large"
                color="#4f46e5"
                style={{ marginTop: 20 }}
              />
            ) : (
              <FlatList
                data={modalData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <Text style={styles.modalItemText}>{item.full_name}</Text>
                    {((modalType === 'CITY' && selectedCity?.id === item.id) ||
                      (modalType === 'DISTRICT' &&
                        selectedDistrict?.id === item.id) ||
                      (modalType === 'WARD' &&
                        selectedWard?.id === item.id)) && (
                      <Ionicons name="checkmark" size={20} color="#4f46e5" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#555',
    marginLeft: 4
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 14
  },
  // Style cho Select Box mới
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee'
  },
  selectText: { fontSize: 14, color: '#333' },

  // Styles cũ
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12
  },
  itemName: { fontSize: 14, color: '#333', fontWeight: '500' },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#ef4444' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10
  },
  btnOrder: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalItemText: { fontSize: 15, color: '#333' }
})
