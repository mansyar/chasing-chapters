import React from 'react'
import './styles.css'
import { Layout } from '@/components/layout'
import { generateHomeMetadata } from '@/lib/metadata'

export const metadata = generateHomeMetadata()

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
