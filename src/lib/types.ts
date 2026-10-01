export interface Config {
  poolAllocPct: number; // % del capital general destinado a operar (ej. 0.10 = 10%)
  riskPct: number;      // % de riesgo por trade, sobre el pool base (ej. 0.10 = 10%)
  rr: number;           // relación riesgo/beneficio, el "X" de 1:X (ej. 3)
}

export type TradeResult = 'win' | 'loss';

export interface Trade {
  result: TradeResult;
  risk: number;      // cuánto se arriesgó en este trade
  delta: number;      // ganancia (positivo) o pérdida (negativo) resultante
  poolAfter: number;   // valor del pool inmediatamente después de este trade
}

export interface HarvestEvent {
  afterTradeIndex: number; // índice del trade que disparó la cosecha
  excedente: number;        // lo que se envió al capital general
  newPoolBase: number;      // nueva base del pool tras la cosecha
  newTarget: number;        // nueva meta (2x la nueva base)
}

export interface WeekState {
  weekLabel: string;
  poolBase: number;
  pool: number;
  target: number;
  riskActual: number;
  trades: Trade[];
  harvestEvents: HarvestEvent[];
  closed: boolean;
  bracketHistory: number[];   // nuevo: poolBase de cada bracket alcanzado esta semana
  activeLevelIndex: number;   // nuevo: qué bracket del historial se usa ahora mismo
  consecutiveLosses: number;  // nuevo: pérdidas seguidas en el bracket actual
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