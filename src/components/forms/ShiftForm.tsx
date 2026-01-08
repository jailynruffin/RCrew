import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function toMinutes(t: string) {
  const [h, m] = t.split(":").map((x) => Number(x));
  return h * 60 + m;
}

export function ShiftForm({
  day,
  onSaved,
  onCancel,
}: {
  day: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("New Shift");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const trimmed = title.trim();
    if (!trimmed) {
      setErr("Title is required.");
      return;
    }

    if (toMinutes(end) <= toMinutes(start)) {
      setErr("End time must be after start time.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.from("shifts").insert({
      day,
      title: trimmed,
      start_time: start,
      end_time: end,
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
      <div className="text-sm text-zinc-500">
        Day: <span className="text-zinc-900 font-medium">{day}</span>
      </div>

      <div>
        <label className="text-sm font-medium">Title</label>
        <input
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Lunch Rush"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Start</label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            type="time"
          />
        </div>
        <div>
          <label className="text-sm font-medium">End</label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            type="time"
          />
        </div>
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
          {busy ? "Saving…" : "Add shift"}
        </button>
      </div>
    </form>
  );
}
