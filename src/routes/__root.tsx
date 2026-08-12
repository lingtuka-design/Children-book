import { createRootRoute, Outlet } from '@tanstack/react-router'
import { PublicLayout } from '@/components/layout/PublicLayout'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <PublicLayout>
      <NotFound />
    </PublicLayout>
  ),
})

function RootComponent() {
  return <Outlet />
}

function NotFound() {
  return (
    <div className="container-site py-20 text-center">
      <p className="text-6xl" aria-hidden="true">
        📖
      </p>
      <h1 className="heading-display mt-4 text-3xl">Page not found</h1>
      <p className="mt-2 text-ink-500">This page seems to have wandered off the storybook.</p>
      <a href="/" className="mt-6 inline-block font-bold text-coral-600 hover:underline">
        Back to home
      </a>
    </div>
  )
}
