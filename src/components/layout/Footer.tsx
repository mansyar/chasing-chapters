import Link from 'next/link'
import { BookOpen, Heart, Instagram, Twitter, Mail } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-neutral-900 text-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 text-white hover:text-neutral-200 transition-colors">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">Chasing Chapters</span>
            </Link>
            <p className="mt-4 text-neutral-400 max-w-md">
              A personal journey through books, stories, and the adventures they hold. 
              Join me as I chase chapters and discover new worlds through reading.
            </p>
            <div className="flex items-center space-x-4 mt-6">
              <a
                href="https://instagram.com"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@chasingchapters.com"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigate</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/reviews" className="text-neutral-400 hover:text-white transition-colors">
                  All Reviews
                </Link>
              </li>
              <li>
                <Link href="/currently-reading" className="text-neutral-400 hover:text-white transition-colors">
                  Currently Reading
                </Link>
              </li>
              <li>
                <Link href="/want-to-read" className="text-neutral-400 hover:text-white transition-colors">
                  Want to Read
                </Link>
              </li>
              <li>
                <Link href="/tags" className="text-neutral-400 hover:text-white transition-colors">
                  Browse by Tags
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-neutral-400 hover:text-white transition-colors">
                  About Me
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">
            © {currentYear} Chasing Chapters. Made with{' '}
            <Heart className="inline-block h-4 w-4 text-red-500" aria-label="love" />{' '}
            for book lovers.
          </p>
          <p className="text-neutral-400 text-sm mt-4 md:mt-0">
            Powered by{' '}
            <a
              href="https://nextjs.org"
              className="text-white hover:text-neutral-200 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js
            </a>{' '}
            and{' '}
            <a
              href="https://payloadcms.com"
              className="text-white hover:text-neutral-200 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Payload CMS
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}