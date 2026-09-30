import { Config } from '@/lib/types';

interface Props {
  config: Config;
  onChange: (config: Config) => void;
}

export default function ConfigForm({ config, onChange }: Props) {
  return (
    <section className="flex gap-3 mb-4">
      <div>
        <label className="block text-xs mb-1">% capital a operar</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-28"
          value={config.poolAllocPct * 100}
          onChange={(e) => onChange({ ...config, poolAllocPct: Number(e.target.value) / 100 })}
        />
      </div>
      <div>
        <label className="block text-xs mb-1">% riesgo por trade</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-28"
          value={config.riskPct * 100}
          onChange={(e) => onChange({ ...config, riskPct: Number(e.target.value) / 100 })}
        />
      </div>
      <div>
        <label className="block text-xs mb-1">RR (1:X)</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-28"
          value={config.rr}
          onChange={(e) => onChange({ ...config, rr: Number(e.target.value) })}
        />
      </div>
    </section>
  );
}