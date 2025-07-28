import React from 'react'
import { BookOpen, Coffee, Heart, Users, Lightbulb, Target } from 'lucide-react'
import Link from 'next/link'

import { PageWrapper } from '@/components/layout'
import { SocialShareInline } from '@/components/common'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'About Chasing Chapters',
  description: 'Learn about the journey behind Chasing Chapters, my passion for reading, and what drives my love for books and storytelling.',
  slug: 'about'
})

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16">
        <PageWrapper className="text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="h-16 w-16 text-primary-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
            About Chasing Chapters
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            Welcome to my personal corner of the literary world. Here, I share my journey 
            through books, stories, and the endless adventures that reading brings to life.
          </p>
        </PageWrapper>
      </section>

      {/* My Story */}
      <section className="py-16 bg-white">
        <PageWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                My Reading Journey
              </h2>
              <div className="space-y-4 text-neutral-700 leading-relaxed">
                <p>
                  Books have been my constant companions for as long as I can remember. 
                  From childhood adventures in fantasy worlds to thought-provoking 
                  non-fiction that challenges my perspectives, reading has shaped who I am 
                  and how I see the world.
                </p>
                <p>
                  Chasing Chapters started as a way to document my reading experiences 
                  and share the books that have left a lasting impact on me. What began 
                  as personal notes has evolved into a space where I can connect with 
                  fellow book lovers and contribute to the vibrant reading community.
                </p>
                <p>
                  Every review you read here comes from genuine passion. I believe 
                  that books are more than entertainment—they&apos;re windows into different 
                  worlds, teachers of empathy, and catalysts for personal growth.
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg p-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Coffee className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">Reading Ritual</h3>
                    <p className="text-sm text-neutral-700">
                      Best reading happens with a warm cup of coffee and natural light
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Heart className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">Favorite Genres</h3>
                    <p className="text-sm text-neutral-700">
                      Literary fiction, science fiction, psychology, and memoirs
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Target className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">Reading Goal</h3>
                    <p className="text-sm text-neutral-700">
                      Quality over quantity—every book should teach me something new
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* What You&apos;ll Find Here */}
      <section className="py-16 bg-neutral-50">
        <PageWrapper>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              What You&apos;ll Find Here
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Chasing Chapters is designed to be your companion in discovering great books 
              and exploring different perspectives through literature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-md">
                <BookOpen className="h-8 w-8 text-primary-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                Honest Reviews
              </h3>
              <p className="text-neutral-600">
                Thoughtful, detailed reviews that go beyond star ratings to explore 
                what makes each book special or challenging.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-md">
                <Lightbulb className="h-8 w-8 text-yellow-500 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                Key Insights
              </h3>
              <p className="text-neutral-600">
                The lessons, ideas, and perspectives that each book offers, 
                helping you decide if it aligns with your interests.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-md">
                <Users className="h-8 w-8 text-blue-500 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                Reading Community
              </h3>
              <p className="text-neutral-600">
                A space where book lovers can discover new reads and share 
                in the joy of literary exploration.
              </p>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* My Reading Philosophy */}
      <section className="py-16 bg-white">
        <PageWrapper>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">
              My Reading Philosophy
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Diversity in Reading
                  </h3>
                  <p className="text-neutral-700">
                    I believe in reading widely across genres, cultures, and perspectives. 
                    Great insights can come from unexpected places, and every book has 
                    something to teach us.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Critical but Fair
                  </h3>
                  <p className="text-neutral-700">
                    Every book deserves a fair assessment. I aim to understand what 
                    the author intended and evaluate how well they achieved their goals, 
                    while being honest about what worked for me.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Reading as Growth
                  </h3>
                  <p className="text-neutral-700">
                    The best books challenge us, change us, or show us something new 
                    about ourselves and the world. I look for books that contribute to 
                    personal and intellectual growth.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Community Connection
                  </h3>
                  <p className="text-neutral-700">
                    Reading is more meaningful when shared. I hope my reviews help 
                    you discover your next favorite book and contribute to the broader 
                    conversation about literature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary-100 to-secondary-100">
        <PageWrapper className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Join the Journey
          </h2>
          <p className="text-lg text-neutral-700 mb-8 max-w-2xl mx-auto">
            Ready to discover your next great read? Explore my reviews, check out what 
            I&apos;m currently reading, or get in touch to share your own book recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/reviews" className="btn-primary">
              Browse Reviews
            </Link>
            <Link href="/currently-reading" className="btn-outline">
              Current Reads
            </Link>
            <Link href="/contact" className="btn-outline">
              Get in Touch
            </Link>
          </div>
          
          {/* Social Sharing */}
          <div className="pt-8 border-t border-neutral-300 max-w-sm mx-auto">
            <SocialShareInline 
              url="/about"
              title="About Chasing Chapters - My Reading Journey"
            />
          </div>
        </PageWrapper>
      </section>
    </>
  )
}