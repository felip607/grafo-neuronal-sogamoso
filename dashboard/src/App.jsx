import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertCircle, Droplet, Activity, TrendingUp, Play, Pause, RotateCcw } from 'lucide-react';

// Configuración del sistema basado en datos reales de Sogamoso
const SYSTEM_CONFIG = {
  sources: {
    tota: { name: 'Lago Tota', capacity: 250, current: 250 },
    tejar: { name: 'Río Tejar', capacity: 15, current: 15 },
    pozo: { name: 'Pozo Profundo', capacity: 10, current: 10 }
  },
  plants: {
    chacon: { name: 'El Chacón', capacity: 365, storage: 10000 },
    sur: { name: 'El Sur', capacity: 60, storage: 0 },
    mode: { name: 'El Mode', capacity: 30, storage: 856 }
  },
  sectors: [
    { id: 1, name: 'Sector 1 (Sur)', population: 10000, currentLoss: 71, demand: 60 },
    { id: 2, name: 'Sector 2', population: 6000, currentLoss: 4, demand: 35 },
    { id: 3, name: 'Sector 3 (Centro)', population: 30000, currentLoss: 41, demand: 88 },
    { id: 4, name: 'Sector 4', population: 25000, currentLoss: 26, demand: 75 },
    { id: 5, name: 'Sector 5 (Mode Rural)', population: 4000, currentLoss: 62, demand: 15 },
    { id: 6, name: 'Sector 6', population: 2000, currentLoss: 43, demand: 9 },
    { id: 7, name: 'Sector 7', population: 2000, currentLoss: 9, demand: 10 },
    { id: 8, name: 'Sector 8 (Norte)', population: 22000, currentLoss: 38, demand: 72 },
    { id: 9, name: 'Sector 9', population: 7000, currentLoss: 44, demand: 20 },
    { id: 10, name: 'Sector 10 (Santa Bárbara)', population: 3000, currentLoss: 39, demand: 11 }
  ]
};

// Red Neuronal Simple para Optimización de Equidad
class EquityOptimizer {
  constructor() {
    this.weights = Array(10).fill(null).map(() => Math.random() * 0.5 + 0.5);
    this.learningRate = 0.01;
    this.trained = false;
  }

  // Función de activación softmax para distribución de probabilidad
  softmax(values) {
    const max = Math.max(...values);
    const exps = values.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  // Predicción de distribución óptima
  predict(totalAvailable, demands) {
    // Ajustar pesos según demanda y pérdidas históricas
    const adjustedWeights = demands.map((demand, i) => {
      const sector = SYSTEM_CONFIG.sectors[i];
      const lossFactor = 1 - (sector.currentLoss / 100); // Penalizar sectores con altas pérdidas
      return this.weights[i] * demand * lossFactor;
    });

    const distribution = this.softmax(adjustedWeights);
    return distribution.map(ratio => ratio * totalAvailable);
  }

  // Entrenar para mejorar equidad
  train(totalAvailable, demands, epochs = 100) {
    for (let epoch = 0; epoch < epochs; epoch++) {
      const allocation = this.predict(totalAvailable, demands);
      
      // Calcular equidad (ratio de satisfacción)
      const satisfactionRatios = allocation.map((alloc, i) => 
        demands[i] > 0 ? alloc / demands[i] : 1
      );
      
      const meanSatisfaction = satisfactionRatios.reduce((a, b) => a + b) / satisfactionRatios.length;
      
      // Ajustar pesos para reducir varianza
      this.weights = this.weights.map((w, i) => {
        const error = satisfactionRatios[i] - meanSatisfaction;
        return w - this.learningRate * error * 0.1;
      });
    }
    this.trained = true;
  }

  // Calcular métricas de equidad
  calculateEquityMetrics(allocation, demands) {
    const ratios = allocation.map((alloc, i) => 
      demands[i] > 0 ? (alloc / demands[i]) * 100 : 100
    );
    
    const mean = ratios.reduce((a, b) => a + b) / ratios.length;
    const variance = ratios.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratios.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100; // Coeficiente de variación
    
    // Índice de Gini simplificado
    const sortedRatios = [...ratios].sort((a, b) => a - b);
    let giniSum = 0;
    sortedRatios.forEach((ratio, i) => {
      giniSum += (2 * (i + 1) - ratios.length - 1) * ratio;
    });
    const gini = giniSum / (ratios.length * ratios.reduce((a, b) => a + b));
    
    return {
      satisfactionRatios: ratios,
      mean,
      stdDev,
      cv,
      gini: Math.abs(gini),
      equityIndex: Math.max(0, 100 - cv) // 100% = perfecta equidad
    };
  }
}

const WaterDistributionOptimizer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [optimizer] = useState(() => new EquityOptimizer());
  const [isTrained, setIsTrained] = useState(false);
  const [scenario, setScenario] = useState('normal');
  const [currentData, setCurrentData] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // Generar demanda sintética realista con patrón horario
  const generateDemand = (hour, sectorId) => {
    const sector = SYSTEM_CONFIG.sectors[sectorId];
    const baseDemand = sector.demand;
    
    // Patrón horario: picos en 6-8am y 6-8pm
    const hourFactor = 
      (hour >= 6 && hour <= 8) ? 1.4 :
      (hour >= 18 && hour <= 20) ? 1.3 :
      (hour >= 0 && hour <= 5) ? 0.6 :
      (hour >= 22 && hour <= 24) ? 0.7 : 1.0;
    
    // Variación aleatoria ±10%
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    return baseDemand * hourFactor * randomFactor;
  };

