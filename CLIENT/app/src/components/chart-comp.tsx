import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StockChartProps {
    data: any[];
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
    const formattedData = data.map(item => ({
        date: item.date.split('T')[0],
        close: item.close
    }));

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData}>
                    <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            borderColor: '#eab308',
                            borderRadius: '0.5rem',
                            color: '#f3f4f6'
                        }}
                        labelStyle={{ color: '#eab308', fontWeight: 'bold' }}
                        formatter={(value) => [`$${value}`, 'Price']}
                    />
                    <Area
                        type="monotone"
                        dataKey="close"
                        stroke="#eab308"
                        strokeWidth={2}
                        fill="url(#colorClose)"
                        activeDot={{ r: 6, fill: '#f59e0b' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StockChart;