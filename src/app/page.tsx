'use client';

import { useState, useEffect, useMemo } from 'react';
import { Config, TradeResult, WeekState, WeekHistoryEntry } from '@/lib/types';
import { createWeek, rebuildWeek, closeWeek, buildChartData } from '@/lib/tradingLogic';
import ConfigForm from '@/components/ConfigForm';
import CapitalOverview from '@/components/CapitalOverview';
import WeekPanel from '@/components/WeekPanel';
import WeekHistory from '@/components/WeekHistory';
import CapitalAdjuster from '@/components/CapitalAdjuster';
import BracketStatus from '@/components/BracketStatus'

const STORAGE_KEY = 'riesgo-trading-state';

interface AppState {
  config: Config;
  capitalGeneral: number;
  poolBaseInitial: number | null;
  weekLabel: string | null;
  weekConfig: Config | null;
  results: TradeResult[];
  history: WeekHistoryEntry[];
}

const defaultState: AppState = {
  config: { poolAllocPct: 0.10, riskPct: 0.10, rr: 3 },
  capitalGeneral: 100,
  poolBaseInitial: null,
  weekLabel: null,
  weekConfig: null,
  results: [],
  history: [],
};

export default function Home() {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setState({ ...defaultState, ...JSON.parse(saved) });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  const { week, totalHarvested } = useMemo(() => {
    if (state.poolBaseInitial === null || state.weekLabel === null || state.weekConfig === null) {
      return { week: null as WeekState | null, totalHarvested: 0 };
    }
    return rebuildWeek(state.weekConfig, state.poolBaseInitial, state.weekLabel, state.results);
  }, [state.weekConfig, state.poolBaseInitial, state.weekLabel, state.results]);

  const liveCapitalGeneral = state.capitalGeneral + totalHarvested;

  const chartData = useMemo(() => {
    if (!week || state.poolBaseInitial === null) return [];
    return buildChartData(state.poolBaseInitial, week);
  }, [week, state.poolBaseInitial]);

  function getCurrentWeekLabel() {
    const d = new Date();
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `Semana ${weekNo} (${dt.getUTCFullYear()})`;
  }

  function handleCreateWeek() {
    const { capitalGeneral, week: newWeek } = createWeek(state.config, state.capitalGeneral, getCurrentWeekLabel());
    setState({
      ...state,
      capitalGeneral,
      poolBaseInitial: newWeek.poolBase,
      weekLabel: newWeek.weekLabel,
      weekConfig: state.config,
      results: [],
    });
  }

  function handleTrade(result: TradeResult) {
    setState({ ...state, results: [...state.results, result] });
  }

  function handleDeleteTrade(index: number) {
    setState({ ...state, results: state.results.filter((_, i) => i !== index) });
  }

  function handleCloseWeek() {
    if (!week || !state.weekConfig || state.poolBaseInitial === null) return;

    const historyEntry: WeekHistoryEntry = {
      id: crypto.randomUUID(),
      weekLabel: week.weekLabel,
      config: state.weekConfig,
      poolBaseInitial: state.poolBaseInitial,
      results: state.results,
      poolFinal: week.pool,
      harvestedTotal: totalHarvested,
      netResult: (totalHarvested + week.pool) - state.poolBaseInitial,
      closedAt: new Date().toISOString(),
    };

    const { capitalGeneral } = closeWeek(week, liveCapitalGeneral);

    setState({
      ...state,
      capitalGeneral,
      poolBaseInitial: null,
      weekLabel: null,
      weekConfig: null,
      results: [],
      history: [historyEntry, ...state.history],
    });
  }

  function handleDeleteHistoryWeek(id: string) {
    setState({ ...state, history: state.history.filter((h) => h.id !== id) });
  }

  function handleAdjustCapital(amount: number) {
    setState({ ...state, capitalGeneral: state.capitalGeneral + amount });
  }

  if (!loaded) return <p>Cargando...</p>;

return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 md:grid-cols-[280px_1fr_300px] gap-6 md:gap-0">

        {/* Columna izquierda */}
        <aside className="md:border-r md:border-black md:pr-6 space-y-4">
          <CapitalOverview capitalGeneral={liveCapitalGeneral} pool={week ? week.pool : 0} />
          <CapitalAdjuster onAdjust={handleAdjustCapital} />
        </aside>

        {/* Columna central, ancho controlado */}
        <main className="md:border-r md:border-black md:px-6">
          <h1 className="text-2xl font-bold text-center mb-6">Sistema de riesgo en trading</h1>

          {!week ? (
            <div className="flex justify-center">
              <button onClick={handleCreateWeek} className="bg-black text-white px-4 py-2 rounded">
                Crear lista de la semana
              </button>
            </div>
          ) : (
            <WeekPanel
              week={week}
              rr={state.weekConfig!.rr}
              chartData={chartData}
              onTrade={handleTrade}
              onDeleteTrade={handleDeleteTrade}
              onCloseWeek={handleCloseWeek}
            />
          )}

          <WeekHistory history={state.history} onDelete={handleDeleteHistoryWeek} />
        </main>

        {/* Columna derecha */}
        <aside className="md:pl-6 space-y-4">
          <ConfigForm config={state.config} onChange={(config) => setState({ ...state, config })} />
          {week && <BracketStatus week={week} config={state.weekConfig!} />}
        </aside>

      </div>
    </div>
  );
}