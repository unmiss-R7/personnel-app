'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { RankStat } from '@/types/personnel';

interface RankBreakdownChartProps {
  data: RankStat[];
}

export default function RankBreakdownChart({ data }: RankBreakdownChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-60 sm:h-72 w-full bg-gray-50 animate-pulse rounded-2xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 w-full flex items-center justify-center text-gray-400 text-xs">
        ไม่มีข้อมูลชั้นยศ
      </div>
    );
  }

  return (
    <div className="w-full h-60 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis 
            type="category" 
            dataKey="rank" 
            tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 700 }}
            width={45}
          />
          <Tooltip 
            formatter={(value: any, _, item: any) => [
              `${value} นาย (${item?.payload?.category || ''})`,
              'จำนวน'
            ]}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.category === 'นายทหารสัญญาบัตร' ? '#0f172a' : '#d97706'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
