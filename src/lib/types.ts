export interface Config {
  poolAllocPct: number; // % del capital general destinado a operar (ej. 0.10 = 10%)
  riskPct: number;      // % de riesgo por trade, sobre el pool base (ej. 0.10 = 10%)
  rr: number;           // relación riesgo/beneficio, el "X" de 1:X (ej. 3)
}

export type TradeResult = 'win' | 'loss' | { type: 'partial'; rr: number };

export interface Trade {
  result: 'win' | 'loss' | 'partial';
  rrAchieved?: number; // solo existe en los parciales
  risk: number;      // cuánto se arriesgó en este trade
  delta: number;      // ganancia (positivo) o pérdida (negativo) resultante
  poolAfter: number;   // valor del pool inmediatamente después de este trade
}

export interface HarvestEvent {
  afterTradeIndex: number;
  kind: 'bracket' | 'recovery'; // cosecha por duplicar, o por recuperar el pool
  excedente: number;
  newPoolBase: number;
  newTarget: number;
}

export interface WeekState {
  weekLabel: string;
  poolBase: number;          // base del pool más alto alcanzado esta semana
  pool: number;
  target: number;
  riskActual: number;
  trades: Trade[];
  harvestEvents: HarvestEvent[];
  closed: boolean;
  bracketHistory: number[];  // bases de los pools alcanzados: la "escalera"
  streakProfit: number;      // ganancia desde la última pérdida (se usa en recuperación)
}

export interface ChartPoint {
  index: number;
  pool: number;
  target: number;
  harvested: boolean;
}

export interface WeekHistoryEntry {
  id: string;
  weekLabel: string;
  config: Config;
  poolBaseInitial: number;
  results: TradeResult[];
  poolFinal: number;       // valor del pool justo antes de barrerlo al cierre
  harvestedTotal: number;   // suma de todas las cosechas ocurridas esa semana
  netResult: number;        // cuánto le sumó (o restó) esta semana al capital general
  closedAt: string;         // fecha ISO, para ordenar
}