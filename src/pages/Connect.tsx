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
        className="text-center max-w-sm w-full"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Activity className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl font-semibold text-memo-text mb-2">Welcome to Memo</h1>
        <p className="text-lg text-memo-text-secondary mb-10 leading-relaxed">
          Your daily health companion. Connect your Oura Ring to see personalized insights for a
          healthier mind.
        </p>

        <div className="space-y-3 mb-10 text-left">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 bg-white rounded-xl p-3.5 shadow-card"
            >
              <div className="w-9 h-9 rounded-lg bg-memo-primary-light flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-memo-text">{f.text}</span>
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
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold text-lg h-14 rounded-xl transition-colors shadow-lg"
        >
          Connect Oura Ring
        </motion.button>

        <p className="text-xs text-memo-text-tertiary mt-4">
          You'll be redirected to Oura to authorize access. Your data is never shared.
        </p>
      </motion.div>
    </div>
  )
}
