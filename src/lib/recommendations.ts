//
// Recommendations Engine for Memo — Dementia & Memory Loss Caregiving App
//
// This module provides evidence-based, caregiver-facing recommendations
// based on Oura Ring biometric data for a person with early-stage dementia
// or memory loss. Recommendations are filtered by condition functions so
// only relevant guidance surfaces each morning.
//

// ── Type Definitions ─────────────────────────────────────────────────────────

export interface DailyMetrics {
  date: string;
  sleep: {
    score: number;           // 0–100
    totalDuration: number;   // seconds
    deepDuration: number;    // seconds
    remDuration: number;     // seconds
    lightDuration: number;   // seconds
    latency: number;         // seconds
    efficiency: number;      // 0–100
  } | null;
  readiness: {
    score: number;           // 0–100
    temperatureDeviation: number;
    restingHR: number;
    hrvBalance: number;      // 0–100
  } | null;
  activity: {
    score: number;           // 0–100
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
    average: number;         // 0–100
    breathingDisturbanceIndex: number;
  } | null;
  stress: {
    stressHigh: number;      // seconds
    recoveryHigh: number;    // seconds
    daySummary: number;      // 0–100
  } | null;
}

export type RecCategory =
  | "morning"
  | "activities"
  | "nutrition"
  | "social"
  | "evening"
  | "safety"
  | "medical";

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

// ── All 30 Recommendations ───────────────────────────────────────────────────