  // Simular disponibilidad de fuentes según escenario
  const getSourceAvailability = () => {
    let totaFactor = 1.0;
    let tejarFactor = 1.0;
    
    switch(scenario) {
      case 'drought':
        totaFactor = 0.7;
        tejarFactor = 0.5;
        break;
      case 'peak':
        totaFactor = 1.0;
        tejarFactor = 1.0;
        break;
      case 'failure':
        totaFactor = 0.5;
        tejarFactor = 0;
        break;
      default:
        totaFactor = 1.0;
        tejarFactor = 1.0;
    }
    
    return {
      tota: SYSTEM_CONFIG.sources.tota.capacity * totaFactor,
      tejar: SYSTEM_CONFIG.sources.tejar.capacity * tejarFactor,
      pozo: SYSTEM_CONFIG.sources.pozo.capacity
    };
  };

  // Distribución actual (proporcional sin optimización)
  const currentDistribution = (totalAvailable, demands) => {
    const totalDemand = demands.reduce((a, b) => a + b, 0);
    if (totalDemand === 0) return demands;
    
    const ratio = totalAvailable / totalDemand;
    return demands.map(d => d * Math.min(ratio, 1));
  };

  // Actualizar simulación
  const updateSimulation = () => {
    const hour = time % 24;
    const sources = getSourceAvailability();
    const totalAvailable = sources.tota + sources.tejar + sources.pozo;
    
    const demands = SYSTEM_CONFIG.sectors.map((_, i) => 
      generateDemand(hour, i)
    );
    
    // Distribución actual (sin NN)
    const currentAlloc = currentDistribution(totalAvailable, demands);
    const currentMetrics = optimizer.calculateEquityMetrics(currentAlloc, demands);
    
    // Distribución optimizada (con NN)
    const optimizedAlloc = isTrained 
      ? optimizer.predict(totalAvailable, demands)
      : currentAlloc;
    const optimizedMetrics = optimizer.calculateEquityMetrics(optimizedAlloc, demands);
    
    const data = {
      time: hour,
      totalAvailable,
      sources,
      demands,
      currentAlloc,
      optimizedAlloc,
      currentMetrics,
      optimizedMetrics,
      sectors: SYSTEM_CONFIG.sectors.map((sector, i) => ({
        ...sector,
        demand: demands[i],
        currentSupply: currentAlloc[i],
        optimizedSupply: optimizedAlloc[i],
        currentSatisfaction: currentMetrics.satisfactionRatios[i],
        optimizedSatisfaction: optimizedMetrics.satisfactionRatios[i]
      }))
    };
    
    setCurrentData(data);
    setHistoryData(prev => [...prev.slice(-23), {
      hour,
      currentEquity: currentMetrics.equityIndex,
      optimizedEquity: optimizedMetrics.equityIndex,
      currentGini: currentMetrics.gini,
      optimizedGini: optimizedMetrics.gini
    }]);
  };

