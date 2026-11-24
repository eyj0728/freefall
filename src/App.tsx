import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CompareFallCanvas } from './components/CompareFallCanvas';
import { FrontViewCanvas } from './components/FrontViewCanvas';
import { SideViewCanvas } from './components/SideViewCanvas';
import { TopViewCanvas } from './components/TopViewCanvas';
import {
  FLIGHT_DURATION,
  getMotionAtTime,
  getStrobeMoments,
  THROW_RANGE_RATIO,
  ThrowStrength,
} from './physics/projectile';

type ChapterTab = 'views' | 'compare';

interface SwitchToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  activeColorClass: string;
}

function SwitchToggle({ label, checked, onChange, activeColorClass }: SwitchToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DD2A7B]"
    >
      <span
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-150 ${
          checked ? activeColorClass : 'bg-zinc-200'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition-transform duration-150 ${
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span className={`text-xs font-medium ${checked ? 'text-zinc-900' : 'text-zinc-500'}`}>
        {label}
      </span>
    </button>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ChapterTab>('views');
  const [strength, setStrength] = useState<ThrowStrength>('medium');
  const [time, setTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [showStrobes, setShowStrobes] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(false);
  const [showHeightLine, setShowHeightLine] = useState<boolean>(true);

  const topLeftRef = useRef<HTMLDivElement | null>(null);
  const bottomLeftRef = useRef<HTMLDivElement | null>(null);
  const bottomRightRef = useRef<HTMLDivElement | null>(null);
  const compareStageRef = useRef<HTMLDivElement | null>(null);

  const [sizes, setSizes] = useState({
    topLeft: { width: 800, height: 200 },
    bottomLeft: { width: 800, height: 460 },
    bottomRight: { width: 300, height: 460 },
    compare: { width: 900, height: 560 },
  });

  const motion = useMemo(() => getMotionAtTime(time), [time]);
  const strobes = useMemo(() => getStrobeMoments(time), [time]);

  useEffect(() => {
    const updateSizes = () => {
      const tl = topLeftRef.current;
      const bl = bottomLeftRef.current;
      const br = bottomRightRef.current;
      const cmp = compareStageRef.current;

      setSizes((prev) => {
        const nextTopLeft =
          tl && tl.clientWidth > 0 && tl.clientHeight > 0
            ? { width: tl.clientWidth, height: tl.clientHeight }
            : prev.topLeft;
        const nextBottomLeft =
          bl && bl.clientWidth > 0 && bl.clientHeight > 0
            ? { width: bl.clientWidth, height: bl.clientHeight }
            : prev.bottomLeft;
        const nextBottomRight =
          br && br.clientWidth > 0 && br.clientHeight > 0
            ? { width: br.clientWidth, height: br.clientHeight }
            : prev.bottomRight;
        const nextCompare =
          cmp && cmp.clientWidth > 0 && cmp.clientHeight > 0
            ? { width: cmp.clientWidth, height: cmp.clientHeight }
            : prev.compare;

        if (
          prev.topLeft.width === nextTopLeft.width &&
          prev.topLeft.height === nextTopLeft.height &&
          prev.bottomLeft.width === nextBottomLeft.width &&
          prev.bottomLeft.height === nextBottomLeft.height &&
          prev.bottomRight.width === nextBottomRight.width &&
          prev.bottomRight.height === nextBottomRight.height &&
          prev.compare.width === nextCompare.width &&
          prev.compare.height === nextCompare.height
        ) {
          return prev;
        }

        return {
          topLeft: nextTopLeft,
          bottomLeft: nextBottomLeft,
          bottomRight: nextBottomRight,
          compare: nextCompare,
        };
      });
    };

    updateSizes();
    const observer = new ResizeObserver(updateSizes);

    if (topLeftRef.current) observer.observe(topLeftRef.current);
    if (bottomLeftRef.current) observer.observe(bottomLeftRef.current);
    if (bottomRightRef.current) observer.observe(bottomRightRef.current);
    if (compareStageRef.current) observer.observe(compareStageRef.current);

    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    if (!isPlaying) return;

    let frameId = 0;
    let lastTimestamp: number | null = null;
    const speedFactor = isSlow ? 0.45 : 1;

    const tick = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }
      const deltaSeconds = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      setTime((prev) => {
        const next = prev + deltaSeconds * speedFactor;
        if (next >= FLIGHT_DURATION) {
          setIsPlaying(false);
          return FLIGHT_DURATION;
        }
        return next;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isSlow]);

  const handleTabChange = (nextTab: ChapterTab) => {
    if (nextTab === activeTab) return;
    setIsPlaying(false);
    setTime(0);
    setActiveTab(nextTab);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (time >= FLIGHT_DURATION - 1e-4) {
      setTime(0);
    }
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTime(0);
  };

  const handleStrengthChange = (next: ThrowStrength) => {
    setIsPlaying(false);
    setStrength(next);
    setTime(0);
  };

  // Shared geometry across Tab 1 orthographic views
  const ballRadius = 11.5;
  const tableEdgeX = 98;
  const throwSpanPx = Math.max(
    120,
    (sizes.bottomLeft.width - tableEdgeX - 44) * THROW_RANGE_RATIO[strength]
  );
  const groundY = Math.max(180, sizes.bottomLeft.height - 36);
  const tableTopY = Math.max(54, Math.round(groundY * 0.25));

  const playLabel =
    activeTab === 'views'
      ? isPlaying
        ? '잠시 멈춤'
        : motion.finished
          ? '다시 던지기'
          : '공 던지기'
      : isPlaying
        ? '잠시 멈춤'
        : motion.finished
          ? '다시 비교하기'
          : '동시에 떨어뜨리기';

  const progressPct = Math.round(motion.progress * 100);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#fafafa] text-zinc-900">
      {/* Subtle Instagram Sunset Accent Line */}
      <div
        className="h-[3px] w-full shrink-0 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]"
        aria-hidden="true"
      />

      {/* Header with Chapter Tabs */}
      <header className="shrink-0 bg-white border-b border-zinc-200/80 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0">
          수평으로 던진 물체의 운동
        </h1>

        <nav
          className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl shrink-0"
          aria-label="단원 선택"
        >
          <button
            type="button"
            onClick={() => handleTabChange('views')}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'views'
                ? 'bg-white text-[#DD2A7B] font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 font-medium'
            }`}
          >
            1. 방향 나누어 보기
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('compare')}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'compare'
                ? 'bg-white text-[#DD2A7B] font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 font-medium'
            }`}
          >
            2. 동시 낙하 비교
          </button>
        </nav>
      </header>

      {activeTab === 'views' ? (
        /* Tab 1: 2x2 Orthographic Layout */
        <main className="flex-1 min-h-0 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_308px] lg:grid-rows-[minmax(198px,29%)_minmax(0,1fr)] gap-3 sm:gap-4">
          {/* 1. 위에서 본 모습 (Top View) */}
          <section
            ref={topLeftRef}
            className="relative h-[180px] lg:h-auto lg:min-h-0 bg-white border border-zinc-200/90 rounded-2xl shadow-[0_2px_10px_rgba(24,24,27,0.03)] overflow-hidden"
            aria-label="위에서 본 모습"
          >
            <div className="pointer-events-none absolute top-2.5 left-3 z-10 bg-white/92 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-zinc-200/80 text-xs font-semibold text-zinc-800 whitespace-nowrap flex items-center gap-1.5">
              <span>위에서 본 모습</span>
              <span aria-hidden="true" className="text-zinc-300">
                ·
              </span>
              <span className="font-semibold text-[#8134AF]">등속 운동</span>
            </div>
            <TopViewCanvas
              width={sizes.topLeft.width}
              height={sizes.topLeft.height}
              tableEdgeX={tableEdgeX}
              throwSpanPx={throwSpanPx}
              ballRadius={ballRadius}
              motion={motion}
              strobes={strobes}
              showStrobes={showStrobes}
              showGuides={showGuides}
            />
          </section>

          {/* Simple Control Panel (Top-Right) */}
          <aside
            className="bg-white border border-zinc-200/90 rounded-2xl shadow-[0_2px_10px_rgba(24,24,27,0.03)] p-4 flex flex-col justify-between gap-2.5 lg:col-start-2 lg:row-start-1"
            aria-label="조작 패널"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayToggle}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white text-sm font-semibold shadow-[0_3px_10px_rgba(221,42,123,0.28)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DD2A7B]"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{playLabel}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="처음으로"
                aria-label="처음으로"
                className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DD2A7B]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">진행</span>
              <input
                type="range"
                min={0}
                max={FLIGHT_DURATION}
                step={0.01}
                value={time}
                onChange={(e) => {
                  setIsPlaying(false);
                  setTime(parseFloat(e.target.value));
                }}
                style={{
                  background: `linear-gradient(90deg, #F58529 0%, #DD2A7B ${progressPct}%, #E4E4E7 ${progressPct}%, #E4E4E7 100%)`,
                }}
                aria-label="던지는 과정 이동"
                className="ig-slider flex-1"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600 whitespace-nowrap">던지는 세기</span>
              <div className="flex items-center gap-1 p-0.5 bg-zinc-100 rounded-lg">
                {(
                  [
                    { id: 'weak', label: '약하게' },
                    { id: 'medium', label: '보통' },
                    { id: 'strong', label: '세게' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleStrengthChange(item.id)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      strength === item.id
                        ? 'bg-white text-[#DD2A7B] font-semibold shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-zinc-100">
              <SwitchToggle
                label="잔상"
                checked={showStrobes}
                onChange={setShowStrobes}
                activeColorClass="bg-[#DD2A7B]"
              />
              <SwitchToggle
                label="연결선"
                checked={showGuides}
                onChange={setShowGuides}
                activeColorClass="bg-[#8134AF]"
              />
              <SwitchToggle
                label="느리게"
                checked={isSlow}
                onChange={setIsSlow}
                activeColorClass="bg-[#F58529]"
              />
            </div>
          </aside>

          {/* 2. 앞에서 본 모습 (Front View) */}
          <section
            ref={bottomLeftRef}
            className="relative h-[320px] lg:h-auto lg:min-h-0 bg-white border border-zinc-200/90 rounded-2xl shadow-[0_2px_10px_rgba(24,24,27,0.03)] overflow-hidden lg:col-start-1 lg:row-start-2"
            aria-label="앞에서 본 모습"
          >
            <div className="pointer-events-none absolute top-2.5 left-3 z-10 bg-white/92 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-zinc-200/80 text-xs font-semibold text-zinc-800 whitespace-nowrap">
              앞에서 본 모습
            </div>
            <FrontViewCanvas
              width={sizes.bottomLeft.width}
              height={sizes.bottomLeft.height}
              tableEdgeX={tableEdgeX}
              throwSpanPx={throwSpanPx}
              tableTopY={tableTopY}
              groundY={groundY}
              ballRadius={ballRadius}
              motion={motion}
              strobes={strobes}
              showStrobes={showStrobes}
              showGuides={showGuides}
            />
          </section>

          {/* 3. 옆에서 본 모습 (Side View - Free Fall) */}
          <section
            ref={bottomRightRef}
            className="relative h-[320px] lg:h-auto lg:min-h-0 bg-white border border-zinc-200/90 rounded-2xl shadow-[0_2px_10px_rgba(24,24,27,0.03)] overflow-hidden lg:col-start-2 lg:row-start-2"
            aria-label="옆에서 본 모습"
          >
            <div className="pointer-events-none absolute top-2.5 left-3 z-10 bg-white/92 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-zinc-200/80 text-xs font-semibold text-zinc-800 whitespace-nowrap flex items-center gap-1.5">
              <span>옆에서 본 모습</span>
              <span aria-hidden="true" className="text-zinc-300">
                ·
              </span>
              <span className="font-semibold text-[#DD2A7B]">자유낙하 운동</span>
            </div>
            <SideViewCanvas
              width={sizes.bottomRight.width}
              height={sizes.bottomRight.height}
              tableTopY={tableTopY}
              groundY={groundY}
              ballRadius={ballRadius}
              motion={motion}
              strobes={strobes}
              showStrobes={showStrobes}
              showGuides={showGuides}
            />
          </section>
        </main>
      ) : (
        /* Tab 2: Simultaneous Drop Comparison */
        <main className="flex-1 min-h-0 p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4">
          <section
            ref={compareStageRef}
            className="relative h-[420px] lg:h-auto lg:flex-1 lg:min-w-0 lg:min-h-0 bg-white border border-zinc-200/90 rounded-2xl shadow-[0_2px_10px_rgba(24,24,27,0.03)] overflow-hidden"
            aria-label="동시 낙하 비교 화면"
          >
            <div className="pointer-events-none absolute top-3 left-3.5 z-10 bg-white/92 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-zinc-200/80 text-xs font-semibold text-zinc-800 whitespace-nowrap flex flex-wrap items-center gap-2.5">
              <span>동시에 떨어뜨리기</span>
              <span aria-hidden="true" className="text-zinc-300">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#6b21a8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7e22ce]" aria-hidden="true" />
                자유낙하
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#c2410c]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" aria-hidden="true" />
                살살 던진 공
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#be185d]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dd2a7b]" aria-hidden="true" />
                세게 던진 공
              </span>
            </div>

            <CompareFallCanvas
              width={sizes.compare.width}
              height={sizes.compare.height}
              motion={motion}
              strobes={strobes}
              showStrobes={showStrobes}
              showHeightLine={showHeightLine}
            />
          </section>

          <aside
            className="w-full lg:w-[308px] shrink-0 bg-white border border-zinc-200/90 rounded-2xl shadow-[0_2px_10px_rgba(24,24,27,0.03)] p-4 flex flex-col justify-start gap-4"
            aria-label="비교 조작 패널"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayToggle}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white text-sm font-semibold shadow-[0_3px_10px_rgba(221,42,123,0.28)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DD2A7B]"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{playLabel}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="처음으로"
                aria-label="처음으로"
                className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DD2A7B]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">진행</span>
              <input
                type="range"
                min={0}
                max={FLIGHT_DURATION}
                step={0.01}
                value={time}
                onChange={(e) => {
                  setIsPlaying(false);
                  setTime(parseFloat(e.target.value));
                }}
                style={{
                  background: `linear-gradient(90deg, #F58529 0%, #DD2A7B ${progressPct}%, #E4E4E7 ${progressPct}%, #E4E4E7 100%)`,
                }}
                aria-label="낙하 과정 이동"
                className="ig-slider flex-1"
              />
            </div>

            <div className="pt-2 border-t border-zinc-100 flex flex-col gap-1.5">
              <SwitchToggle
                label="잔상 보기"
                checked={showStrobes}
                onChange={setShowStrobes}
                activeColorClass="bg-[#DD2A7B]"
              />
              <SwitchToggle
                label="높이 비교선"
                checked={showHeightLine}
                onChange={setShowHeightLine}
                activeColorClass="bg-[#8134AF]"
              />
              <SwitchToggle
                label="느리게"
                checked={isSlow}
                onChange={setIsSlow}
                activeColorClass="bg-[#F58529]"
              />
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
