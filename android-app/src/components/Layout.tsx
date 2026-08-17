import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';

export function Layout({ children }: { children: ReactNode }) {
  const step = useLocation().pathname === '/solve' ? 3 : 1;
  return <div className="min-h-[100dvh] bg-[#08090c] text-white">
    <header className="safe-top sticky top-0 z-40 border-b border-white/10 bg-[#08090c]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 grid-cols-2 gap-1 rounded-xl bg-white/10 p-2"><i className="rounded bg-violet-500"/><i className="rounded bg-cyan-400"/><i className="rounded bg-yellow-400"/><i className="rounded bg-red-400"/></div><div><h1 className="font-bold">CubeSolver</h1><p className="text-[10px] uppercase tracking-[.16em] text-white/40">Android · офлайн</p></div></div>
        <div className="flex items-center gap-1 text-[11px] text-white/45">{['Цвета', 'Проверка', 'Решение'].map((label, index) => <span key={label} className={`grid h-8 min-w-8 place-items-center rounded-full px-2 ${index + 1 === step ? 'bg-white text-black' : index + 1 < step ? 'text-emerald-300' : ''}`}>{index + 1 < step ? <Check size={14}/> : index + 1}</span>)}</div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-7">{children}</main>
  </div>;
}
