import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const nav = useNavigate();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    const { error } = await signUp(email.trim(), password);
    setBusy(false);

    if (error) {
      setErr(error);
      return;
    }

    nav("/login");
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-100 shadow-sm p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-zinc-500">You may need to confirm email.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          {err && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-zinc-900 text-white py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link className="font-medium underline" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
