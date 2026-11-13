'use client'

// Standalone route /admin/email-logs. The same panel is also the "Email" tab inside /admin.
// You can delete this file if you only want the tab.
import DashboardLayout from '@/components/layout/DashboardLayout'
import EmailHealthPanel from '@/components/admin/EmailHealthPanel'

export default function AdminEmailLogsPage() {
  return (
    <DashboardLayout>
      <EmailHealthPanel />
    </DashboardLayout>
  )
}
