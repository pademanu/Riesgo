import { WeekState, Config } from '@/lib/types';
import { winsUntilTarget } from '@/lib/tradingLogic';

interface Props {
  week: WeekState;
  config: Config;
}

export default function BracketStatus({ week, config }: Props) {
  const maxLosses = Math.floor(1 / config.riskPct);
  const bracketNumber = week.activeLevelIndex + 1;
  const isTopBracket = week.activeLevelIndex === 0;
  const isBurned = week.activeLevelIndex < week.bracketHistory.length - 1;

  const activeBracketTarget = week.bracketHistory[week.activeLevelIndex] * 2;
  const winsToDoubleActive = winsUntilTarget(week.pool, week.riskActual, config.rr, activeBracketTarget);
  const winsToDoubleHighest = winsUntilTarget(week.pool, week.riskActual, config.rr, week.target);
  const lossesLeft = maxLosses - week.consecutiveLosses;

  let message: React.ReactNode;

  if (isTopBracket) {
    // Bracket 1, ya sea porque nunca subiste o porque bajaste hasta el fondo
    message = (
      <>
        Estás en el bracket número <b>1</b>. Te quedan <b>{winsToDoubleActive}</b> acierto
        {winsToDoubleActive === 1 ? '' : 's'} para duplicar este bracket.
      </>
    );
  } else if (!isBurned) {
    // Bracket > 1, operando en el nivel más alto que has alcanzado
    message = (
      <>
        Estás en el bracket número <b>{bracketNumber}</b>. Te quedan <b>{winsToDoubleActive}</b> acierto
        {winsToDoubleActive === 1 ? '' : 's'} para duplicar y <b>{lossesLeft}</b> pérdida
        {lossesLeft === 1 ? '' : 's'} para bajar de bracket.
      </>
    );
  } else {
    // Bracket > 1, pero ya quemaste el nivel más alto y bajaste uno (o más)
    message = (
      <>
        Estás en el bracket número <b>{bracketNumber}</b>. Te quedan <b>{winsToDoubleActive}</b> acierto
        {winsToDoubleActive === 1 ? '' : 's'} para duplicar el bracket actual, <b>{lossesLeft}</b> pérdida
        {lossesLeft === 1 ? '' : 's'} para bajar de bracket y te quedan <b>{winsToDoubleHighest}</b> acierto
        {winsToDoubleHighest === 1 ? '' : 's'} para duplicar el último bracket al que llegaste.
      </>
    );
  }

  return (
    <div
      className={`text-xl rounded-lg p-2 mb-3 border ${
        isBurned ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}
    >
      {isBurned && <span className="mr-1">⚠️</span>}
      {message}
    </div>
  );
}