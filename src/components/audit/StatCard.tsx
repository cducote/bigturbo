'use client';

export interface StatCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
}

export function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <div className="border border-[#1e293b] bg-[#fefcf3] p-4 font-mono">
      <p className="text-xs uppercase tracking-wide text-[#1e293b] opacity-60">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-[#0f172a]">{value}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-[#1e293b] opacity-70">{subtitle}</p>
      )}
    </div>
  );
}
