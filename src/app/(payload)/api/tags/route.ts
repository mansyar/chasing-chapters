import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET() {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get all tags with review counts
    const tags = await payload.find({
      collection: 'tags',
      sort: 'name',
      limit: 100,
      depth: 0
    })

    // Return tags with minimal data needed for filtering
    const formattedTags = tags.docs.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      description: tag.description
    }))

    return NextResponse.json({
      success: true,
      docs: formattedTags,
      totalDocs: tags.totalDocs
    })
  } catch (error) {
    console.error('Tags API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tags',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}