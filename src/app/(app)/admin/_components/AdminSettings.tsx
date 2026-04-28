'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { addDivision, deleteDivision, addWorkType, deleteWorkType } from '../actions'
import type { Division, WorkType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AdminSettingsProps {
  divisions: Division[]
  workTypes: WorkType[]
}

export default function AdminSettings({ divisions, workTypes }: AdminSettingsProps) {
  return (
    <div className="flex gap-16">
      <ListManager
        title="Divisions"
        items={divisions.map(d => ({ id: d.id, name: d.name, protected: false }))}
        onAdd={addDivision}
        onDelete={deleteDivision}
      />
      <ListManager
        title="Work Types"
        items={workTypes.map(w => ({ id: w.id, name: w.name, protected: w.is_misc ?? false }))}
        onAdd={addWorkType}
        onDelete={deleteWorkType}
      />
    </div>
  )
}

interface ListItem {
  id: string
  name: string
  protected: boolean
}

interface ListManagerProps {
  title: string
  items: ListItem[]
  onAdd: (name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function ListManager({ title, items, onAdd, onDelete }: ListManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    if (!newName.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await onAdd(newName.trim())
        setNewName('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  function handleDelete(id: string) {
    setError(null)
    startTransition(async () => {
      try {
        await onDelete(id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <div className="min-w-48">
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <ul className="space-y-1 mb-3">
        {items.map(item => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className="text-sm">{item.name}</span>
            {!item.protected && (
              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                aria-label={`Delete ${item.name}`}
              >
                <X size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={`New ${title.slice(0, -1).toLowerCase()}`}
          className="h-8 text-sm"
          disabled={isPending}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={isPending || !newName.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  )
}