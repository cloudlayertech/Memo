import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function BackButton({ label = "Back" }: { label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1 text-sm text-primary font-medium mb-4"
    >
      <ArrowLeft className="w-4 h-4" /> {label}
    </button>
  )
}