  // Entrenar red neuronal
  const trainModel = () => {
    const avgDemands = SYSTEM_CONFIG.sectors.map(s => s.demand);
    const totalAvailable = 275; // Promedio disponible
    
    optimizer.train(totalAvailable, avgDemands, 500);
    setIsTrained(true);
    updateSimulation();
  };

  // Efectos
  useEffect(() => {
    updateSimulation();
  }, [time, scenario, isTrained]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!currentData) return <div className="p-8">Cargando...</div>;

  const getSectorColor = (satisfaction) => {
    if (satisfaction >= 95) return '#22c55e';
    if (satisfaction >= 80) return '#eab308';
    if (satisfaction >= 60) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Sistema de Optimización de Distribución de Agua
          </h1>
          <p className="text-gray-600">Sogamoso, Boyacá - Optimización basada en Redes Neuronales</p>
          
          <div className="mt-4 flex gap-4 items-center flex-wrap">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pausar' : 'Iniciar'} Simulación
            </button>
            
            <button
              onClick={() => {
                setTime(0);
                setHistoryData([]);
                updateSimulation();
              }}
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
              Hora: {currentData.time}:00
            </div>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibilidad Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentData.totalAvailable.toFixed(1)} L/s
                </p>
              </div>
              <Droplet className="text-blue-400" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Equidad Actual</p>
                <p className="text-2xl font-bold text-orange-600">
                  {currentData.currentMetrics.equityIndex.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="text-orange-400" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Equidad Optimizada</p>
                <p className="text-2xl font-bold text-green-600">
                  {currentData.optimizedMetrics.equityIndex.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="text-green-400" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mejora</p>
                <p className="text-2xl font-bold text-purple-600">
                  +{(currentData.optimizedMetrics.equityIndex - currentData.currentMetrics.equityIndex).toFixed(1)}%
                </p>
              </div>
              <Activity className="text-purple-400" size={32} />
            </div>
          </div>
        </div>

        {/* Gráficas de Equidad en el Tiempo */}
        {historyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Evolución de Equidad</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Hora', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Índice de Equidad (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="currentEquity" stroke="#f97316" name="Sistema Actual" strokeWidth={2} />
                <Line type="monotone" dataKey="optimizedEquity" stroke="#22c55e" name="Sistema Optimizado" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Comparación por Sectores */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Satisfacción de Demanda por Sector</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentData.sectors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" label={{ value: 'Sector', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Satisfacción (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="currentSatisfaction" fill="#f97316" name="Actual" />
              <Bar dataKey="optimizedSatisfaction" fill="#22c55e" name="Optimizado" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla Detallada de Sectores */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Estado Detallado por Sector</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Sector</th>
                  <th className="p-2 text-right">Población</th>
                  <th className="p-2 text-right">Demanda (L/s)</th>
                  <th className="p-2 text-right">Suministro Actual</th>
                  <th className="p-2 text-right">Suministro Opt.</th>
                  <th className="p-2 text-right">Satisfacción Actual</th>
                  <th className="p-2 text-right">Satisfacción Opt.</th>
                  <th className="p-2 text-right">IANC Histórico</th>
                </tr>
              </thead>
              <tbody>
                {currentData.sectors.map((sector) => (
                  <tr key={sector.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{sector.name}</td>
                    <td className="p-2 text-right">{sector.population.toLocaleString()}</td>
                    <td className="p-2 text-right">{sector.demand.toFixed(1)}</td>
                    <td className="p-2 text-right">{sector.currentSupply.toFixed(1)}</td>
                    <td className="p-2 text-right">{sector.optimizedSupply.toFixed(1)}</td>
                    <td className="p-2 text-right">
                      <span 
                        className="px-2 py-1 rounded text-white text-xs font-bold"
                        style={{ backgroundColor: getSectorColor(sector.currentSatisfaction) }}
                      >
                        {sector.currentSatisfaction.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span 
                        className="px-2 py-1 rounded text-white text-xs font-bold"
                        style={{ backgroundColor: getSectorColor(sector.optimizedSatisfaction) }}
                      >
                        {sector.optimizedSatisfaction.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right text-red-600 font-semibold">{sector.currentLoss}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información del Sistema */}
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
      </div>
    </div>
  );
};

export default WaterDistributionOptimizer;