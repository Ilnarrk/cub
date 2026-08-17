import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import { FACE_COLORS, FACE_NAMES } from '@shared/constants/cube';
import type { FaceName } from '@shared/types/api';

type Vector3 = [number, number, number];
type StickerSpec = { face: FaceName; index: number; position: Vector3; rotation: Vector3; cubiePosition: Vector3 };

interface Cube3DProps {
  facelets?: string;
  selectedColor?: FaceName;
  onStickerChange?: (index: number, color: FaceName) => void;
  compact?: boolean;
  cameraPosition?: Vector3;
  fullscreenOverlay?: ReactNode;
  activeMove?: string;
  animationKey?: number;
  replayToken?: number;
  allowOrbit?: boolean;
}

function Cubie() {
  return <mesh><boxGeometry args={[0.92, 0.92, 0.92]} /><meshStandardMaterial color="#111827" roughness={0.72} /></mesh>;
}

function stickerSpecs(): StickerSpec[] {
  const specs: StickerSpec[] = [];
  const add = (face: FaceName, row: number, column: number, position: Vector3, rotation: Vector3, cubiePosition: Vector3) => specs.push({ face, index: FACE_NAMES.indexOf(face) * 9 + row * 3 + column, position, rotation, cubiePosition });
  for (let row = 0; row < 3; row += 1) for (let column = 0; column < 3; column += 1) {
    const across = column - 1;
    const down = 1 - row;
    add('F', row, column, [across, down, 1.47], [0, 0, 0], [across, down, 1]);
    add('B', row, column, [-across, down, -1.47], [0, Math.PI, 0], [-across, down, -1]);
    add('R', row, column, [1.47, down, 1 - column], [0, Math.PI / 2, 0], [1, down, 1 - column]);
    add('L', row, column, [-1.47, down, column - 1], [0, -Math.PI / 2, 0], [-1, down, column - 1]);
    add('U', row, column, [across, 1.47, row - 1], [-Math.PI / 2, 0, 0], [across, 1, row - 1]);
    add('D', row, column, [across, -1.47, 1 - row], [Math.PI / 2, 0, 0], [across, -1, 1 - row]);
  }
  return specs;
}

const STICKERS = stickerSpecs();
const CUBIE_POSITIONS: Vector3[] = [-1, 0, 1].flatMap((x) => [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((z) => [x, y, z] as Vector3)));
const positionKey = ([x, y, z]: Vector3) => `${x}:${y}:${z}`;
const STICKERS_BY_CUBIE = new Map<string, StickerSpec[]>();
STICKERS.forEach((sticker) => {
  const key = positionKey(sticker.cubiePosition);
  STICKERS_BY_CUBIE.set(key, [...(STICKERS_BY_CUBIE.get(key) ?? []), sticker]);
});

function CubieWithStickers({ position, facelets, selectedColor, onStickerChange }: { position: Vector3; facelets: string; selectedColor?: FaceName; onStickerChange?: (index: number, color: FaceName) => void }) {
  return <group position={position}><Cubie />{(STICKERS_BY_CUBIE.get(positionKey(position)) ?? []).map((sticker) => {
    const color = (facelets[sticker.index] ?? 'X') as FaceName | 'X';
    const editable = Boolean(onStickerChange);
    const localPosition: Vector3 = [sticker.position[0] - position[0], sticker.position[1] - position[1], sticker.position[2] - position[2]];
    return <mesh key={sticker.index} position={localPosition} rotation={sticker.rotation} onClick={(event) => { event.stopPropagation(); if (editable && selectedColor) onStickerChange?.(sticker.index, selectedColor); }}>
      <planeGeometry args={[0.76, 0.76]} />
      <meshStandardMaterial color={color === 'X' ? '#334155' : FACE_COLORS[color]} roughness={0.42} toneMapped={false} />
    </mesh>;
  })}</group>;
}

type MoveDefinition = { axis: 'x' | 'y' | 'z'; layer: number; direction: number };
const MOVES: Record<string, MoveDefinition> = {
  R: { axis: 'x', layer: 1, direction: -1 }, L: { axis: 'x', layer: -1, direction: 1 },
  U: { axis: 'y', layer: 1, direction: -1 }, D: { axis: 'y', layer: -1, direction: 1 },
  F: { axis: 'z', layer: 1, direction: -1 }, B: { axis: 'z', layer: -1, direction: 1 },
};

const FACE_NORMALS: Record<FaceName, Vector3> = { U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1] };
const NORMAL_TO_FACE = new Map(Object.entries(FACE_NORMALS).map(([face, normal]) => [positionKey(normal), face as FaceName]));
const STICKER_BY_CUBIE_AND_FACE = new Map(STICKERS.map((sticker) => [`${positionKey(sticker.cubiePosition)}|${sticker.face}`, sticker]));

function rotateVector([x, y, z]: Vector3, axis: MoveDefinition['axis'], direction: number): Vector3 {
  if (axis === 'x') return direction > 0 ? [x, -z, y] : [x, z, -y];
  if (axis === 'y') return direction > 0 ? [z, y, -x] : [-z, y, x];
  return direction > 0 ? [-y, x, z] : [y, -x, z];
}

