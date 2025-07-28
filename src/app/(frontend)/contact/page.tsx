import React from 'react'
import { Mail, MessageCircle, BookOpen, Coffee, ExternalLink, Heart } from 'lucide-react'
import Link from 'next/link'

import { PageWrapper } from '@/components/layout'
import { SocialShareInline } from '@/components/common'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Contact - Let\'s Connect',
  description: 'Get in touch about book recommendations, collaboration opportunities, or just to chat about your favorite reads.',
  slug: 'contact'
})

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
        <PageWrapper className="text-center">
          <div className="flex justify-center mb-6">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Let&apos;s Connect
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            I love connecting with fellow book lovers! Whether you have recommendations, 
            questions, or just want to chat about your latest read, I&apos;d love to hear from you.
          </p>
        </PageWrapper>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <PageWrapper>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Ways to Reach Me
              </h2>
              <p className="text-lg text-neutral-600">
                Choose the method that works best for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Email Contact */}
              <div className="card p-8 text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  Email Me
                </h3>
                <p className="text-neutral-600 mb-4">
                  For book recommendations, collaboration inquiries, or detailed discussions about literature.
                </p>
                <a 
                  href="mailto:hello@chasingchapters.com" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  hello@chasingchapters.com
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
                <p className="text-sm text-neutral-500 mt-2">
                  I typically respond within 24-48 hours
                </p>
              </div>

              {/* Social Media */}
              <div className="card p-8 text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-purple-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  Social Media
                </h3>
                <p className="text-neutral-600 mb-4">
                  Follow along with my reading journey and join the conversation about books.
                </p>
                <div className="space-y-2">
                  <a 
                    href="#" 
                    className="block text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  >
                    @chasingchapters
                  </a>
                  <p className="text-sm text-neutral-500">
                    Daily reading updates and bookish thoughts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* What to Expect */}
      <section className="py-16 bg-neutral-50">
        <PageWrapper>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">
              What to Expect
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <Coffee className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Thoughtful Responses
                </h3>
                <p className="text-neutral-600">
                  I take time to provide meaningful replies to your questions and recommendations.
                </p>
              </div>
              
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Book-Focused Discussions
                </h3>
                <p className="text-neutral-600">
                  Our conversations center around books, reading experiences, and literary discoveries.
                </p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* Contact Reasons */}
      <section className="py-16 bg-white">
        <PageWrapper>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Reasons to Get in Touch
              </h2>
              <p className="text-lg text-neutral-600">
                Here are some great reasons to reach out
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <BookOpen className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Book Recommendations
                </h3>
                <p className="text-sm text-neutral-700">
                  Share books you think I&apos;d love, or ask for recommendations based on your interests.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <MessageCircle className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Discussion
                </h3>
                <p className="text-sm text-neutral-700">
                  Discuss books we&apos;ve both read, share different perspectives, or debate literary merits.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <Heart className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Collaboration
                </h3>
                <p className="text-sm text-neutral-700">
                  Opportunities for book clubs, reading challenges, or other literary collaborations.
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6">
                <Coffee className="h-8 w-8 text-amber-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Feedback
                </h3>
                <p className="text-sm text-neutral-700">
                  Thoughts on my reviews, suggestions for the site, or feedback on my reading choices.
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
                <ExternalLink className="h-8 w-8 text-red-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Media & Press
                </h3>
                <p className="text-sm text-neutral-700">
                  Press inquiries, interviews, podcast appearances, or other media opportunities.
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6">
                <BookOpen className="h-8 w-8 text-indigo-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Just to Chat
                </h3>
                <p className="text-sm text-neutral-700">
                  Sometimes the best conversations happen when we just start talking about books!
                </p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* Response Time & Guidelines */}
      <section className="py-16 bg-gradient-to-r from-neutral-100 to-neutral-200">
        <PageWrapper>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              A Few Quick Notes
            </h2>
            
            <div className="space-y-4 text-left">
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-neutral-700">
                  <strong>Response Time:</strong> I aim to respond to all messages within 24-48 hours. 
                  Longer emails about complex topics might take a bit more time for a thoughtful response.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <p className="text-neutral-700">
                  <strong>Book Spoilers:</strong> Please mark any major spoilers clearly in your message. 
                  I appreciate being able to read books with fresh eyes!
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <p className="text-neutral-700">
                  <strong>Reading Preferences:</strong> While I read across many genres, 
                  I&apos;m always excited to discover something new. Don&apos;t hesitate to recommend outside my usual interests!
                </p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <PageWrapper className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Ready to Connect?
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            I&apos;m always excited to meet fellow book lovers and discover new perspectives 
            on literature. Don&apos;t be shy—reach out today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="mailto:hello@chasingchapters.com" className="btn-primary">
              Send an Email
            </a>
            <Link href="/about" className="btn-outline">
              Learn More About Me
            </Link>
          </div>
          
          {/* Social Sharing */}
          <div className="pt-8 border-t border-neutral-200 max-w-sm mx-auto">
            <SocialShareInline 
              url="/contact"
              title="Connect with Chasing Chapters"
            />
          </div>
        </PageWrapper>
      </section>
    </>
  )
}