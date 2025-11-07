import React, { useState, useEffect } from 'react';
import { Droplet, Activity, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { EquityOptimizer } from './models/EquityOptimizer';
import { SYSTEM_CONFIG } from './config/systemConfig';
import { Controls } from './components/Controls';
import { EquityChart } from './components/charts/EquityChart';
import { SectorSatisfactionChart } from './components/charts/SectorSatisfactionChart';
import { SystemInfo } from './components/SystemInfo';

import './App.css';

const MetricCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

const WaterDistributionOptimizer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [optimizer] = useState(() => new EquityOptimizer());
  const [isTrained, setIsTrained] = useState(false);
  const [scenario, setScenario] = useState('normal');
  const [currentData, setCurrentData] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // Generate realistic synthetic demand with hourly pattern
  const generateDemand = (hour, sectorId) => {
    const sector = SYSTEM_CONFIG.sectors[sectorId];
    const baseDemand = sector.demand;
    
    const hourFactor = 
      (hour >= 6 && hour <= 8) ? 1.4 :
      (hour >= 18 && hour <= 20) ? 1.3 :
      (hour >= 0 && hour <= 5) ? 0.6 :
      (hour >= 22 && hour <= 24) ? 0.7 : 1.0;
    
    const randomFactor = 0.9 + Math.random() * 0.2;
    return baseDemand * hourFactor * randomFactor;
  };

  // Simulate source availability based on scenario
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

  // Current distribution (proportional without optimization)
  const currentDistribution = (totalAvailable, demands) => {
    const totalDemand = demands.reduce((a, b) => a + b, 0);
    if (totalDemand === 0) return demands;
    
    const ratio = totalAvailable / totalDemand;
    return demands.map(d => d * Math.min(ratio, 1));
  };

  // Update simulation
  const updateSimulation = () => {
    const hour = time % 24;
    const sources = getSourceAvailability();
    const totalAvailable = sources.tota + sources.tejar + sources.pozo;
    
    const demands = SYSTEM_CONFIG.sectors.map((_, i) => 
      generateDemand(hour, i)
    );
    
    // Current distribution (without NN)
    const currentAlloc = currentDistribution(totalAvailable, demands);
    const currentMetrics = optimizer.calculateEquityMetrics(currentAlloc, demands);
    
    // Optimized distribution (with NN)
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

  // Train neural network
  const trainModel = () => {
    const avgDemands = SYSTEM_CONFIG.sectors.map(s => s.demand);
    const totalAvailable = 275; // Average available
    
    optimizer.train(totalAvailable, avgDemands, 500);
    setIsTrained(true);
    updateSimulation();
  };

  // Reset simulation
  const resetSimulation = () => {
    setTime(0);
    setHistoryData([]);
    updateSimulation();
  };

  // Effects
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

  if (!currentData) return <div className="p-8">Loading...</div>;

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

          <Controls 
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            resetSimulation={resetSimulation}
            trainModel={trainModel}
            isTrained={isTrained}
            scenario={scenario}
            setScenario={setScenario}
            currentTime={currentData.time}
          />
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Disponibilidad Total"
            value={`${currentData.totalAvailable.toFixed(1)} L/s`}
            icon={<Droplet className="text-blue-400" size={32} />}
            color="blue"
          />
          <MetricCard
            title="Equidad Actual"
            value={`${currentData.currentMetrics.equityIndex.toFixed(1)}%`}
            icon={<TrendingUp className="text-orange-400" size={32} />}
            color="orange"
          />
          <MetricCard
            title="Equidad Optimizada"
            value={`${currentData.optimizedMetrics.equityIndex.toFixed(1)}%`}
            icon={<TrendingUp className="text-green-400" size={32} />}
            color="green"
          />
          <MetricCard
            title="Mejora"
            value={`+${(currentData.optimizedMetrics.equityIndex - currentData.currentMetrics.equityIndex).toFixed(1)}%`}
            icon={<Activity className="text-purple-400" size={32} />}
            color="purple"
          />
        </div>

        {/* Charts */}
        {historyData.length > 0 && <EquityChart historyData={historyData} />}
        <SectorSatisfactionChart sectors={currentData.sectors} />

        {/* Detailed Table */}
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

        <SystemInfo />
      </div>
    </div>
  );
};

export default WaterDistributionOptimizer;