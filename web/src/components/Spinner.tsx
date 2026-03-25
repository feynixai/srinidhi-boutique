'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label = 'Loading…' }: SpinnerProps) {
  const dim = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  const track = size === 'sm' ? 'border-2' : 'border-[3px]';

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label={label}>
      <div
        className={`${dim} ${track} border-[#c5a55a]/20 border-t-[#c5a55a] rounded-full animate-spin`}
      />
      {size !== 'sm' && (
        <p className="text-xs text-[#1a1a2e]/40 font-medium tracking-wide">{label}</p>
      )}
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-card px-10 py-10 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#c5a55a]/20 border-t-[#c5a55a] rounded-full animate-spin" />
        <p className="text-sm text-[#1a1a2e]/50 font-medium tracking-wide">Loading…</p>
      </div>
    </div>
  );
}
