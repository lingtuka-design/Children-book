import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useAuth } from '@/services/hooks'

export const Route = createFileRoute('/admin/_layout')({ component: AdminGuardLayout })

function AdminGuardLayout() {
  const authed = useAuth()
  if (!authed) return <Navigate to="/admin/login" />
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
