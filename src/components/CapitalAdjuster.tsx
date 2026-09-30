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
      <button onClick={() => setOpen(true)} className="text-xs text-gray-500 underline mb-4">
        Depositar o retirar capital
      </button>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4 bg-gray-50 border rounded-lg p-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Monto</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-2 py-1 w-32 text-black font-semibold"
          placeholder="0.00"
          autoFocus
        />
      </div>
      <button onClick={() => handleSubmit('deposit')} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm">
        Depositar
      </button>
      <button onClick={() => handleSubmit('withdraw')} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm">
        Retirar
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 px-2 text-sm">
        Cancelar
      </button>
    </div>
  );
}