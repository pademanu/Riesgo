'use client';

import { useState } from 'react';

interface Props {
  onAdjust: (amount: number) => void;
}

export default function CapitalAdjuster({ onAdjust }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  function handleSubmit(type: 'deposit' | 'withdraw') {
    const value = Number(amount);
    if (!value || value <= 0) return;
    onAdjust(type === 'deposit' ? value : -value);
    setAmount('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border px-3 py-1.5 rounded ml-auto cursor-pointer"
      >
        Depositar o retirar capital
      </button>
    );
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-4 space-y-3">
      {/* Campo de monto */}
      <div>
        <label className="block text-xs text-black mb-1">Monto</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-3 py-1.5 w-full max-w-35 text-black font-semibold"
          placeholder="0.00"
          autoFocus
        />
      </div>

      {/* Botones */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleSubmit('deposit')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-sm cursor-pointer transition-colors"
        >
          Depositar
        </button>

        <button
          onClick={() => handleSubmit('withdraw')}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm cursor-pointer transition-colors"
        >
          Retirar
        </button>

        <button
          onClick={() => setOpen(false)}
          className="text-black hover:text-gray-700 px-2 text-sm cursor-pointer transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}