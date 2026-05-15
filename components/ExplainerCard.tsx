"use client";

import { motion } from "framer-motion";
import { getExplainer } from "@/lib/ai/context-loader";

interface ExplainerCardProps {
  command: string;
}

export function ExplainerCard({ command }: ExplainerCardProps) {
  const explainer = getExplainer(command);
  if (!explainer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="bg-slate-900/60 border border-cyan-400/10 rounded-lg p-4 my-2 space-y-3">
        <div>
          <span className="text-xs font-medium text-slate-500">
            What it does
          </span>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            {explainer.plainEnglish}
          </p>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-lg leading-none">💡</span>
          <div>
            <span className="text-xs font-medium text-amber-400/70">
              Analogy
            </span>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {explainer.analogy}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-lg leading-none">⚠️</span>
          <div>
            <span className="text-xs font-medium text-rose-400/70">
              Common Mistake
            </span>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {explainer.commonMistake}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-lg leading-none">✅</span>
          <div>
            <span className="text-xs font-medium text-emerald-400/70">
              Pro Tip
            </span>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {explainer.tip}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
