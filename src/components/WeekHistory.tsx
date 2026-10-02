import { WeekHistoryEntry } from '@/lib/types';

interface Props {
  history: WeekHistoryEntry[];
  onDelete: (id: string) => void;
}

export default function WeekHistory({ history, onDelete }: Props) {
  if (history.length === 0) return null;

  return (
    <section className="mt-8 border-t pt-4">
      <h2 className="text-lg font-semibold mb-2">Historial de semanas</h2>
      {history.map((h) => {
        const winCount = h.results.filter((r) => r === 'win').length;
        const lossCount = h.results.filter((r) => r === 'loss').length;
        const totalTrades = winCount + lossCount;
        const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
        return (
          <div key={h.id} className="flex justify-between items-center bg-gray-50 border rounded-lg p-3 mb-2">
            <div>
              <p className="font-semibold text-black">{h.weekLabel}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {winCount}G / {lossCount}P · win rate {winRate.toFixed(0)}% · pool base ${h.poolBaseInitial.toFixed(2)} ·
                RR 1:{h.config.rr} · riesgo {(h.config.riskPct * 100).toFixed(0)}%
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${h.netResult >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {h.netResult >= 0 ? '+' : ''}${h.netResult.toFixed(2)}
              </span>
              <button onClick={() => onDelete(h.id)} className="text-gray-400 hover:text-red-600">🗑</button>
            </div>
          </div>
        );
      })}
    </section>
  );
}