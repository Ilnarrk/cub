import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, Check } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { BeginnerGuideModal } from '@shared/ui/BeginnerGuideModal';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const { pathname } = useLocation();
  const [guideOpen, setGuideOpen] = useState(false);
  const currentStep = pathname === '/solve' ? 3 : 1;
  const steps = ['Цвета', 'Проверка', 'Решение'];
  return (
    <div className={cn('relative min-h-screen overflow-hidden', className)}>
      <div className="ambient-orb pointer-events-none fixed -left-32 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-[110px]" />
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090c]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="relative grid h-9 w-9 grid-cols-2 gap-[3px] rounded-xl border border-white/10 bg-white/[0.07] p-2 shadow-[0_0_30px_rgba(124,92,255,.25)]">
              <span className="rounded-[2px] bg-[#7c5cff]"/><span className="rounded-[2px] bg-[#00c5ff]"/><span className="rounded-[2px] bg-[#ffce3a]"/><span className="rounded-[2px] bg-[#ff5b65]"/>
            </div>
            <div><h1 className="text-[15px] font-bold tracking-[-.02em]">Cube Studio</h1><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Кубик 3×3</p></div>
          </div>
          <div className="hidden items-center gap-1.5 md:flex">
            {steps.map((label, index) => {
              const step = index + 1; const done = step < currentStep; const active = step === currentStep;
              return <div key={label} className="flex items-center"><div className={cn('flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors', active ? 'bg-white text-black' : done ? 'text-emerald-300' : 'text-white/35')}><span className={cn('grid h-5 w-5 place-items-center rounded-full text-[10px]', active ? 'bg-black text-white' : done ? 'bg-emerald-400/15' : 'bg-white/[.06]')}>{done ? <Check size={12}/> : step}</span>{label}</div>{index < 2 && <span className="mx-1 h-px w-5 bg-white/10"/>}</div>;
            })}
          </div>
          <button type="button" onClick={() => setGuideOpen(true)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-white"><BookOpen size={16}/><span className="hidden sm:inline">Как собирать</span></button>
        </div>
      </header>
      <main className="relative mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center px-6 py-5 text-xs text-white/30 lg:px-10">
          <p>Cube Studio · помощник по сборке</p>
        </div>
      </footer>
      <BeginnerGuideModal open={guideOpen} onClose={() => setGuideOpen(false)}/>
    </div>
  );
}
