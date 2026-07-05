import { motion } from "framer-motion"
import { Activity, Shield, Brain, Heart } from "lucide-react"
import { getOuraAuthUrl } from "@/lib/ouraApi"

const features = [
  { icon: Activity, text: "Track sleep, heart rate, activity & more" },
  { icon: Brain, text: "Personalized tips for brain health" },
  { icon: Heart, text: "Evidence-based recommendations" },
  { icon: Shield, text: "Your data stays private and secure" },
]

export default function Connect() {
  const handleConnect = () => {
    window.location.href = getOuraAuthUrl()
  }

  return (
    <div className="min-h-[100dvh] bg-memo-bg flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        <div className="w-24 h-24 rounded-3xl bg-[#8B6F4E] flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Activity className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-5xl font-bold text-memo-text mb-3 tracking-tight">Welcome to Memo</h1>
        <p className="text-xl text-memo-text-secondary mb-12 leading-relaxed">
          Your daily health companion. Connect your Oura Ring to see personalized insights for a
          healthier mind.
        </p>

        <div className="space-y-3 mb-12 text-left">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-card"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F5EDE3] flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-[#8B6F4E]" />
              </div>
              <span className="text-base font-medium text-memo-text">{f.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleConnect}
          className="w-full bg-[#8B6F4E] hover:bg-[#6B5337] text-white font-bold text-lg h-14 rounded-xl transition-colors shadow-lg"
        >
          Connect Oura Ring
        </motion.button>

        <p className="text-sm text-memo-text-tertiary mt-5">
          You&apos;ll be redirected to Oura to authorize access. Your data is never shared.
        </p>
      </motion.div>
    </div>
  )
}
