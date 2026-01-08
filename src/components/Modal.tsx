import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
            aria-label="Close modal"
          />

          <motion.div
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-zinc-100"
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Close
              </button>
            </div>

            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
