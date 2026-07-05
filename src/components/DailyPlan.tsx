import { motion } from "framer-motion"
import {
  Sun,
  CloudSun,
  Moon,
  Heart,
  Activity,
  Brain,
  Droplets,
  Footprints,
  AlertTriangle,
  Wind,
  ShieldAlert,
  Sparkles,
  Music,
  Clock,
  Zap,
  Coffee,
  MoonStar,
} from "lucide-react"
import type { DailyMetrics } from "@/types/oura"

interface DailyPlanProps {
  metrics: DailyMetrics | null;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlanItem {
  text: string;
  icon: React.ElementType;
  severity: "info" | "warning" | "critical" | "positive";
}

interface PlanColumn {
  timeLabel: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  items: PlanItem[];
}

/* ------------------------------------------------------------------ */
/*  Severity helpers                                                   */
/* ------------------------------------------------------------------ */

const severityDot: Record<PlanItem["severity"], string> = {
  positive: "#22c55e",
  info: "#6B9BC4",
  warning: "#E8A838",
  critical: "#EF4444",
}

/* ------------------------------------------------------------------ */
/*  Plan builder -- every recommendation comes from ACTUAL Oura data   */
/* ------------------------------------------------------------------ */

function buildPlan(metrics: DailyMetrics | null): PlanColumn[] {
  /* -------- Fallback: no data at all -------- */
  if (!metrics) {
    return [
      {
        timeLabel: "Morning",
        icon: Sun,
        iconColor: "#C4A46B",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-100",
        items: [
          { text: "Check in gently about how they feel this morning", icon: Coffee, severity: "info" },
          { text: "Offer water and a healthy breakfast", icon: Droplets, severity: "info" },
          { text: "Review the day's schedule together", icon: Clock, severity: "info" },
        ],
      },
      {
        timeLabel: "Afternoon",
        icon: CloudSun,
        iconColor: "#6B9BC4",
        bgColor: "bg-sky-50",
        borderColor: "border-sky-100",
        items: [
          { text: "Encourage a short walk or light movement", icon: Footprints, severity: "info" },
          { text: "Engage in a calming activity: music, puzzles, or conversation", icon: Music, severity: "info" },
          { text: "Offer a healthy snack and water", icon: Droplets, severity: "info" },
        ],
      },
      {
        timeLabel: "Evening",
        icon: Moon,
        iconColor: "#9B8BB5",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-100",
        items: [
          { text: "Begin winding down with calming activities", icon: MoonStar, severity: "info" },
          { text: "Avoid screens and stimulating activities", icon: ShieldAlert, severity: "warning" },
          { text: "Ensure a comfortable, quiet sleep environment", icon: Sparkles, severity: "info" },
        ],
      },
    ]
  }

  /* ---------- Extract relevant metrics ---------- */
  const sleepScore = metrics.sleep?.score
  const sleepLatency = metrics.sleep?.latency        // contributor score 0-100
  const deepSleep = metrics.sleep?.deepSleep          // contributor score 0-100
  const remSleep = metrics.sleep?.remSleep            // contributor score 0-100

  const readinessScore = metrics.readiness?.score
  const restingHR = metrics.heartRate?.resting
  const hrvBalance = metrics.readiness?.hrvBalance

  const steps = metrics.activity?.steps
  const activityScore = metrics.activity?.score

  const spo2Avg = metrics.spo2?.average
  const breathingDisturbance = metrics.spo2?.breathingDisturbanceIndex

  const stressSummary = metrics.stress?.daySummary
  const stressRecovery = metrics.stress?.recoveryHigh

  const resilienceScore = metrics.resilience?.score

  /* ---------- MORNING ---------- */
  const morningItems: PlanItem[] = []

  /* Sleep score >= 80 -- good sleep */
  if (sleepScore != null && sleepScore >= 80) {
    morningItems.push({
      text: "They slept well last night — expect a calmer, more focused day",
      icon: Sparkles,
      severity: "positive",
    })
    morningItems.push({
      text: "Good day for cognitive activities like puzzles or reading",
      icon: Brain,
      severity: "positive",
    })
  }

  /* Sleep score < 65 -- poor sleep */
  if (sleepScore != null && sleepScore < 65) {
    morningItems.push({
      text: "Poor sleep detected — keep the morning calm and predictable",
      icon: ShieldAlert,
      severity: "warning",
    })
    morningItems.push({
      text: "Watch for increased confusion or irritability today",
      icon: AlertTriangle,
      severity: "warning",
    })
    if (morningItems.length < 3) {
      morningItems.push({
        text: "Avoid new environments or unfamiliar people",
        icon: ShieldAlert,
        severity: "warning",
      })
    }
  }

  /* Sleep between 65-79 -- moderate */
  if (sleepScore != null && sleepScore >= 65 && sleepScore < 80) {
    morningItems.push({
      text: "Moderate sleep — take it slow this morning",
      icon: Coffee,
      severity: "info",
    })
  }

  /* Low deep sleep contributor score */
  if (deepSleep != null && deepSleep < 45 && (sleepScore == null || sleepScore >= 65)) {
    morningItems.push({
      text: "Deep sleep was low — they may feel groggy; ease into the day",
      icon: Moon,
      severity: "info",
    })
  }

  /* Low REM sleep contributor score */
  if (remSleep != null && remSleep < 50 && (sleepScore == null || sleepScore >= 65)) {
    morningItems.push({
      text: "REM sleep was reduced — expect more emotional sensitivity",
      icon: Heart,
      severity: "info",
    })
  }

  /* Elevated resting HR */
  if (restingHR != null && restingHR > 80) {
    morningItems.push({
      text: "Resting heart rate is elevated — check for discomfort or anxiety",
      icon: Heart,
      severity: "warning",
    })
    if (morningItems.length < 3) {
      morningItems.push({
        text: "Keep activities gentle today",
        icon: Activity,
        severity: "warning",
      })
    }
  }

  /* Very elevated resting HR > 90 */
  if (restingHR != null && restingHR > 90) {
    morningItems.push({
      text: "Resting HR is very high — check for fever, pain, or dehydration",
      icon: ShieldAlert,
      severity: "critical",
    })
  }

  /* Low readiness */
  if (readinessScore != null && readinessScore < 60) {
    morningItems.push({
      text: "Recovery score is low — they may tire easily today",
      icon: Zap,
      severity: "warning",
    })
    if (morningItems.length < 3) {
      morningItems.push({
        text: "Plan for rest periods between activities",
        icon: Clock,
        severity: "info",
      })
    }
  }

  /* Good readiness + good heart */
  if (
    readinessScore != null && readinessScore >= 70 &&
    restingHR != null && restingHR <= 70 &&
    morningItems.length === 0
  ) {
    morningItems.push({
      text: "Great recovery overnight — they are ready for the day",
      icon: Sparkles,
      severity: "positive",
    })
  }

  /* SpO2 critical */
  if (spo2Avg != null && spo2Avg < 92) {
    morningItems.push({
      text: "⚠️ Blood oxygen critically low — consider contacting their doctor",
      icon: ShieldAlert,
      severity: "critical",
    })
  } else if (spo2Avg != null && spo2Avg < 95) {
    morningItems.push({
      text: "⚠️ Blood oxygen below 95% — monitor breathing and energy closely",
      icon: AlertTriangle,
      severity: "warning",
    })
  }

  /* Breathing disturbances */
  if (breathingDisturbance != null && breathingDisturbance > 15) {
    morningItems.push({
      text: "Frequent breathing disturbances overnight — discuss with their physician",
      icon: Wind,
      severity: "warning",
    })
  }

  /* Fill with data-informed generics if needed */
  if (morningItems.length < 2) {
    if (sleepScore == null) {
      morningItems.push({ text: "Check in gently about how they feel this morning", icon: Coffee, severity: "info" })
    }
    if (morningItems.length < 2) {
      morningItems.push({ text: "Offer water and a nutritious breakfast", icon: Droplets, severity: "info" })
    }
  }

  /* ---------- AFTERNOON ---------- */
  const afternoonItems: PlanItem[] = []

  /* Low steps yesterday */
  if (steps != null && steps < 3000) {
    afternoonItems.push({
      text: "Low movement yesterday — encourage gentle activity today",
      icon: Footprints,
      severity: "warning",
    })
    afternoonItems.push({
      text: "Even 10 minutes of walking helps circulation and mood",
      icon: Activity,
      severity: "info",
    })
  }

  /* Good steps */
  if (steps != null && steps >= 5000 && activityScore != null && activityScore >= 70) {
    afternoonItems.push({
      text: "Great activity level — keep the momentum going!",
      icon: Sparkles,
      severity: "positive",
    })
  }

  /* High stress */
  if (stressSummary != null && stressSummary > 60) {
    afternoonItems.push({
      text: "High overnight stress — create a calm, quiet environment",
      icon: ShieldAlert,
      severity: "warning",
    })
    afternoonItems.push({
      text: "Consider calming music or a gentle walk",
      icon: Music,
      severity: "info",
    })
  }

  /* Extreme stress */
  if (stressSummary != null && stressSummary > 85) {
    afternoonItems.push({
      text: "Severe stress detected — rule out pain, infection, or medication issues",
      icon: ShieldAlert,
      severity: "critical",
    })
  }

  /* Low stress recovery */
  if (stressRecovery != null && stressRecovery < 60 * 60 && (stressSummary == null || stressSummary <= 60)) {
    afternoonItems.push({
      text: "Limited recovery time overnight — build in rest periods today",
      icon: Clock,
      severity: "info",
    })
  }

  /* Good stress state */
  if (
    stressSummary != null && stressSummary < 50 &&
    stressRecovery != null && stressRecovery >= 2 * 3600 &&
    afternoonItems.length === 0
  ) {
    afternoonItems.push({
      text: "Low stress, good recovery — a great afternoon for social visits",
      icon: Sparkles,
      severity: "positive",
    })
  }

  /* Low readiness carries into afternoon */
  if (readinessScore != null && readinessScore < 60 && afternoonItems.length < 2) {
    afternoonItems.push({
      text: "Recovery is low — keep activities light and restorative",
      icon: Zap,
      severity: "warning",
    })
  }

  /* Resilience context */
  if (resilienceScore != null && resilienceScore < 50 && afternoonItems.length < 3) {
    afternoonItems.push({
      text: "Resilience is low — avoid overwhelming situations",
      icon: ShieldAlert,
      severity: "warning",
    })
  }

  /* Fill if needed */
  if (afternoonItems.length < 2) {
    if (steps == null) {
      afternoonItems.push({ text: "Encourage light movement or stretching", icon: Footprints, severity: "info" })
    }
    if (afternoonItems.length < 2) {
      afternoonItems.push({ text: "Engage in a calming activity: music, puzzles, or conversation", icon: Music, severity: "info" })
    }
  }

  /* ---------- EVENING ---------- */
  const eveningItems: PlanItem[] = []

  /* Elevated resting HR */
  if (restingHR != null && restingHR > 80) {
    eveningItems.push({
      text: "Resting heart rate is elevated — prioritize a calm, early evening",
      icon: Heart,
      severity: "warning",
    })
  }

  /* Healthy heart */
  if (restingHR != null && restingHR <= 70 && eveningItems.length === 0) {
    eveningItems.push({
      text: "Heart rate looks healthy — maintain the calming routine",
      icon: Heart,
      severity: "positive",
    })
  }

  /* Low HRV */
  if (hrvBalance != null && hrvBalance < 60) {
    eveningItems.push({
      text: "Low HRV — their nervous system needs extra rest tonight",
      icon: Wind,
      severity: "warning",
    })
    eveningItems.push({
      text: "Try guided breathing together: slow inhales and exhales for 5 minutes",
      icon: Activity,
      severity: "info",
    })
  }

  /* Poor sleep last night = early wind-down */
  if (sleepScore != null && sleepScore < 65) {
    eveningItems.push({
      text: "Last night's sleep was poor — aim for an earlier bedtime tonight",
      icon: Moon,
      severity: "warning",
    })
    eveningItems.push({
      text: "Start wind-down routine 1 hour before bed",
      icon: Clock,
      severity: "info",
    })
  } else if (sleepScore != null && sleepScore < 75) {
    eveningItems.push({
      text: "Start wind-down routine a bit earlier tonight",
      icon: MoonStar,
      severity: "info",
    })
  }

  /* Sleep latency contributor score low = took long to fall asleep */
  if (sleepLatency != null && sleepLatency < 40 && (sleepScore == null || sleepScore >= 65)) {
    eveningItems.push({
      text: "They took a while to fall asleep — dim lights 1–2 hours before bed",
      icon: MoonStar,
      severity: "info",
    })
  }

  /* Low deep sleep contributor score = warm bath suggestion */
  if (deepSleep != null && deepSleep < 50 && eveningItems.length < 3) {
    eveningItems.push({
      text: "A warm bath 90 minutes before bed may help deepen sleep tonight",
      icon: Droplets,
      severity: "info",
    })
  }

  /* Sundowning risk */
  if (
    (sleepScore != null && sleepScore < 65) ||
    (stressSummary != null && stressSummary > 65)
  ) {
    eveningItems.push({
      text: "Watch for sundowning signs — turn on lights before dusk",
      icon: AlertTriangle,
      severity: "warning",
    })
  }

  /* Fill if needed */
  if (eveningItems.length < 2) {
    eveningItems.push({ text: "Begin winding down 30 minutes before bedtime", icon: MoonStar, severity: "info" })
  }
  if (eveningItems.length < 2) {
    eveningItems.push({ text: "Ensure the bedroom is cool, dark, and quiet", icon: Sparkles, severity: "info" })
  }

  /* ---------- Limit to 3 per column ---------- */
  return [
    {
      timeLabel: "Morning",
      icon: Sun,
      iconColor: "#C4A46B",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      items: morningItems.slice(0, 3),
    },
    {
      timeLabel: "Afternoon",
      icon: CloudSun,
      iconColor: "#6B9BC4",
      bgColor: "bg-sky-50",
      borderColor: "border-sky-100",
      items: afternoonItems.slice(0, 3),
    },
    {
      timeLabel: "Evening",
      icon: Moon,
      iconColor: "#9B8BB5",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      items: eveningItems.slice(0, 3),
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DailyPlan({ metrics }: DailyPlanProps) {
  const columns = buildPlan(metrics)

  const hasData = metrics != null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="bg-white rounded-2xl shadow-card p-5 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-memo-text">Today&apos;s Care Plan</h2>
        {hasData && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Based on overnight Oura data
          </span>
        )}
        {!hasData && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            General guidance
          </span>
        )}
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((col, colIdx) => {
          const Icon = col.icon
          return (
            <motion.div
              key={col.timeLabel}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 + colIdx * 0.08 }}
              className={`rounded-xl border ${col.borderColor} ${col.bgColor} p-4 space-y-3`}
            >
              {/* Column header */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Icon className="w-5 h-5" style={{ color: col.iconColor }} />
                </div>
                <h3 className="text-base font-semibold text-memo-text">{col.timeLabel}</h3>
              </div>

              {/* Items */}
              <ul className="space-y-3">
                {col.items.map((item, i) => {
                  const ItemIcon = item.icon
                  return (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.3 + colIdx * 0.08 + i * 0.06 }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: severityDot[item.severity] }}
                      />
                      <div className="flex items-start gap-2">
                        <ItemIcon
                          className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-60"
                          style={{ color: severityDot[item.severity] }}
                        />
                        <span className="text-sm text-memo-text-secondary leading-relaxed">
                          {item.text}
                        </span>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            </motion.div>
          )
        })}
      </div>

      {/* Footer note */}
      {hasData && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-xs text-memo-text-secondary/70 text-center"
        >
          Recommendations are generated from real Oura Ring biometric data.
          Always consult a healthcare professional for medical concerns.
        </motion.p>
      )}
    </motion.div>
  )
}
