import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, Eraser, Loader2, Shuffle } from 'lucide-react';
import type { FaceName } from '@shared/types/api';
import { COLOR_LABELS, FACE_COLORS, FACE_NAMES } from '@shared/constants/cube';
import { normalizeFaceletsByCentres, validateCubeLocally } from '@shared/lib/cubeValidation';
import { Cube3D } from '@widgets/Cube3D';
import { EMPTY, loadSession, saveSession } from '@/storage';
import { localSolver } from '@/solver/service';
import { isRequestCurrent } from '@/solver/core';

export function ReviewPage() {
  const navigate = useNavigate();
  const [facelets, setFacelets] = useState(EMPTY.visualFacelets);
  const [selected, setSelected] = useState<FaceName>('U');
  const [hydrated, setHydrated] = useState(false);
  const [ready, setReady] = useState(false);
  const [working, setWorking] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [error, setError] = useState('');
  const [physical, setPhysical] = useState({ checking: false, valid: false, detail: '' });
  const currentFacelets = useRef(facelets);

  useEffect(() => { currentFacelets.current = facelets; }, [facelets]);
  useEffect(() => {
    let active = true;
    void loadSession().then((session) => { if (active) { setFacelets(session.visualFacelets); setHydrated(true); } });
    void localSolver.initialize().then(() => { if (active) setReady(true); }).catch(() => { if (active) setError('Не удалось подготовить локальный решатель.'); });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => Object.fromEntries(FACE_NAMES.map((color) => [color, [...facelets].filter((item) => item === color).length])) as Record<FaceName, number>, [facelets]);
  const normalized = useMemo(() => normalizeFaceletsByCentres(facelets), [facelets]);
  const localIssues = useMemo(() => facelets.includes('X') ? validateCubeLocally(facelets) : normalized ? validateCubeLocally(normalized) : [{ code: 'centres', message: 'Шесть центров должны иметь разные цвета.', indices: [] }], [facelets, normalized]);
  const issueMessages = useMemo(() => [...new Set(localIssues.map((issue) => issue.message))], [localIssues]);

  useEffect(() => {
    if (localIssues.length || !normalized) { setPhysical({ checking: false, valid: false, detail: '' }); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      setPhysical({ checking: true, valid: false, detail: '' });
      void localSolver.validate(normalized).then((result) => { if (active) setPhysical({ checking: false, valid: result.valid, detail: result.detail ?? '' }); }).catch(() => { if (active) setPhysical({ checking: false, valid: false, detail: 'Проверка завершилась с ошибкой.' }); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [localIssues.length, normalized]);

  const persistCube = (next: string) => {
    setFacelets(next);
    setError('');
    void saveSession({ ...EMPTY, visualFacelets: next });
  };
  const paint = (index: number, color: FaceName) => {
    if (facelets[index] === color) return;
    if (counts[color] >= 9) { setError(`Все 9 стикеров цвета «${COLOR_LABELS[color]}» уже отмечены.`); return; }
    persistCube(facelets.slice(0, index) + color + facelets.slice(index + 1));
  };
  const solve = async () => {
    if (!normalized) return;
    setWorking(true); setError('');
    const source = facelets;
    try {
      const solution = await localSolver.solve(normalized);
      if (!isRequestCurrent(source, currentFacelets.current)) return;
      await saveSession({ version: 1, visualFacelets: source, solverFacelets: normalized, solution, step: 0 });
      navigate('/solve', { state: { solution, visualFacelets: source, solverFacelets: normalized } });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось решить куб.'); }
    finally { setWorking(false); }
  };
  const randomize = async () => {
    setRandomizing(true);
    try { persistCube(await localSolver.randomState()); } catch { setError('Не удалось создать пример.'); }
    finally { setRandomizing(false); }
  };
  const canSolve = hydrated && ready && !localIssues.length && physical.valid;

  return <section className="space-y-4">
    <div><h2 className="text-3xl font-black tracking-tight">Введите цвета кубика</h2><p className="mt-1 text-sm text-white/45">Выберите цвет и коснитесь нужного стикера. Интернет не требуется.</p></div>
    <div className="grid gap-4 landscape:grid-cols-[minmax(0,1.4fr)_360px]">
      <div className="card overflow-hidden p-2"><Cube3D facelets={facelets} selectedColor={selected} onStickerChange={paint}/></div>
      <aside className="space-y-3">
        <div className="card p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Палитра</h3><span className="text-xs text-white/35">нажмите цвет</span></div><div className="grid grid-cols-3 gap-2">{FACE_NAMES.map((color) => <button key={color} type="button" onClick={() => setSelected(color)} aria-pressed={selected === color} className={`relative min-h-16 rounded-2xl border p-2 text-center ${selected === color ? 'border-white/50 bg-white/15' : 'border-white/10 bg-white/5'}`}><span className="mx-auto block h-8 w-8 rounded-lg border border-white/30" style={{ background: FACE_COLORS[color] }}/><span className="mt-1 block truncate text-[10px]">{COLOR_LABELS[color]}</span><span className={`text-[10px] ${counts[color] === 9 ? 'text-emerald-300' : 'text-white/40'}`}>{counts[color]}/9</span>{selected === color && <Check className="absolute right-1 top-1" size={13}/>}</button>)}</div></div>
        <div className={`rounded-2xl border p-4 ${canSolve ? 'border-emerald-400/25 bg-emerald-400/10' : 'border-amber-300/20 bg-amber-300/[.07]'}`}>{physical.checking ? <p className="flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={17}/>Проверяем конфигурацию…</p> : canSolve ? <p className="text-sm font-bold text-emerald-200">Куб готов к решению</p> : <div><p className="flex items-center gap-2 text-sm font-bold text-amber-100"><AlertTriangle size={17}/>Продолжите ввод</p>{issueMessages.slice(0,2).map((message) => <p key={message} className="mt-1 text-xs text-white/50">{message}</p>)}{physical.detail && <p className="mt-1 text-xs text-white/50">{physical.detail}</p>}</div>}</div>
        {!ready && <p aria-live="polite" className="text-center text-xs text-violet-200/70">Подготовка автономного решателя…</p>}
        {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">{error}</p>}
        <div className="grid grid-cols-2 gap-2"><button className="action action-secondary flex items-center justify-center gap-2" onClick={() => persistCube(EMPTY.visualFacelets)}><Eraser size={17}/>Сбросить</button><button className="action action-secondary flex items-center justify-center gap-2" disabled={randomizing} onClick={randomize}><Shuffle size={17}/>Пример</button></div>
        <button className="action action-primary safe-bottom flex w-full items-center justify-center gap-2" disabled={!canSolve || working} onClick={solve}>{working ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18}/>}Найти решение</button>
      </aside>
    </div>
  </section>;
}
