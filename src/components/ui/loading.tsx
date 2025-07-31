import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function Loading({ size = 'md', text, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <Loader2 className={cn('animate-spin text-indigo-600', sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  )
}

interface LoadingOverlayProps {
  loading: boolean
  children: React.ReactNode
  text?: string
  className?: string
}

export function LoadingOverlay({ loading, children, text = 'Chargement...', className }: LoadingOverlayProps) {
  if (!loading) return <>{children}</>

  return (
    <div className="relative">
      {children}
      <div className={cn(
        'absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10',
        className
      )}>
        <Loading text={text} size="lg" />
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
} 