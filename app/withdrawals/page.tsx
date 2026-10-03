'use client'

import { useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X, 
} from 'lucide-react'
import toast from 'react-hot-toast'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { withdrawalService, investmentService, authService } from '@/lib/services'
import { formatCurrency, formatDate, getStatusColor, getPaymentMethodLabel, truncateAddress } from '@/lib/utils'

const METHODS = [
  { value: 'bitcoin', label: 'Bitcoin', network: 'BTC', field: 'bitcoin_address' },
  { value: 'ethereum', label: 'Ethereum', network: 'ETH', field: 'ethereum_address' },
  { value: 'usdt', label: 'USDT', network: 'TRX', field: 'usdt_address' },
  { value: 'usdt2', label: 'USDT', network: 'ETH', field: 'usdt_erc20_address' }
] as const

export default function WithdrawalsPage() {
  const qc = useQueryClient()
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [withdrawalId, setWithdrawalId] = useState('')
  const [method, setMethod] = useState<typeof METHODS[number]['value']>('bitcoin')
  const [amount, setAmount] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => withdrawalService.getWithdrawals().then(r => r.data.data!),
  })

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => investmentService.getDashboard().then(r => r.data.data!),
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe().then(r => r.data.data!),
  })

  const balance = Number(dashboard?.wallet_balance || 0)
  const numericAmount = Number(amount || 0)
  const selectedMethod = METHODS.find(item => item.value === method)!
  const payoutAddress = (me?.profile?.[selectedMethod.field] || '') as string
  const amountError = useMemo(() => {
    if (!amount) return ''
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 'Enter an amount greater than $0.00.'
    if (numericAmount > balance) return 'Insufficient balance.'
    return ''
  }, [amount, numericAmount, balance])

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['withdrawals'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const requestMutation = useMutation({
    mutationFn: withdrawalService.requestWithdrawal,
    onSuccess: (res) => {
      setWithdrawalId(res.data.data!.withdrawal_id)
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      toast.success('OTP sent to your email.')
      refresh()
      setTimeout(() => {
        otpRefs.current[0]?.focus()
      }, 100)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: withdrawalService.verifyOTP,
    onSuccess: () => {
      toast.success('Withdrawal confirmed! Processing soon.')
      closeModal()
      refresh()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: withdrawalService.cancelWithdrawal,
    onSuccess: () => {
      toast.success('Withdrawal cancelled.')
      refresh()
    },
  })

  const resendMutation = useMutation({
    mutationFn: withdrawalService.resendOTP,
    onSuccess: () => {
      toast.success('OTP resent to your email.')
    },
  })

  const closeModal = () => {
    setShowModal(false)
    setStep('form')
    setWithdrawalId('')
    setAmount('')
    setOtp(['', '', '', '', '', ''])
  }

  const openModal = () => {
    setShowModal(true)
    setStep('form')
  }

  const submitWithdrawal = () => {
    if (amountError || !numericAmount) return
    if (!payoutAddress) {
      toast.error(`Please set your ${selectedMethod.label} ${selectedMethod.network} address in your profile before withdrawing.`)
      return
    }
    requestMutation.mutate({ amount: numericAmount.toFixed(2), method })
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
            <p className="mt-1 text-sm text-dark-400">Secure withdrawals with email OTP confirmation and balance reservation.</p>
          </div>
          <button onClick={openModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-sm font-bold text-dark-950 transition hover:brightness-110">
            <ArrowUpDown size={17} /> New withdrawal
          </button>
        </motion.section>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="premium-card p-5">
            <Wallet size={18} className="text-emerald-400" />
            <p className="mt-4 text-xs uppercase tracking-[.12em] text-dark-400">Available balance</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(balance)}</p>
          </div>
          <div className="premium-card p-5">
            <Clock3 size={18} className="text-blue-400" />
            <p className="mt-4 text-xs uppercase tracking-[.12em] text-dark-400">Pending requests</p>
            <p className="mt-2 text-2xl font-bold text-white">{dashboard?.pending_withdrawals ?? 0}</p>
          </div>
          <div className="premium-card p-5">
            <CheckCircle2 size={18} className="text-violet-400" />
            <p className="mt-4 text-xs uppercase tracking-[.12em] text-dark-400">Total withdrawn</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(dashboard?.total_withdrawn || 0)}</p>
          </div>
        </div>

        <section className="premium-card overflow-hidden">
          <div className="border-b border-dark-700 px-5 py-4 lg:px-6">
            <h2 className="font-bold text-white">Withdrawal history</h2>
            <p className="mt-1 text-xs text-dark-400">Pending amounts are held from your balance immediately and refunded if cancelled or rejected.</p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-400" /></div>
          ) : !withdrawals?.length ? (
            <div className="py-20 text-center">
              <ArrowUpDown size={36} className="mx-auto text-dark-600" />
              <p className="mt-3 text-sm text-dark-400">No withdrawals yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-dark-900/50 text-xs uppercase tracking-wider text-dark-500">
                  <tr>
                    {['Amount', 'Method', 'Destination', 'Status', 'Created', 'Action'].map(h => <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/70">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="transition hover:bg-white/[0.015]">
                      <td className="px-6 py-4 font-mono font-bold text-white">{formatCurrency(w.amount)}</td>
                      <td className="px-6 py-4 text-dark-300">{getPaymentMethodLabel(w.method)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-dark-400">{w.payout_address ? truncateAddress(w.payout_address, 7) : '—'}</td>
                      <td className="px-6 py-4"><span className={getStatusColor(w.status)}>{w.status.replace('_', ' ')}</span></td>
                      <td className="px-6 py-4 text-dark-400">{formatDate(w.created_at)}</td>
                      <td className="px-6 py-4">
                        {w.status === 'pending' ? (
                          <button disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(w.id)} className="text-xs font-semibold text-red-400 transition hover:text-red-300 disabled:opacity-50">Cancel</button>
                        ) : <span className="text-dark-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ opacity: 0, scale: .96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} className="w-full max-w-lg rounded-3xl border border-dark-700 bg-dark-900 p-6 shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{step === 'form' ? 'Request withdrawal' : 'Confirm withdrawal'}</h2>
                  <p className="mt-1 text-xs text-dark-400">{step === 'form' ? 'Funds are held immediately after you continue.' : 'Enter the 6-digit code sent to your email.'}</p>
                </div>
                <button onClick={closeModal} className="rounded-lg p-2 text-dark-400 transition hover:bg-dark-800 hover:text-white"><X size={18} /></button>
              </div>

              {step === 'form' ? (
                <div className="mt-6 space-y-5">
                  <div className="flex items-center justify-between rounded-2xl border border-dark-700 bg-dark-800 p-4">
                    <span className="text-sm text-dark-400">Available balance</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(balance)}</span>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark-200">Withdrawal method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {METHODS.map(m => (
                        <button key={m.value} onClick={() => setMethod(m.value)} className={`rounded-xl border p-3 text-left transition ${method === m.value ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'}`}>
                          <span className={`block text-sm font-semibold ${method === m.value ? 'text-emerald-300' : 'text-white'}`}>{m.label}</span>
                          <span className="mt-1 block text-xs text-dark-500">{m.network}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-dark-200">Amount (USD)</label>
                      <button onClick={() => setAmount(balance.toFixed(2))} className="text-xs font-semibold text-emerald-400">Use max</button>
                    </div>
                    <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" className="input-gold w-full text-lg font-semibold" />
                    <div className="mt-2 flex gap-2">
                      {[25, 50, 75, 100].map(percent => <button key={percent} onClick={() => setAmount((balance * percent / 100).toFixed(2))} className="rounded-lg border border-dark-700 px-2.5 py-1 text-xs text-dark-400 transition hover:border-emerald-500/30 hover:text-emerald-300">{percent}%</button>)}
                    </div>
                    {amountError && <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400"><AlertCircle size={13} />{amountError}</p>}
                  </div>

                  <div className="rounded-2xl border border-dark-700 bg-dark-800 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-dark-500">Payout destination</p>
                        <p className={`mt-1 truncate font-mono text-xs ${payoutAddress ? 'text-dark-200' : 'text-red-400'}`}>{payoutAddress || 'Address not configured'}</p>
                      </div>
                      {payoutAddress ? <button onClick={() => { navigator.clipboard.writeText(payoutAddress); toast.success('Address copied') }} className="text-dark-400 hover:text-white"><Copy size={16} /></button> : <Link href="/profile?tab=wallet" className="shrink-0 text-xs font-semibold text-emerald-400">Add address</Link>}
                    </div>
                  </div>

                  <button onClick={submitWithdrawal} disabled={requestMutation.isPending || !!amountError || !numericAmount || !payoutAddress} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3.5 font-bold text-dark-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                    {requestMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <><ShieldCheck size={18} /> Continue securely</>}
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"><ShieldCheck size={25} /></div>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input key={index} ref={el => { otpRefs.current[index] = el }} value={digit} onChange={e => handleOtpChange(index, e.target.value)} onKeyDown={e => { if (e.key === 'Backspace' && !digit && index > 0) otpRefs.current[index - 1]?.focus() }} inputMode="numeric" maxLength={1} className="h-12 w-11 rounded-xl border border-dark-600 bg-dark-800 text-center text-lg font-bold text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" />
                    ))}
                  </div>
                  <button onClick={() => verifyMutation.mutate({ withdrawal_id: withdrawalId, code: otp.join('') })} disabled={verifyMutation.isPending || otp.join('').length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3.5 font-bold text-dark-950 disabled:opacity-50">
                    {verifyMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Confirm withdrawal'}
                  </button>
                  <button onClick={() => resendMutation.mutate(withdrawalId)} disabled={resendMutation.isPending} className="mx-auto flex items-center gap-2 text-xs font-semibold text-dark-400 transition hover:text-white disabled:opacity-50"><RefreshCw size={13} className={resendMutation.isPending ? 'animate-spin' : ''} /> Resend OTP</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}





  // return (
  //   <DashboardLayout>
  //     <div className="mb-8 flex items-center justify-between">
  //       <div>
  //         <h1 className="text-2xl font-display font-bold text-white">Withdrawals</h1>
  //         <p className="text-dark-400 text-sm mt-1">
  //           Available balance: <span className="text-gold-400 font-semibold">{formatCurrency(balance)}</span>
  //         </p>
  //       </div>
  //       <button onClick={() => { setShowModal(true); setStep('form') }}
  //         className="bg-gold-gradient text-dark-950 font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm flex items-center gap-2">
  //         <ArrowUpDown size={16} /> Withdraw Funds
  //       </button>
  //     </div>

  //     {/* Table */}
  //     <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
  //       <div className="p-6 border-b border-dark-700">
  //         <h2 className="font-display font-bold text-white">Withdrawal History</h2>
  //       </div>
  //       {isLoading ? (
  //         <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gold-400" /></div>
  //       ) : !withdrawals?.length ? (
  //         <div className="text-center py-16">
  //           <ArrowUpDown size={40} className="text-dark-600 mx-auto mb-3" />
  //           <p className="text-dark-500">No withdrawals yet.</p>
  //         </div>
  //       ) : (
  //         <div className="overflow-x-auto">
  //           <table className="w-full text-sm">
  //             <thead>
  //               <tr className="text-dark-400 text-xs border-b border-dark-700">
  //                 {['Amount', 'Method', 'Destination', 'Status', 'Date', ''].map(h => (
  //                   <th key={h} className="text-left px-6 py-3 font-medium">{h}</th>
  //                 ))}
  //               </tr>
  //             </thead>
  //             <tbody>
  //               {withdrawals.map(w => (
  //                 <tr key={w.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
  //                   <td className="px-6 py-4 font-semibold text-gold-400 font-mono">{formatCurrency(w.amount)}</td>
  //                   <td className="px-6 py-4 text-dark-300">{getPaymentMethodLabel(w.method)}</td>
  //                   <td className="px-6 py-4 text-dark-400 font-mono text-xs">
  //                     {w.payout_address ? `${w.payout_address.slice(0, 12)}...` : '—'}
  //                   </td>
  //                   <td className="px-6 py-4"><span className={getStatusColor(w.status)}>{w.status.replace('_', ' ')}</span></td>
  //                   <td className="px-6 py-4 text-dark-400">{formatDate(w.created_at)}</td>
  //                   <td className="px-6 py-4">
  //                     {w.status === 'pending' && (
  //                       <button onClick={() => cancelMutation.mutate(w.id)}
  //                         className="text-red-400 hover:text-red-300 text-xs transition-colors">Cancel</button>
  //                     )}
  //                   </td>
  //                 </tr>
  //               ))}
  //             </tbody>
  //           </table>
  //         </div>
  //       )}
  //     </div>

  //     {/* Modal */}
  //     {showModal && (
  //       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
  //         <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-md">
  //           <div className="flex items-center justify-between mb-6">
  //             <h2 className="font-display font-bold text-white text-xl">
  //               {step === 'form' ? 'Withdraw Funds' : 'Confirm Withdrawal'}
  //             </h2>
  //             <button onClick={() => { setShowModal(false); setStep('form') }} className="text-dark-400 hover:text-white"><X size={20} /></button>
  //           </div>

  //           {step === 'form' ? (
  //             <div className="space-y-4">
  //               <div className="bg-dark-800 rounded-xl p-4 flex justify-between items-center">
  //                 <span className="text-dark-400 text-sm">Available</span>
  //                 <span className="text-gold-400 font-bold font-mono">{formatCurrency(balance)}</span>
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-medium text-dark-200 mb-2">Withdrawal Method</label>
  //                 <div className="grid grid-cols-2 gap-2">
  //                   {METHODS.map(m => (
  //                     <button key={m.value} onClick={() => setMethod(m.value)}
  //                       className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
  //                         method === m.value ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-dark-600 text-dark-300 hover:border-dark-500'
  //                       }`}>{m.label}</button>
  //                   ))}
  //                 </div>
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-medium text-dark-200 mb-2">Amount (USD)</label>
  //                 <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0"
  //                   placeholder="0.00" className="input-gold w-full" />
  //                 <p className="text-xs text-dark-500 mt-1">Make sure your payout address is set in your profile.</p>
  //               </div>

  //               <button onClick={() => requestMutation.mutate({ amount, method })} disabled={requestMutation.isPending || !amount}
  //                 className="w-full bg-gold-gradient text-dark-950 font-bold py-3.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
  //                 {requestMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Request Withdrawal'}
  //               </button>
  //             </div>
  //           ) : (
  //             <div className="space-y-6">
  //               <div className="text-center">
  //                 <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
  //                   <ShieldCheck size={26} className="text-gold-400" />
  //                 </div>
  //                 <p className="text-dark-400 text-sm">Enter the 6-digit OTP sent to your email to confirm this withdrawal.</p>
  //               </div>

  //               <div className="flex gap-2 justify-center">
  //                 {otp.map((d, i) => (
  //                   <input key={i} ref={el => { otpRefs.current[i] = el }} type="text" inputMode="numeric"
  //                     maxLength={1} value={d} onChange={e => handleOtpChange(i, e.target.value)}
  //                     onKeyDown={e => e.key === 'Backspace' && !otp[i] && i > 0 && otpRefs.current[i-1]?.focus()}
  //                     className={`w-11 h-12 text-center text-lg font-bold rounded-xl border bg-dark-800 text-white outline-none transition-all
  //                       ${d ? 'border-gold-500' : 'border-dark-600 focus:border-gold-500'}`}
  //                   />
  //                 ))}
  //               </div>

  //               <button
  //                 onClick={() => verifyMutation.mutate({ withdrawal_id: withdrawalId, code: otp.join('') })}
  //                 disabled={verifyMutation.isPending || otp.join('').length < 6}
  //                 className="w-full bg-gold-gradient text-dark-950 font-bold py-3.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
  //                 {verifyMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Withdrawal'}
  //               </button>
  //             </div>
  //           )}
  //         </div>
  //       </div>
  //     )}
  //   </DashboardLayout>
  // )