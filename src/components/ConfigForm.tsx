import { Config } from '@/lib/types';
import { useState, useEffect } from 'react';

interface Props {
  config: Config;
  onChange: (config: Config) => void;
}

export default function ConfigForm({ config, onChange }: Props) {
  // Estados locales para poder tener el input vacío
  const [poolAlloc, setPoolAlloc] = useState(String(config.poolAllocPct * 100));
  const [risk, setRisk] = useState(String(config.riskPct * 100));
  const [rr, setRr] = useState(String(config.rr));

  // Sincronizar si el config cambia desde fuera
  useEffect(() => {
    setPoolAlloc(String(config.poolAllocPct * 100));
    setRisk(String(config.riskPct * 100));
    setRr(String(config.rr));
  }, [config.poolAllocPct, config.riskPct, config.rr]);

  return (
    <section className="flex gap-3 mb-4">
      {/* % capital a operar */}
      <div>
        <label className="block text-xs mb-1">% capital a operar</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-28"
          value={poolAlloc}
          onChange={(e) => {
            const value = e.target.value;
            setPoolAlloc(value);

            // Solo actualizamos el config si hay un número válido
            if (value !== '' && !isNaN(Number(value))) {
              onChange({
                ...config,
                poolAllocPct: Number(value) / 100,
              });
            }
          }}
          onBlur={() => {
            // Si al salir del campo está vacío, ponemos 0
            if (poolAlloc === '') {
              setPoolAlloc('0');
              onChange({ ...config, poolAllocPct: 0 });
            }
          }}
        />
      </div>

      {/* % riesgo por trade */}
      <div>
        <label className="block text-xs mb-1">% riesgo por trade</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-28"
          value={risk}
          onChange={(e) => {
            const value = e.target.value;
            setRisk(value);

            if (value !== '' && !isNaN(Number(value))) {
              onChange({
                ...config,
                riskPct: Number(value) / 100,
              });
            }
          }}
          onBlur={() => {
            if (risk === '') {
              setRisk('0');
              onChange({ ...config, riskPct: 0 });
            }
          }}
        />
      </div>

      {/* RR (1:X) */}
      <div>
        <label className="block text-xs mb-1">RR (1:X)</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-28"
          value={rr}
          onChange={(e) => {
            const value = e.target.value;
            setRr(value);

            if (value !== '' && !isNaN(Number(value))) {
              onChange({
                ...config,
                rr: Number(value),
              });
            }
          }}
          onBlur={() => {
            if (rr === '') {
              setRr('0');
              onChange({ ...config, rr: 0 });
            }
          }}
        />
      </div>
    </section>
  );
}