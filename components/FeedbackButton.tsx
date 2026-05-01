"use client";

interface FeedbackButtonProps {
  page: string;
}

export function FeedbackButton({ page }: FeedbackButtonProps) {
  const subject = encodeURIComponent(`Feedback: ${page}`);
  const body = encodeURIComponent(`Page: ${page}\n\nHi,\n\nHere's my feedback:\n\n`);
  const href = `mailto:maheedhartalluri@gmail.com?subject=${subject}&body=${body}`;

  return (
    <a
      href={href}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 border border-white/[0.08] hover:border-white/[0.14] backdrop-blur-sm transition-colors shadow-lg"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      Feedback
    </a>
  );
}
