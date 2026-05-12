"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoffeeModal({ isOpen, onClose }: CoffeeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-panel-strong rounded-xl border border-amber-400/20 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-300">Support DQL Detective</h2>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                &#10005;
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              If you find this project useful, consider supporting its development.
              Every bit of encouragement helps keep the cases coming.
            </p>

            <div className="rounded-lg border border-white/[0.06] bg-slate-900/40 p-4 space-y-2">
              <p className="text-xs text-slate-400">
                Reach out for support, collaboration, or just to say hi:
              </p>
              <a
                href="mailto:maheedhartalluri@gmail.com"
                className="text-sm text-cyan-400 hover:underline break-all"
              >
                maheedhartalluri@gmail.com
              </a>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onClose}
              className="w-full py-2.5 rounded-md text-sm font-medium bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30 transition-colors"
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
