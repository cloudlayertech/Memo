import { useEffect, useState } from "react"

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
}

export default function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 7,
  color = "#8B6F4E",
  trackColor = "#EDE8E0",
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedProgress / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(Math.max(0, Math.min(100, progress))), 100)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
      />
    </svg>
  )
}
