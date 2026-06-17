import { useState } from "react"
import { createCommunity } from "../api/community"

export default function CreateCommunityModal({ close, refresh }) {

  const [form, setForm] = useState({
    name: "",
    description: ""
  })

  const handleSubmit = async (e) => {

    e.preventDefault()

    await createCommunity(form)

    refresh()
    close()

  }

  return (

    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-6 backdrop-blur-sm">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-outline-variant/30 bg-surface-container-lowest p-6 text-on-background shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      >

        <h2 className="text-lg font-semibold mb-4">
          Create Community
        </h2>

        <input
          placeholder="Community name"
          className="mb-3 w-full border border-outline-variant/30 bg-surface-container-low p-3 text-on-background outline-none placeholder:text-on-surface-variant focus:border-primary"
          onChange={(e)=>setForm({...form,name:e.target.value})}
        />

        <textarea
          placeholder="Description"
          className="mb-3 w-full border border-outline-variant/30 bg-surface-container-low p-3 text-on-background outline-none placeholder:text-on-surface-variant focus:border-primary"
          onChange={(e)=>setForm({...form,description:e.target.value})}
        />

        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={close}
            className="border border-outline px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface"
          >
            Cancel
          </button>

          <button className="bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary">
            Create
          </button>

        </div>

      </form>

    </div>

  )
}
