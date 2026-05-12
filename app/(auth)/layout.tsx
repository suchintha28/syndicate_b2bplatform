import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '24px 16px',
      background: 'var(--bg)',
    }}>
      {children}
    </div>
  )
}
