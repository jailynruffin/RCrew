import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { supabase } from "../lib/supabaseClient";
import { Modal } from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { EmployeeForm } from "../components/forms/EmployeeForm";
import { ShiftForm } from "../components/forms/ShiftForm";
import { AvailabilityForm } from "../components/forms/AvailabilityForm";

type Employee = { id: string; name: string; role: string };
type Shift = { id: string; day: string; start_time: string; end_time: string; title: string };
type Availability = { id: string; employee_id: string; day: string; start_time: string; end_time: string };
type Assignment = { id: string; shift_id: string; employee_id: string };

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function coversShift(shift: Shift, a?: Availability) {
  if (!a) return false;
  const s1 = timeToMinutes(shift.start_time);
  const e1 = timeToMinutes(shift.end_time);
  const s2 = timeToMinutes(a.start_time);
  const e2 = timeToMinutes(a.end_time);
  return s2 <= s1 && e2 >= e1;
}

export function SchedulePage() {
  const { signOut } = useAuth();

  const [day, setDay] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);

  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [addShiftOpen, setAddShiftOpen] = useState(false);

  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityEmployeeId, setAvailabilityEmployeeId] = useState<string | null>(null);

  const niceDay = useMemo(() => format(parseISO(day), "EEE, MMM d"), [day]);

  const employeeById = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const e of employees) map.set(e.id, e);
    return map;
  }, [employees]);

  const assignedByShiftId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assignments) map.set(a.shift_id, a.employee_id);
    return map;
  }, [assignments]);

  const availabilityByEmployeeId = useMemo(() => {
    const map = new Map<string, Availability>();
    for (const a of availabilities) {
      if (a.day === day) map.set(a.employee_id, a);
    }
    return map;
  }, [availabilities, day]);

  const activeShift = useMemo(
    () => shifts.find((s) => s.id === activeShiftId) ?? null,
    [shifts, activeShiftId]
  );

  const activeAvailabilityEmployee = useMemo(() => {
    if (!availabilityEmployeeId) return null;
    return employeeById.get(availabilityEmployeeId) ?? null;
  }, [availabilityEmployeeId, employeeById]);

  const existingAvailability = useMemo(() => {
    if (!availabilityEmployeeId) return null;
    return availabilityByEmployeeId.get(availabilityEmployeeId) ?? null;
  }, [availabilityEmployeeId, availabilityByEmployeeId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const [eRes, sRes, aRes, asnRes] = await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("shifts").select("*").eq("day", day).order("start_time"),
      supabase.from("availabilities").select("*").eq("day", day),
      supabase.from("assignments").select("*"),
    ]);

    const msg =
      eRes.error?.message ||
      sRes.error?.message ||
      aRes.error?.message ||
      asnRes.error?.message ||
      null;

    if (msg) {
      setErr(msg);
      setLoading(false);
      return;
    }

    setEmployees((eRes.data ?? []) as Employee[]);
    setShifts((sRes.data ?? []) as Shift[]);
    setAvailabilities((aRes.data ?? []) as Availability[]);
    setAssignments((asnRes.data ?? []) as Assignment[]);
    setLoading(false);
  }, [day]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const channel = supabase
      .channel("rcrew-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "availabilities" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, loadAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  const availableForActiveShift = useMemo(() => {
    if (!activeShift) return [];
    return employees
      .filter((emp) => coversShift(activeShift, availabilityByEmployeeId.get(emp.id)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, activeShift, availabilityByEmployeeId]);

  function openAssignModal(shiftId: string) {
    setActiveShiftId(shiftId);
    setAssignOpen(true);
    setErr(null);
  }

  async function assignEmployee(employeeId: string) {
    if (!activeShift) return;

    setAssignSaving(true);
    setErr(null);

    const { error } = await supabase
      .from("assignments")
      .upsert({ shift_id: activeShift.id, employee_id: employeeId }, { onConflict: "shift_id" });

    setAssignSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setAssignOpen(false);
  }

  function openAvailabilityModal(employeeId: string) {
    setAvailabilityEmployeeId(employeeId);
    setAvailabilityOpen(true);
    setErr(null);
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur border-b border-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">RCrew Scheduler</div>
            <div className="text-xs text-zinc-500">Realtime assignment + availability filtering</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              type="date"
            />

            <button
              onClick={() => setAddShiftOpen(true)}
              className="rounded-xl bg-zinc-900 text-white px-3 py-2 text-sm hover:bg-zinc-800"
            >
              Add shift
            </button>

            <button
              onClick={() => setAddEmployeeOpen(true)}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              Add employee
            </button>

            <button
              onClick={signOut}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Schedule</h2>
            <p className="text-sm text-zinc-500">{niceDay}</p>
          </div>
          <button
            onClick={loadAll}
            className="rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-zinc-100 shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-100">
              <div className="font-semibold">Shifts</div>
              <div className="text-xs text-zinc-500">Assign opens a filtered modal</div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="text-sm text-zinc-500">Loading…</div>
              ) : shifts.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  No shifts for this day. Add one to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {shifts.map((s) => {
                    const assignedEmployeeId = assignedByShiftId.get(s.id);
                    const assigned = assignedEmployeeId ? employeeById.get(assignedEmployeeId) : null;

                    return (
                      <div key={s.id} className="rounded-2xl border border-zinc-100 p-4 hover:shadow-sm transition">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{s.title}</div>
                            <div className="text-sm text-zinc-500">
                              {s.start_time} – {s.end_time}
                            </div>
                          </div>

                          <button
                            onClick={() => openAssignModal(s.id)}
                            className="rounded-xl bg-zinc-900 text-white px-3 py-2 text-sm hover:bg-zinc-800"
                          >
                            Assign
                          </button>
                        </div>

                        <div className="mt-3 text-sm">
                          <span className="text-zinc-500">Assigned:</span>{" "}
                          <span className={clsx(assigned ? "text-zinc-900" : "text-zinc-400")}>
                            {assigned ? `${assigned.name} (${assigned.role})` : "Unassigned"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-100">
              <div className="font-semibold">Employees</div>
              <div className="text-xs text-zinc-500">Availability for {niceDay}</div>
            </div>

            <div className="p-5 space-y-3">
              {loading ? (
                <div className="text-sm text-zinc-500">Loading…</div>
              ) : employees.length === 0 ? (
                <div className="text-sm text-zinc-500">No employees yet. Add one.</div>
              ) : (
                employees.map((e) => {
                  const a = availabilityByEmployeeId.get(e.id);
                  const status = a ? `${a.start_time}–${a.end_time}` : "Not available";

                  return (
                    <div key={e.id} className="rounded-2xl border border-zinc-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{e.name}</div>
                          <div className="text-xs text-zinc-500">{e.role}</div>
                        </div>

                        <button
                          onClick={() => openAvailabilityModal(e.id)}
                          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50"
                        >
                          Availability
                        </button>
                      </div>

                      <div className={clsx("mt-2 text-sm", a ? "text-zinc-900" : "text-zinc-400")}>
                        {status}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      <Modal
        open={assignOpen}
        title={
          activeShift
            ? `Assign: ${activeShift.title} (${activeShift.start_time}–${activeShift.end_time})`
            : "Assign"
        }
        onClose={() => setAssignOpen(false)}
      >
        {!activeShift ? (
          <div className="text-sm text-zinc-500">No shift selected.</div>
        ) : (
          <>
            <p className="text-sm text-zinc-500">Employees must cover the full shift window.</p>

            <div className="mt-4 space-y-2">
              {availableForActiveShift.length === 0 ? (
                <div className="text-sm text-zinc-500">No matches for this shift.</div>
              ) : (
                availableForActiveShift.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => assignEmployee(e.id)}
                    disabled={assignSaving}
                    className="w-full text-left rounded-xl border border-zinc-200 px-3 py-3 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-zinc-500">{e.role}</div>
                  </button>
                ))
              )}
            </div>

            {assignSaving && <div className="mt-3 text-xs text-zinc-500">Saving…</div>}
          </>
        )}
      </Modal>

      {/* Add employee modal */}
      <Modal open={addEmployeeOpen} title="Add employee" onClose={() => setAddEmployeeOpen(false)}>
        <EmployeeForm
          onCancel={() => setAddEmployeeOpen(false)}
          onSaved={async () => {
            setAddEmployeeOpen(false);
            await loadAll();
          }}
        />
      </Modal>

      {/* Add shift modal */}
      <Modal open={addShiftOpen} title="Add shift" onClose={() => setAddShiftOpen(false)}>
        <ShiftForm
          day={day}
          onCancel={() => setAddShiftOpen(false)}
          onSaved={async () => {
            setAddShiftOpen(false);
            await loadAll();
          }}
        />
      </Modal>

      {/* Availability modal */}
      <Modal
        open={availabilityOpen}
        title="Set availability"
        onClose={() => setAvailabilityOpen(false)}
      >
        {activeAvailabilityEmployee ? (
          <AvailabilityForm
            day={day}
            employee={activeAvailabilityEmployee}
            existing={existingAvailability}
            onCancel={() => setAvailabilityOpen(false)}
            onSaved={async () => {
              setAvailabilityOpen(false);
              await loadAll();
            }}
          />
        ) : (
          <div className="text-sm text-zinc-500">No employee selected.</div>
        )}
      </Modal>
    </div>
  );
}
