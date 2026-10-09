'use client';

import { useState } from 'react';

interface Props {
  maxRR: number;
  riskActual: number;
  onSubmit: (rr: number) => void;
  onCancel: () => void;
}

export default function PartialTradeForm({ maxRR, riskActual, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState('');
  const rr = Number(value);
  const isValid = rr > 0 && rr < maxRR;

  return (
    <div className="flex flex-wrap items-end gap-2 bg-black-50 border border-amber-200 rounded-lg p-3 mb-4">
      <div>
        <label className="block text-xs text-gray-200 mb-1">RR cobrado (menor a {maxRR})</label>
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border rounded px-2 py-1 w-28"
          placeholder="1.5"
          autoFocus
        />
      </div>
      <p className="text-xs text-gray-200 pb-2">
        {isValid ? `Ganancia: +$${(rr * riskActual).toFixed(2)}` : 'Ganancia: +0.00$'}
      </p>
      <button
        disabled={!isValid}
        onClick={() => onSubmit(rr)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-sm cursor-pointer transition-colors"
      >
        Registrar
      </button>
      <button onClick={onCancel} className="hover:text-gray-400 border px-3 py-1.5 rounded cursor-pointer">
        Cancelar
      </button>
    </div>
  );
}