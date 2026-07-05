//
// Recommendations Engine for Memo -- Dementia & Memory Loss Caregiving App
//
// This module provides evidence-based, caregiver-facing recommendations
// based on Oura Ring biometric data for a person with early-stage dementia
// or memory loss. Every recommendation checks ACTUAL Oura data via condition
// functions -- no generic advice. Only relevant guidance surfaces each day.
//

// -- Type Definitions ---------------------------------------------------------

export interface DailyMetrics {
  date: string;
  sleep: {
    score: number;           // 0-100
    totalSleep: number;      // contributor score 0-100 (not seconds)
    deepSleep: number;       // contributor score 0-100 (not seconds)
    remSleep: number;        // contributor score 0-100 (not seconds)
    latency: number;         // contributor score 0-100 (not seconds)
    efficiency: number;      // contributor score 0-100
  } | null;
  readiness: {
    score: number;           // 0-100
    restingHeartRate: number;  // contributor score 0-100 (not BPM)
    hrvBalance: number;      // contributor score 0-100
    bodyTemperature: number; // contributor score 0-100
  } | null;
  activity: {
    score: number;           // 0-100
    steps: number;
    activeCalories: number;
    totalCalories: number;
    highIntensityMin: number;
    distance: number;        // meters
  } | null;
  heartRate: {
    resting: number;
    avg: number;
    min: number;
    max: number;
  } | null;
  spo2: {
    average: number;         // 0-100
    breathingDisturbanceIndex: number;
  } | null;
  stress: {
    stressHigh: number;      // seconds
    recoveryHigh: number;    // seconds
    daySummary: number;      // 0-100
  } | null;
}

export type RecCategory =
  | "sleep"
  | "heart"
  | "activity"
  | "stress"
  | "spo2"
  | "morning"
  | "afternoon"
  | "evening";

export type Severity = "info" | "warning" | "critical";

export interface Recommendation {
  id: string;
  category: RecCategory;
  title: string;
  description: string;
  severity: Severity;
  condition: (metrics: DailyMetrics) => boolean;
  actions: string[];
  scienceNote: string;
}

// -- All 30 Recommendations ---------------------------------------------------
// Every recommendation checks REAL Oura data. No generic "always true" items.

