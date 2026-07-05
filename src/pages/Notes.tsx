import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Calendar } from "lucide-react"

interface Note {
  id: string;
  date: string;
  text: string;
  mood: "good" | "okay" | "challenging";
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" as const },
  }),
}

export default function Notes() {
  // Use localStorage to persist notes
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem("memo_notes") || "[]") }
    catch { return [] }
  })
  const [newNote, setNewNote] = useState("")
  const [mood, setMood] = useState<"good" | "okay" | "challenging">("good")

  const saveNotes = (updated: Note[]) => {
    setNotes(updated)
    localStorage.setItem("memo_notes", JSON.stringify(updated))
  }

  const addNote = () => {
    if (!newNote.trim()) return
    const note: Note = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      text: newNote.trim(),
      mood,
    }
    saveNotes([note, ...notes])
    setNewNote("")
  }

  const deleteNote = (id: string) => saveNotes(notes.filter((n) => n.id !== id))

  return (
    <div className="min-h-[100dvh] bg-memo-bg px-4 md:px-8 pt-6 pb-10">
      <div className="w-full max-w-3xl space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-4xl font-bold text-memo-text tracking-tight">Care Notes</h1>
          <p className="text-lg text-memo-text-secondary mt-1">Track observations and important moments</p>
        </motion.div>

        {/* New note form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl shadow-card p-5"
        >
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="What did you notice today? How are they doing?"
            className="w-full h-28 p-4 bg-memo-bg rounded-xl text-memo-text placeholder:text-memo-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-[#8B6F4E]/30 text-base"
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              {(["good", "okay", "challenging"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                    mood === m
                      ? "bg-[#8B6F4E] text-white shadow-sm"
                      : "bg-memo-bg text-memo-text-secondary hover:bg-[#F5EDE3]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="flex items-center gap-2 bg-[#8B6F4E] hover:bg-[#6B5337] text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>
        </motion.div>

        {/* Notes list */}
        <div className="space-y-4">
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl shadow-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm text-memo-text-tertiary mb-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(note.date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      note.mood === "good"
                        ? "bg-green-100 text-green-700"
                        : note.mood === "okay"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {note.mood}
                  </span>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-memo-text-tertiary hover:text-memo-danger transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-memo-text whitespace-pre-wrap text-base leading-relaxed">{note.text}</p>
            </motion.div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-16">
              <p className="text-memo-text-tertiary text-lg">
                No notes yet. Add your first observation above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
