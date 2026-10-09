import { Config } from '@/lib/types';
import { previewSetup } from '@/lib/tradingLogic';

interface Props {
  config: Config;
  capital: number;
}

export default function SetupPreview({ config, capital }: Props) {
  const p = previewSetup(config, capital);
  if (!p) return null;

  return (
    <div className="text-xl rounded-lg p-2 mb-3 border bg-gray-50 border-gray-200 text-gray-600 space-y-1">
      {p.winsToDouble === null ? (
        <p>
          Con estos ajustes el riesgo no escala lo suficiente: ni con 50 trades ganadores seguidos
          se duplica el bracket.
        </p>
      ) : (
        <>
          <p>
            Con estos ajustes te tomaría{p.winsToDouble === 1 ? '' : 'n'} <b>{p.winsToDouble}</b>{' '}
            {p.winsToDouble === 1 ? 'trade ganador' : 'trades ganadores'} para duplicar un bracket y{' '}
            <b>{p.lossesToBurn}</b>{' '}
            {p.lossesToBurn === 1 ? 'trade perdedor' : 'trades perdedores seguidos'} para quemarlo.
          </p>
          {p.surplus > 0.005 && (
            <p>
              Al duplicar queda un sobrante que cubre el <b>{p.surplusPctOfBase.toFixed(0)}%</b> del pool del bracket anterior.
              {p.surplusPctOfBase >= 100 &&
                ' Si pierdes el siguiente bracket regresas a uno con dinero ya ganado.'}
            </p>
          )}
          <p className='text-red-400 font-bold'>
            Esto es una proyección, no una predicción.
          </p>
        </>
      )}
    </div>
  );
}