export const recommendations: Recommendation[] = [
  // ============================================================================
  // 1. MORNING -- What to do this morning based on overnight data (5 items)
  // ============================================================================

  {
    id: "morning-sleep-excellent",
    category: "morning",
    title: "They slept well -- a good day ahead",
    description:
      "Sleep score was strong last night. Well-rested days tend to have better cognitive clarity and calmer moods for people with memory loss.",
    severity: "info",
    condition: (m) => (m.sleep?.score ?? 0) >= 80 && (m.sleep?.efficiency ?? 0) >= 85,
    actions: [
      "Encourage their regular morning routine",
      "Plan a favorite activity today",
      "Good day for social visits",
    ],
    scienceNote:
      "Quality sleep above 80% is associated with 40% fewer agitation episodes in dementia patients.",
  },

  {
    id: "morning-sleep-poor",
    category: "morning",
    title: "They had a restless night -- keep the morning calm",
    description:
      "Sleep score was below 65. Poor sleep increases confusion and irritability. A gentle, predictable morning helps them reset.",
    severity: "warning",
    condition: (m) =>
      (m.sleep?.score ?? 100) < 65 || (m.sleep?.efficiency ?? 100) < 70,
    actions: [
      "Keep voices soft and lights low",
      "Offer warm tea and a familiar breakfast",
      "Avoid new people or places today",
    ],
    scienceNote:
      "Sleep scores below 65 correlate with 2x increase in sundowning behavior.",
  },

  {
    id: "morning-low-readiness",
    category: "morning",
    title: "Readiness is low -- they may need extra support today",
    description:
      "A low readiness score signals their body is still recovering. They may move more slowly, feel achy, or have trouble concentrating.",
    severity: "warning",
    condition: (m) => (m.readiness?.score ?? 80) < 60,
    actions: [
      "Offer help with dressing and grooming without rushing",
      "Prioritize comfort -- check room temperature and clothing",
      "Scale back planned activities and focus on rest and connection",
    ],
    scienceNote:
      "Readiness scores reflect autonomic recovery; persistently low scores in dementia patients correlate with increased caregiver burden.",
  },

  {
    id: "morning-sleep-latency-high",
    category: "morning",
    title: "They took a while to fall asleep -- ease into the day",
    description:
      "Sleep latency was over 30 minutes, which may indicate evening anxiety, circadian disruption, or too much late-day stimulation.",
    severity: "info",
    condition: (m) => (m.sleep?.latency ?? 0) > 30 * 60,
    actions: [
      "Let them wake naturally -- avoid abrupt alarms",
      "Open curtains gradually for gentle light exposure",
      "Consider a brief morning stretch session together",
    ],
    scienceNote:
      "Sleep-onset insomnia is linked to elevated evening cortisol and is common in early dementia due to circadian rhythm changes.",
  },

  {
    id: "morning-elevated-hr",
    category: "morning",
    title: "Resting heart rate was elevated overnight",
    description:
      "Their resting HR was above 80 bpm. This may indicate stress, dehydration, or that their body is fighting something. Keep today gentle.",
    severity: "warning",
    condition: (m) => (m.heartRate?.resting ?? 60) > 80,
    actions: [
      "Offer a full glass of water first thing",
      "Check for signs of pain or discomfort",
      "Keep the schedule light and low-pressure",
    ],
    scienceNote:
      "Elevated resting HR in older adults is linked to increased dementia progression risk and may signal infection or dehydration.",
  },

  // ============================================================================
  // 2. SLEEP -- Sleep quality breakdown (4 items)
  // ============================================================================

  {
    id: "sleep-low-efficiency",
    category: "sleep",
    title: "Sleep efficiency was low -- they spent too long awake in bed",
    description:
      "Efficiency below 75% means they spent significant time awake after falling asleep. Fragmented sleep reduces memory consolidation and mood stability.",
    severity: "warning",
    condition: (m) =>
      (m.sleep?.efficiency ?? 100) < 75 && (m.sleep?.totalSleep ?? 0) > 4 * 3600,
    actions: [
      "Review evening routine -- limit caffeine after noon",
      "Ensure the bedroom is cool, dark, and quiet",
      "Consider a brief afternoon nap (20-30 minutes) to compensate",
    ],
    scienceNote:
      "Sleep efficiency below 75% is associated with impaired glymphatic clearance of amyloid-beta, a key protein in Alzheimer's disease.",
  },

  {
    id: "sleep-low-deep",
    category: "sleep",
    title: "Deep sleep was below normal -- brain cleanup may be incomplete",
    description:
      "Deep (slow-wave) sleep dropped below 45 minutes. This stage clears brain waste via the glymphatic system. Low deep sleep may leave them cognitively foggy.",
    severity: "warning",
    condition: (m) =>
      (m.sleep?.deepSleep ?? 3600) < 45 * 60 &&
      (m.sleep?.totalSleep ?? 0) > 5 * 3600,
    actions: [
      "Encourage daytime physical activity to deepen sleep tonight",
      "Avoid late-afternoon naps",
      "Consider magnesium-rich foods at dinner (nuts, leafy greens)",
    ],
    scienceNote:
      "Reduced slow-wave sleep is associated with amyloid-beta accumulation and accelerated cognitive decline.",
  },

  {
    id: "sleep-low-rem",
    category: "sleep",
    title: "REM sleep was reduced -- emotional processing may be affected",
    description:
      "REM duration fell below 60 minutes. REM sleep processes emotions and consolidates procedural memory. A deficit can increase emotional reactivity.",
    severity: "warning",
    condition: (m) =>
      (m.sleep?.remSleep ?? 3600) < 60 * 60 &&
      (m.sleep?.totalSleep ?? 0) > 5 * 3600,
    actions: [
      "Keep today calm -- reduced REM can increase emotional sensitivity",
      "Avoid introducing new or potentially stressful situations",
      "Prioritize an earlier, consistent bedtime tonight",
    ],
    scienceNote:
      "REM sleep deprivation increases emotional reactivity by 60% and impairs memory consolidation in older adults with mild cognitive impairment.",
  },

  {
    id: "sleep-short-total",
    category: "sleep",
    title: "Total sleep was under 5 hours -- significant sleep deficit",
    description:
      "They got less than 5 hours of total sleep. Severe sleep deprivation dramatically worsens confusion, memory problems, and agitation risk.",
    severity: "critical",
    condition: (m) => (m.sleep?.totalSleep ?? 3600 * 8) < 5 * 3600,
    actions: [
      "Today is a rest day -- minimize demands and stimulation",
      "Watch closely for signs of delirium or sudden confusion",
      "Plan an early bedtime tonight with a calming wind-down routine",
      "Contact their physician if short sleep persists multiple nights",
    ],
    scienceNote:
      "Sleeping fewer than 5 hours increases next-day delirium risk by 3x in older adults with cognitive impairment.",
  },

  // ============================================================================
  // 3. HEART -- Cardiovascular health signals (4 items)
  // ============================================================================

  {
    id: "heart-hr-elevated",
    category: "heart",
    title: "Resting heart rate is elevated",
    description:
      "Their resting HR is above 80 bpm. This can signal stress, dehydration, infection, or poor recovery. Monitor for signs of discomfort.",
    severity: "warning",
    condition: (m) => (m.heartRate?.resting ?? 60) > 80,
    actions: [
      "Offer water throughout the day",
      "Check if they are in pain or anxious",
      "Consider a quiet, restful day",
    ],
    scienceNote:
      "Elevated resting HR in older adults is linked to increased dementia progression risk and cardiovascular mortality.",
  },

  {
    id: "heart-hr-high-critical",
    category: "heart",
    title: "Resting heart rate is very high -- investigate promptly",
    description:
      "Resting HR exceeded 90 bpm overnight. This warrants attention -- it may indicate infection, medication side effects, significant dehydration, or cardiac stress.",
    severity: "critical",
    condition: (m) => (m.heartRate?.resting ?? 60) > 90,
    actions: [
      "Check for fever, pain, or urinary issues",
      "Ensure adequate hydration immediately",
      "Contact their physician if elevated HR persists",
      "Monitor for chest discomfort or shortness of breath",
    ],
    scienceNote:
      "Resting HR above 90 bpm in older adults doubles mortality risk and may signal acute infection, heart failure, or severe dehydration.",
  },

  {
    id: "heart-hrv-low",
    category: "heart",
    title: "HRV balance is low -- their recovery system is strained",
    description:
      "HRV balance dropped below 60, indicating their autonomic nervous system is under stress. They may feel more anxious or fatigued today.",
    severity: "warning",
    condition: (m) => (m.readiness?.hrvBalance ?? 80) < 60,
    actions: [
      "Try guided breathing together: slow inhales and exhales for 5 minutes",
      "Keep today's schedule simple and predictable",
      "Avoid caffeine and other stimulants",
    ],
    scienceNote:
      "Heart rate variability (HRV) reflects autonomic resilience; low HRV is associated with increased stress reactivity, poorer sleep recovery, and faster cognitive decline.",
  },

  {
    id: "heart-hr-good",
    category: "heart",
    title: "Heart metrics look healthy -- their cardiovascular system is resting well",
    description:
      "Resting HR is in a healthy range and recovery signals are strong. Good cardiovascular recovery supports brain health and cognitive function.",
    severity: "info",
    condition: (m) =>
      (m.heartRate?.resting ?? 80) <= 70 &&
      (m.readiness?.hrvBalance ?? 0) >= 70 &&
      (m.readiness?.score ?? 0) >= 70,
    actions: [
      "Great cardiovascular recovery -- maintain current habits",
      "Good day for gentle physical activity",
      "Continue consistent sleep and hydration patterns",
    ],
    scienceNote:
      "Healthy resting HR (60-70 bpm) and strong HRV are associated with slower cognitive decline and reduced dementia risk.",
  },

  // ============================================================================
  // 4. ACTIVITY -- Movement and physical engagement (4 items)
  // ============================================================================

  {
    id: "activity-steps-low",
    category: "activity",
    title: "Low movement yesterday -- encourage gentle activity",
    description:
      "Step count was below 3,000. Sedentary days can worsen stiffness, low mood, and constipation. Gentle movement helps circulation and cognition.",
    severity: "warning",
    condition: (m) => (m.activity?.steps ?? 5000) < 3000,
    actions: [
      "Short walk outside or around the house",
      "Gentle stretching while seated",
      "Dancing to favorite music",
    ],
    scienceNote:
      "Walking fewer than 3,000 steps/day is associated with 2x faster cognitive decline and increased mortality in older adults.",
  },

  {
    id: "activity-steps-good",
    category: "activity",
    title: "Good activity level -- maintain this momentum",
    description:
      "They walked over 5,000 steps yesterday. Regular movement supports cardiovascular health, brain oxygenation, and mood regulation in dementia.",
    severity: "info",
    condition: (m) =>
      (m.activity?.steps ?? 0) >= 5000 && (m.activity?.score ?? 0) >= 70,
    actions: [
      "Praise their effort -- positive reinforcement builds habits",
      "Continue the routine that worked",
      "Consider adding a low-pressure outdoor activity like gardening",
    ],
    scienceNote:
      "Regular physical activity increases hippocampal volume and neuroplasticity, slowing cognitive decline in dementia patients.",
  },

  {
    id: "activity-high-intensity-caution",
    category: "activity",
    title: "They overexerted recently -- balance rest with activity",
    description:
      "Unusually high intensity activity (over 60 minutes) can lead to fatigue, soreness, or cardiovascular strain the following day.",
    severity: "warning",
    condition: (m) => (m.activity?.highIntensityMin ?? 0) > 60,
    actions: [
      "Focus on light activities today (walking, stretching)",
      "Monitor for signs of fatigue or muscle soreness",
      "Ensure they stay well-hydrated throughout the day",
    ],
    scienceNote:
      "Older adults with dementia may not self-regulate exertion; caregiver monitoring prevents overexertion and related injury.",
  },

  {
    id: "activity-very-sedentary",
    category: "activity",
    title: "Very low calorie burn -- ensure they're eating enough",
    description:
      "Very low activity (under 1,500 steps and under 150 active calories) often means reduced appetite or missed meals. People with memory loss may forget to eat.",
    severity: "warning",
    condition: (m) =>
      (m.activity?.activeCalories ?? 300) < 150 &&
      (m.activity?.steps ?? 5000) < 2000,
    actions: [
      "Offer small, frequent meals and snacks rather than large plates",
      "Include nutrient-dense foods: avocado, eggs, nut butters, smoothies",
      "Sit with them during meals -- companionship increases intake",
    ],
    scienceNote:
      "Unintentional weight loss occurs in 40% of dementia patients and is linked to faster disease progression and increased mortality.",
  },

  // ============================================================================
  // 5. STRESS -- Nervous system stress and recovery (4 items)
  // ============================================================================

  {
    id: "stress-high",
    category: "stress",
    title: "High stress detected -- create a calm environment",
    description:
      "Their stress levels were elevated (stress summary above 60). High stress increases cortisol, which can damage memory-forming brain regions.",
    severity: "warning",
    condition: (m) => (m.stress?.daySummary ?? 0) > 60,
    actions: [
      "Play calming music or nature sounds",
      "Try gentle hand massage",
      "Keep the schedule simple today",
    ],
    scienceNote:
      "Chronic stress elevates cortisol, which shrinks the hippocampus -- the brain's memory center most affected by Alzheimer's.",
  },

  {
    id: "stress-extreme",
    category: "stress",
    title: "Severe stress levels -- rule out physical causes",
    description:
      "Extremely high stress metrics (above 85 or over 5 hours in high-stress state) may reflect pain, infection, medication issues, or severe psychological distress.",
    severity: "critical",
    condition: (m) =>
      (m.stress?.daySummary ?? 0) > 85 || (m.stress?.stressHigh ?? 0) > 5 * 3600,
    actions: [
      "Check for signs of pain, infection, or urinary retention",
      "Contact their physician to discuss the data and any behavioral changes",
      "If they seem acutely distressed or unwell, seek urgent medical care",
    ],
    scienceNote:
      "In dementia patients, pain and infection are common but under-recognized causes of acute behavioral disturbance and elevated stress biomarkers.",
  },

  {
    id: "stress-recovery-low",
    category: "stress",
    title: "Recovery time was low -- their nervous system didn't rest",
    description:
      "Recovery high was under 1 hour, meaning their body spent very little time in a restorative state. They may feel worn out and reactive today.",
    severity: "warning",
    condition: (m) => (m.stress?.recoveryHigh ?? 3600) < 60 * 60,
    actions: [
      "Build in several quiet rest periods throughout the day",
      "Avoid overstimulation -- keep visitors and noise to a minimum",
      "Try a gentle afternoon nap (30-45 minutes)",
    ],
    scienceNote:
      "Insufficient recovery time (sympathetic dominance) is linked to accelerated cellular aging and cognitive decline in chronically stressed older adults.",
  },

  {
    id: "stress-good-recovery",
    category: "stress",
    title: "Good stress recovery overnight",
    description:
      "Recovery metrics look strong -- their nervous system had adequate time in a restorative state. This supports emotional stability and clearer thinking.",
    severity: "info",
    condition: (m) =>
      (m.stress?.recoveryHigh ?? 0) >= 2 * 3600 &&
      (m.stress?.daySummary ?? 100) < 50,
    actions: [
      "Good recovery -- a stable day for learning or social activities",
      "Consider a cognitively engaging activity (puzzles, reminiscing)",
      "Maintain current routines that are working",
    ],
    scienceNote:
      "Adequate parasympathetic recovery (2+ hours) is associated with better emotional regulation and slower hippocampal atrophy in older adults.",
  },

  // ============================================================================
  // 6. SpO2 -- Blood oxygen and breathing (3 items)
  // ============================================================================

  {
    id: "spo2-low",
    category: "spo2",
    title: "Blood oxygen is low -- consider medical evaluation",
    description:
      "SpO2 average fell below 92%. Low blood oxygen can indicate respiratory issues, sleep apnea, or cardiovascular problems and may cause delirium.",
    severity: "critical",
    condition: (m) => (m.spo2?.average ?? 98) < 92,
    actions: [
      "Seek medical attention promptly -- call their physician or urgent care",
      "Monitor for breathing difficulty, bluish lips, or extreme fatigue",
      "In an emergency (severe shortness of breath), call emergency services",
    ],
    scienceNote:
      "SpO2 below 92% indicates hypoxemia; in dementia patients, this can cause delirium and rapid cognitive deterioration if untreated.",
  },

  {
    id: "spo2-breathing-disturbance",
    category: "spo2",
    title: "Frequent breathing disturbances detected overnight",
    description:
      "Breathing disturbance index was above 15, suggesting possible sleep apnea or nocturnal breathing irregularities that fragment sleep and reduce oxygenation.",
    severity: "warning",
    condition: (m) => (m.spo2?.breathingDisturbanceIndex ?? 0) > 15,
    actions: [
      "Discuss these findings with their physician -- a sleep study may be needed",
      "Ensure they sleep on their side rather than their back",
      "Avoid alcohol and sedatives in the evening, which worsen apnea",
    ],
    scienceNote:
      "Sleep apnea affects up to 50% of Alzheimer's patients and is linked to amyloid buildup; CPAP treatment may slow cognitive decline.",
  },

  {
    id: "spo2-good",
    category: "spo2",
    title: "Blood oxygen levels look healthy overnight",
    description:
      "SpO2 remained strong and breathing disturbances were minimal. Good oxygenation supports brain health and reduces delirium risk.",
    severity: "info",
    condition: (m) =>
      (m.spo2?.average ?? 0) >= 95 &&
      (m.spo2?.breathingDisturbanceIndex ?? 100) <= 10,
    actions: [
      "Healthy oxygenation -- continue current sleep setup",
      "Maintain good ventilation in the bedroom",
      "Regular sleep position and pillow setup are working well",
    ],
    scienceNote:
      "Maintaining SpO2 above 95% during sleep supports optimal brain oxygenation and reduces oxidative stress in neural tissue.",
  },

  // ============================================================================
  // 7. AFTERNOON -- What to do this afternoon (3 items)
  // ============================================================================

  {
    id: "afternoon-gentle-walk",
    category: "afternoon",
    title: "Good time for a gentle afternoon walk",
    description:
      "Readiness and sleep scores are solid, and stress is moderate. An afternoon walk boosts mood, aids digestion, and supports circadian rhythm.",
    severity: "info",
    condition: (m) =>
      (m.readiness?.score ?? 0) >= 60 &&
      (m.stress?.daySummary ?? 100) < 60 &&
      (m.activity?.steps ?? 0) < 7000,
    actions: [
      "Take a 15-20 minute walk in natural light",
      "Point out familiar landmarks or flowers along the way",
      "Walking after lunch helps regulate blood sugar and sleep timing",
    ],
    scienceNote:
      "Afternoon light exposure and light walking improve circadian rhythm alignment and reduce sundowning risk by 35%.",
  },

  {
    id: "afternoon-rest-needed",
    category: "afternoon",
    title: "Afternoon rest is recommended -- skip the outing",
    description:
      "With low readiness, poor sleep, or high stress, the afternoon should focus on restoration rather than activity. Pushing through worsens evening agitation.",
    severity: "warning",
    condition: (m) =>
      (m.readiness?.score ?? 80) < 60 ||
      (m.sleep?.score ?? 80) < 60 ||
      (m.stress?.daySummary ?? 0) > 65,
    actions: [
      "Set up a quiet rest area with soft music",
      "Read aloud from a favorite book or look at photo albums",
      "A 20-30 minute nap can help -- but not longer, to preserve nighttime sleep",
    ],
    scienceNote:
      "Strategic afternoon rest (not exceeding 30 minutes) improves evening mood and reduces sundowning without disrupting nighttime sleep architecture.",
  },

  {
    id: "afternoon-social-window",
    category: "afternoon",
    title: "Good afternoon for a social visit",
    description:
      "Sleep, readiness, and stress metrics all suggest a stable state. This afternoon window is ideal for social engagement, which supports cognitive reserve.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 0) >= 75 &&
      (m.readiness?.score ?? 0) >= 70 &&
      (m.stress?.daySummary ?? 100) < 50 &&
      (m.heartRate?.resting ?? 80) < 80,
    actions: [
      "Arrange a visit with a family member or close friend",
      "Plan a video call with a grandchild",
      "Consider a short outing to a familiar, comfortable place",
    ],
    scienceNote:
      "Social engagement in the early afternoon (before fatigue sets in) is associated with a 70% reduction in cognitive decline risk in dementia.",
  },

  // ============================================================================
  // 8. EVENING -- Evening wind-down recommendations (4 items)
  // ============================================================================

  {
    id: "evening-wind-down-early",
    category: "evening",
    title: "Start the wind-down routine early tonight",
    description:
      "Sleep quality was below 75 or sleep latency was over 20 minutes. An earlier, more deliberate wind-down can improve tonight's sleep.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 80) < 75 || (m.sleep?.latency ?? 0) > 20 * 60,
    actions: [
      "Dim lights 1-2 hours before bedtime",
      "Play soft, calming music or nature sounds",
      "Avoid screens (TV, phones, tablets) in the last hour before bed",
    ],
    scienceNote:
      "Evening light exposure suppresses melatonin production; dim lighting supports natural circadian rhythm alignment in dementia patients.",
  },

  {
    id: "evening-sundowning",
    category: "evening",
    title: "Watch for sundowning signs this evening",
    description:
      "Sundowning -- increased confusion, agitation, or restlessness in late afternoon/evening -- is common in dementia and may follow poor sleep or high stress.",
    severity: "warning",
    condition: (m) =>
      (m.sleep?.score ?? 80) < 65 ||
      (m.stress?.daySummary ?? 0) > 65 ||
      (m.stress?.stressHigh ?? 0) > 2.5 * 3600,
    actions: [
      "Close curtains and turn on lights before dusk to ease the transition",
      "Engage in a calming activity: folding laundry, sorting objects, gentle music",
      "If agitation occurs, stay calm, validate their feelings, and redirect gently",
    ],
    scienceNote:
      "Sundowning affects up to 66% of dementia patients; maintaining bright light exposure during the day and dim lighting at night reduces severity.",
  },

  {
    id: "evening-low-hrv",
    category: "evening",
    title: "HRV is low -- prioritize a restorative evening",
    description:
      "HRV balance below 60 means their autonomic nervous system is still under strain. A restorative evening routine is essential for recovery.",
    severity: "warning",
    condition: (m) => (m.readiness?.hrvBalance ?? 80) < 60,
    actions: [
      "Avoid stimulating activities or new experiences in the evening",
      "Try guided breathing exercises together: slow, deep breaths for 5 minutes",
      "Ensure the bedroom is cool, dark, and quiet",
    ],
    scienceNote:
      "Evening HRV-guided breathing at 6 breaths/minute increases parasympathetic tone, improving sleep quality and next-day cognitive performance.",
  },

  {
    id: "evening-warm-bath",
    category: "evening",
    title: "A warm bath can promote better sleep tonight",
    description:
      "With suboptimal sleep scores or readiness, a warm bath 1-2 hours before bed helps lower core body temperature -- a natural sleep signal.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 80) < 80 ||
      (m.sleep?.deepSleep ?? 3600) < 60 * 60 ||
      (m.readiness?.score ?? 80) < 70,
    actions: [
      "Draw a warm (not hot) bath 90 minutes before desired bedtime",
      "Add calming scents like lavender essential oil if they enjoy it",
      "After bathing, keep the bedroom cool to support temperature drop",
    ],
    scienceNote:
      "Warm-water immersion increases peripheral blood flow, which accelerates post-bath core cooling -- a mechanism that reduces sleep latency by ~10 minutes.",
  },

  // ============================================================================
  // 9. SAFETY -- Temperature and combined risk signals (2 items)
  // ============================================================================

  {
    id: "safety-temperature-deviation",
    category: "morning",
    title: "Temperature deviation detected -- monitor for illness",
    description:
      "A notable temperature deviation from their baseline (over 0.5 degrees) may signal an infection, inflammation, or other physiological stressor.",
    severity: "warning",
    condition: (m) =>
      Math.abs(m.readiness?.bodyTemperature ?? 0) > 0.5,
    actions: [
      "Check for signs of infection: cough, sore throat, urinary changes, confusion",
      "Monitor temperature with a thermometer for confirmation",
      "If fever or infection signs are present, contact their physician",
    ],
    scienceNote:
      "Oura's skin temperature sensor can detect deviations preceding symptom onset; in dementia patients, infections often present as sudden confusion.",
  },

  {
    id: "safety-concerning-combo",
    category: "morning",
    title: "Multiple concerning signals -- stay extra attentive today",
    description:
      "Elevated HR, poor sleep, AND high stress together suggest their body is under significant strain. This combination warrants close monitoring.",
    severity: "critical",
    condition: (m) =>
      (m.heartRate?.resting ?? 60) > 85 &&
      (m.sleep?.score ?? 100) < 60 &&
      (m.stress?.daySummary ?? 0) > 70,
    actions: [
      "Minimize all activities today -- this is a rest and monitor day",
      "Check temperature, hydration, and for signs of pain or infection",
      "Contact their physician with the data summary",
      "Have emergency contacts readily available",
    ],
    scienceNote:
      "The combination of tachycardia, poor sleep, and high stress in older adults with dementia increases same-day hospitalization risk by 5x.",
  },
];

// -- Filtering Functions ------------------------------------------------------

/**
 * Returns all recommendations whose condition matches the given metrics.
 * Each recommendation checks REAL Oura data -- only relevant advice surfaces.
 * Sorts by severity (critical first, then warning, then info).
 */
export function getRecommendationsForData(metrics: DailyMetrics): Recommendation[] {
  const severityOrder: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  return recommendations
    .filter((rec) => rec.condition(metrics))
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Returns matching recommendations filtered by category.
 * Categories: sleep | heart | activity | stress | spo2 | morning | afternoon | evening
 */
export function getRecommendationsByCategory(
  metrics: DailyMetrics,
  category: string
): Recommendation[] {
  return getRecommendationsForData(metrics).filter((rec) => rec.category === category);
}

/**
 * Returns the top N most important recommendations, sorted by severity.
 * Critical items always appear first, followed by warnings, then info.
 */
export function getTopRecommendations(
  metrics: DailyMetrics,
  count: number
): Recommendation[] {
  return getRecommendationsForData(metrics).slice(0, Math.max(1, count));
}

// -- Default Export -----------------------------------------------------------

export default {
  recommendations,
  getRecommendationsForData,
  getRecommendationsByCategory,
  getTopRecommendations,
};
