import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const EquityChart = ({ historyData }) => {
  if (!historyData || historyData.length === 0) return null;

  return (
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
  );
};