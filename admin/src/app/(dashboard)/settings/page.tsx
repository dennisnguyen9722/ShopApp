/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import axiosClient from '@/lib/axiosClient'
import { useAuth } from '@/context/AuthContext'
import {
  Store,
  UserCog,
  Save,
  Loader2,
  Camera,
  Lock,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  const { user, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // State: Shop Settings
  const [shopSettings, setShopSettings] = useState({
    storeName: '',
    logo: '',
    email: '',
    phone: '',
    address: '',
    facebook: '',
    zalo: ''
  })

  // State: Personal Profile
  const [profile, setProfile] = useState({
    name: '',
    avatar: ''
  })

  // State: Change Password
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 1. FETCH SHOP SETTINGS & USER INFO
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axiosClient.get('/settings')
        setShopSettings(data)
      } catch (error) {
        console.error('Chưa có cấu hình shop', error)
      }
    }
    fetchSettings()
  }, [])

  // Sync user data to state when user context loads
  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, avatar: user.avatar || '' })
    }
  }, [user])

  // --- HANDLER: UPLOAD ẢNH (Cloudinary) ---
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'avatar'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const data = new FormData()
    data.append('file', file)
    data.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'supermall_preset'
    )

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: data }
      )
      const json = await res.json()

      if (type === 'logo') {
        setShopSettings((prev) => ({ ...prev, logo: json.secure_url }))
      } else {
        setProfile((prev) => ({ ...prev, avatar: json.secure_url }))
      }
    } catch {
      toast.error('Lỗi upload ảnh')
    } finally {
      setUploading(false)
    }
  }

  // --- HANDLER: SAVE SHOP SETTINGS ---
  const saveShopSettings = async () => {
    setLoading(true)
    try {
      await axiosClient.put('/settings', shopSettings)
      toast.success('Đã lưu cấu hình cửa hàng')
    } catch (error: any) {
      toast.error('Lưu thất bại')
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLER: SAVE PROFILE ---
  const saveProfile = async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.put('/auth/profile', profile)

      // Update Context để Header nhận avatar mới ngay lập tức
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (token) login(token, data)

      toast.success('Cập nhật hồ sơ thành công')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật')
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLER: CHANGE PASSWORD ---
  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.warning('Mật khẩu xác nhận không khớp!')
    }
    if (passwords.newPassword.length < 6) {
      return toast.warning('Mật khẩu mới phải trên 6 ký tự')
    }

    setLoading(true)
    try {
      await axiosClient.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })
      toast.success('Đổi mật khẩu thành công!')
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserCog className="w-6 h-6 text-indigo-600" /> Cấu Hình & Tài Khoản
        </h2>
        <p className="text-gray-500">
          Quản lý thông tin cửa hàng và thông tin cá nhân.
        </p>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="shop">Thông tin Cửa hàng</TabsTrigger>
          <TabsTrigger value="profile">Cá nhân & Bảo mật</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: CẤU HÌNH SHOP --- */}
        <TabsContent value="shop" className="mt-6 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="w-5 h-5" /> Thông tin chung
              </CardTitle>
              <CardDescription>
                Thông tin này sẽ hiển thị trên hóa đơn và trang web.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden relative group">
                  {shopSettings.logo ? (
                    <img
                      src={shopSettings.logo}
                      alt="Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Store className="w-8 h-8 text-gray-300" />
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleUpload(e, 'logo')}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Logo Cửa Hàng</p>
                  <p className="text-xs text-gray-500">
                    Định dạng PNG, JPG. Tối đa 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên cửa hàng</Label>
                  <Input
                    value={shopSettings.storeName}
                    onChange={(e) =>
                      setShopSettings({
                        ...shopSettings,
                        storeName: e.target.value
                      })
                    }
                    placeholder="VD: SuperMall"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email liên hệ</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      value={shopSettings.email}
                      onChange={(e) =>
                        setShopSettings({
                          ...shopSettings,
                          email: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hotline / SĐT</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      value={shopSettings.phone}
                      onChange={(e) =>
                        setShopSettings({
                          ...shopSettings,
                          phone: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Địa chỉ</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      value={shopSettings.address}
                      onChange={(e) =>
                        setShopSettings({
                          ...shopSettings,
                          address: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mạng xã hội (Facebook / Zalo)</Label>
                <div className="relative">
                  <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    value={shopSettings.facebook}
                    onChange={(e) =>
                      setShopSettings({
                        ...shopSettings,
                        facebook: e.target.value
                      })
                    }
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={saveShopSettings}
                  disabled={loading || uploading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 w-4 h-4" />
                  )}{' '}
                  Lưu cấu hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: CÁ NHÂN --- */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          {/* Card Hồ Sơ */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Hồ sơ của bạn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden relative group border-2 border-white shadow-md">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      className="w-full h-full object-cover"
                      alt="avatar"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-indigo-500">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleUpload(e, 'avatar')}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div>
                  <Label>Tên hiển thị</Label>
                  <Input
                    className="mt-1 w-[300px]"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button
                onClick={saveProfile}
                disabled={loading || uploading}
                className="bg-indigo-600"
              >
                Lưu hồ sơ
              </Button>
            </CardContent>
          </Card>

          {/* Card Mật Khẩu */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" /> Đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Hãy đặt mật khẩu mạnh để bảo vệ tài khoản.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Mật khẩu hiện tại</Label>
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      currentPassword: e.target.value
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Mật khẩu mới</Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Xác nhận mật khẩu mới</Label>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value
                    })
                  }
                />
              </div>
              <Button
                variant="destructive"
                onClick={changePassword}
                disabled={loading}
              >
                Đổi mật khẩu
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
