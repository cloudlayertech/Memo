import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useData } from "@/context/DataContext"
import { getRecommendationsForData } from "@/lib/recommendations"
import type { RecCategory, Severity } from "@/lib/recommendations"
import RecommendationCard from "@/components/RecommendationCard"
import { RefreshCw } from "lucide-react"

const categories: { key: RecCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "morning", label: "Morning" },
  { key: "activity", label: "Activities" },
  { key: "sleep", label: "Sleep" },
  { key: "heart", label: "Heart" },
  { key: "evening", label: "Evening" },
  { key: "stress", label: "Stress" },
  { key: "spo2", label: "SpO2" },
]

const severities: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "info", label: "Tips" },
  { key: "warning", label: "Notices" },
  { key: "critical", label: "Important" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: "easeOut" as const },
  }),
}

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
    <div className="min-h-[100dvh] bg-memo-bg px-4 md:px-8 pt-6 pb-10">
      <div className="w-full space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-4xl font-bold text-memo-text tracking-tight">Care Plan</h1>
          <p className="text-lg text-memo-text-secondary mt-1">
            {allRecs.length > 0
              ? `${allRecs.length} personalized tips for today`
              : "Loading your recommendations..."}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative max-w-lg"
        >
          <input
            type="text"
            placeholder="Search recommendations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-5 pr-5 bg-white rounded-2xl shadow-card text-memo-text placeholder:text-memo-text-tertiary focus:outline-none focus:ring-2 focus:ring-[#8B6F4E]/30 text-base"
          />
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? "bg-[#8B6F4E] text-white shadow-sm"
                  : "bg-white text-memo-text-secondary shadow-card hover:bg-memo-bg"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Severity Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {severities.map((sev) => (
            <button
              key={sev.key}
              onClick={() => setActiveSeverity(sev.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeSeverity === sev.key
                  ? "bg-[#8B6F4E] text-white shadow-sm"
                  : "bg-white text-memo-text-secondary shadow-card hover:bg-memo-bg"
              }`}
            >
              {sev.label}
            </button>
          ))}
        </motion.div>

        {/* Loading / Empty / Results */}
        {loading && !metrics ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-memo-text-tertiary">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-lg">Loading recommendations...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-memo-text-secondary text-lg">
              {allRecs.length === 0
                ? "No recommendations for today — you're doing great!"
                : "No recommendations match your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((rec, i) => (
              <motion.div
                key={rec.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
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
