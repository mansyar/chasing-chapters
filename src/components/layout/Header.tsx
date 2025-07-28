'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, BookOpen, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Reviews', href: '/reviews' },
    { name: 'Currently Reading', href: '/currently-reading' },
    { name: 'Want to Read', href: '/want-to-read' },
    { name: 'Tags', href: '/tags' },
    { name: 'About', href: '/about' },
  ]

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-primary-700 hover:text-primary-800 transition-colors">
            <BookOpen className="h-8 w-8" />
            <span className="text-xl font-bold">Chasing Chapters</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <button className="text-neutral-500 hover:text-neutral-700 transition-colors">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </button>
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden text-neutral-500 hover:text-neutral-700 transition-colors"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="sr-only">Toggle menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'md:hidden transition-all duration-300 ease-in-out overflow-hidden',
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-md font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}