'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock3, LifeBuoy, Loader2, MessageSquare, Plus, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { SupportTicket, supportService } from '@/lib/services'
import { formatDateTime } from '@/lib/utils'

const categories = [
  ['account', 'Account'],
  ['deposit', 'Deposit'],
  ['withdrawal', 'Withdrawal'],
  ['investment', 'Investment'],
  ['technical', 'Technical'],
  ['other', 'Other'],
] as const

export default function SupportTicketsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<SupportTicket['category']>('withdrawal')
  const [priority, setPriority] = useState<SupportTicket['priority']>('normal')
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportService.getTickets().then(r => r.data.data!),
  })

  const selected = useMemo(() => tickets?.find(ticket => ticket.id === selectedId) || null, [tickets, selectedId])

  const createMutation = useMutation({
    mutationFn: supportService.createTicket,
    onSuccess: res => {
      toast.success('Support ticket created.')
      setShowCreate(false)
      setSubject('')
      setMessage('')
      setSelectedId(res.data.data!.id)
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => supportService.reply(id, message),
    onSuccess: () => {
      setReply('')
      toast.success('Reply sent.')
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })

  const statusClass: Record<string, string> = {
    open: 'badge-pending',
    answered: 'badge-info',
    closed: 'badge-success',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
            <p className="mt-1 text-sm text-dark-400">Get help with deposits, withdrawals, investments, account access and technical issues.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-sm font-bold text-dark-950 transition hover:brightness-110">
            <Plus size={17} /> New ticket
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <section className="premium-card overflow-hidden">
            <div className="border-b border-dark-700 px-5 py-4">
              <h2 className="font-semibold text-white">Your tickets</h2>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-400" /></div>
            ) : !tickets?.length ? (
              <div className="px-6 py-16 text-center">
                <LifeBuoy size={34} className="mx-auto text-dark-600" />
                <p className="mt-3 text-sm font-medium text-white">No support tickets</p>
                <p className="mt-1 text-xs text-dark-400">Create a ticket whenever you need assistance.</p>
              </div>
            ) : (
              <div className="max-h-[620px] divide-y divide-dark-700/70 overflow-y-auto">
                {tickets.map(ticket => (
                  <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`w-full p-5 text-left transition hover:bg-white/[0.02] ${selectedId === ticket.id ? 'bg-emerald-500/[0.06]' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{ticket.subject}</p>
                        <p className="mt-1 text-xs capitalize text-dark-500">{ticket.category} · {ticket.priority} priority</p>
                      </div>
                      <span className={statusClass[ticket.status]}>{ticket.status}</span>
                    </div>
                    <p className="mt-3 text-xs text-dark-500">Updated {formatDateTime(ticket.updated_at)}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="premium-card min-h-[520px] overflow-hidden">
            {!selected ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
                <MessageSquare size={38} className="text-dark-600" />
                <p className="mt-4 font-semibold text-white">Select a support ticket</p>
                <p className="mt-1 max-w-sm text-sm text-dark-400">Your conversation with support will appear here.</p>
              </div>
            ) : (
              <div className="flex min-h-[520px] flex-col">
                <div className="border-b border-dark-700 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-white">{selected.subject}</h2>
                      <p className="mt-1 text-xs text-dark-500">Ticket #{selected.id.slice(0, 8)}</p>
                    </div>
                    <span className={statusClass[selected.status]}>{selected.status}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {selected.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.sender === 'user' ? 'bg-emerald-500/10 text-dark-100 ring-1 ring-emerald-500/15' : 'bg-dark-800 text-dark-200 ring-1 ring-dark-700'}`}>
                        <p className="whitespace-pre-wrap text-sm leading-6">{msg.message}</p>
                        <p className="mt-2 text-[11px] text-dark-500">{msg.sender === 'admin' ? 'Support' : 'You'} · {formatDateTime(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dark-700 p-4">
                  {selected.status === 'closed' ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400"><CheckCircle2 size={16} /> This ticket is closed.</div>
                  ) : (
                    <div className="flex gap-2">
                      <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2} placeholder="Write a reply..." className="input-gold min-h-[52px] flex-1 resize-none" />
                      <button onClick={() => selected && reply.trim() && replyMutation.mutate({ id: selected.id, message: reply.trim() })} disabled={!reply.trim() || replyMutation.isPending} className="flex w-12 items-center justify-center rounded-xl bg-gold-gradient text-dark-950 disabled:opacity-50">
                        {replyMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: .97, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .97 }} className="w-full max-w-lg rounded-3xl border border-dark-700 bg-dark-900 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Open a support ticket</h2>
                  <p className="mt-1 text-xs text-dark-400">Include enough detail for the support team to investigate quickly.</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-dark-400 hover:bg-dark-800 hover:text-white"><X size={18} /></button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark-200">Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="input-gold w-full" placeholder="Example: Withdrawal is still pending" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark-200">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value as SupportTicket['category'])} className="input-gold w-full">
                      {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark-200">Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as SupportTicket['priority'])} className="input-gold w-full">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark-200">Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="input-gold w-full resize-none" placeholder="Describe what happened, including any relevant transaction details." />
                </div>
                <button onClick={() => createMutation.mutate({ subject: subject.trim(), category, priority, message: message.trim() })} disabled={!subject.trim() || !message.trim() || createMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3.5 font-bold text-dark-950 disabled:opacity-50">
                  {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <><Clock3 size={17} /> Create ticket</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
