import { motion } from "framer-motion"
import { Sun, CloudSun, Moon } from "lucide-react"
import type { DailyMetrics } from "@/types/oura"
import { getRecommendationsForData } from "@/lib/recommendations"

interface DailyPlanProps {
  metrics: DailyMetrics | null;
}

interface PlanSection {
  timeLabel: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  tasks: string[];
}

function buildPlan(metrics: DailyMetrics | null): PlanSection[] {
  if (!metrics) {
    return [
      {
        timeLabel: "Morning",
        icon: Sun,
        iconColor: "#C4A46B",
        bgColor: "bg-amber-50",
        tasks: [
          "Help with morning routine: gentle wake-up, check how they slept",
          "Offer water and a healthy breakfast",
          "Review any appointments or activities for the day",
        ],
      },
      {
        timeLabel: "Afternoon",
        icon: CloudSun,
        iconColor: "#6B9BC4",
        bgColor: "bg-sky-50",
        tasks: [
          "Encourage a short walk or light movement",
          "Engage in a calming activity: music, puzzles, or conversation",
          "Offer a healthy snack and water",
        ],
      },
      {
        timeLabel: "Evening",
        icon: Moon,
        iconColor: "#9B8BB5",
        bgColor: "bg-purple-50",
        tasks: [
          "Begin winding down with calming activities",
          "Avoid screens and stimulating activities",
          "Ensure a comfortable, quiet sleep environment",
        ],
      },
    ]
  }

  const allRecs = getRecommendationsForData(metrics)

  // Derive morning tasks from sleep data
  const morningTasks: string[] = []
  const sleepScore = metrics.sleep?.score
  const sleepEfficiency = metrics.sleep?.efficiency
  const sleepDuration = metrics.sleep?.totalDuration

  if (sleepScore != null && sleepScore < 70) {
    morningTasks.push("They slept poorly — be patient, allow extra rest time")
    morningTasks.push("Offer a calming morning routine without rushing")
  } else if (sleepScore != null && sleepScore >= 80) {
    morningTasks.push("They slept well — a great day for activities!")
  } else {
    morningTasks.push("Check in gently about how they feel this morning")
  }

  if (sleepEfficiency != null && sleepEfficiency < 85) {
    morningTasks.push("Sleep was fragmented — watch for fatigue or irritability")
  }

  if (sleepDuration != null && sleepDuration < 21600) {
    morningTasks.push("Short sleep night — allow for a restful break or nap today")
  }

  if (metrics.readiness?.temperatureDeviation && Math.abs(metrics.readiness.temperatureDeviation) > 0.5) {
    morningTasks.push("Body temperature varied — check if they feel unwell")
  }

  // Fill with defaults if we don't have enough
  while (morningTasks.length < 2) {
    morningTasks.push("Offer water and a nutritious breakfast")
    if (morningTasks.length < 2) morningTasks.push("Review the day's schedule together")
  }

  // Derive afternoon tasks from activity and stress data
  const afternoonTasks: string[] = []
  const steps = metrics.activity?.steps
  const stressHigh = metrics.stress?.stressHigh
  const readinessScore = metrics.readiness?.score

  if (steps != null && steps < 3000) {
    afternoonTasks.push("Encourage a gentle 15-minute walk outside")
  } else if (steps != null && steps >= 7000) {
    afternoonTasks.push("Great activity level — keep the momentum going!")
  } else {
    afternoonTasks.push("Suggest light movement or stretching")
  }

  if (stressHigh != null && stressHigh > 60) {
    afternoonTasks.push("Stress levels were high — try calming music or breathing exercises")
  } else if (stressHigh != null && stressHigh < 30) {
    afternoonTasks.push("Low stress day — good time for social engagement")
  }

  if (readinessScore != null && readinessScore < 60) {
    afternoonTasks.push("Low readiness score — keep activities light and restorative")
  }

  // Fill with defaults
  while (afternoonTasks.length < 2) {
    afternoonTasks.push("Engage in a meaningful activity: music, conversation, or a hobby")
    if (afternoonTasks.length < 2) afternoonTasks.push("Offer a healthy snack and water")
  }

  // Derive evening tasks from readiness and heart rate data
  const eveningTasks: string[] = []
  const restingHR = metrics.heartRate?.resting
  const hrvBalance = metrics.readiness?.hrvBalance
  const sleepScoreForEvening = metrics.sleep?.score

  if (restingHR != null && restingHR > 80) {
    eveningTasks.push("Resting heart rate is elevated — prioritize a calm, early evening")
  } else if (restingHR != null && restingHR <= 70) {
    eveningTasks.push("Heart rate looks healthy — maintain the calming routine")
  }

  if (hrvBalance != null && hrvBalance < 60) {
    eveningTasks.push("Low HRV suggests they need extra rest — keep the evening quiet")
  }

  if (sleepScoreForEvening != null && sleepScoreForEvening < 70) {
    eveningTasks.push("Last night's sleep was poor — aim for an earlier bedtime tonight")
    eveningTasks.push("Start wind-down routine 1 hour before bed")
  } else {
    eveningTasks.push("Begin winding down 30 minutes before bedtime")
  }

  eveningTasks.push("Ensure the bedroom is cool, dark, and quiet")

  // Fill with defaults
  while (eveningTasks.length < 2) {
    eveningTasks.push("Avoid screens and stimulating activities in the evening")
    if (eveningTasks.length < 2) eveningTasks.push("Offer a warm, caffeine-free drink before bed")
  }

  // Also pull specific recommendation actions
  const sleepRecs = allRecs.filter((r) => r.category === "morning" || r.category === "evening").slice(0, 2)
  const exerciseRecs = allRecs.filter((r) => r.category === "activities").slice(0, 2)
  const heartRecs = allRecs.filter((r) => r.category === "medical" || r.category === "safety").slice(0, 2)

  // Merge recommendation actions into sections
  sleepRecs.forEach((r) => {
    if (r.actions[0] && !morningTasks.includes(r.actions[0])) {
      morningTasks.push(r.actions[0])
    }
  })
  exerciseRecs.forEach((r) => {
    if (r.actions[0] && !afternoonTasks.includes(r.actions[0])) {
      afternoonTasks.push(r.actions[0])
    }
  })
  heartRecs.forEach((r) => {
    if (r.actions[0] && !eveningTasks.includes(r.actions[0])) {
      eveningTasks.push(r.actions[0])
    }
  })

  // Limit to 3 tasks each
  return [
    {
      timeLabel: "Morning",
      icon: Sun,
      iconColor: "#C4A46B",
      bgColor: "bg-amber-50",
      tasks: morningTasks.slice(0, 3),
    },
    {
      timeLabel: "Afternoon",
      icon: CloudSun,
      iconColor: "#6B9BC4",
      bgColor: "bg-sky-50",
      tasks: afternoonTasks.slice(0, 3),
    },
    {
      timeLabel: "Evening",
      icon: Moon,
      iconColor: "#9B8BB5",
      bgColor: "bg-purple-50",
      tasks: eveningTasks.slice(0, 3),
    },
  ]
}

export default function DailyPlan({ metrics }: DailyPlanProps) {
  const sections = buildPlan(metrics)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="bg-white rounded-2xl shadow-card p-5 md:p-6"
    >
      <h2 className="text-xl font-semibold text-memo-text mb-4">Today&apos;s Care Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.timeLabel} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl ${section.bgColor} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" style={{ color: section.iconColor }} />
                </div>
                <h3 className="text-lg font-semibold text-memo-text">{section.timeLabel}</h3>
              </div>
              <ul className="space-y-2 pl-1">
                {section.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-memo-text-secondary leading-relaxed">
                    <span
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: section.iconColor }}
                    />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
