interface Props {
  capitalGeneral: number;
  pool: number;
}

export default function CapitalOverview({ capitalGeneral, pool }: Props) {
  return (
    <section className="flex gap-4 mb-6">
      <div className="flex-1 bg-gray-50 p-4 rounded-lg">
        <p className="text-xs text-black">Capital general</p>
        <p className="text-2xl text-black font-semibold">${capitalGeneral.toFixed(2)}</p>
      </div>
      <div className="flex-1 bg-gray-50 p-4 rounded-lg">
        <p className="text-xs text-black">Capital en juego (pool)</p>
        <p className="text-2xl text-black font-semibold">${pool.toFixed(2)}</p>
      </div>
    </section>
  );
}