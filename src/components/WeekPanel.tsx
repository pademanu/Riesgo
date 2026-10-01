import { WeekState, ChartPoint, TradeResult, Config } from '@/lib/types';
import NextTradePreview from './NextTradePreview';
import TradeChart from './TradeChart';
import TradesTable from './TradesTable';

interface Props {
  week: WeekState;
  rr: number;
  chartData: ChartPoint[];
  onTrade: (result: TradeResult) => void;
  onDeleteTrade: (index: number) => void;
  onCloseWeek: () => void;
}

export default function WeekPanel({ week, rr, chartData, onTrade, onDeleteTrade, onCloseWeek }: Props) {
  return (
    <>
      <h2 className="text-lg font-semibold">{week.weekLabel}</h2>
      <p className="text-sm text-gray-300 mb-3">
        Meta actual: ${week.target.toFixed(2)} (pool base: ${week.poolBase.toFixed(2)})
      </p>

      <NextTradePreview riskActual={week.riskActual} rr={rr} />
      <TradeChart data={chartData} />

      <div className="flex gap-2 my-4">
        <button onClick={() => onTrade('win')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-sm cursor-pointer transition-colors">
          Trade ganado
        </button>
        <button onClick={() => onTrade('loss')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm cursor-pointer transition-colors">
          Trade perdido
        </button>
        <button onClick={onCloseWeek} className="hover:text-gray-400 border px-3 py-1.5 rounded ml-auto cursor-pointer">
          Cerrar semana
        </button>
      </div>

      <TradesTable trades={week.trades} onDelete={onDeleteTrade} />
    </>
  );
}