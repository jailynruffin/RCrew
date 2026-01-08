import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export function EmployeeForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Crew");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setErr("Name is required.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.from("employees").insert({
      name: trimmed,
      role: role.trim() || "Crew",
    });

    setBusy(false);

    if (error) {
      setErr(error.message);
      return;
    }

    onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <input
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Ava Carter"
          autoFocus
        />
      </div>

      <div>
        <label className="text-sm font-medium">Role</label>
        <input
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Lead"
        />
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          disabled={busy}
          className="rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Add employee"}
        </button>
      </div>
    </form>
  );
}
