'use client'

// Admin email health: delivery stats, configuration warnings, test email, and the email log
// with Retry. Used as the "Email" tab of app/admin/page.tsx and by app/admin/email-logs/page.tsx.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Loader2, Mail, RefreshCw, Send, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { adminService } from '@/lib/services'
import { formatDateTime } from '@/lib/utils'

type Filter = 'all' | 'failed' | 'sent'

// lib/api.ts already toasts the server's error message (e.g. the exact SMTP error on a failed
// retry), so only toast here when the server never answered (network error / timeout).
function toastIfNoServerReply(err: any, fallback: string) {
  if (!err?.response) toast.error(err?.message || fallback)
}

export default function EmailHealthPanel() {
  const qc = useQueryClient()
  // The log list, and the small summary behind the red badge on the Email tab.
  const refreshEmailHealth = () => {
    qc.invalidateQueries({ queryKey: ['admin-email-logs'] })
    qc.invalidateQueries({ queryKey: ['admin-email-summary'] })
  }
  const [filter, setFilter] = useState<Filter>('failed')
  const [search, setSearch] = useState('')
  const [testTo, setTestTo] = useState('')

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-email-logs', filter, search],
    queryFn: () =>
      adminService
        .getEmailLogs({ status: filter === 'all' ? undefined : filter, search: search.trim() || undefined })
        .then(r => r.data.data!),
    refetchInterval: 30_000,
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => adminService.retryEmail(id),
    onSuccess: () => {
      toast.success('Email re-sent.')
      refreshEmailHealth()
    },
    // A failed retry comes back as HTTP 502 with the exact error in the message.
    onError: err => {
      toastIfNoServerReply(err, 'Retry failed.')
      refreshEmailHealth()
    },
  })

  const testMutation = useMutation({
    mutationFn: () => adminService.sendTestEmail(testTo.trim() || undefined),
    onSuccess: res => {
      toast.success(res.data.message || 'Test email sent.')
      refreshEmailHealth()
    },
    onError: err => {
      toastIfNoServerReply(err, 'Test email failed.')
      refreshEmailHealth()
    },
  })

  const summary = data?.summary
  const config = data?.config
  const healthy = !!summary && summary.failed_24h === 0 && (config?.warnings.length ?? 0) === 0

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Email health</h2>
            <p className="mt-1 text-sm text-dark-400">See whether deposit, withdrawal, OTP and support emails are really reaching people.</p>
          </div>
          <button onClick={() => refetch()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-dark-600 bg-dark-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-emerald-500/30">
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-400" /></div>
        ) : (
          <>
            {/* Overall status */}
            <div className={`flex items-start gap-3 rounded-2xl border p-4 ${healthy ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
              {healthy
                ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-400" />
                : <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-400" />}
              <div className="text-sm">
                <p className={`font-semibold ${healthy ? 'text-emerald-300' : 'text-amber-200'}`}>
                  {healthy ? 'Email delivery looks healthy' : 'Email delivery needs attention'}
                </p>
                {summary && summary.failed_24h > 0 && (
                  <p className="mt-1 text-xs text-amber-200/80">
                    {summary.failed_24h} email(s) failed in the last 24 hours.
                    {summary.last_failure_error && <> Last error: <span className="font-mono">{summary.last_failure_error}</span></>}
                  </p>
                )}
                {summary?.last_failure_hint && <p className="mt-1 text-xs text-amber-100">How to fix: {summary.last_failure_hint}</p>}
                {config?.warnings.map(w => <p key={w} className="mt-1 text-xs text-amber-200/80">• {w}</p>)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Sent (24h)', value: summary?.sent_24h ?? 0, tone: 'text-emerald-400' },
                { label: 'Failed (24h)', value: summary?.failed_24h ?? 0, tone: (summary?.failed_24h ?? 0) > 0 ? 'text-red-400' : 'text-white' },
                { label: 'Failed (all time)', value: summary?.failed_total ?? 0, tone: 'text-white' },
              ].map(c => (
                <div key={c.label} className="premium-card p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-dark-400">{c.label}</p>
                  <p className={`mt-3 text-3xl font-bold ${c.tone}`}>{c.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Test email */}
              <section className="premium-card p-5">
                <h2 className="flex items-center gap-2 font-semibold text-white"><Mail size={16} /> Send a test email</h2>
                <p className="mt-1 text-xs text-dark-400">Sends a real email now. If it fails you will see the exact error and how to fix it.</p>
                <div className="mt-4 flex gap-2">
                  <input value={testTo} onChange={e => setTestTo(e.target.value)} type="email" placeholder="Leave empty to send to yourself" className="input-gold min-w-0 flex-1" />
                  <button onClick={() => testMutation.mutate()} disabled={testMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 text-sm font-bold text-dark-950 disabled:opacity-60">
                    {testMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send
                  </button>
                </div>
              </section>

              {/* Configuration (never includes the password) */}
              <section className="premium-card p-5">
                <h2 className="font-semibold text-white">Configuration</h2>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                  {config && ([
                    ['Server', `${config.host}:${config.port}${config.use_tls ? ' (TLS)' : config.use_ssl ? ' (SSL)' : ''}`],
                    ['Login', config.smtp_user || '(not set)'],
                    ['Password', config.password_set ? 'set' : 'MISSING'],
                    ['From', config.from_email],
                    ['Admin alerts go to', config.admin_recipients.join(', ') || '(nobody)'],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-dark-500">{k}</dt>
                      <dd className="break-all font-mono text-dark-200">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>

            {/* Log */}
            <section className="premium-card overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-dark-700 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold text-white">Email log</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {(['failed', 'sent', 'all'] as Filter[]).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? 'bg-emerald-500/15 text-emerald-300' : 'text-dark-400 hover:text-white'}`}>{f}</button>
                  ))}
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or subject" className="input-gold w-48 py-1.5 text-xs" />
                </div>
              </div>

              {!data?.logs.length ? (
                <p className="px-6 py-14 text-center text-sm text-dark-500">
                  {filter === 'failed' ? 'No failed emails. 🎉' : 'No emails found.'}
                </p>
              ) : (
                <div className="divide-y divide-dark-700/70">
                  {data.logs.map(log => (
                    <div key={log.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {log.status === 'sent'
                            ? <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                            : <XCircle size={15} className="shrink-0 text-red-400" />}
                          <p className="truncate text-sm font-medium text-white">{log.subject}</p>
                        </div>
                        <p className="mt-1 text-xs text-dark-400">
                          To {log.recipient} · {formatDateTime(log.created_at)}
                          {log.attempts > 1 && ` · ${log.attempts} attempts`}
                        </p>
                        {log.error && <p className="mt-1 break-words font-mono text-[11px] text-red-300/90">{log.error}</p>}
                      </div>
                      {log.status === 'failed' && (
                        log.retryable ? (
                          <button onClick={() => retryMutation.mutate(log.id)} disabled={retryMutation.isPending && retryMutation.variables === log.id} className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-dark-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-500/30 disabled:opacity-60">
                            {retryMutation.isPending && retryMutation.variables === log.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Retry
                          </button>
                        ) : (
                          <span className="shrink-0 self-start text-[11px] text-dark-500">Code email: user can request a new one</span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
    </div>
  )
}
