import { Config, Trade, TradeResult, WeekState } from './types';

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
      target,
      riskActual,
      trades: [],
      harvestEvents: [],
      closed: false,
    },
  };
}

/** Aplica UN trade a una semana ya existente. No muta: devuelve una semana nueva. */
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
  let poolBase = week.poolBase;
  let target = week.target;
  let riskActual: number;
  let delta: number;

  if (result === 'win') {
    delta = config.rr * riskUsed;
    pool += delta;
    riskActual = riskUsed * (config.rr - 1);
  } else {
    delta = -riskUsed;
    pool += delta;
    riskActual = poolBase * config.riskPct; // vuelve a la unidad base
  }

  const trades: Trade[] = [...week.trades, { result, risk: riskUsed, delta, poolAfter: pool }];
  const harvestEvents = [...week.harvestEvents];
  let harvestedAmount = 0;

  // while, por si un solo trade se pasa de más de una meta de una vez
  while (pool >= target) {
    const excedente = pool - target;
    harvestedAmount += excedente;
    poolBase = target;
    pool = target;
    target = poolBase * 2;
    riskActual = poolBase * config.riskPct;
    harvestEvents.push({
      afterTradeIndex: trades.length - 1,
      excedente,
      newPoolBase: poolBase,
      newTarget: target,
    });
  }

  return {
    week: { ...week, pool, poolBase, target, riskActual, trades, harvestEvents },
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
    weekLabel,
    poolBase: poolBaseInitial,
    pool: poolBaseInitial,
    target: poolBaseInitial * 2,
    riskActual: poolBaseInitial * config.riskPct,
    trades: [],
    harvestEvents: [],
    closed: false,
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