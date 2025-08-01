import React, { useState, useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  format?: (value: number) => string
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className = "",
  format = (val: number) => val.toString()
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 },
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value)
    }, duration)

    return () => clearTimeout(timer)
  }, [value, duration])

  return (
    <animated.span className={className}>
      {number.to((n) => format(Math.floor(n)))}
    </animated.span>
  )
} 