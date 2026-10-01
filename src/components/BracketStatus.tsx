import { WeekState, Config } from '@/lib/types';
import { winsUntilTarget } from '@/lib/tradingLogic';

interface Props {
  week: WeekState;
  config: Config;
}

export default function BracketStatus({ week, config }: Props) {
  const maxLosses = Math.floor(1 / config.riskPct);
  const lossesLeft = week.activeLevelIndex > 0 ? maxLosses - week.consecutiveLosses : null;
  const winsLeft = winsUntilTarget(week.pool, week.riskActual, config.rr, week.target);
  const isReduced = week.activeLevelIndex < week.bracketHistory.length - 1;

  return (
    <div
      className={`text-xl rounded-lg p-2 mb-3 border ${
        isReduced ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}
    >
      {isReduced && <span className="mr-1">⚠️</span>}
      Estás en el bracket número <b>{week.activeLevelIndex + 1}</b>. Te quedan{' '}
      <b>{winsLeft}</b> acierto{winsLeft === 1 ? '' : 's'} para duplicar
      {lossesLeft !== null && (
        <>
          {' '}y <b>{lossesLeft}</b> pérdida{lossesLeft === 1 ? '' : 's'} para bajar de bracket
        </>
      )}
      .
    </div>
  );
}