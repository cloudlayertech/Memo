import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function BackButton({ label = "Back" }: { label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate("/")}
      className="flex items-center gap-2 text-sm text-[#8B6F4E] font-semibold mb-4 hover:text-[#6B5337] transition-colors"
    >
      <ArrowLeft className="w-4 h-4" /> {label}
    </button>
  )
}
