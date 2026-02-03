'use client';

interface ShareActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function ShareAction({ icon, label, onClick, disabled = false }: ShareActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-3 p-4
        bg-white/5 hover:bg-white/10
        border border-white/10 hover:border-white/20
        rounded-2xl
        transition-all duration-150
        hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-900
      `}
      aria-label={label}
    >
      <div className="w-10 h-10 flex items-center justify-center text-white">
        {icon}
      </div>
      <span className="text-xs text-white/80 font-medium">
        {label}
      </span>
    </button>
  );
}
