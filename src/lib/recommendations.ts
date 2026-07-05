import type { Recommendation, DailyMetrics } from "@/types/oura"

export const recommendations: Recommendation[] = [
  // === SLEEP (8) ===
  {
    id: "sleep-low-score",
    category: "sleep",
    title: "Your sleep quality was below ideal",
    description: "Getting restful sleep is one of the most important things for brain health. Your sleep score was lower than the recommended 70+ range.",
    severity: "warning",
    condition: (m) => (m.sleep?.score ?? 100) < 70,
    actions: [
      "Go to bed 30 minutes earlier tonight",
      "Avoid screens for 1 hour before bed",
      "Keep your bedroom cool and dark",
    ],
    scienceNote: "Research shows that consistently poor sleep increases beta-amyloid buildup, a key factor in Alzheimer's progression.",
  },
  {
    id: "sleep-latency-high",
    category: "sleep",
    title: "It took a while to fall asleep",
    description: "Your sleep latency was over 20 minutes, which may indicate difficulty winding down.",
    severity: "info",
    condition: (m) => (m.sleep?.latency ?? 0) > 1200,
    actions: [
      "Try a 10-minute breathing exercise before bed",
      "Avoid caffeine after 2 PM",
      "Read a paper book to relax your mind",
    ],
    scienceNote: "Prolonged sleep latency is associated with hyperarousal, which can impair memory consolidation during sleep.",
  },
  {
    id: "sleep-short-duration",
    category: "sleep",
    title: "You didn't get enough sleep last night",
    description: "Adults should aim for 7-9 hours of sleep. Getting less can affect memory and cognitive function.",
    severity: "warning",
    condition: (m) => (m.sleep?.totalDuration ?? 28800) < 21600,
    actions: [
      "Plan for an earlier bedtime tonight",
      "Take a 20-minute nap if needed during the day",
      "Avoid alcohol, which fragments sleep",
    ],
    scienceNote: "Sleep deprivation of even 1-2 hours significantly impairs hippocampal function, critical for memory formation.",
  },
  {
    id: "sleep-efficiency-low",
    category: "sleep",
    title: "Your sleep was fragmented",
    description: "Sleep efficiency below 85% suggests you spent significant time awake in bed.",
    severity: "info",
    condition: (m) => (m.sleep?.efficiency ?? 100) < 85,
    actions: [
      "If awake for 20+ minutes, get up and read briefly",
      "Avoid looking at the clock during the night",
      "Limit fluids 2 hours before bed",
    ],
    scienceNote: "Sleep fragmentation reduces slow-wave sleep, the stage most important for clearing brain waste products.",
  },
  {
    id: "sleep-deep-low",
    category: "sleep",
    title: "Deep sleep was limited",
    description: "Deep sleep is when your brain clears toxins and consolidates memories. Your deep sleep was on the lower side.",
    severity: "info",
    condition: (m) => (m.sleep?.deepDuration ?? 7200) < 3600,
    actions: [
      "Exercise regularly (but not right before bed)",
      "Avoid late-night eating",
      "Consider magnesium-rich foods like nuts and seeds",
    ],
    scienceNote: "Deep (slow-wave) sleep is essential for glymphatic clearance of metabolic waste from the brain.",
  },
  {
    id: "sleep-good",
    category: "sleep",
    title: "Great sleep last night!",
    description: "Your sleep score was strong. Quality sleep supports memory and cognitive health.",
    severity: "info",
    condition: (m) => (m.sleep?.score ?? 0) >= 80,
    actions: [
      "Keep up your current bedtime routine",
      "Note what went well to replicate it",
    ],
    scienceNote: "Consistent high-quality sleep is associated with reduced cognitive decline and better memory retention.",
  },
  {
    id: "sleep-rem-low",
    category: "sleep",
    title: "REM sleep was below average",
    description: "REM sleep supports emotional regulation and memory processing. Yours was on the lower side.",
    severity: "info",
    condition: (m) => (m.sleep?.remDuration ?? 5400) < 3600,
    actions: [
      "Maintain a consistent sleep schedule",
      "Practice stress-reduction techniques",
      "Avoid alcohol, which suppresses REM sleep",
    ],
    scienceNote: "REM sleep plays a key role in processing emotional memories and supporting cognitive flexibility.",
  },
  {
    id: "sleep-temp-variation",
    category: "sleep",
    title: "Body temperature varied during sleep",
    description: "Temperature changes during sleep can affect sleep quality and recovery.",
    severity: "info",
    condition: (m) => Math.abs(m.readiness?.temperatureDeviation ?? 0) > 0.5,
    actions: [
      "Ensure your bedroom is between 60-67°F",
      "Use breathable bedding materials",
      "Avoid heavy meals close to bedtime",
    ],
    scienceNote: "Core body temperature regulation is closely tied to sleep architecture and circadian rhythm stability.",
  },

  // === EXERCISE (6) ===
  {
    id: "activity-low",
    category: "exercise",
    title: "Consider a gentle walk today",
    description: "Movement supports brain health. Your step count was below 3,000 today.",
    severity: "warning",
    condition: (m) => (m.activity?.steps ?? 5000) < 3000,
    actions: [
      "Take a 15-20 minute walk outside",
      "Do light stretching or chair yoga",
      "Walk while on phone calls",
    ],
    scienceNote: "Regular physical activity increases BDNF (brain-derived neurotrophic factor), which supports neuron growth and connectivity.",
  },
  {
    id: "activity-good",
    category: "exercise",
    title: "Great activity level today!",
    description: "You hit over 7,000 steps — excellent for brain and cardiovascular health.",
    severity: "info",
    condition: (m) => (m.activity?.steps ?? 0) >= 7000,
    actions: [
      "Keep up the momentum tomorrow",
      "Add variety: try stairs or a different route",
    ],
    scienceNote: "Studies show that adults who walk 7,000+ steps daily have significantly lower risk of cognitive decline.",
  },
  {
    id: "activity-moderate-vigorous",
    category: "exercise",
    title: "Excellent high-intensity activity!",
    description: "You got meaningful vigorous activity today, which is great for heart and brain health.",
    severity: "info",
    condition: (m) => (m.activity?.highIntensityMin ?? 0) >= 20,
    actions: [
      "Allow proper recovery time",
      "Stay hydrated",
      "Gradually increase intensity over time",
    ],
    scienceNote: "Moderate-to-vigorous physical activity is linked to increased hippocampal volume and improved executive function.",
  },
  {
    id: "activity-very-low",
    category: "exercise",
    title: "Very low movement detected",
    description: "Sedentary behavior is associated with faster cognitive decline. Try to add gentle movement.",
    severity: "critical",
    condition: (m) => (m.activity?.steps ?? 5000) < 1500,
    actions: [
      "Stand up and stretch every hour",
      "Walk to get water regularly",
      "Try seated exercises if mobility is limited",
    ],
    scienceNote: "Prolonged sedentary time is an independent risk factor for dementia, even in physically active individuals.",
  },
  {
    id: "activity-recovery-needed",
    category: "exercise",
    title: "Your body may need more recovery",
    description: "Your readiness score is low. Consider lighter activity today.",
    severity: "warning",
    condition: (m) => (m.readiness?.score ?? 80) < 60 && (m.activity?.steps ?? 0) > 5000,
    actions: [
      "Switch to gentle yoga or stretching",
      "Prioritize rest and good nutrition",
      "Go to bed early tonight",
    ],
    scienceNote: "Overtraining without adequate recovery can elevate cortisol, which may negatively impact memory function.",
  },
  {
    id: "activity-weekly-trend",
    category: "exercise",
    title: "Build a consistent movement habit",
    description: "Consistency matters more than intensity. Aim for daily gentle movement.",
    severity: "info",
    condition: () => true,
    actions: [
      "Schedule a daily walk at the same time",
      "Find a walking buddy for accountability",
      "Track your streak of active days",
    ],
    scienceNote: "Consistent moderate exercise over time shows stronger protective effects against dementia than sporadic intense activity.",
  },

  // === HEART HEALTH (5) ===
  {
    id: "hr-elevated",
    category: "heart",
    title: "Your resting heart rate is elevated",
    description: "An elevated resting HR can signal stress, poor recovery, or dehydration.",
    severity: "warning",
    condition: (m) => (m.heartRate?.resting ?? 60) > 80,
    actions: [
      "Practice deep breathing for 5 minutes",
      "Check hydration — drink water",
      "Consider an earlier bedtime tonight",
    ],
    scienceNote: "Elevated resting heart rate is associated with increased risk of cognitive decline and vascular dementia.",
  },
  {
    id: "hr-good",
    category: "heart",
    title: "Your heart rate looks healthy",
    description: "Your resting heart rate is in a healthy range — great for cardiovascular fitness.",
    severity: "info",
    condition: (m) => {
      const hr = m.heartRate?.resting
      return hr !== undefined && hr !== null && hr >= 50 && hr <= 70
    },
    actions: [
      "Maintain your current exercise routine",
      "Continue heart-healthy nutrition",
    ],
    scienceNote: "A lower resting heart rate typically indicates better cardiovascular fitness and autonomic nervous system health.",
  },
  {
    id: "hrv-low",
    category: "heart",
    title: "Your HRV balance is low",
    description: "Low heart rate variability suggests your body is under stress or needs recovery.",
    severity: "warning",
    condition: (m) => (m.readiness?.hrvBalance ?? 80) < 60,
    actions: [
      "Try a guided breathing exercise",
      "Reduce intense activities today",
      "Ensure adequate sleep tonight",
    ],
    scienceNote: "Low HRV is linked to chronic stress and inflammation, both of which are risk factors for cognitive decline.",
  },
  {
    id: "hrv-good",
    category: "heart",
    title: "Your HRV looks balanced",
    description: "Good heart rate variability indicates your nervous system is handling stress well.",
    severity: "info",
    condition: (m) => (m.readiness?.hrvBalance ?? 0) >= 80,
    actions: [
      "Great job managing stress",
      "Continue your current wellness habits",
    ],
    scienceNote: "Higher HRV is associated with better emotional regulation, decision-making, and cognitive flexibility.",
  },
  {
    id: "hr-exercise-elevated",
    category: "heart",
    title: "Post-exercise heart rate elevation",
    description: "Your heart rate remains elevated, suggesting incomplete recovery from recent activity.",
    severity: "info",
    condition: (m) => (m.heartRate?.resting ?? 60) > 75 && (m.activity?.highIntensityMin ?? 0) > 30,
    actions: [
      "Focus on active recovery: light walking",
      "Prioritize sleep quality tonight",
      "Consider contrast showers to aid recovery",
    ],
    scienceNote: "Heart rate recovery speed after exercise is a strong predictor of cardiovascular health and longevity.",
  },

  // === MENTAL HEALTH (7) ===
  {
    id: "stress-high",
    category: "mental",
    title: "High stress detected — try a breathing exercise",
    description: "Your stress levels were elevated. Chronic stress negatively impacts memory.",
    severity: "warning",
    condition: (m) => (m.stress?.stressHigh ?? 0) > 60,
    actions: [
      "Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s",
      "Take a 10-minute walk outside",
      "Listen to calming music",
    ],
    scienceNote: "Chronic stress elevates cortisol, which can shrink the hippocampus — the brain's memory center.",
  },
  {
    id: "stress-recovery-good",
    category: "mental",
    title: "Good stress recovery today",
    description: "Your body recovered well from stress — this supports both mental and physical health.",
    severity: "info",
    condition: (m) => (m.stress?.recoveryHigh ?? 0) > 50,
    actions: [
      "Notice what helped and replicate it",
      "Share your wellness wins with someone",
    ],
    scienceNote: "Effective stress recovery is associated with better emotional regulation and cognitive performance.",
  },
  {
    id: "resilience-low",
    category: "mental",
    title: "Your resilience score is low",
    description: "Resilience reflects how well you balance stress and recovery. Yours needs attention.",
    severity: "warning",
    condition: (m) => (m.resilience?.score ?? 80) < 60,
    actions: [
      "Schedule time for a relaxing activity",
      "Reach out to a friend or family member",
      "Practice gratitude: write down 3 good things",
    ],
    scienceNote: "Psychological resilience is protective against cognitive decline and supports overall brain health.",
  },
  {
    id: "resilience-good",
    category: "mental",
    title: "Strong resilience today!",
    description: "Your resilience score shows you're managing life's demands well.",
    severity: "info",
    condition: (m) => (m.resilience?.score ?? 0) >= 80,
    actions: [
      "Keep up your current balance of activity and rest",
      "Help someone else with their stress",
    ],
    scienceNote: "High resilience is correlated with larger prefrontal cortex volume and better cognitive aging.",
  },
  {
    id: "mental-mindfulness",
    category: "mental",
    title: "Consider a mindfulness practice",
    description: "Regular mindfulness supports memory and reduces stress-related brain changes.",
    severity: "info",
    condition: () => true,
    actions: [
      "Try a 5-minute guided meditation",
      "Practice mindful eating at your next meal",
      "Do a body scan before bed",
    ],
    scienceNote: "MRI studies show that regular mindfulness practice can increase gray matter density in the hippocampus.",
  },
  {
    id: "mental-cognitive-activity",
    category: "mental",
    title: "Keep your mind active today",
    description: "Cognitive stimulation helps build cognitive reserve against decline.",
    severity: "info",
    condition: () => true,
    actions: [
      "Do a crossword puzzle or Sudoku",
      "Learn something new: a word, fact, or skill",
      "Have an engaging conversation with someone",
    ],
    scienceNote: "Cognitive reserve built through lifelong learning can delay dementia symptom onset by years.",
  },
  {
    id: "stress-sleep-link",
    category: "mental",
    title: "Stress may be affecting your sleep",
    description: "Both stress and sleep scores were suboptimal — they often influence each other.",
    severity: "warning",
    condition: (m) =>
      (m.stress?.stressHigh ?? 0) > 50 && (m.sleep?.score ?? 80) < 70,
    actions: [
      "Start a wind-down routine 1 hour before bed",
      "Journal worries before bedtime to clear your mind",
      "Try progressive muscle relaxation",
    ],
    scienceNote: "Stress-sleep cycles can become self-reinforcing; breaking the cycle with relaxation techniques benefits both.",
  },

  // === SOCIAL (4) ===
  {
    id: "social-connection",
    category: "social",
    title: "Connect with someone today",
    description: "Social interaction is one of the strongest protectors against cognitive decline.",
    severity: "info",
    condition: () => true,
    actions: [
      "Call a friend or family member",
      "Have a meal with someone",
      "Join a group activity or club",
    ],
    scienceNote: "Social engagement is associated with a 70% reduction in cognitive decline compared to social isolation.",
  },
  {
    id: "social-weekend",
    category: "social",
    title: "Plan a social activity",
    description: "Weekends are a great time to strengthen social bonds that support brain health.",
    severity: "info",
    condition: () => {
      const day = new Date().getDay()
      return day === 0 || day === 6
    },
    actions: [
      "Meet a friend for coffee or a walk",
      "Plan a family video call",
      "Attend a community event",
    ],
    scienceNote: "Social activities combine cognitive, physical, and emotional engagement — a triple benefit for brain health.",
  },
  {
    id: "social-volunteer",
    category: "social",
    title: "Consider volunteering",
    description: "Helping others provides purpose and social connection, both protective for brain health.",
    severity: "info",
    condition: () => true,
    actions: [
      "Look for local volunteering opportunities",
      "Help a neighbor with an errand",
      "Mentor someone in a skill you have",
    ],
    scienceNote: "Volunteering combines social, physical, and cognitive engagement and is associated with delayed cognitive aging.",
  },
  {
    id: "social-isolation",
    category: "social",
    title: "Prioritize social connection this week",
    description: "If you've been spending a lot of time alone, make an effort to reach out.",
    severity: "warning",
    condition: () => true,
    actions: [
      "Schedule at least one social activity this week",
      "Reach out to someone you haven't spoken to recently",
      "Consider joining a group with shared interests",
    ],
    scienceNote: "Chronic social isolation is a major risk factor for dementia, comparable to smoking or physical inactivity.",
  },

  // === NUTRITION (5) ===
  {
    id: "nutrition-hydration",
    category: "nutrition",
    title: "Stay well hydrated today",
    description: "Even mild dehydration can affect mood, energy, and cognitive performance.",
    severity: "info",
    condition: () => true,
    actions: [
      "Drink a glass of water upon waking",
      "Keep a water bottle nearby throughout the day",
      "Include hydrating foods like cucumber and watermelon",
    ],
    scienceNote: "The brain is 75% water; even 1-2% dehydration can impair attention, memory, and motor skills.",
  },
  {
    id: "nutrition-mediterranean",
    category: "nutrition",
    title: "Include brain-healthy foods today",
    description: "The Mediterranean diet pattern is strongly linked to reduced dementia risk.",
    severity: "info",
    condition: () => true,
    actions: [
      "Add leafy greens to a meal",
      "Include fatty fish (salmon, sardines) this week",
      "Snack on nuts and berries",
    ],
    scienceNote: "The MIND diet (Mediterranean-DASH) is associated with a 53% reduction in Alzheimer's risk when followed closely.",
  },
  {
    id: "nutrition-blood-sugar",
    category: "nutrition",
    title: "Keep blood sugar stable",
    description: "Blood sugar spikes and crashes can affect mood, energy, and brain function.",
    severity: "info",
    condition: () => true,
    actions: [
      "Pair carbohydrates with protein or healthy fats",
      "Choose whole grains over refined carbs",
      "Avoid sugary drinks and snacks",
    ],
    scienceNote: "Chronic blood sugar dysregulation is linked to increased dementia risk, sometimes called 'Type 3 diabetes.'",
  },
  {
    id: "nutrition-omega3",
    category: "nutrition",
    title: "Get your omega-3s this week",
    description: "Omega-3 fatty acids, especially DHA, are essential building blocks for brain cells.",
    severity: "info",
    condition: () => true,
    actions: [
      "Eat fatty fish twice this week",
      "Add walnuts or flaxseed to meals",
      "Consider an algae-based omega-3 supplement",
    ],
    scienceNote: "DHA makes up 30% of the brain's structural fat. Low DHA is associated with accelerated brain aging.",
  },
  {
    id: "nutrition-alcohol",
    category: "nutrition",
    title: "Limit alcohol today",
    description: "Alcohol affects sleep quality and brain health. Even moderate amounts can impact cognition.",
    severity: "info",
    condition: (m) => (m.sleep?.remDuration ?? 0) > 0 && (m.sleep?.efficiency ?? 100) < 80,
    actions: [
      "Choose alcohol-free alternatives",
      "If drinking, limit to one serving",
      "Stop drinking 3+ hours before bed",
    ],
    scienceNote: "Even moderate alcohol consumption is now recognized as a risk factor for dementia and brain atrophy.",
  },

  // === MEDICAL (3) ===
  {
    id: "medical-spo2",
    category: "medical",
    title: "Blood oxygen was lower than optimal",
    description: "Your SpO2 reading was below 95%. This deserves attention.",
    severity: "critical",
    condition: (m) => (m.spo2?.average ?? 100) < 95,
    actions: [
      "Contact your healthcare provider",
      "Monitor for symptoms: shortness of breath, confusion",
      "Ensure good ventilation while sleeping",
    ],
    scienceNote: "Chronic low oxygen levels can impair cognitive function. Discuss persistent SpO2 below 95% with a doctor.",
  },
  {
    id: "medical-checkup",
    category: "medical",
    title: "Schedule a regular health checkup",
    description: "Regular monitoring of blood pressure, cholesterol, and blood sugar supports brain health.",
    severity: "info",
    condition: () => true,
    actions: [
      "Book an appointment with your primary care doctor",
      "Discuss cognitive health and any concerns",
      "Review medications that might affect cognition",
    ],
    scienceNote: "Managing cardiovascular risk factors (BP, cholesterol, diabetes) is one of the most effective ways to prevent dementia.",
  },
  {
    id: "medical-hearing",
    category: "medical",
    title: "Check your hearing if you haven't recently",
    description: "Hearing loss is a major modifiable risk factor for dementia.",
    severity: "info",
    condition: () => true,
    actions: [
      "Schedule a hearing test",
      "Use hearing aids if prescribed — they reduce dementia risk",
      "Minimize exposure to loud noises",
    ],
    scienceNote: "Hearing loss is the largest single modifiable risk factor for dementia, contributing to 8% of cases globally.",
  },
]

export function getRecommendationsForData(metrics: DailyMetrics): Recommendation[] {
  return recommendations.filter((r) => r.condition(metrics))
}

export function getRecommendationsByCategory(
  metrics: DailyMetrics,
  category: string
): Recommendation[] {
  return getRecommendationsForData(metrics).filter((r) => r.category === category)
}

export function getRecommendationsBySeverity(
  metrics: DailyMetrics,
  severity: string
): Recommendation[] {
  return getRecommendationsForData(metrics).filter((r) => r.severity === severity)
}
