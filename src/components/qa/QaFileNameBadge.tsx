"use client";

interface QaFileNameBadgeProps {
  file: string;
  className?: string;
  position?: "inline" | "fixed";
}

function shouldShowQaBadges() {
  return process.env.NEXT_PUBLIC_QA_FILE_BADGES === "true";
}

export function QaFileNameBadge({
  file,
  className = "",
  position = "inline",
}: QaFileNameBadgeProps) {
  if (!shouldShowQaBadges()) {
    return null;
  }

  const label = (
    <span
      className="pointer-events-auto inline-flex max-w-[min(88vw,720px)] cursor-text items-center overflow-x-auto whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-900 shadow-sm select-text print:hidden dark:border-amber-600/60 dark:bg-amber-950/80 dark:text-amber-100"
      title={file}
      data-qa-file-badge={file}
    >
      Archivo: {file}
    </span>
  );

  if (position === "fixed") {
    return (
      <div className="pointer-events-auto fixed right-4 top-20 z-[9999] hidden justify-end md:flex">
        {label}
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-auto col-span-full mb-2 flex justify-end ${className}`.trim()}
    >
      {label}
    </div>
  );
}
