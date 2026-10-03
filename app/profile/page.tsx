'use client'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authService } from '@/lib/services'
import { useAuthStore } from '@/lib/store'
import DashboardLayout from '@/components/layout/DashboardLayout'
import toast from 'react-hot-toast'
import { Loader2, Copy, User, Wallet, KeyRound, Check, LifeBuoy, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const qc = useQueryClient()
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'security'>('profile')
  const [copied, setCopied] = useState(false)

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe().then(r => { setUser(r.data.data!); return r.data.data! }),
  })

  const profileForm = useForm({ defaultValues: { first_name: user?.first_name, last_name: user?.last_name, phone: user?.phone, country: user?.country } })
  const walletForm = useForm({ defaultValues: {
    bitcoin_address: me?.profile?.bitcoin_address || '',
    ethereum_address: me?.profile?.ethereum_address || '',
    usdt_address: me?.profile?.usdt_address || '',
    usdt_erc20_address: me?.profile?.usdt_erc20_address || '',
  }})
  const passwordForm = useForm<{ old_password: string; new_password: string; new_password2: string }>()

  useEffect(() => {
    if (!me) return
    profileForm.reset({ first_name: me.first_name, last_name: me.last_name, phone: me.phone, country: me.country })
    walletForm.reset({
      bitcoin_address: me?.profile?.bitcoin_address || '',
      ethereum_address: me?.profile?.ethereum_address || '',
      usdt_address: me?.profile?.usdt_address || '',
      usdt_erc20_address: me?.profile?.usdt_erc20_address || '',
    })
  }, [me])

  const profileMutation = useMutation({
    mutationFn: (d: any) => authService.updateProfile(d),
    onSuccess: (res) => { setUser(res.data.data!); toast.success('Profile updated!') },
  })
  const walletMutation = useMutation({
    mutationFn: (d: any) => authService.updateWallet(d),
    onSuccess: () => { toast.success('Wallet info updated!'); qc.invalidateQueries({ queryKey: ['me'] }) },
  })
  const passwordMutation = useMutation({
    mutationFn: (d: any) => authService.changePassword(d),
    onSuccess: () => { toast.success('Password changed!'); passwordForm.reset() },
  })

  const copyReferral = () => {
    navigator.clipboard.writeText(user?.referral_code || '')
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { key: 'profile',  label: 'Profile',  icon: User },
    { key: 'wallet',   label: 'Wallet',   icon: Wallet },
    { key: 'security', label: 'Security', icon: KeyRound },
  ] as const

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Profile & Settings</h1>
        <p className="text-dark-400 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Referral card */}
      <div className="bg-dark-800 border border-gold-500/20 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Your Referral Code</p>
          <p className="text-xs text-dark-400 mt-0.5">Earn $5 bonus for every verified referral</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-gold-400 font-bold text-lg tracking-widest">{user?.referral_code}</span>
          <button onClick={copyReferral}
            className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-400 hover:text-white transition-all">
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <Link href="/support/tickets" className="group mb-6 flex items-center justify-between gap-4 rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-5 transition hover:border-blue-500/30 hover:bg-blue-500/[0.07]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><LifeBuoy size={19} /></div>
          <div>
            <p className="text-sm font-semibold text-white">Support Ticket</p>
            <p className="mt-0.5 text-xs text-dark-400">Create and track support requests directly from your account.</p>
          </div>
        </div>
        <ArrowRight size={18} className="text-dark-500 transition group-hover:translate-x-1 group-hover:text-blue-400" />
      </Link>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-800 border border-dark-700 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'text-dark-400 hover:text-white'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-2xl">
        {/* Profile tab */}
        {activeTab === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
            <h2 className="font-display font-bold text-white mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">First Name</label>
                <input {...profileForm.register('first_name')} className="input-gold w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Last Name</label>
                <input {...profileForm.register('last_name')} className="input-gold w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Email</label>
              <input value={user?.email} disabled className="input-gold w-full opacity-50 cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Phone</label>
                <input {...profileForm.register('phone')} className="input-gold w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Country</label>
                <input {...profileForm.register('country')} className="input-gold w-full" />
              </div>
            </div>
            <button type="submit" disabled={profileMutation.isPending}
              className="bg-gold-gradient text-dark-950 font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60">
              {profileMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Wallet tab */}
        {activeTab === 'wallet' && (
          <form onSubmit={walletForm.handleSubmit(d => walletMutation.mutate(d))} className="space-y-4">
            <h2 className="font-display font-bold text-white mb-4">Payout Addresses</h2>
            <p className="text-xs text-dark-500 -mt-2 mb-4">These addresses are used when you request a withdrawal.</p>
            {[
              { field: 'bitcoin_address',  label: 'Bitcoin Address',  placeholder: 'bc1q...' },
              { field: 'ethereum_address', label: 'Ethereum Address', placeholder: '0x...' },
              { field: 'usdt_address',     label: 'USDT Address (TRC-20)', placeholder: 'T...' },
              { field: 'usdt_erc20_address', label: 'USDT Address (ERC-20)', placeholder: '0x...' },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-dark-200 mb-2">{label}</label>
                <input {...walletForm.register(field as any)} placeholder={placeholder} className="input-gold w-full font-mono text-sm" />
              </div>
            ))}
            <button type="submit" disabled={walletMutation.isPending}
              className="bg-gold-gradient text-dark-950 font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60">
              {walletMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Addresses'}
            </button>
          </form>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="space-y-4">
            <h2 className="font-display font-bold text-white mb-4">Change Password</h2>
            {[
              { field: 'old_password',  label: 'Current Password', placeholder: '••••••••' },
              { field: 'new_password',  label: 'New Password',     placeholder: 'Min 8 characters' },
              { field: 'new_password2', label: 'Confirm New Password', placeholder: 'Repeat password' },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-dark-200 mb-2">{label}</label>
                <input {...passwordForm.register(field as any, { required: true })} type="password" placeholder={placeholder} className="input-gold w-full" />
              </div>
            ))}
            <button type="submit" disabled={passwordMutation.isPending}
              className="bg-gold-gradient text-dark-950 font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60">
              {passwordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
