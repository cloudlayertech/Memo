import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import ProgressRing from "./ProgressRing"

interface MetricCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  progress: number
  color: string
  trend?: number | null
  onClick?: () => void
  delay?: number
}

export default function MetricCard({
  icon,
  title,
  value,
  unit,
  subtitle,
  progress,
  color,
  trend,
  onClick,
  delay = 0,
}: MetricCardProps) {
  const trendIcon =
    trend === null || trend === undefined ? null : trend > 2 ? (
      <TrendingUp className="w-3.5 h-3.5 text-memo-success" />
    ) : trend < -2 ? (
      <TrendingDown className="w-3.5 h-3.5 text-memo-danger" />
    ) : (
      <Minus className="w-3.5 h-3.5 text-memo-text-tertiary" />
    )

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(45, 42, 38, 0.10)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-card text-left w-full flex items-center gap-4 transition-shadow cursor-pointer border-0"
    >
      <div className="relative flex-shrink-0">
        <ProgressRing progress={progress} size={68} strokeWidth={6} color={color} />
        <div className="absolute inset-0 flex items-center justify-center" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-memo-text-secondary mb-0.5">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-memo-text truncate">{value}</span>
          {unit && <span className="text-sm text-memo-text-tertiary">{unit}</span>}
        </div>
        {subtitle && <p className="text-xs text-memo-text-tertiary mt-0.5 truncate">{subtitle}</p>}
        {trend !== null && trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trendIcon}
            <span
              className={`text-xs font-medium ${
                trend > 2
                  ? "text-memo-success"
                  : trend < -2
                  ? "text-memo-danger"
                  : "text-memo-text-tertiary"
              }`}
            >
              {Math.abs(trend).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </motion.button>
  )
}
