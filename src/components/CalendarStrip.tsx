import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDayName, formatDateShort } from "@/lib/utils"

interface CalendarStripProps {
  days: string[]
  selectedDate: string
  onSelectDate: (date: string) => void
}

export default function CalendarStrip({ days, selectedDate, onSelectDate }: CalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current
      const el = selectedRef.current
      const scrollLeft = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: "smooth" })
    }
  }, [selectedDate])

  const today = new Date().toISOString().split("T")[0]

  const handlePrevWeek = () => {
    const newOffset = weekOffset - 1
    setWeekOffset(newOffset)
    // Calculate the start of current displayed week and go back 7 days
    const currentStart = new Date(days[0])
    currentStart.setDate(currentStart.getDate() - 7)
    const newDays: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentStart)
      d.setDate(d.getDate() + i)
      newDays.push(d.toISOString().split("T")[0])
    }
    onSelectDate(newDays[6]) // Select the last day of the new week
  }

  const handleNextWeek = () => {
    const newOffset = weekOffset + 1
    setWeekOffset(newOffset)
    // Calculate the start of current displayed week and go forward 7 days
    const currentStart = new Date(days[0])
    currentStart.setDate(currentStart.getDate() + 7)
    const newDays: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentStart)
      d.setDate(d.getDate() + i)
      newDays.push(d.toISOString().split("T")[0])
    }
    onSelectDate(newDays[6]) // Select the last day of the new week
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-3">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevWeek}
          className="w-8 h-8 rounded-lg bg-memo-bg flex items-center justify-center flex-shrink-0 hover:bg-memo-primary-light transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4 text-memo-text-secondary" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 flex-1"
        >
          {days.map((date) => {
            const isSelected = date === selectedDate
            const isToday = date === today
            return (
              <motion.button
                key={date}
                ref={isSelected ? selectedRef : null}
                whileTap={{ scale: 0.93 }}
                onClick={() => onSelectDate(date)}
                className={`flex flex-col items-center justify-center min-w-[52px] h-[68px] rounded-xl snap-center transition-colors ${
                  isSelected
                    ? "bg-primary text-white"
                    : isToday
                      ? "bg-memo-primary-light text-primary"
                      : "bg-memo-bg text-memo-text-secondary hover:bg-memo-primary-light"
                }`}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {formatDayName(date)}
                </span>
                <span className="text-base font-semibold mt-0.5">{formatDateShort(date)}</span>
                {isToday && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-primary mt-1" />
                )}
              </motion.button>
            )
          })}
        </div>

        <button
          onClick={handleNextWeek}
          className="w-8 h-8 rounded-lg bg-memo-bg flex items-center justify-center flex-shrink-0 hover:bg-memo-primary-light transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4 text-memo-text-secondary" />
        </button>
      </div>
    </div>
  )
}
