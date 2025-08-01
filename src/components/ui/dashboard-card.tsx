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
    card: 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-md',
    icon: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    value: 'text-gray-900',
    trend: 'text-indigo-600'
  },
  success: {
    card: 'bg-white border-indigo-200 hover:border-indigo-300 hover:shadow-md',
    icon: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    value: 'text-gray-900',
    trend: 'text-emerald-600'
  },
  warning: {
    card: 'bg-white border-amber-200 hover:border-amber-300 hover:shadow-md',
    icon: 'bg-gradient-to-r from-amber-500 to-amber-600',
    value: 'text-gray-900',
    trend: 'text-amber-600'
  },
  danger: {
    card: 'bg-white border-red-200 hover:border-red-300 hover:shadow-md',
    icon: 'bg-gradient-to-r from-red-500 to-red-600',
    value: 'text-gray-900',
    trend: 'text-red-600'
  },
  info: {
    card: 'bg-white border-blue-200 hover:border-blue-300 hover:shadow-md',
    icon: 'bg-gradient-to-r from-blue-500 to-blue-600',
    value: 'text-gray-900',
    trend: 'text-blue-600'
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
        'transform transition-all duration-300 hover:scale-102 hover:shadow-lg',
        styles.card,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className={cn('text-3xl font-bold', styles.value)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
            )}
            {trend && (
              <p className={cn('text-xs font-medium mt-2', styles.trend)}>
                {trend.isPositive ? '↗' : '↘'} {trend.value}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center shadow-lg', styles.icon)}>
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