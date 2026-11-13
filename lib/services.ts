import { number } from 'zod'
import { api, unwrap, ApiResponse } from './api'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  country?: string
  avatar?: string
  is_verified: boolean
  is_staff: boolean
  referral_code: string
  referral_count: number
  profile: UserProfile
  created_at: string
}

export interface UserProfile {
  bitcoin_address?: string
  ethereum_address?: string
  usdt_address?: string
  usdt_erc20_address?: string
  wallet_balance: number
  total_deposited: string
  total_withdrawn: string
  total_earned: string
}

export interface InvestmentPlan {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount?: number
  roi_percentage: number
  duration: number
  duration_unit: 'days' | 'weeks' | 'months'
  is_active: boolean
  is_featured: boolean
}

export interface Deposit {
  id: string
  user_email?: string
  amount: string
  payment_method: string
  transaction_hash?: string
  proof_of_payment?: string
  status: 'pending' | 'confirmed' | 'rejected'
  admin_note?: string
  confirmed_at?: string
  created_at: string
}

export interface Investment {
  id: string
  plan: InvestmentPlan
  amount: number
  roi_percentage: number
  expected_return: number
  actual_return: string
  status: 'active' | 'completed' | 'cancelled'
  starts_at: string
  ends_at: string
  completed_at?: string
  progress_percentage: number
  created_at: string
}

export interface Withdrawal {
  id: string
  amount: string
  method: string
  payout_address?: string
  status: 'pending' | 'otp_verified' | 'processing' | 'completed' | 'rejected'
  admin_note?: string
  processed_at?: string
  created_at: string
}

export interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'roi' | 'referral_bonus' | 'investment'
  amount: string
  status: 'pending' | 'success' | 'failed'
  description: string
  reference: string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
}

export interface TicketMessage {
  id: string
  sender: 'user' | 'admin'
  message: string
  created_at: string
}

export interface SupportTicket {
  id: string
  subject: string
  category: 'account' | 'deposit' | 'withdrawal' | 'investment' | 'other'
  priority: 'low' | 'normal' | 'high'
  status: 'open' | 'answered' | 'closed' 
  messages: TicketMessage[]
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
}

export interface DashboardSummary {
  wallet_balance: number
  total_deposited: number
  total_withdrawn: number
  total_earned: number
  total_invested: number
  active_investments: number
  completed_investments: number
  pending_deposits: number
  pending_deposit_amount: number
  pending_withdrawals: number
  referral_count: number
}

// ── Email health ──────────────────────────────────────────────────────────────
/** What a normal user sees about their own emails (no technical details). */
export interface UserEmailStatus {
  emails: { id: string; subject: string; status: 'sent' | 'failed'; created_at: string }[]
  /** Recent account emails that could not be delivered (last 7 days). */
  failed_count: number
}

export interface EmailLogEntry {
  id: string
  recipient: string
  user_email: string | null
  subject: string
  template: string
  status: 'sent' | 'failed'
  error: string
  attempts: number
  retryable: boolean
  created_at: string
  updated_at: string
}

export interface EmailConfigReport {
  backend: string
  host: string
  port: number | null
  use_tls: boolean | null
  use_ssl: boolean
  timeout_seconds: number | null
  smtp_user: string
  password_set: boolean
  from_email: string
  admin_recipients: string[]
  frontend_url: string
  warnings: string[]
}

export interface AdminEmailOverview {
  summary: {
    sent_24h: number
    failed_24h: number
    failed_total: number
    last_failure_at: string | null
    last_failure_error: string | null
    last_failure_hint: string
  }
  config: EmailConfigReport
  logs: EmailLogEntry[]
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  register: (data: { email: string; first_name: string; last_name: string; phone?: string; country?: string; password: string; password2: string; referral_code?: string }) =>
    api.post<ApiResponse<{ email: string; email_sent?: boolean }>>('/auth/register/', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; access: string; refresh: string }>>('/auth/login/', data),

  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),

  verifyEmail: (data: { email: string; code: string }) =>
    api.post<ApiResponse<{ user: User; access: string; refresh: string }>>('/auth/otp/verify-email/', data),

  resendOTP: (data: { email: string; purpose: string }) =>
    api.post('/auth/otp/resend/', data),

  requestPasswordReset: (email: string) =>
    api.post('/auth/password/reset/', { email }),

  confirmPasswordReset: (data: { email: string; code: string; new_password: string; new_password2: string }) =>
    api.post('/auth/password/reset/confirm/', data),

  changePassword: (data: { old_password: string; new_password: string; new_password2: string }) =>
    api.post('/auth/password/change/', data),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me/'),

  updateProfile: (data: Partial<User>) =>
    api.patch<ApiResponse<User>>('/auth/me/', data),

  updateWallet: (data: Partial<UserProfile>) =>
    api.patch<ApiResponse<UserProfile>>('/auth/me/wallet/', data),
}

