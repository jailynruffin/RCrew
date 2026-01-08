import React, { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Employee = { id: string; name: string; role: string };
type Availability = { id: string; employee_id: string; day: string; start_time: string; end_time: string };

function toMinutes(t: string) {
  const [h, m] = t.split(":").map((x) => Number(x));
  return h * 60 + m;
}

export function AvailabilityForm({
  day,
  employee,
  existing,
  onSaved,
  onCancel,
}: {
  day: string;
  employee: Employee;
  existing: Availability | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [start, setStart] = useState(existing?.start_time ?? "09:00");
  const [end, setEnd] = useState(existing?.end_time ?? "17:00");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const label = useMemo(() => {
    return `${employee.name} • ${employee.role}`;
  }, [employee.name, employee.role]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (toMinutes(end) <= toMinutes(start)) {
      setErr("End time must be after start time.");
      return;
    }

    setBusy(true);

    if (existing?.id) {
      const { error } = await supabase
        .from("availabilities")
        .update({ start_time: start, end_time: end })
        .eq("id", existing.id);

      setBusy(false);

      if (error) {
        setErr(error.message);
        return;
      }

      onSaved();
      return;
    }

    const { error } = await supabase.from("availabilities").insert({
      employee_id: employee.id,
      day,
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
        <div className="text-zinc-900 font-medium">{label}</div>
        <div>
          Day: <span className="text-zinc-900 font-medium">{day}</span>
        </div>
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
          {busy ? "Saving…" : existing ? "Update availability" : "Add availability"}
        </button>
      </div>
    </form>
  );
}
