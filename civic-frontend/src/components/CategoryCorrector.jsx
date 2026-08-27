import { useState } from 'react'
import { chatApi } from '../api/chatApi'

const VALID_CATEGORIES = [
  'Pothole', 'Garbage', 'Waterlogging', 'Streetlight', 'Drainage',
  'Sewage', 'Road Damage', 'Footpath', 'Illegal Construction',
  'Fallen Tree', 'Water Leakage', 'Other'
]

/**
 * CategoryCorrector — lets an admin fix a wrong AI-suggested category
 * directly from the Issue Details page. Every correction is logged to
 * category_feedback on the backend, building a labeled dataset that
 * can be used later to fine-tune a dedicated classifier or expand the
 * few-shot prompt examples with real failure cases.
 *
 * Props:
 *   issue          — current issue object { id, category, ... }
 *   aiConfidence   — optional, the confidence the AI originally reported
 *   onCorrected    — callback(updatedIssue) after a successful correction
 */
export default function CategoryCorrector({ issue, aiConfidence, onCorrected }) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState(issue.category)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    if (selected === issue.category) { setEditing(false); return }
    setSaving(true)
    setError(null)
    try {
      const res = await chatApi.correctCategory(issue.id, selected, aiConfidence ?? null)
      onCorrected?.(res.data.data)
      setEditing(false)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        title="Correct the AI-suggested category — helps improve future classification"
        className="inline-flex items-center gap-1.5 text-xs text-[#8C959F]
                   hover:text-[#1B3A6B] dark:hover:text-[#4A90D9] transition-colors
                   border-b border-dashed border-[#D0D7DE] dark:border-[#30363D]"
      >
        <PencilIcon className="w-3 h-3" />
        Wrong category? Fix it
      </button>
    )
  }

  return (
    <div className="bg-[#F5F7FA] dark:bg-[#0D1117] border border-[#D0D7DE]
                    dark:border-[#30363D] rounded-lg p-3 space-y-2">
      <p className="text-xs text-[#57606A] dark:text-[#8B949E]">
        Correcting this helps train the AI classifier for future submissions.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {VALID_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all
              ${selected === cat
                ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white'
                : 'bg-white dark:bg-[#161B22] border-[#D0D7DE] dark:border-[#30363D] ' +
                  'text-[#57606A] dark:text-[#8B949E] hover:border-[#1B3A6B]/40'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      {error && <p className="text-[#C0392B] text-xs">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="text-xs px-3 py-1.5 rounded-md font-semibold text-white
                     bg-[#F4811F] hover:bg-[#e07318] disabled:opacity-50
                     transition-colors">
          {saving ? 'Saving…' : 'Save Correction'}
        </button>
        <button onClick={() => { setEditing(false); setSelected(issue.category) }}
          className="text-xs px-3 py-1.5 rounded-md text-[#8C959F]
                     hover:text-[#57606A] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