// ── Investments ───────────────────────────────────────────────────────────────
export const investmentService = {
  getPlans: () =>
    api.get<ApiResponse<InvestmentPlan[]>>('/investments/plans/'),

  getDashboard: () =>
    api.get<ApiResponse<DashboardSummary>>('/investments/dashboard/'),

  getInvestments: (params?: { status?: string }) =>
    api.get<ApiResponse<Investment[]>>('/investments/', { params }),

  getInvestment: (id: string) =>
    api.get<ApiResponse<Investment>>(`/investments/${id}/`),

  createInvestment: (data: { plan_id: string; amount: string | number }) =>
    api.post<ApiResponse<Investment>>('/investments/create/', data),

  getDeposits: (params?: { status?: string }) =>
    api.get<ApiResponse<Deposit[]>>('/investments/deposits/', { params }),

  getDeposit: (id: string) =>
    api.get<ApiResponse<Deposit>>(`/investments/deposits/${id}/`),

  createDeposit: (data: FormData) =>
    api.post<ApiResponse<Deposit>>('/investments/deposits/create/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getTransactions: (params?: { type?: string; status?: string }) =>
    api.get<ApiResponse<Transaction[]>>('/investments/transactions/', { params }),
}

// ── Withdrawals ───────────────────────────────────────────────────────────────
export const withdrawalService = {
  getWithdrawals: (params?: { status?: string }) =>
    api.get<ApiResponse<Withdrawal[]>>('/withdrawals/', { params }),

  requestWithdrawal: (data: { amount: string; method: string }) =>
    api.post<ApiResponse<{ withdrawal_id: string }>>('/withdrawals/request/', data),

  verifyOTP: (data: { withdrawal_id: string; code: string }) =>
    api.post('/withdrawals/verify-otp/', data),

  cancelWithdrawal: (id: string) =>
    api.post(`/withdrawals/${id}/cancel/`),

  resendOTP: (id: string) =>
    api.post(`/withdrawals/${id}/resend-otp/`),
}

// ── Support ────────────────────────────────────────────────────────────────
export const supportService = {
  getTickets: (params?: { status?: string }) =>
    api.get<ApiResponse<SupportTicket[]>>('/support/tickets/', { params }),
  
  createTicket: (data: { subject: string; category: SupportTicket['category']; priority: SupportTicket['priority']; message: string }) =>
    api.post<ApiResponse<SupportTicket>>('/support/tickets/', data),

  getTicket: (id: string) =>
    api.get<ApiResponse<SupportTicket>>(`/support/tickets/${id}/`),

  reply: (id: string, message: string ) =>
    api.post<ApiResponse<TicketMessage>>(`/support/tickets/${id}/reply/`, { message}),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationService = {
  getNotifications: () =>
    api.get<ApiResponse<Notification[]>>('/notifications/'),

  getUnreadCount: () =>
    api.get<ApiResponse<{ unread_count: number }>>('/notifications/unread-count/'),

  markAllRead: () =>
    api.post('/notifications/mark-all-read/'),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read/`),

  getEmailStatus: () =>
    api.get<ApiResponse<UserEmailStatus>>('/notifications/email-log'),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminService = {
  getStats: () =>
    api.get('/admin/stats/'),

  getUsers: (params?: any) =>
    api.get('/admin/users/', { params }),

  getUser: (id: string) =>
    api.get(`/admin/users/${id}/`),

  updateUser: (id: string, data: any) =>
    api.patch(`/admin/users/${id}/`, data),

  toggleUserStatus: (id: string) =>
    api.post(`/admin/users/${id}/toggle-status/`),

  creditWallet: (data: { user_id: string; amount: string; description: string }) =>
    api.post('/admin/users/credit-wallet/', data),

  getDeposits: (params?: any) =>
    api.get('/admin/deposits/', { params }),

  depositAction: (id: string, data: { action: 'approve' | 'reject'; admin_note?: string }) =>
    api.post(`/admin/deposits/${id}/action/`, data),

  getWithdrawals: (params?: any) =>
    api.get('/admin/withdrawals/', { params }),

  withdrawalAction: (id: string, data: { action: 'approve' | 'reject'; admin_note?: string }) =>
    api.post(`/admin/withdrawals/${id}/action/`, data),

  getPlans: () =>
    api.get('/admin/plans/'),

  createPlan: (data: any) =>
    api.post('/admin/plans/', data),

  updatePlan: (id: string, data: any) =>
    api.patch(`/admin/plans/${id}/`, data),

  deletePlan: (id: string) =>
    api.delete(`/admin/plans/${id}/`),

  broadcast: (data: { subject: string; message: string; target: string }) =>
    api.post<ApiResponse<{ total: number; sent: number; failed: number }>>('/admin/broadcast/', data),

  getSupportTickets: (params?: { status?: string }) =>
    api.get<ApiResponse<SupportTicket[]>>('/support/admin/tickets/', { params }),

  supportTicketAction: (id: string, data: { status?: SupportTicket['status']; message?: string }) =>
    api.post<ApiResponse<SupportTicket>>(`/support/admin/tickets/${id}/action/`, data),

  // Email health: delivery log, retry a failed email, send a test email
  getEmailLogs: (params?: { status?: 'sent' | 'failed'; search?: string; limit?: number }) =>
    api.get<ApiResponse<AdminEmailOverview>>('/admin/email-logs/', { params }),

  retryEmail: (id: string) =>
    api.post<ApiResponse<EmailLogEntry>>(`/admin/email-logs/${id}/retry/`),

  sendTestEmail: (to?: string) =>
    api.post<ApiResponse<null>>('/admin/email-test/', to ? { to } : {}),
}