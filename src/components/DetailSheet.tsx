import { motion, AnimatePresence } from "framer-motion"
import type { PanInfo } from "framer-motion"
import { X } from "lucide-react"
import { useRef } from "react"

interface DetailSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function DetailSheet({ isOpen, onClose, title, children }: DetailSheetProps) {
  const constraintsRef = useRef(null)

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />
          <motion.div
            ref={constraintsRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white rounded-t-3xl pt-3 pb-2 px-5 z-10 border-b border-gray-100">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-memo-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-memo-bg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-memo-text-secondary" />
                </button>
              </div>
            </div>
            <div className="p-5 pb-10">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
