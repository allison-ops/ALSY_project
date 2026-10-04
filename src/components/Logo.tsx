export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-pink-400 text-white shadow-md shadow-pink-200/70 ${dim}`}
    >
      <svg viewBox="0 0 24 24" className={icon} fill="currentColor" aria-hidden>
        <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
        <circle cx="19" cy="19" r="2" />
      </svg>
    </span>
  );
}
