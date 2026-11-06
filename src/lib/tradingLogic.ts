import { Config, Trade, TradeResult, WeekState, ChartPoint } from './types';

const EPS = 1e-9; // tolerancia para errores de decimales al comparar dinero

/** Crea una semana nueva: separa el pool del capital general. */
export function createWeek(
  config: Config,
  capitalGeneral: number,
  weekLabel: string
): { capitalGeneral: number; week: WeekState } {
  const poolBase = capitalGeneral * config.poolAllocPct;

  return {
    capitalGeneral: capitalGeneral - poolBase,
    week: {
      weekLabel,
      poolBase,
      pool: poolBase,
      target: poolBase * 2,
      riskActual: poolBase * config.riskPct,
      trades: [],
      harvestEvents: [],
      closed: false,
      bracketHistory: [poolBase],
      streakProfit: 0,
    },
  };
}

/** Base de la escalera que toca según el pool: el mayor bracket alcanzado cuya base sea <= pool. */
export function getLadderBase(bracketHistory: number[], pool: number): number {
  let base = bracketHistory[0];
  for (const b of bracketHistory) {
    if (b <= pool + EPS) base = b;
  }
  return base;
}

/** Recuperación: ya subiste de pool alguna vez y ahora estás por debajo de su base. */
export function isRecovery(week: WeekState): boolean {
  return week.bracketHistory.length > 1 && week.pool < week.poolBase - EPS;
}

/** Paso y riesgo que corresponden a una ganancia: cada paso se desbloquea al acumular
 *  lo que habría dado el trade completo del paso anterior. */
export function stepForProfit(
  profit: number,
  r1: number,
  rr: number
): { step: number; risk: number; nextThreshold: number } {
  if (rr <= 1) return { step: 1, risk: r1, nextThreshold: Infinity };

  let risk = r1;
  let step = 1;
  let cumulative = 0;

  for (let i = 0; i < 60; i++) {
    const stepGain = rr * risk;
    if (profit + EPS >= cumulative + stepGain) {
      cumulative += stepGain;
      risk = risk * (rr - 1);
      step++;
    } else {
      break;
    }
  }
  // ganancia total que hace falta para desbloquear el paso siguiente
  return { step, risk, nextThreshold: cumulative + rr * risk };
}

/** Paso y riesgo actuales de una semana, según el modo en que esté. */
function currentStep(week: WeekState, config: Config) {
  const ladderBase = getLadderBase(week.bracketHistory, week.pool);
  const r1 = ladderBase * config.riskPct;
  const profit = isRecovery(week) ? week.streakProfit : week.pool - ladderBase;
  return { ...stepForProfit(profit, r1, config.rr), profit };
}

/** Aplica UN trade. No muta: devuelve una semana nueva. */
export function applyTrade(
  week: WeekState,
  config: Config,
  result: TradeResult
): { week: WeekState; harvestedAmount: number } {
  if (week.closed) {
    throw new Error('No se pueden agregar trades a una semana cerrada');
  }

  const wasRecovery = isRecovery(week);
  const riskUsed = week.riskActual;

  let delta: number;
  let streakProfit = week.streakProfit;

  if (result === 'loss') {
    delta = -riskUsed;
    streakProfit = 0;
  } else {
    const rrCobrado = result === 'win' ? config.rr : result.rr;
    delta = rrCobrado * riskUsed;
    streakProfit += delta;
  }

  let pool = week.pool + delta;
  let poolBase = week.poolBase;
  let target = week.target;
  let bracketHistory = [...week.bracketHistory];
  const harvestEvents = [...week.harvestEvents];
  let harvestedAmount = 0;

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
  const tradeIndex = trades.length - 1;

  // 1) Cosecha por duplicar: el sobrante va al capital general y el pool se resetea a la meta
  let bracketHarvested = false;
  while (pool + EPS >= target) {
    const excedente = Math.max(0, pool - target);
    harvestedAmount += excedente;
    poolBase = target;
    pool = target;
    target = poolBase * 2;
    bracketHistory = [...bracketHistory, poolBase];
    streakProfit = 0;
    bracketHarvested = true;
    harvestEvents.push({ afterTradeIndex: tradeIndex, kind: 'bracket', excedente, newPoolBase: poolBase, newTarget: target });
  }

  // 2) Cosecha por recuperar: al volver a la base, el sobrante también sale del pool
  if (wasRecovery && !bracketHarvested && pool + EPS >= poolBase) {
    const excedente = Math.max(0, pool - poolBase);
    harvestedAmount += excedente;
    pool = poolBase;
    streakProfit = 0;
    harvestEvents.push({ afterTradeIndex: tradeIndex, kind: 'recovery', excedente, newPoolBase: poolBase, newTarget: target });
  }

  const next: WeekState = { ...week, pool, poolBase, target, trades, harvestEvents, bracketHistory, streakProfit };
  const { risk } = currentStep(next, config);

  return { week: { ...next, riskActual: risk }, harvestedAmount };
}

