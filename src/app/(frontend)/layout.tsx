import React from 'react'
import './styles.css'
import { Layout } from '@/components/layout'
import { generateHomeMetadata } from '@/lib/metadata'
import WebVitalsTracker from '@/components/common/WebVitalsTracker'

export const metadata = {
  ...generateHomeMetadata(),
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <WebVitalsTracker />
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
