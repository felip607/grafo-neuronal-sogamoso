import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

export const Controls = ({ 
  isRunning, 
  setIsRunning, 
  resetSimulation, 
  trainModel, 
  isTrained, 
  scenario, 
  setScenario, 
  currentTime 
}) => {
  return (
    <div className="mt-4 flex gap-4 items-center flex-wrap">
      <button
        onClick={() => setIsRunning(!isRunning)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {isRunning ? <Pause size={20} /> : <Play size={20} />}
        {isRunning ? 'Pausar' : 'Iniciar'} Simulación
      </button>
      
      <button
        onClick={resetSimulation}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        <RotateCcw size={20} />
        Reiniciar
      </button>
      
      <button
        onClick={trainModel}
        disabled={isTrained}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          isTrained 
            ? 'bg-green-600 text-white cursor-not-allowed' 
            : 'bg-orange-600 text-white hover:bg-orange-700'
        }`}
      >
        <Activity size={20} />
        {isTrained ? '✓ Red Entrenada' : 'Entrenar Red Neuronal'}
      </button>
      
      <select
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="normal">Escenario Normal</option>
        <option value="drought">Época Seca</option>
        <option value="peak">Demanda Pico</option>
        <option value="failure">Falla de Fuente</option>
      </select>
      
      <div className="text-lg font-semibold text-gray-700">
        Hora: {currentTime}:00
      </div>
    </div>
  );
};