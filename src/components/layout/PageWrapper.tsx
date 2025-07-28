import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function PageWrapper({ 
  children, 
  className, 
  maxWidth = '7xl',
  padding = 'lg'
}: PageWrapperProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-6',
    md: 'px-4 sm:px-6 py-8',
    lg: 'px-4 sm:px-6 lg:px-8 py-12'
  }

  return (
    <div className={cn(
      'mx-auto',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}