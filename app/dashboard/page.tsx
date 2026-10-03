'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowDownToLine, 
  ArrowUpDown, 
  CheckCircle2,
  Clock3,
  LifeBuoy,
  Sparkles,
  TrendingUp, 
  Users, 
  Wallet, 
} from 'lucide-react'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { investmentService } from '@/lib/services'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => investmentService.getDashboard().then(r => r.data.data!),
    refetchInterval: 60_000,
  })

  const { data: investments } = useQuery({
    queryKey: ['investments', 'active'],
    queryFn: () => investmentService.getInvestments({ status: 'active' }).then(r => r.data.data!),
    refetchInterval: 60_000,
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions-recent'],
    queryFn: () => investmentService.getTransactions().then(r => r.data.data!),
  })

  const activeInvestments = (investments || []).filter(
    inv => inv.status === 'active' && Number(inv.progress_percentage) < 100
  )

  const stats = summary ? [
    { label: 'Wallet Balance',    value: formatCurrency(summary.wallet_balance),   icon: Wallet,         tone: 'emerald' },
    { label: 'Total Deposited',   value: formatCurrency(summary.total_deposited),  icon: ArrowDownToLine, tone: 'blue' },
    { label: 'Total Earned',      value: formatCurrency(summary.total_earned),     icon: TrendingUp,     tone: 'emerald' },
    { label: 'Total Withdrawn',   value: formatCurrency(summary.total_withdrawn),  icon: ArrowUpDown,    tone: 'violet' },
  ] : []

  const iconTone: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/15',
    blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/15',
    violet: 'bg-violet-500/10 text-violet-400 ring-violet-500/15',
  }

  return (
    <DashboardLayout>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-7">
        <motion.section variants={item} className="relative overflow-hidden rounded-3xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/[0.08] via-dark-900 to-dark-900 p-6 lg:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-300">
                <Sparkles size={13} /> Portfolio overview
              </div>
              <h1 className="text-2xl font-bold text-white lg:text-3xl">Welcome back, {user?.first_name || 'Investor'}</h1>
              <p className="mt-2 max-w-xl text-sm text-dark-300">Track your balance, investments, deposits, withdrawals and support activity from one place.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/deposits" className="rounded-xl border border-dark-600 bg-dark-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-emerald-500/30 hover:bg-dark-700">Add funds</Link>
              <Link href="/investments" className="rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-bold text-dark-950 transition hover:brightness-110">Start investment</Link>
            </div>
          </div>
        </motion.section>

        <motion.section variants={stagger} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="premium-card h-36 animate-pulse" />
          )) : stats.map(({ label, value, icon: Icon, tone }) => (
            <motion.div key={label} variants={item} whileHover={{ y: -3 }} className="premium-card group p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-dark-400">{label}</p>
                  <p className="mt-5 text-2xl font-bold tracking-tight text-white">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${iconTone[tone]}`}>
                  <Icon size={20} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {summary && (
          <motion.section variants={item} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: 'Active', value: summary.active_investments, icon: TrendingUp, href: '/investments' },
              { label: 'Completed', value: summary.completed_investments, icon: CheckCircle2, href: '/investments' },
              { label: 'Pending deposits', value: summary.pending_deposits, icon: Clock3, href: '/deposits' },
              { label: 'Pending withdrawals', value: summary.pending_withdrawals, icon: ArrowUpDown, href: '/withdrawals' },
              { label: 'Referrals', value: summary.referral_count, icon: Users, href: '/profile' },
            ].map(({ label, value, icon: Icon, href }) => (
              <Link key={label} href={href} className="group rounded-2xl border border-dark-700 bg-dark-800/70 p-4 transition hover:border-emerald-500/20 hover:bg-dark-800">
                <Icon size={17} className="text-dark-400 transition group-hover:text-emerald-400" />
                <p className="mt-3 text-2xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-dark-400">{label}</p>
              </Link>
            ))}
          </motion.section>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <motion.section variants={item} className="premium-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-dark-700/80 px-5 py-4 lg:px-6">
              <div>
                <h2 className="font-bold text-white">Active Investments</h2>
                <p className="mt-0.5 text-xs text-dark-400">Only investments still in progress appear here.</p>
              </div>
              <Link href="/investments" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">View all</Link>
            </div>
            {!activeInvestments.length ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400"><TrendingUp size={22} /></div>
                <p className="font-semibold text-white">No active investments</p>
                <p className="mt-1 max-w-xs text-sm text-dark-400">Completed investments are automatically removed from this list.</p>
                <Link href="/investments" className="mt-4 text-sm font-semibold text-emerald-400">Browse plans →</Link>
              </div>
            ) : (
              <div className="divide-y divide-dark-700/70">
                {activeInvestments.slice(0, 5).map(inv => (
                  <div key={inv.id} className="p-5 lg:px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{inv.plan.name}</p>
                        <p className="mt-1 text-xs text-dark-400">Ends {formatDate(inv.ends_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-emerald-400">{formatCurrency(inv.amount)}</p>
                        <p className="mt-1 text-xs text-dark-400">{Number(inv.progress_percentage).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-dark-700">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Number(inv.progress_percentage), 100)}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full bg-gold-gradient" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section variants={item} className="premium-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-dark-700/80 px-5 py-4 lg:px-6">
              <div>
                <h2 className="font-bold text-white">Recent Activity</h2>
                <p className="mt-0.5 text-xs text-dark-400">Latest account transactions</p>
              </div>
              <Link href="/transactions" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">History</Link>
            </div>
            {!transactions?.length ? (
              <div className="flex min-h-64 items-center justify-center text-sm text-dark-500">No transactions yet.</div>
            ) : (
              <div className="divide-y divide-dark-700/70">
                {transactions.slice(0, 6).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4 lg:px-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium capitalize text-white">{tx.type.replace('_', ' ')}</p>
                        <span className={getStatusColor(tx.status)}>{tx.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-dark-500">{formatDate(tx.created_at)}</p>
                    </div>
                    <p className={`shrink-0 font-mono text-sm font-bold ${tx.type === 'withdrawal' || tx.type === 'investment' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {tx.type === 'withdrawal' || tx.type === 'investment' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        <motion.section variants={item} className="flex flex-col gap-4 rounded-2xl border border-dark-700 bg-dark-800/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><LifeBuoy size={19} /></div>
            <div>
              <p className="text-sm font-semibold text-white">Need help with a deposit, withdrawal or investment?</p>
              <p className="mt-0.5 text-xs text-dark-400">Open a support ticket and keep the full conversation in your account.</p>
            </div>
          </div>
          <Link href="/support/tickets" className="shrink-0 rounded-xl border border-dark-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-500/30">Support tickets</Link>
        </motion.section>
      </motion.div>
    </DashboardLayout>
  )
}