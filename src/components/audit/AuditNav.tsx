'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/audit', label: 'Dashboard' },
  { href: '/audit/agents', label: 'Agents' },
  { href: '/audit/workflows', label: 'Workflows' },
  { href: '/audit/traces', label: 'Traces' },
  { href: '/audit/prism', label: 'Prism' },
  { href: '/audit/metrics', label: 'Metrics' },
  { href: '/audit/prompts', label: 'Prompts' },
];

export function AuditNav() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/audit') {
      return pathname === '/audit';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-48 border-r border-[#1e293b] bg-[#fefcf3] font-mono">
      <div className="p-4">
        <div className="mb-4 border-b border-[#1e293b] pb-3">
          <div className="text-xl font-black tracking-tight text-[#0f172a]">
            BigTurbo
          </div>
          <div className="text-xs text-[#1e293b] opacity-70 mt-0.5">Agent Audit</div>
        </div>

        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? 'bg-[#1e293b] text-[#fefcf3]'
                      : 'text-[#0f172a] hover:bg-[#1e293b] hover:bg-opacity-10'
                  }`}
                >
                  <span className="mr-2">{active ? '\u2192' : '\u00a0\u00a0'}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 border-t border-[#1e293b] p-4">
        <div className="text-xs text-[#1e293b] opacity-60">
          <div>{'\u2248'} system status</div>
          <div className="mt-1">synced: active</div>
        </div>
      </div>
    </nav>
  );
}