/** Reconstruye la semana desde cero a partir de la lista de resultados. */
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
    bracketHistory: [poolBaseInitial],
    streakProfit: 0,
  };

  let totalHarvested = 0;
  for (const result of results) {
    const { week: nextWeek, harvestedAmount } = applyTrade(week, config, result);
    week = nextWeek;
    totalHarvested += harvestedAmount;
  }

  return { week, totalHarvested };
}

/** Cierra la semana: lo que quedó en el pool vuelve al capital general. */
export function closeWeek(
  week: WeekState,
  capitalGeneral: number
): { capitalGeneral: number; week: WeekState } {
  return {
    capitalGeneral: capitalGeneral + week.pool,
    week: { ...week, pool: 0, closed: true },
  };
}

export interface WeekStatus {
  mode: 'normal' | 'recovery';
  ladderIndex: number;           // 0 = pool inicial
  ladderBase: number;            // pool en el que estás ahora
  step: number;
  nextGoal: number;              // pool al que subirías
  amountToNext: number;
  amountToNextStep: number | null; // null = último paso antes de subir de pool
  winsToNext: number | null;     // trades ganadores completos para llegar
  lowerBase: number | null;      // pool al que bajarías (null si estás en el inicial)
  amountToDrop: number | null;
  lossesToDrop: number | null;   // pérdidas seguidas que te bajan de pool
}

/** Estadísticas para el aviso: se calculan simulando trades con la misma lógica real. */
export function getWeekStatus(week: WeekState, config: Config): WeekStatus {
  const ladderBase = getLadderBase(week.bracketHistory, week.pool);
  const ladderIndex = week.bracketHistory.indexOf(ladderBase);
  const mode = isRecovery(week) ? 'recovery' : 'normal';
  const { step, nextThreshold, profit } = currentStep(week, config);

  const nextGoal =
    ladderIndex < week.bracketHistory.length - 1 ? week.bracketHistory[ladderIndex + 1] : week.target;
  const amountToNext = Math.max(0, nextGoal - week.pool);
  const toNextStep = nextThreshold - profit;
  // Si ese paso se desbloquearía cuando ya llegaste al pool siguiente, este es el último paso
  const amountToNextStep = toNextStep < amountToNext - EPS ? toNextStep : null;
  let winsToNext: number | null = null;
  let simWin = week;

  for (let i = 1; i <= 60; i++) {
    simWin = applyTrade(simWin, config, 'win').week;
    if (simWin.pool + EPS >= nextGoal) {
      winsToNext = i;
      break;
    }
  }

  let lowerBase: number | null = null;
  let amountToDrop: number | null = null;
  let lossesToDrop: number | null = null;
  if (ladderIndex > 0) {
    lowerBase = week.bracketHistory[ladderIndex - 1];
    amountToDrop = Math.max(0, week.pool - ladderBase);
    let simLoss = week;
    for (let i = 1; i <= 200; i++) {
      simLoss = applyTrade(simLoss, config, 'loss').week;
      if (simLoss.pool < ladderBase - EPS) {
        lossesToDrop = i;
        break;
      }
    }
  }

  return {
    mode,
    ladderIndex,
    ladderBase,
    step,
    nextGoal,
    amountToNext,
    amountToNextStep,
    winsToNext,
    lowerBase,
    amountToDrop,
    lossesToDrop,
  };
}

export function buildChartData(poolBaseInitial: number, week: WeekState): ChartPoint[] {
  const points: ChartPoint[] = [
    { index: 0, pool: poolBaseInitial, target: poolBaseInitial * 2, harvested: false },
  ];
  let target = poolBaseInitial * 2;

  week.trades.forEach((trade, i) => {
    const harvestEvent = week.harvestEvents.find((h) => h.afterTradeIndex === i);
    points.push({ index: i + 1, pool: trade.poolAfter, target, harvested: !!harvestEvent });
    if (harvestEvent) target = harvestEvent.newTarget;
  });

  return points;
}

export interface SetupPreview {
  winsToDouble: number | null;
  lossesToBurn: number;
  surplus: number;
  surplusPctOfCapital: number;
  surplusPctOfBase: number;
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
    lossesToBurn: Math.floor(1 / config.riskPct),
    surplus,
    surplusPctOfCapital: capital > 0 ? (surplus / capital) * 100 : 0,
    surplusPctOfBase: poolBase > 0 ? (surplus / poolBase) * 100 : 0,
  };
}