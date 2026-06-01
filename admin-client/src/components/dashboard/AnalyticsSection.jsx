"use client";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { motion } from "framer-motion";

const performanceData = [
  { session: '2019/20', avgGPA: 2.8 },
  { session: '2020/21', avgGPA: 3.1 },
  { session: '2021/22', avgGPA: 2.9 },
  { session: '2022/23', avgGPA: 3.3 },
  { session: '2023/24', avgGPA: 3.42 },
];

const passFailData = [
  { name: 'Pass (1st Class)', value: 120, color: '#10B981' },
  { name: 'Pass (2nd Upper)', value: 340, color: '#3B82F6' },
  { name: 'Pass (2nd Lower)', value: 410, color: '#8B5CF6' },
  { name: 'Pass (3rd Class)', value: 116, color: '#F59E0B' },
  { name: 'Fail', value: 262, color: '#EF4444' },
];

export default function AnalyticsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Line Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Average CGPA Trend</h3>
            <p className="text-sm text-slate-400">Historical performance over 5 sessions</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors">
            View Full Report
          </button>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="session" 
                stroke="#64748B" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#64748B" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                domain={[2, 4]} 
                dx={-10}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#131B2F', 
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#F8FAFC' }}
              />
              <Line 
                type="monotone" 
                dataKey="avgGPA" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4, stroke: '#131B2F' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981', style: { filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.8))' } }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Donut Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6 border border-white/5 flex flex-col"
      >
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-white">Grade Distribution</h3>
          <p className="text-sm text-slate-400">Current session overview</p>
        </div>
        
        <div className="flex-1 min-h-[200px] w-full relative flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={passFailData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {passFailData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 4px ${entry.color}80)` }} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#131B2F', 
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#F8FAFC' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">1,248</span>
            <span className="text-xs text-slate-400">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          {passFailData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }} />
                <span className="text-slate-300">{item.name}</span>
              </div>
              <span className="font-semibold text-white">{item.value}</span>
            </div>
          ))}
        </div>

      </motion.div>

    </div>
  );
}
