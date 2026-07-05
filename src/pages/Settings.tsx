import { motion } from "framer-motion"
import { LogOut, User, Shield, Info } from "lucide-react"
import { useData } from "@/context/DataContext"

export default function Settings() {
  const { personalInfo, disconnect } = useData()

  const handleDisconnect = () => {
    if (window.confirm("Are you sure you want to disconnect your Oura Ring?")) {
      disconnect()
    }
  }

  return (
    <div className="min-h-[100dvh] bg-memo-bg px-4 pt-5 pb-10">
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-semibold text-memo-text mb-1">Settings</h1>
          <p className="text-base text-memo-text-secondary">Manage your account and preferences</p>
        </motion.div>

        {/* Connected Account */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-memo-primary-light flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-memo-text">Connected Account</h2>
              <p className="text-sm text-memo-text-secondary">Oura Ring</p>
            </div>
          </div>

          {personalInfo && (
            <div className="bg-memo-bg rounded-xl p-4 space-y-2 mb-4">
              {personalInfo.name && (
                <div className="flex justify-between text-sm">
                  <span className="text-memo-text-secondary">Name</span>
                  <span className="font-medium text-memo-text">{personalInfo.name}</span>
                </div>
              )}
              {personalInfo.age && (
                <div className="flex justify-between text-sm">
                  <span className="text-memo-text-secondary">Age</span>
                  <span className="font-medium text-memo-text">{personalInfo.age}</span>
                </div>
              )}
              {personalInfo.biological_sex && (
                <div className="flex justify-between text-sm">
                  <span className="text-memo-text-secondary">Sex</span>
                  <span className="font-medium text-memo-text capitalize">
                    {personalInfo.biological_sex}
                  </span>
                </div>
              )}
              {personalInfo.weight && (
                <div className="flex justify-between text-sm">
                  <span className="text-memo-text-secondary">Weight</span>
                  <span className="font-medium text-memo-text">{personalInfo.weight} kg</span>
                </div>
              )}
              {personalInfo.height && (
                <div className="flex justify-between text-sm">
                  <span className="text-memo-text-secondary">Height</span>
                  <span className="font-medium text-memo-text">{personalInfo.height} cm</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 h-12 bg-memo-bg hover:bg-red-50 text-memo-danger rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Disconnect Oura Ring
          </button>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-memo-success" />
            <h2 className="text-lg font-semibold text-memo-text">Data Privacy</h2>
          </div>
          <p className="text-sm text-memo-text-secondary leading-relaxed">
            Your health data stays on your device and is only used to display insights in this app.
            Nothing is stored on our servers. Your Oura data is fetched directly from Oura's servers
            using your personal access token.
          </p>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <Info className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-memo-text">About Memo</h2>
          </div>
          <p className="text-sm text-memo-text-secondary leading-relaxed">
            Memo is a personal health dashboard designed to help you and your loved ones monitor
            wellness metrics from your Oura Ring. It provides evidence-based recommendations
            to support healthy aging and cognitive well-being.
          </p>
          <p className="text-xs text-memo-text-tertiary mt-3">
            Built with care. Not intended as medical advice. Always consult your healthcare
            provider for medical concerns.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
