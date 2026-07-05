import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Moon, HeartPulse, Footprints, Gauge, Droplets, Wind, Shield, RefreshCw } from "lucide-react"
import { useData } from "@/context/DataContext"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { fetchWeeklyData, fetchMonthlyData } from "@/lib/ouraApi"
import type { DailyMetrics } from "@/types/oura"

const chartConfigs = [
  {
    key: "sleep",
    label: "Sleep Score",
    icon: Moon,
    color: "#7B9EA8",
    accessor: (m: DailyMetrics) => m.sleep?.score ?? 0,
  },
  {
    key: "readiness",
    label: "Readiness Score",
    icon: Gauge,
    color: "#9B8BB5",
    accessor: (m: DailyMetrics) => m.readiness?.score ?? 0,
  },
  {
    key: "activity",
    label: "Steps",
    icon: Footprints,
    color: "#7BA87B",
    accessor: (m: DailyMetrics) => m.activity?.steps ?? 0,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "heartRate",
    label: "Resting Heart Rate",
    icon: HeartPulse,
    color: "#C4706B",
    accessor: (m: DailyMetrics) => m.heartRate?.resting ?? 0,
  },
  {
    key: "spo2",
    label: "SpO2 Average",
    icon: Droplets,
    color: "#6BA8C4",
    accessor: (m: DailyMetrics) => m.spo2?.average ?? 0,
  },
  {
    key: "stress",
    label: "Stress Level",
    icon: Wind,
    color: "#C4A46B",
    accessor: (m: DailyMetrics) => m.stress?.stressHigh ?? 0,
  },
  {
    key: "resilience",
    label: "Resilience Score",
    icon: Shield,
    color: "#8BB5A0",
    accessor: (m: DailyMetrics) => m.resilience?.score ?? 0,
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: "easeOut" as const },
  }),
}

export default function Trends() {
  const { token, selectedDate } = useData()
  const [range, setRange] = useState<7 | 30>(7)
  const [trendData, setTrendData] = useState<DailyMetrics[] | null>(null)
  const [loading, setLoading] = useState(true)

  useState(() => {
    if (!token) return
    setLoading(true)
    const fetcher = range === 7 ? fetchWeeklyData : fetchMonthlyData
    fetcher(token.accessToken, selectedDate)
      .then(setTrendData)
      .catch(console.error)
      .finally(() => setLoading(false))
  })

  // Fetch data on mount and when range/date changes
  useMemo(() => {
    if (!token) return
    setLoading(true)
    const fetcher = range === 7 ? fetchWeeklyData : fetchMonthlyData
    fetcher(token.accessToken, selectedDate)
      .then(setTrendData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [range, selectedDate, token])

  const chartData = useMemo(() => {
    if (!trendData) return []
    return trendData.map((m: any) => {
      const entry: Record<string, any> = { date: m.date ? m.date.slice(5) : "" }
      chartConfigs.forEach((c) => {
        entry[c.key] = c.accessor(m)
      })
      return entry
    })
  }, [trendData])

  const averages = useMemo(() => {
    if (!trendData || trendData.length === 0) return null
    const avg = (key: string) => {
      const vals = chartData.map((d) => d[key]).filter((v) => v > 0)
      if (vals.length === 0) return "--"
      const sum = vals.reduce((a, b) => a + b, 0)
      const avg = sum / vals.length
      return Number.isInteger(avg) ? avg.toString() : avg.toFixed(1)
    }
    return {
      sleep: avg("sleep"),
      readiness: avg("readiness"),
      steps: avg("activity"),
      heartRate: avg("heartRate"),
      stress: avg("stress"),
      resilience: avg("resilience"),
    }
  }, [chartData, trendData])

  return (
    <div className="min-h-[100dvh] bg-memo-bg px-4 md:px-8 pt-6 pb-10">
      <div className="w-full space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-4xl font-bold text-memo-text tracking-tight">Trends</h1>
          <p className="text-lg text-memo-text-secondary mt-1">See how your metrics change over time</p>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex bg-white rounded-2xl p-1.5 shadow-card max-w-sm"
        >
          {[
            { value: 7 as const, label: "This Week" },
            { value: 30 as const, label: "This Month" },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                range === r.value ? "bg-[#8B6F4E] text-white shadow-sm" : "text-memo-text-secondary hover:bg-memo-bg"
              }`}
            >
              {r.label}
            </button>
          ))}
        </motion.div>

        {/* Averages Summary */}
        {averages && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-card p-5"
          >
            <h2 className="text-sm font-semibold text-memo-text-secondary uppercase tracking-wider mb-4">
              Averages
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {[
                { label: "Sleep", value: averages.sleep, color: "#7B9EA8" },
                { label: "Readiness", value: averages.readiness, color: "#9B8BB5" },
                { label: "Steps", value: Number(averages.steps).toLocaleString(), color: "#7BA87B" },
                { label: "Resting HR", value: averages.heartRate, color: "#C4706B" },
                { label: "Stress", value: `${averages.stress}%`, color: "#C4A46B" },
                { label: "Resilience", value: averages.resilience, color: "#8BB5A0" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-memo-text-tertiary uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-xl font-semibold text-memo-text" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading or Charts */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-memo-text-tertiary">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-lg">Loading trends...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {chartConfigs.map((cfg, i) => {
              const Icon = cfg.icon
              const data = chartData.filter((d) => d[cfg.key] > 0)
              const isBar = cfg.key === "activity"
              const ChartComponent = isBar ? BarChart : AreaChart
              const DataComponent = isBar ? (
                <Bar dataKey={cfg.key} fill={cfg.color} radius={[4, 4, 0, 0]} />
              ) : (
                <Area
                  type="monotone"
                  dataKey={cfg.key}
                  stroke={cfg.color}
                  fill={cfg.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )

              return (
                <motion.div
                  key={cfg.key}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="bg-white rounded-2xl shadow-card p-5"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    <h3 className="text-base font-semibold text-memo-text">{cfg.label}</h3>
                  </div>
                  <div className="h-[200px]">
                    {data.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ChartComponent data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: "#9B9590" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis hide domain={["auto", "auto"]} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: "none",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              fontSize: 13,
                            }}
                            formatter={(value: number) =>
                              cfg.format ? [cfg.format(value), cfg.label] : [value, cfg.label]
                            }
                          />
                          {DataComponent}
                        </ChartComponent>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-memo-text-tertiary">
                        No data available
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
