import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Recommendation } from "@/lib/recommendations"

const severityConfig = {
  info: { color: "#6B9BC4", bg: "#EBF2F8", icon: Info, label: "Tip" },
  warning: { color: "#C9A050", bg: "#FBF4E6", icon: AlertTriangle, label: "Notice" },
  critical: { color: "#C4706B", bg: "#FCEEEE", icon: AlertCircle, label: "Important" },
}

const categoryLabels: Record<string, string> = {
  morning: "Morning",
  activities: "Activities",
  nutrition: "Nutrition",
  social: "Social",
  evening: "Evening",
  safety: "Safety",
  medical: "Medical",
}

interface RecommendationCardProps {
  rec: Recommendation
}

export default function RecommendationCard({ rec }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = severityConfig[rec.severity]
  const Icon = config.icon

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl shadow-card overflow-hidden"
      style={{ borderLeft: `4px solid ${config.color}` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: config.bg }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              {config.label}
            </span>
            <span className="text-[11px] text-memo-text-tertiary uppercase tracking-wider">
              {categoryLabels[rec.category]}
            </span>
          </div>
          <h3 className="text-base font-semibold text-memo-text">{rec.title}</h3>
          <p className="text-sm text-memo-text-secondary mt-1 line-clamp-2">{rec.description}</p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mt-1"
        >
          <ChevronDown className="w-5 h-5 text-memo-text-tertiary" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-[52px]">
              <p className="text-sm text-memo-text-secondary mb-3">{rec.description}</p>

              <h4 className="text-sm font-semibold text-memo-text mb-2">Recommended Actions:</h4>
              <ul className="space-y-1.5 mb-3">
                {rec.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-memo-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-memo-success flex-shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-memo-bg rounded-xl p-3 mt-2">
                <p className="text-xs text-memo-text-secondary">
                  <span className="font-semibold">Why this matters: </span>
                  {rec.scienceNote}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
