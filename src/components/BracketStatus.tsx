import { WeekState, Config } from '@/lib/types';
import { getWeekStatus } from '@/lib/tradingLogic';

interface Props {
  week: WeekState;
  config: Config;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export default function BracketStatus({ week, config }: Props) {
  const s = getWeekStatus(week, config);
  const recovering = s.mode === 'recovery';

  return (
    <div
      className={`text-lg rounded-lg p-3 mb-3 border space-y-1 ${
        recovering ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}
    >
      <p>
        {recovering && <span className="mr-1">⚠️</span>}
        Pool actual: <b>{money(s.ladderBase)}</b>
        {s.ladderIndex === 0 && ' (inicial)'} · paso <b>{s.step}</b>
        {s.amountToNextStep !== null && (
          <> ({money(s.amountToNextStep)} para el paso {s.step + 1})</>
        )}{' '}
        · {recovering ? 'modo recuperación' : 'modo normal'}
      </p>

      {recovering && (
        <p>
          Estás recuperando el pool de <b>{money(week.poolBase)}</b>: cualquier pérdida te devuelve al paso 1 del pool actual.
        </p>
      )}

      <p>
        Te faltan <b>{money(s.amountToNext)}</b> para subir al pool de <b>{money(s.nextGoal)}</b>{' '}
        {s.winsToNext !== null ? (
          <>
            (<b>{s.winsToNext}</b> {s.winsToNext === 1 ? 'trade ganador completo' : 'trades ganadores completos'}).
          </>
        ) : (
          '(más de 60 trades ganadores).'
        )}
      </p>

      {s.lowerBase !== null ? (
        <p>
          Te queda{s.lossesToDrop === 1 ? '' : 'n'} <b>{s.lossesToDrop ?? '200+'}</b>{' '}
          {s.lossesToDrop === 1 ? 'pérdida seguida' : 'pérdidas seguidas'} para bajar al pool de{' '}
          <b>{money(s.lowerBase)}</b> (margen: {money(s.amountToDrop ?? 0)}).
        </p>
      ) : (
        <p>Estás en el pool inicial: no hay un pool más bajo al que caer.</p>
      )}
    </div>
  );
}