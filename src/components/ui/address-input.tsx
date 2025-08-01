import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'
import { geocodeAddress, getAddressSuggestions, type GeocodingResult } from '@/lib/geocoding'

interface AddressInputProps {
  value: string
  onChange: (address: string) => void
  onGeocode?: (result: GeocodingResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AddressInput({
  value,
  onChange,
  onGeocode,
  placeholder = "Entrez une adresse...",
  className = "",
  disabled = false
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Recherche d'adresses avec debounce
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await getAddressSuggestions(value)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Erreur lors de la recherche d\'adresses:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value])

  // Géocodage automatique quand une adresse est sélectionnée
  const handleAddressSelect = async (address: string) => {
    onChange(address)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)

    if (onGeocode) {
      setIsLoading(true)
      try {
        const result = await geocodeAddress(address)
        if (!('error' in result)) {
          onGeocode(result)
        }
      } catch (error) {
        console.error('Erreur lors du géocodage:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Géocodage manuel avec le bouton
  const handleGeocode = async () => {
    if (!value.trim()) return

    setIsLoading(true)
    try {
      const result = await geocodeAddress(value)
      if (!('error' in result)) {
        onGeocode?.(result)
      }
    } catch (error) {
      console.error('Erreur lors du géocodage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Navigation au clavier dans les suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleAddressSelect(suggestions[selectedIndex])
        } else if (value.trim()) {
          handleGeocode()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Clic en dehors pour fermer les suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleGeocode}
            disabled={!value.trim() || isLoading || disabled}
            className="h-6 w-6 p-0"
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Suggestions d'adresses */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleAddressSelect(suggestion)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Indicateur de chargement */}
      {isLoading && !showSuggestions && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  )
} 