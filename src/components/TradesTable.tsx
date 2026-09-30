import { Trade } from '@/lib/types';

interface Props {
  trades: Trade[];
  onDelete: (index: number) => void;
}

export default function TradesTable({ trades, onDelete }: Props) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-1">#</th>
          <th>Resultado</th>
          <th>Riesgo</th>
          <th>P/L</th>
          <th>Pool</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t, i) => (
          <tr key={i} className="border-b">
            <td className="py-1">{i + 1}</td>
            <td className={t.result === 'win' ? 'text-emerald-600' : 'text-red-600'}>
              {t.result === 'win' ? 'Ganado' : 'Perdido'}
            </td>
            <td>${t.risk.toFixed(2)}</td>
            <td className={t.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {t.delta >= 0 ? '+' : ''}${t.delta.toFixed(2)}
            </td>
            <td>${t.poolAfter.toFixed(2)}</td>
            <td>
              <button onClick={() => onDelete(i)} className="text-gray-400 hover:text-red-600">🗑</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}