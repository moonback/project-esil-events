import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Nouvelles variantes avec gradients
        gradient: "border-transparent text-white font-bold shadow-sm",
        "gradient-primary": "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-sm",
        "gradient-success": "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-transparent shadow-sm",
        "gradient-warning": "bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-transparent shadow-sm",
        "gradient-danger": "bg-gradient-to-r from-red-600 to-pink-600 text-white border-transparent shadow-sm",
        "gradient-info": "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }