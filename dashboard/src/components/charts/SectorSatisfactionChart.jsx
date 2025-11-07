import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const SectorSatisfactionChart = ({ sectors }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Satisfacción de Demanda por Sector</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sectors}>
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
  );
};