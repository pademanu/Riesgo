interface Props {
  riskActual: number;
  rr: number;
}

export default function NextTradePreview({ riskActual, rr }: Props) {
  return (
    <div className="flex gap-6 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
      <div>
        <p className="text-xs text-gray-600 m-0">Próximo Stop Loss (riesgo)</p>
        <p className="text-lg text-black font-semibold m-0">${riskActual.toFixed(2)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-600 m-0">Próximo Take Profit (ganancia)</p>
        <p className="text-lg text-black font-semibold m-0">${(riskActual * rr).toFixed(2)}</p>
      </div>
    </div>
  );
}