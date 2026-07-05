import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Calendar } from "lucide-react"
import BackButton from "@/components/BackButton"

interface Note {
  id: string;
  date: string;
  text: string;
  mood: "good" | "okay" | "challenging";
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
    <div className="min-h-[100dvh] bg-memo-bg px-4 pt-5 pb-10">
      <div className="max-w-2xl mx-auto">
        <BackButton />
        <h1 className="text-3xl font-semibold text-memo-text mb-1">Care Notes</h1>
        <p className="text-base text-memo-text-secondary mb-5">Track observations and important moments</p>

        {/* New note form */}
        <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="What did you notice today? How are they doing?"
            className="w-full h-24 p-3 bg-memo-bg rounded-xl text-memo-text placeholder:text-memo-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              {(["good", "okay", "challenging"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    mood === m
                      ? "bg-primary text-white"
                      : "bg-memo-bg text-memo-text-secondary"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="space-y-3">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-card p-4"
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
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                  className="text-memo-text-tertiary hover:text-memo-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-memo-text whitespace-pre-wrap">{note.text}</p>
            </motion.div>
          ))}
          {notes.length === 0 && (
            <p className="text-center text-memo-text-tertiary py-8">
              No notes yet. Add your first observation above.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
