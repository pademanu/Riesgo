interface Props {
  capitalGeneral: number;
  pool: number;
}

export default function CapitalOverview({ capitalGeneral, pool }: Props) {
  return (
    <section className="grid gap-4 mb-6 w-full">
      {/* Capital general */}
      <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
        <p className="text-xs text-black">Capital general</p>
        <p
          className="text-2xl text-black font-semibold truncate"
          title={`$${capitalGeneral.toFixed(2)}`} // tooltip con el valor completo
        >
          ${capitalGeneral.toFixed(2)}
        </p>
      </div>

      {/* Capital en juego (pool) */}
      <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
        <p className="text-xs text-black">Capital en juego (pool)</p>
        <p
          className="text-2xl text-black font-semibold truncate"
          title={`$${pool.toFixed(2)}`}
        >
          ${pool.toFixed(2)}
        </p>
      </div>
    </section>
  );
}