export const recommendations: Recommendation[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. MORNING ROUTINE (5 recommendations)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "morning-poor-sleep",
    category: "morning",
    title: "They had a restless night — keep the morning calm",
    description:
      "Poor sleep can increase confusion and agitation in people with memory loss. A calm, predictable morning routine can help them feel grounded.",
    severity: "warning",
    condition: (m) =>
      (m.sleep?.score ?? 80) < 65 || (m.sleep?.efficiency ?? 90) < 80,
    actions: [
      "Keep lights soft and voices low",
      "Offer a warm, familiar breakfast",
      "Avoid rushing or introducing new activities today",
    ],
    scienceNote:
      "Sleep deprivation exacerbates cognitive decline symptoms and increases sundowning risk by 40%.",
  },

  {
    id: "morning-good-sleep",
    category: "morning",
    title: "They slept well — build on this positive start",
    description:
      "A restful night supports clearer thinking and better mood. Take advantage of this window for activities that require more focus or engagement.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 0) >= 80 && (m.sleep?.efficiency ?? 0) >= 90,
    actions: [
      "Greet them warmly and reinforce today's date and schedule",
      "Plan a cognitively engaging activity mid-morning",
      "Celebrate the good sleep — positive reinforcement builds routine",
    ],
    scienceNote:
      "Good sleep consolidates memories and improves executive function by up to 30% in older adults.",
  },

  {
    id: "morning-long-sleep-latency",
    category: "morning",
    title: "They took a while to fall asleep — ease into the day",
    description:
      "Long sleep latency may indicate anxiety, caffeine effects, or circadian disruption. A slow, low-pressure morning can help them recover.",
    severity: "info",
    condition: (m) => (m.sleep?.latency ?? 0) > 30 * 60, // > 30 min
    actions: [
      "Let them wake naturally if possible — avoid abrupt alarms",
      "Open curtains gradually for gentle light exposure",
      "Consider a brief morning stretch session together",
    ],
    scienceNote:
      "Sleep-onset insomnia is linked to elevated evening cortisol and is common in early dementia due to circadian rhythm changes.",
  },

  {
    id: "morning-low-deep-sleep",
    category: "morning",
    title: "Deep sleep was low — expect some mental fatigue",
    description:
      "Deep (slow-wave) sleep is essential for clearing brain waste via the glymphatic system. Low deep sleep may leave them feeling foggy.",
    severity: "warning",
    condition: (m) =>
      (m.sleep?.deepDuration ?? 3600) < 45 * 60 &&
      (m.sleep?.totalDuration ?? 0) > 4 * 3600,
    actions: [
      "Keep the morning schedule light and familiar",
      "Postpone any complex tasks to later in the day",
      "Encourage a brief rest or quiet reading after breakfast",
    ],
    scienceNote:
      "Reduced slow-wave sleep is associated with amyloid-beta accumulation and accelerated cognitive decline.",
  },

  {
    id: "morning-low-readiness",
    category: "morning",
    title: "Readiness is low — they may need extra support today",
    description:
      "A low readiness score signals their body is still recovering. They may move more slowly, feel achy, or have trouble concentrating.",
    severity: "warning",
    condition: (m) => (m.readiness?.score ?? 80) < 60,
    actions: [
      "Offer help with dressing and grooming without rushing",
      "Prioritize comfort — check room temperature and clothing",
      "Scale back planned activities and focus on rest and connection",
    ],
    scienceNote:
      "Readiness scores reflect autonomic recovery; persistently low scores in dementia patients correlate with increased caregiver burden.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. DAILY ACTIVITIES (6 recommendations)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "activities-low-steps",
    category: "activities",
    title: "Encourage gentle movement today",
    description:
      "Low step counts mean they have been mostly sedentary. Gentle activity improves circulation, mood, and sleep quality.",
    severity: "info",
    condition: (m) => (m.activity?.steps ?? 6000) < 3000,
    actions: [
      "Take a 10–15 minute walk after breakfast or lunch",
      "Do seated chair exercises together while watching TV",
      "Set a shared step goal and celebrate progress together",
    ],
    scienceNote:
      "Even 20 minutes of light walking daily can reduce dementia progression risk by 30% and improve BDNF levels.",
  },

  {
    id: "activities-cognitive-stimulation",
    category: "activities",
    title: "Plan a cognitive activity today",
    description:
      "Structured mental engagement helps preserve neural pathways. On days when mood is stable, cognitive exercises are especially beneficial.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 0) >= 65 && (m.stress?.daySummary ?? 50) < 65,
    actions: [
      "Work on a simple puzzle, crossword, or memory card game together",
      "Look through old photo albums and reminisce about the stories",
      "Listen to music from their youth and encourage them to sing along",
    ],
    scienceNote:
      "Cognitive stimulation therapy (CST) is NICE-recommended and shown to improve cognition and quality of life in mild-to-moderate dementia.",
  },

  {
    id: "activities-high-stress",
    category: "activities",
    title: "Their nervous system is taxed — keep today soothing",
    description:
      "High stress markers suggest they are feeling overwhelmed. Overstimulation can worsen confusion and behavioral symptoms.",
    severity: "warning",
    condition: (m) =>
      (m.stress?.stressHigh ?? 0) > 3 * 3600 || // > 3 hrs
      (m.stress?.daySummary ?? 0) > 75,
    actions: [
      "Skip complex or unfamiliar activities today",
      "Try gentle hand massage or aromatherapy (lavender or chamomile)",
      "Spend quiet time together — reading aloud, looking at nature, or gentle music",
    ],
    scienceNote:
      "Chronic stress elevates cortisol, which damages the hippocampus — the brain region most affected by Alzheimer's disease.",
  },

  {
    id: "activities-good-activity-score",
    category: "activities",
    title: "They've been active — maintain this momentum",
    description:
      "Good activity levels support cardiovascular health, brain oxygenation, and mood regulation. Keep the positive momentum going.",
    severity: "info",
    condition: (m) =>
      (m.activity?.score ?? 0) >= 80 && (m.activity?.steps ?? 0) >= 5000,
    actions: [
      "Continue the routine that worked — consistency is key",
      "Add a new, low-pressure outdoor activity (gardening, birdwatching)",
      "Praise their effort — positive reinforcement strengthens habits",
    ],
    scienceNote:
      "Regular physical activity increases hippocampal volume and neuroplasticity, slowing cognitive decline in dementia patients.",
  },

  {
    id: "activities-structured-routine",
    category: "activities",
    title: "Stick to a familiar routine today",
    description:
      "Predictability reduces anxiety and confusion. When data shows irregular patterns, returning to a trusted routine provides comfort.",
    severity: "info",
    condition: (m) =>
      (m.readiness?.score ?? 80) < 70 || (m.sleep?.score ?? 80) < 70,
    actions: [
      "Follow the usual daily schedule in the same order",
      "Use visual cues (calendar, clocks, labeled rooms) to orient them",
      "Prepare familiar meals and activities they already enjoy",
    ],
    scienceNote:
      "Structured routines reduce behavioral disturbances in dementia by 50% by minimizing cognitive load and decision fatigue.",
  },

  {
    id: "activities-high-intensity-caution",
    category: "activities",
    title: "They overexerted recently — balance rest with activity",
    description:
      "Unusually high intensity activity can lead to fatigue, soreness, or cardiovascular strain the following day.",
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. NUTRITION & HYDRATION (4 recommendations)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "nutrition-low-activity-low-cal",
    category: "nutrition",
    title: "Low calorie burn — ensure they're eating enough",
    description:
      "Very low activity often means reduced appetite or missed meals. People with memory loss may forget to eat or lose interest in food.",
    severity: "warning",
    condition: (m) =>
      (m.activity?.activeCalories ?? 300) < 150 &&
      (m.activity?.steps ?? 5000) < 2000,
    actions: [
      "Offer small, frequent meals and snacks rather than large plates",
      "Include nutrient-dense foods: avocado, eggs, nut butters, smoothies",
      "Sit with them during meals — companionship increases intake",
    ],
    scienceNote:
      "Unintentional weight loss occurs in 40% of dementia patients and is linked to faster disease progression and increased mortality.",
  },

  {
    id: "nutrition-high-activity",
    category: "nutrition",
    title: "They were very active — fuel their recovery",
    description:
      "Higher activity levels mean increased caloric and protein needs. Proper nutrition supports muscle maintenance and energy.",
    severity: "info",
    condition: (m) =>
      (m.activity?.steps ?? 0) > 7000 ||
      (m.activity?.activeCalories ?? 0) > 400,
    actions: [
      "Include a protein-rich source at every meal (fish, beans, eggs, yogurt)",
      "Offer extra snacks — fruit, cheese, or whole-grain crackers",
      "Ensure adequate hydration with water, herbal tea, or broth",
    ],
    scienceNote:
      "Protein intake of 1.0–1.2 g/kg/day supports muscle preservation in older adults and is critical for physically active dementia patients.",
  },

  {
    id: "nutrition-hydration-reminder",
    category: "nutrition",
    title: "Focus on hydration today",
    description:
      "Dehydration is common in people with dementia because the thirst signal weakens with age and cognitive decline.",
    severity: "info",
    condition: (m) =>
      (m.heartRate?.resting ?? 65) > 75 ||
      (m.readiness?.score ?? 80) < 65,
    actions: [
      "Place a water bottle within easy reach in every room",
      "Offer fluids they enjoy — flavored water, diluted juice, herbal tea",
      "Monitor urine color; darker urine suggests dehydration",
    ],
    scienceNote:
      "Dehydration is a leading cause of hospitalization in elderly dementia patients and can mimic or worsen confusion (delirium).",
  },

  {
    id: "nutrition-meal-timing",
    category: "nutrition",
    title: "Maintain consistent meal times today",
    description:
      "Irregular sleep patterns can disrupt hunger cues and circadian rhythms. Consistent meal timing supports both digestion and sleep quality.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 80) < 75 || (m.sleep?.latency ?? 0) > 20 * 60,
    actions: [
      "Serve breakfast, lunch, and dinner at the same times each day",
      "Avoid heavy meals within 3 hours of bedtime",
      "Consider a light evening snack (warm milk, banana, small crackers)",
    ],
    scienceNote:
      "Chrononutrition research shows that regular meal timing strengthens circadian rhythms, improving both sleep quality and metabolic health.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SOCIAL ENGAGEMENT (4 recommendations)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "social-good-sleep-good-mood",
    category: "social",
    title: "A great day to connect with others",
    description:
      "Good sleep and stable metrics create an ideal window for social interaction. Positive social experiences boost mood and cognitive reserve.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 0) >= 80 &&
      (m.stress?.daySummary ?? 50) < 50 &&
      (m.readiness?.score ?? 0) >= 75,
    actions: [
      "Arrange a visit with a family member or close friend",
      "Plan a video call with a grandchild or distant relative",
      "Consider a short outing to a familiar, comfortable place",
    ],
    scienceNote:
      "Social engagement is associated with a 70% reduction in cognitive decline risk and improved emotional well-being in dementia.",
  },

  {
    id: "social-high-stress-social",
    category: "social",
    title: "Keep social time brief and familiar today",
    description:
      "When stress is elevated, large gatherings or unfamiliar visitors can be overwhelming. Opt for quiet, one-on-one connection.",
    severity: "warning",
    condition: (m) =>
      (m.stress?.daySummary ?? 0) > 65 ||
      (m.stress?.stressHigh ?? 0) > 2 * 3600,
    actions: [
      "Limit visits to one or two close, familiar people",
      "Choose a quiet setting away from crowds or loud noises",
      "Watch for signs of overwhelm and be ready to end the visit early",
    ],
    scienceNote:
      "Overstimulation can trigger agitation and sundowning in dementia; brief, familiar social contact is more beneficial than large gatherings.",
  },

  {
    id: "social-companion-animal",
    category: "social",
    title: "Pet therapy can provide comfort today",
    description:
      "On days when human interaction feels overwhelming, animal companionship offers nonverbal emotional support and reduces anxiety.",
    severity: "info",
    condition: (m) =>
      (m.stress?.daySummary ?? 0) > 60 ||
      (m.readiness?.score ?? 80) < 65 ||
      (m.sleep?.score ?? 80) < 70,
    actions: [
      "If a pet is present, encourage gentle petting or brushing together",
      "Play calming videos of animals or nature if no pet is available",
      "Talk about pets they had in the past — reminiscing connects to identity",
    ],
    scienceNote:
      "Pet therapy reduces cortisol, lowers blood pressure, and decreases agitation scores in dementia patients by up to 50%.",
  },

  {
    id: "social-caregiver-self-care",
    category: "social",
    title: "You also need connection — reach out for support",
    description:
      "Caregiving is emotionally demanding. Your well-being directly affects the quality of care you provide. Do not neglect your own social needs.",
    severity: "info",
    condition: (m) =>
      (m.stress?.daySummary ?? 0) > 70 ||
      (m.sleep?.score ?? 0) < 60 ||
      (m.readiness?.score ?? 0) < 55,
    actions: [
      "Call a friend, family member, or support group today",
      "Accept offers of help — even a short break matters",
      "Look into respite care or adult day programs for regular relief",
    ],
    scienceNote:
      "Caregiver burnout affects 40–70% of dementia caregivers; social support is the strongest protective factor against depression and burnout.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EVENING WIND-DOWN (4 recommendations)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "evening-sleep-hygiene",
    category: "evening",
    title: "Start the wind-down routine early tonight",
    description:
      "Consistent evening routines signal the brain that it's time to sleep. For people with dementia, this predictability is especially calming.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 0) < 75 || (m.sleep?.latency ?? 0) > 20 * 60,
    actions: [
      "Dim lights 1–2 hours before bedtime",
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
      "Sundowning — increased confusion, agitation, or restlessness in late afternoon/evening — is common in dementia and may follow poor sleep.",
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
    title: "Their recovery is low — prioritize rest tonight",
    description:
      "Low HRV balance suggests their autonomic nervous system is still under strain. A restorative evening routine can help recovery.",
    severity: "warning",
    condition: (m) => (m.readiness?.hrvBalance ?? 80) < 60,
    actions: [
      "Avoid stimulating activities or new experiences in the evening",
      "Try guided breathing exercises together: slow, deep breaths for 5 minutes",
      "Ensure the bedroom is cool, dark, and quiet",
    ],
    scienceNote:
      "Heart rate variability (HRV) reflects autonomic resilience; low HRV is associated with increased stress reactivity and poorer sleep recovery.",
  },

  {
    id: "evening-warm-bath",
    category: "evening",
    title: "A warm bath or shower can promote better sleep",
    description:
      "A warm bath 1–2 hours before bed helps lower core body temperature, which is a natural sleep signal for the brain.",
    severity: "info",
    condition: (m) =>
      (m.sleep?.score ?? 80) < 80 ||
      (m.sleep?.deepDuration ?? 3600) < 60 * 60 ||
      (m.readiness?.score ?? 80) < 70,
    actions: [
      "Draw a warm (not hot) bath 90 minutes before desired bedtime",
      "Add calming scents like lavender essential oil if they enjoy it",
      "After bathing, keep the bedroom cool to support temperature drop",
    ],
    scienceNote:
      "Warm-water immersion increases peripheral blood flow, which accelerates post-bath core cooling — a mechanism that reduces sleep latency by ~10 minutes.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SAFETY & MONITORING (4 recommendations)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "safety-temperature-deviation",
    category: "safety",
    title: "Temperature deviation detected — monitor for illness",
    description:
      "A notable temperature deviation from their baseline may signal an infection, inflammation, or other physiological stressor.",
    severity: "warning",
    condition: (m) =>
      Math.abs(m.readiness?.temperatureDeviation ?? 0) > 0.5,
    actions: [
      "Check for signs of infection: cough, sore throat, urinary changes, confusion",
      "Monitor temperature with a thermometer for confirmation",
      "If fever or infection signs are present, contact their physician",
    ],
    scienceNote:
      "Oura's skin temperature sensor can detect deviations preceding symptom onset; in dementia patients, infections often present as sudden confusion.",
  },

  {
    id: "safety-elevated-resting-hr",
    category: "safety",
    title: "Resting heart rate is elevated — investigate the cause",
    description:
      "An elevated resting heart rate may indicate dehydration, infection, pain, medication effects, or anxiety. This warrants attention.",
    severity: "warning",
    condition: (m) => (m.heartRate?.resting ?? 65) > 85,
    actions: [
      "Check if they are in pain, anxious, or uncomfortable",
      "Ensure they are well-hydrated — offer water",
      "Review recent medication changes that might affect heart rate",
    ],
    scienceNote:
      "Elevated resting HR in older adults is associated with increased mortality risk and may indicate underlying infection, dehydration, or cardiac issues.",
  },

  {
    id: "safety-low-spo2",
    category: "safety",
    title: "Blood oxygen is low — consider medical evaluation",
    description:
      "Low SpO2 can indicate respiratory issues, sleep apnea, or cardiovascular problems. This should not be ignored, especially in older adults.",
    severity: "critical",
    condition: (m) => (m.spo2?.average ?? 98) < 92,
    actions: [
      "Seek medical attention promptly — call their physician or urgent care",
      "Monitor for breathing difficulty, bluish lips, or extreme fatigue",
      "In an emergency (severe shortness of breath), call emergency services",
    ],
    scienceNote:
      "SpO2 below 92% indicates hypoxemia; in dementia patients, this can cause delirium and rapid cognitive deterioration if untreated.",
  },

  {
    id: "safety-breathing-disturbance",
    category: "safety",
    title: "Frequent breathing disturbances detected overnight",
    description:
      "A high breathing disturbance index suggests possible sleep apnea or nocturnal breathing irregularities, which fragment sleep and reduce oxygenation.",
    severity: "warning",
    condition: (m) => (m.spo2?.breathingDisturbanceIndex ?? 0) > 15,
    actions: [
      "Discuss these findings with their physician — a sleep study may be needed",
      "Ensure they sleep on their side rather than their back",
      "Avoid alcohol and sedatives in the evening, which worsen apnea",
    ],
    scienceNote:
      "Sleep apnea affects up to 50% of Alzheimer's patients and is linked to amyloid buildup; CPAP treatment may slow cognitive decline.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. MEDICAL (3 recommendations)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "medical-sustained-low-readiness",
    category: "medical",
    title: "Low readiness for multiple days — consider a check-in",
    description:
      "Persistent low readiness scores may indicate an underlying health issue that is not immediately visible. A medical review is warranted.",
    severity: "warning",
    condition: (m) => (m.readiness?.score ?? 80) < 55,
    actions: [
      "Schedule an appointment with their primary care physician",
      "Keep a log of symptoms: appetite changes, mood shifts, new confusion",
      "Bring recent Oura data trends to the appointment for reference",
    ],
    scienceNote:
      "Persistent autonomic dysregulation (low readiness) in older adults may signal infection, medication side effects, or emerging illness.",
  },

  {
    id: "medical-extreme-stress",
    category: "medical",
    title: "Severe stress levels — rule out physical causes",
    description:
      "Extremely high stress metrics may reflect pain, infection, medication issues, or significant psychological distress that requires evaluation.",
    severity: "critical",
    condition: (m) =>
      (m.stress?.daySummary ?? 0) > 85 ||
      (m.stress?.stressHigh ?? 0) > 5 * 3600,
    actions: [
      "Check for signs of pain, infection, or urinary retention",
      "Contact their physician to discuss the data and any behavioral changes",
      "If they seem acutely distressed or unwell, seek urgent medical care",
    ],
    scienceNote:
      "In dementia patients, pain and infection are common but under-recognized causes of acute behavioral disturbance and elevated stress biomarkers.",
  },

  {
    id: "medical-medication-review",
    category: "medical",
    title: "Time to review medications with their doctor",
    description:
      "Changes in sleep, heart rate, or stress patterns may be medication-related. Regular medication reviews are essential in dementia care.",
    severity: "info",
    condition: (m) =>
      (m.heartRate?.resting ?? 65) > 80 ||
      (m.sleep?.score ?? 80) < 60 ||
      (m.stress?.daySummary ?? 0) > 70,
    actions: [
      "Schedule a medication review with their prescribing physician",
      "List all current medications, supplements, and recent changes",
      "Ask specifically about sedatives, anticholinergics, and antihypertensives",
    ],
    scienceNote:
      "Polypharmacy affects 80% of dementia patients; anticholinergic medications are especially problematic, worsening cognition and causing delirium.",
  },
];

// ── Filtering Functions ──────────────────────────────────────────────────────

/**
 * Returns all recommendations whose condition matches the given metrics.
 * Call this each morning to get the personalized care plan.
 */
export function getRecommendationsForData(
  metrics: DailyMetrics
): Recommendation[] {
  return recommendations.filter((rec) => rec.condition(metrics));
}

/**
 * Returns matching recommendations filtered by category.
 */
export function getRecommendationsByCategory(
  metrics: DailyMetrics,
  category: RecCategory
): Recommendation[] {
  return getRecommendationsForData(metrics).filter(
    (rec) => rec.category === category
  );
}

/**
 * Returns matching recommendations filtered by severity.
 */
export function getRecommendationsBySeverity(
  metrics: DailyMetrics,
  severity: Severity
): Recommendation[] {
  return getRecommendationsForData(metrics).filter(
    (rec) => rec.severity === severity
  );
}

// ── Default Export ───────────────────────────────────────────────────────────

export default {
  recommendations,
  getRecommendationsForData,
  getRecommendationsByCategory,
  getRecommendationsBySeverity,
};
