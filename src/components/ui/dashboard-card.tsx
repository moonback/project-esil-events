import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  onClick?: () => void
}

const variantStyles = {
  default: {
    card: 'bg-white border-gray-200 hover:border-gray-300',
    icon: 'bg-gradient-to-r from-blue-500 to-blue-600',
    value: 'text-gray-900',
    trend: 'text-blue-600'
  },
  success: {
    card: 'bg-white border-green-200 hover:border-green-300',
    icon: 'bg-gradient-to-r from-green-500 to-green-600',
    value: 'text-gray-900',
    trend: 'text-green-600'
  },
  warning: {
    card: 'bg-white border-yellow-200 hover:border-yellow-300',
    icon: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    value: 'text-gray-900',
    trend: 'text-yellow-600'
  },
  danger: {
    card: 'bg-white border-red-200 hover:border-red-300',
    icon: 'bg-gradient-to-r from-red-500 to-red-600',
    value: 'text-gray-900',
    trend: 'text-red-600'
  },
  info: {
    card: 'bg-white border-purple-200 hover:border-purple-300',
    icon: 'bg-gradient-to-r from-purple-500 to-purple-600',
    value: 'text-gray-900',
    trend: 'text-purple-600'
  }
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
  onClick
}: DashboardCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card 
      className={cn(
        'transform transition-all duration-300 hover:scale-105 hover:shadow-lg',
        styles.card,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={cn('text-3xl font-bold', styles.value)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={cn('text-xs font-medium mt-1', styles.trend)}>
                {trend.isPositive ? '↗' : '↘'} {trend.value}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg', styles.icon)}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 