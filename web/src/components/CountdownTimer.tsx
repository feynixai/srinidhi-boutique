'use client';
import { useState, useEffect } from 'react';

interface Props {
  endsAt: Date;
  label?: string;
}

export function CountdownTimer({ endsAt, label = 'Sale ends in' }: Props) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    function update() {
      const now = new Date();
      const diff = endsAt.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.expired) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3" data-testid="countdown-timer">
      <span className="text-sm font-medium text-[#1a1a2e]/70 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        {[
          { label: 'HRS', value: timeLeft.hours },
          { label: 'MIN', value: timeLeft.minutes },
          { label: 'SEC', value: timeLeft.seconds },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="text-center bg-[#1a1a2e] text-[#c5a55a] rounded-xl px-3 py-2 min-w-[52px]">
              <p className="text-2xl font-bold font-mono leading-none">{pad(unit.value)}</p>
              <p className="text-[9px] uppercase tracking-wider mt-0.5 text-[#c5a55a]/70">{unit.label}</p>
            </div>
            {i < 2 && <span className="text-[#1a1a2e]/30 text-xl font-bold">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
