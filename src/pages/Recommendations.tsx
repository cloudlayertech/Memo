import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useData } from "@/context/DataContext"
import { getRecommendationsForData } from "@/lib/recommendations"
import RecommendationCard from "@/components/RecommendationCard"
import SkeletonCard from "@/components/SkeletonCard"
import type { RecCategory, Severity } from "@/types/oura"

const categories: { key: RecCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sleep", label: "Sleep" },
  { key: "exercise", label: "Exercise" },
  { key: "heart", label: "Heart" },
  { key: "mental", label: "Mental" },
  { key: "social", label: "Social" },
  { key: "nutrition", label: "Nutrition" },
  { key: "medical", label: "Medical" },
]

const severities: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "info", label: "Tips" },
  { key: "warning", label: "Notices" },
  { key: "critical", label: "Important" },
]

export default function Recommendations() {
  const { metrics, loading } = useData()
  const [activeCategory, setActiveCategory] = useState<RecCategory | "all">("all")
  const [activeSeverity, setActiveSeverity] = useState<Severity | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")

  const allRecs = useMemo(() => {
    if (!metrics) return []
    return getRecommendationsForData(metrics)
  }, [metrics])

  const filtered = useMemo(() => {
    let recs = allRecs
    if (activeCategory !== "all") {
      recs = recs.filter((r) => r.category === activeCategory)
    }
    if (activeSeverity !== "all") {
      recs = recs.filter((r) => r.severity === activeSeverity)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      recs = recs.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term)
      )
    }
    return recs
  }, [allRecs, activeCategory, activeSeverity, searchTerm])

  return (
    <div className="min-h-[100dvh] bg-memo-bg px-4 pt-5 pb-10">
      <div className="max-w-2xl mx-auto space-y-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-semibold text-memo-text mb-1">Recommendations</h1>
          <p className="text-base text-memo-text-secondary">
            {allRecs.length > 0
              ? `${allRecs.length} personalized tips for today`
              : "Loading your recommendations..."}
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search recommendations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-4 pr-4 bg-white rounded-xl shadow-card text-memo-text placeholder:text-memo-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? "bg-primary text-white"
                  : "bg-white text-memo-text-secondary shadow-card hover:bg-memo-bg"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Severity Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {severities.map((sev) => (
            <button
              key={sev.key}
              onClick={() => setActiveSeverity(sev.key)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeSeverity === sev.key
                  ? "bg-primary text-white"
                  : "bg-white text-memo-text-secondary shadow-card hover:bg-memo-bg"
              }`}
            >
              {sev.label}
            </button>
          ))}
        </div>

        {loading && !metrics ? (
          <SkeletonCard count={4} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-memo-text-secondary text-lg">
              {allRecs.length === 0
                ? "No recommendations for today — you're doing great!"
                : "No recommendations match your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <RecommendationCard rec={rec} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
