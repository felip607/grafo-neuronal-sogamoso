import { AlertCircle } from 'lucide-react';

export const SystemInfo = () => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <div className="flex items-start">
        <AlertCircle className="text-blue-500 mr-2 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-bold text-blue-900">Sobre el Sistema de Optimización</h3>
          <p className="text-sm text-blue-800 mt-1">
            Este sistema utiliza una red neuronal feedforward para optimizar la distribución de agua
            buscando <strong>maximizar la equidad</strong> entre sectores. La red aprende a asignar recursos
            considerando la demanda, población y pérdidas históricas (IANC) de cada sector.
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Índice de Equidad:</strong> Mide qué tan uniformemente se satisface la demanda.
            100% significa que todos los sectores reciben proporcionalmente igual.
            <strong> Índice de Gini:</strong> Mide desigualdad (0 = perfecta equidad).
          </p>
        </div>
      </div>
    </div>
  );
};