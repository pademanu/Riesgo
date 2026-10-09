import { Config, Trade, TradeResult, WeekState, ChartPoint  } from './types';

/** Crea una semana nueva: separa el pool del capital general. */
export function createWeek(
  config: Config,
  capitalGeneral: number,
  weekLabel: string
): { capitalGeneral: number; week: WeekState } {
  const poolBase = capitalGeneral * config.poolAllocPct;
  const target = poolBase * 2;
  const riskActual = poolBase * config.riskPct;

  return {
    capitalGeneral: capitalGeneral - poolBase,
    week: {
      weekLabel,
      poolBase,
      pool: poolBase,
      progressPool: poolBase,
      target,
      riskActual,
      trades: [],
      harvestEvents: [],
      closed: false,
      bracketHistory: [poolBase],
      activeLevelIndex: 0,
      consecutiveLosses: 0,
    },
  };
}

export function applyTrade(
  week: WeekState,
  config: Config,
  result: TradeResult
): { week: WeekState; harvestedAmount: number } {
  if (week.closed) {
    throw new Error('No se pueden agregar trades a una semana cerrada');
  }

  const riskUsed = week.riskActual;
  let pool = week.pool;
  let progressPool = week.progressPool;
  let poolBase = week.poolBase;
  let target = week.target;
  let riskActual: number;
  let delta: number;
  let bracketHistory = [...week.bracketHistory];
  let activeLevelIndex = week.activeLevelIndex;
  let consecutiveLosses = week.consecutiveLosses;

  const maxLosses = Math.floor(1 / config.riskPct);

  if (result === 'loss') {
    delta = -riskUsed;
    pool += delta;
    progressPool += delta;
    consecutiveLosses += 1;

    if (consecutiveLosses >= maxLosses && activeLevelIndex > 0) {
      activeLevelIndex -= 1;
      consecutiveLosses = 0;
    }
    riskActual = bracketHistory[activeLevelIndex] * config.riskPct;
  } else if (result === 'win') {
    delta = config.rr * riskUsed;
    pool += delta;
    progressPool += delta;
    riskActual = riskUsed * (config.rr - 1);
    consecutiveLosses = 0;
  } else {
    // Parcial: el dinero es real, pero el progreso no avanza.
    delta = result.rr * riskUsed;
    pool += delta;
    // progressPool y riskActual NO cambian: hay que repetir el mismo paso
    riskActual = riskUsed;
    consecutiveLosses = 0;
  }

  const trades: Trade[] = [
    ...week.trades,
    {
      result: typeof result === 'string' ? result : 'partial',
      rrAchieved: typeof result === 'string' ? undefined : result.rr,
      risk: riskUsed,
      delta,
      poolAfter: pool,
    },
  ];
  const harvestEvents = [...week.harvestEvents];
  let harvestedAmount = 0;

  while (pool >= target) {
    const excedente = pool - target;
    harvestedAmount += excedente;
    poolBase = target;
    pool = target;
    progressPool = target; // el nuevo bracket arranca limpio
    target = poolBase * 2;
    bracketHistory = [...bracketHistory, poolBase];
    activeLevelIndex = bracketHistory.length - 1;
    consecutiveLosses = 0;
    riskActual = poolBase * config.riskPct;
    harvestEvents.push({ afterTradeIndex: trades.length - 1, excedente, newPoolBase: poolBase, newTarget: target });
  }

  return {
    week: {
      ...week, pool, progressPool, poolBase, target, riskActual, trades,
      harvestEvents, bracketHistory, activeLevelIndex, consecutiveLosses,
    },
    harvestedAmount,
  };
}

/** Reconstruye una semana desde cero a partir de la lista de resultados.
 *  Clave para el botón de "eliminar trade": borras uno del array y recalculas todo. */
export function rebuildWeek(
  config: Config,
  poolBaseInitial: number,
  weekLabel: string,
  results: TradeResult[]
): { week: WeekState; totalHarvested: number } {
let week: WeekState = {
  progressPool: poolBaseInitial,
  weekLabel,
  poolBase: poolBaseInitial,
  pool: poolBaseInitial,
  target: poolBaseInitial * 2,
  riskActual: poolBaseInitial * config.riskPct,
  trades: [],
  harvestEvents: [],
  closed: false,
  bracketHistory: [poolBaseInitial],
  activeLevelIndex: 0,
  consecutiveLosses: 0,
};

  let totalHarvested = 0;
  for (const result of results) {
    const { week: nextWeek, harvestedAmount } = applyTrade(week, config, result);
    week = nextWeek;
    totalHarvested += harvestedAmount;
  }

  return { week, totalHarvested };
}

/** Cierra la semana: todo lo que quedó en el pool (llegó o no a la meta) vuelve al capital general. */
export function closeWeek(
  week: WeekState,
  capitalGeneral: number
): { capitalGeneral: number; week: WeekState } {
  return {
    capitalGeneral: capitalGeneral + week.pool,
    week: { ...week, pool: 0, closed: true },
  };
}

export function buildChartData(poolBaseInitial: number, week: WeekState): ChartPoint[] {
  const points = [{ index: 0, pool: poolBaseInitial, target: poolBaseInitial * 2, harvested: false }];
  let target = poolBaseInitial * 2;

  week.trades.forEach((trade, i) => {
    const harvestEvent = week.harvestEvents.find((h) => h.afterTradeIndex === i);
    points.push({ index: i + 1, pool: trade.poolAfter, target, harvested: !!harvestEvent });
    if (harvestEvent) target = harvestEvent.newTarget;
  });

  return points;
}

/** Simula cuántas victorias consecutivas (desde el estado actual) hacen falta para llegar al target. */
export function winsUntilTarget(pool: number, riskActual: number, rr: number, target: number): number {
  let count = 0;
  let p = pool;
  let r = riskActual;
  while (p < target && count < 50) {
    p += rr * r;
    r = r * (rr - 1);
    count++;
  }
  return count;
}

export interface SetupPreview {
  surplusPctOfBase: number; // sobrante como % del pool base del bracket
  winsToDouble: number | null; // null = no se alcanza la meta en el límite de simulación
  lossesToBurn: number;
  surplus: number;             // sobrante del primer bracket, en dólares
  surplusPctOfCapital: number;
}

/** Simula el mejor escenario (puros ganados completos) para un set up, sin crear semana. */
export function previewSetup(config: Config, capital: number): SetupPreview | null {
  const poolBase = capital * config.poolAllocPct;
  if (poolBase <= 0 || config.riskPct <= 0 || config.riskPct > 1 || config.rr <= 1) return null;

  const target = poolBase * 2;
  let pool = poolBase;
  let risk = poolBase * config.riskPct;
  let wins = 0;

  while (pool < target && wins < 50) {
    pool += config.rr * risk;
    risk = risk * (config.rr - 1);
    wins++;
  }

  const reached = pool >= target;
  const surplus = reached ? pool - target : 0;

  return {
    winsToDouble: reached ? wins : null,
    lossesToBurn: Math.floor(1 / config.riskPct), // misma regla que usa applyTrade
    surplus,
    surplusPctOfCapital: capital > 0 ? (surplus / capital) * 100 : 0,
    surplusPctOfBase: poolBase > 0 ? (surplus / poolBase) * 100 : 0,
  };
}