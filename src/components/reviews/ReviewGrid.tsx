import { Review, Media, Tag } from '@/payload-types'
import ReviewCard from './ReviewCard'

interface ReviewGridProps {
  reviews: (Review & {
    coverImage?: Media
    tags?: (number | Tag)[]
  })[]
  title?: string
  showTitle?: boolean
  showReadingStatus?: boolean
}

export default function ReviewGrid({ 
  reviews, 
  title = "Recent Reviews",
  showTitle = true,
  showReadingStatus = false
}: ReviewGridProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-lg">No reviews available yet.</p>
        <p className="text-neutral-400 text-sm mt-2">Check back soon for new book reviews!</p>
      </div>
    )
  }

  return (
    <section>
      {showTitle && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">{title}</h2>
          <div className="w-24 h-1 bg-primary-600 rounded"></div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} showReadingStatus={showReadingStatus} />
        ))}
      </div>
    </section>
  )
}