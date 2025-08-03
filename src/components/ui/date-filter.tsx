import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, X } from 'lucide-react'
import { formatDateLong } from '@/lib/utils'

interface DateFilterProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void
  className?: string
}

export function DateFilter({ onDateRangeChange, className = '' }: DateFilterProps) {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleStartDateChange = (date: string) => {
    setStartDate(date)
    onDateRangeChange(date || null, endDate || null)
  }

  const handleEndDateChange = (date: string) => {
    setEndDate(date)
    onDateRangeChange(startDate || null, date || null)
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    onDateRangeChange(null, null)
  }

  const hasActiveFilters = startDate || endDate

  // Fermer le popup quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Calendar className="h-4 w-4" />
        <span>
          {hasActiveFilters ? 'Filtre actif' : 'Filtrer par date'}
        </span>
        {hasActiveFilters && (
          <X 
            className="h-4 w-4 ml-2" 
            onClick={(e) => {
              e.stopPropagation()
              clearFilters()
            }}
          />
        )}
      </Button>

      {isOpen && (
        <div 
          ref={popupRef}
          className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-80"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Filtrer par plage de dates
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2">
                  Plage sélectionnée :
                </div>
                <div className="text-sm text-gray-900">
                  {startDate && (
                    <div>Du : {formatDateLong(startDate)}</div>
                  )}
                  {endDate && (
                    <div>Au : {formatDateLong(endDate)}</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-gray-200">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Effacer
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                size="sm"
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 