import { motion } from "framer-motion"
import { LogOut, User, Shield, Info } from "lucide-react"
import { useData } from "@/context/DataContext"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" as const },
  }),
}

export default function Settings() {
  const { personalInfo, disconnect } = useData()

  const handleDisconnect = () => {
    if (window.confirm("Are you sure you want to disconnect your Oura Ring?")) {
      disconnect()
    }
  }

  return (
    <div className="min-h-[100dvh] bg-memo-bg px-4 md:px-8 pt-6 pb-10">
      <div className="w-full max-w-3xl space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-4xl font-bold text-memo-text tracking-tight">Settings</h1>
          <p className="text-lg text-memo-text-secondary mt-1">Manage your account and preferences</p>
        </motion.div>

        {/* Connected Account */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#F5EDE3] flex items-center justify-center">
              <User className="w-7 h-7 text-[#8B6F4E]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-memo-text">Connected Account</h2>
              <p className="text-base text-memo-text-secondary">Oura Ring</p>
            </div>
          </div>

          {personalInfo && (
            <div className="bg-memo-bg rounded-xl p-5 space-y-3 mb-5">
              {personalInfo.name && (
                <div className="flex justify-between text-base">
                  <span className="text-memo-text-secondary">Name</span>
                  <span className="font-semibold text-memo-text">{personalInfo.name}</span>
                </div>
              )}
              {personalInfo.age && (
                <div className="flex justify-between text-base">
                  <span className="text-memo-text-secondary">Age</span>
                  <span className="font-semibold text-memo-text">{personalInfo.age}</span>
                </div>
              )}
              {personalInfo.biological_sex && (
                <div className="flex justify-between text-base">
                  <span className="text-memo-text-secondary">Sex</span>
                  <span className="font-semibold text-memo-text capitalize">
                    {personalInfo.biological_sex}
                  </span>
                </div>
              )}
              {personalInfo.weight && (
                <div className="flex justify-between text-base">
                  <span className="text-memo-text-secondary">Weight</span>
                  <span className="font-semibold text-memo-text">{personalInfo.weight} kg</span>
                </div>
              )}
              {personalInfo.height && (
                <div className="flex justify-between text-base">
                  <span className="text-memo-text-secondary">Height</span>
                  <span className="font-semibold text-memo-text">{personalInfo.height} cm</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 h-12 bg-memo-bg hover:bg-red-50 text-memo-danger rounded-xl transition-colors font-semibold text-base"
          >
            <LogOut className="w-5 h-5" />
            Disconnect Oura Ring
          </button>
        </motion.div>

        {/* Privacy */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-7 h-7 text-memo-success" />
            <h2 className="text-xl font-semibold text-memo-text">Data Privacy</h2>
          </div>
          <p className="text-base text-memo-text-secondary leading-relaxed">
            Your health data stays on your device and is only used to display insights in this app.
            Nothing is stored on our servers. Your Oura data is fetched directly from Oura&apos;s servers
            using your personal access token.
          </p>
        </motion.div>

        {/* About */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-7 h-7 text-[#8B6F4E]" />
            <h2 className="text-xl font-semibold text-memo-text">About Memo</h2>
          </div>
          <p className="text-base text-memo-text-secondary leading-relaxed">
            Memo is a personal health dashboard designed to help you and your loved ones monitor
            wellness metrics from your Oura Ring. It provides evidence-based recommendations
            to support healthy aging and cognitive well-being.
          </p>
          <p className="text-sm text-memo-text-tertiary mt-4">
            Built with care. Not intended as medical advice. Always consult your healthcare
            provider for medical concerns.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
