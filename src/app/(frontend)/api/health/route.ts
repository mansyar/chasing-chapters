import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check without database connection during build
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      database: 'available',
    }

    // Only test database connection in runtime, not during build
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      try {
        const { getPayload } = await import('payload')
        const configPromise = await import('@payload-config')
        const payload = await getPayload({ config: configPromise.default })
        
        if (payload.db?.connect) {
          await payload.db.connect()
          health.database = 'connected'
        }
      } catch (_dbError) {
        health.database = 'disconnected'
        // Don't fail health check just for database connection in some environments
      }
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    const health = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      database: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    }

    return NextResponse.json(health, { status: 503 })
  }
}