/** Applies one standard cube move to the rendered stickers. */
// eslint-disable-next-line react-refresh/only-export-components
export function applyMove(facelets: string, move?: string): string {
  if (!move || !MOVES[move[0]] || facelets.length !== 54) return facelets;
  const definition = MOVES[move[0]];
  const direction = definition.direction * (move.includes("'") ? -1 : 1);
  const turns = move.includes('2') ? 2 : 1;
  let next = facelets;
  for (let turn = 0; turn < turns; turn += 1) {
    const rotated = next.split('');
    STICKERS.forEach((source) => {
      if (source.cubiePosition[definition.axis === 'x' ? 0 : definition.axis === 'y' ? 1 : 2] !== definition.layer) return;
      const cubie = rotateVector(source.cubiePosition, definition.axis, direction);
      const normal = rotateVector(FACE_NORMALS[source.face], definition.axis, direction);
      const face = NORMAL_TO_FACE.get(positionKey(normal));
      const target = face ? STICKER_BY_CUBIE_AND_FACE.get(`${positionKey(cubie)}|${face}`) : undefined;
      if (target) rotated[target.index] = next[source.index];
    });
    next = rotated.join('');
  }
  return next;
}

function AnimatedCube({ facelets, selectedColor, onStickerChange, activeMove, animationKey, replayToken }: Pick<Cube3DProps, 'facelets' | 'selectedColor' | 'onStickerChange' | 'activeMove' | 'animationKey' | 'replayToken'>) {
  const rotationRef = useRef<Group>(null);
  const progress = useRef(0);
  const phase = useRef<'forward' | 'rewind'>('forward');
  const previousReplayToken = useRef(replayToken);
  const definition = activeMove ? MOVES[activeMove[0]] : undefined;
  const turns = activeMove?.includes('2') ? 2 : 1;
  const direction = activeMove?.includes("'") ? -1 : 1;
  const target = definition ? definition.direction * direction * turns * Math.PI / 2 : 0;
  useEffect(() => {
    const isReplay = replayToken !== previousReplayToken.current;
    previousReplayToken.current = replayToken;
    progress.current = 0;
    phase.current = isReplay ? 'rewind' : 'forward';
    if (!isReplay && rotationRef.current) rotationRef.current.rotation.set(0, 0, 0);
  }, [activeMove, animationKey, replayToken]);
  useFrame((_, delta) => {
    if (!definition || !rotationRef.current || progress.current >= 1) return;
    const duration = phase.current === 'rewind' ? 0.85 : 1.25;
    progress.current = Math.min(1, progress.current + delta / duration);
    const eased = 1 - (1 - progress.current) ** 3;
    rotationRef.current.rotation[definition.axis] = phase.current === 'rewind' ? target * (1 - eased) : target * eased;
    if (progress.current === 1 && phase.current === 'rewind') { phase.current = 'forward'; progress.current = 0; }
  });
  const axisIndex = definition?.axis === 'x' ? 0 : definition?.axis === 'y' ? 1 : 2;
  const moving = definition ? CUBIE_POSITIONS.filter((position) => position[axisIndex] === definition.layer) : [];
  const staticCubies = definition ? CUBIE_POSITIONS.filter((position) => position[axisIndex] !== definition.layer) : CUBIE_POSITIONS;
  const props = { facelets: facelets ?? 'X'.repeat(54), selectedColor, onStickerChange };
  return <group>{staticCubies.map((position) => <CubieWithStickers key={positionKey(position)} position={position} {...props} />)}{definition && <group ref={rotationRef}>{moving.map((position) => <CubieWithStickers key={positionKey(position)} position={position} {...props} />)}</group>}</group>;
}

export function Cube3D({ facelets = 'X'.repeat(54), selectedColor, onStickerChange, compact = false, cameraPosition = [5.4, 4.4, 5.4], fullscreenOverlay, activeMove, animationKey, replayToken, allowOrbit = true }: Cube3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await containerRef.current?.requestFullscreen();
  };
  return <div ref={containerRef} className={`${fullscreen ? 'h-screen rounded-none' : compact ? 'h-[360px]' : 'h-[460px] sm:h-[560px]'} relative overflow-hidden rounded-[18px] border border-white/[.06] bg-[#06070a] shadow-inner`}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(124,92,255,.15),transparent_38%),linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:auto,40px_40px,40px_40px]" />
    <Canvas camera={{ position: cameraPosition, fov: 42 }}>
      <ambientLight intensity={1.35} />
      <directionalLight position={[5, 7, 4]} intensity={2.4} />
      <AnimatedCube facelets={facelets} selectedColor={selectedColor} onStickerChange={onStickerChange} activeMove={activeMove} animationKey={animationKey} replayToken={replayToken} />
      {allowOrbit && <OrbitControls enablePan={false} minDistance={5.4} maxDistance={10} />}
    </Canvas>
    {fullscreen && fullscreenOverlay && <div className="absolute left-4 top-4 z-10 max-h-[calc(100vh-2rem)] overflow-auto rounded-2xl border border-white/10 bg-[#0b0c11]/90 p-3 shadow-2xl backdrop-blur-xl">{fullscreenOverlay}</div>}
    {activeMove && <div className="pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/20 px-4 py-2 text-sm font-bold text-violet-100 shadow-[0_8px_30px_rgba(124,92,255,.3)] backdrop-blur-xl"><span className="text-2xl leading-none">{activeMove.includes("'") ? '↺' : '↻'}</span><span>Ход {activeMove}{activeMove.includes('2') ? ' × 2' : ''}</span></div>}
    <button type="button" onClick={toggleFullscreen} className="absolute right-3 top-3 rounded-xl border border-white/10 bg-black/40 p-2.5 text-white/65 backdrop-blur hover:bg-white/10 hover:text-white" aria-label={fullscreen ? 'Выйти из полноэкранного режима' : 'Открыть на весь экран'}>{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
    {allowOrbit && <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/[.07] bg-black/35 px-3 py-1.5 text-[10px] font-medium text-white/40 backdrop-blur">Вращайте модель мышью или пальцем</div>}
  </div>;
}
