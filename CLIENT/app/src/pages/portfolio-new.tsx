import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, GitCommit, BrainCircuit, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Cover from "../assets/BG.png";
import Navbar from '../components/navbar';

// --- TypeScript Interfaces (Unchanged) ---
interface DecisionItem {
    stockSymbol: string;
    decision: 'BUY' | 'NO_BUY' | string;
    reason: string;
}
interface YahooDataPoint {
    date: string;
    close: number;
    predicted?: number;
}
interface RegressionStockData {
    stockSymbol: string;
    yahoo_data: YahooDataPoint[];
}
interface GeminiData {
    score: string;
    reasoning: string;
}
interface StrategyResponse {
    confidence?: string;
    data?: DecisionItem[] | RegressionStockData[] | GeminiData;
    details?: DecisionItem[];
}
interface Strategy {
    strategy: string;
    response: StrategyResponse;
}
interface ErrorDisplayProps {
    message: string;
}

// --- Skeleton Loader (Glassmorphic) ---
const SkeletonLoader = () => (
    <div className="relative min-h-screen bg-black text-zinc-300 font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black"></div>
        <div className="absolute inset-0 bg-cover opacity-15" style={{ backgroundImage: `url(${Cover})`, filter: 'grayscale(80%)' }}></div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <header className="mb-12 text-center">
                <div className="h-16 bg-white/10 rounded-lg w-3/4 mx-auto mb-4 animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded w-1/4 mx-auto animate-pulse"></div>
            </header>

            {/* Regression Charts Skeleton */}
            <div className="mb-12">
                <div className="h-8 bg-white/10 rounded w-1/3 mb-6 animate-pulse"></div>
                <div className="flex space-x-6 overflow-x-auto pb-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-shrink-0 w-[90%] sm:w-[60%] md:w-[45%] lg:w-[35%]">
                            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-80 animate-pulse">
                                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                                <div className="bg-white/5 rounded-lg h-56"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strategy Cards Skeleton */}
            <div>
                <div className="h-8 bg-white/10 rounded w-1/3 mb-6 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="bg-white/10 rounded-full h-12 w-12"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-6 bg-white/10 rounded w-3/4"></div>
                                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-3 mt-4">
                                <div className="h-4 bg-white/10 rounded w-full"></div>
                                <div className="h-4 bg-white/10 rounded w-5/6"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// --- UI State Helper Components (Glassmorphic) ---
const ErrorDisplay = ({ message }: ErrorDisplayProps) => (
    <div className="flex items-center justify-center h-screen bg-black p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black"></div>
        <div className="absolute inset-0 bg-cover opacity-10 filter grayscale" style={{ backgroundImage: `url(${Cover})` }}></div>

        <div className="relative bg-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-lg text-center shadow-2xl shadow-red-500/10">
            <AlertTriangle className="h-12 w-12 mb-4 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold mb-2 text-white">Execution Failed</h2>
            <p className="text-lg text-center max-w-md text-zinc-300">Could not retrieve market data. Check terminal and API connection.</p>
            <p className="text-sm mt-4 p-3 bg-red-500/10 rounded-lg font-mono text-red-300">Error: {message}</p>
        </div>
    </div>
);

// --- Core UI Components (Glassmorphic) ---
const StrategyCard = ({ strategy }: { strategy: Strategy }) => {
    const { strategy: strategyName, response } = strategy;

    const getIcon = () => {
        const iconProps = { className: "h-8 w-8 text-amber-400" };
        switch (strategyName) {
            case 'Mean Reversion': return <GitCommit {...iconProps} />;
            case 'Avg Crossover': return <TrendingUp {...iconProps} />;
            case 'GeoPolitics + Social Media Strategy': return <BrainCircuit {...iconProps} />;
            default: return <TrendingUp {...iconProps} />;
        }
    };

    const DecisionIcon = ({ decision }: { decision: string }) => {
        const iconProps = { className: `h-5 w-5 mt-0.5 flex-shrink-0` };
        switch (decision) {
            case 'BUY': return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-400`} />;
            case 'NO_BUY': return <XCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
            default: return null;
        }
    };

    const renderContent = () => {
        // ... content rendering logic is unchanged, but benefits from new card styles
        switch (strategyName) {
            case 'Mean Reversion':
            case 'Avg Crossover':
                const items = (response.data as DecisionItem[]) || response.details;
                if (!items || items.length === 0) return <p className="p-4 text-zinc-500">No signals generated.</p>;
                return (
                    <div className="divide-y divide-white/5">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-start space-x-3 p-4 group hover:bg-white/5 transition-colors">
                                <DecisionIcon decision={item.decision} />
                                <div>
                                    <p className="font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">
                                        {item.stockSymbol} -{' '}
                                        <span className={`font-bold ${item.decision === 'BUY' ? 'text-green-400' : 'text-red-500'}`}>
                                            {item.decision.replace('_', ' ')}
                                        </span>
                                    </p>
                                    <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">{item.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'Gemini Strategy':
                const geminiData = response.data as GeminiData;
                if (!geminiData) return null;
                return (
                    <div className="p-4 space-y-4">
                        <div>
                            <h4 className="font-bold text-zinc-200 mb-1">Sentiment Score</h4>
                            <p className="text-md text-amber-300 whitespace-pre-line">{geminiData.score}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-200 mb-1">Reasoning</h4>
                            <p className="text-sm text-zinc-400">{geminiData.reasoning}</p>
                        </div>
                    </div>
                );
            default:
                return <p className="p-4 text-zinc-500">No display available for this strategy.</p>;
        }
    };

    return (
        // Enhanced Glassmorphic Card Style
        <div className="bg-zinc-900/30 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-amber-500/10">
            <div className="p-4 flex items-center space-x-4 border-b border-white/5">
                {getIcon()}
                <div>
                    <h3 className="text-xl font-bold text-amber-300">{strategyName}</h3>
                    {response.confidence && <p className="text-xs text-amber-500/80 font-mono tracking-wider">{response.confidence}</p>}
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

const SingleRegressionChart = ({ stock }: { stock: RegressionStockData }) => {
    const chartData = stock.yahoo_data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return (
        // Enhanced Glassmorphic Card Style
        <div className="bg-zinc-900/30 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg p-4 sm:p-6 h-full transition-all duration-300 hover:border-white/20 hover:shadow-amber-500/10">
            <h3 className="text-xl font-bold text-amber-300 mb-4">{stock.stockSymbol} Forecast</h3>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" horizontal={true} vertical={false} />
                    <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa' }} />
                    <YAxis stroke="#a1a1aa" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} tickFormatter={(value) => `$${Number(value).toFixed(2)}`} tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa' }} />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(20, 20, 22, 0.7)',
                            backdropFilter: 'blur(8px)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.75rem',
                        }}
                        labelStyle={{ color: '#fcd34d', fontWeight: 'bold' }}
                        itemStyle={{ color: '#e4e4e7' }}
                        formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "14px" }} />
                    <Line type="monotone" dataKey="close" stroke="#a1a1aa" name="Historical" dot={false} strokeWidth={2} activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#000' }} />
                    <Line type="monotone" dataKey="predicted" stroke="#f59e0b" name="Predicted" strokeDasharray="5 5" dot={false} strokeWidth={2} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#f59e0b' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const RegressionCharts = ({ strategy }: { strategy: Strategy }) => {
    const regressionData = strategy.response.data as RegressionStockData[];
    if (!regressionData || regressionData.length === 0) return null;

    return (
        <section>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-2">Regression Analysis</h2>
            <p className="text-zinc-400 mb-6">Price forecasts based on historical data.</p>
            <div className="flex space-x-6 overflow-x-auto pb-4 -mb-4">
                {regressionData.map((stock) => (
                    <div key={stock.stockSymbol} className="flex-shrink-0 w-[90%] sm:w-[60%] md:w-[45%] lg:w-[35%]">
                        <SingleRegressionChart stock={stock} />
                    </div>
                ))}
            </div>
        </section>
    );
}

const PortfolioHub = () => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("QUANT-TOKEN");
                if (!token) throw new Error("Authorization token not found.");
                const response = await fetch('http://localhost:3000/api/portfolio/holy-api', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
                const data = await response.json();
                setStrategies(data.strategies || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <SkeletonLoader />;
    if (error) return <ErrorDisplay message={error} />;

    const regressionStrategy = strategies.find(s => s.strategy === 'Regression');
    const otherStrategies = strategies.filter(s => s.strategy !== 'Regression');

    return (
        <div className="relative min-h-screen bg-black text-zinc-300 font-sans overflow-hidden">
            {/* Enhanced background with gradient and muted pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black"></div>
            <div className="absolute inset-0 bg-cover opacity-15" style={{ backgroundImage: `url(${Cover})`, filter: 'grayscale(80%)' }}></div>

            <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <Navbar></Navbar>
                <header className="mt-16 mb-12 text-center">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-2 tracking-tighter">
                        Your Portfolio Score
                    </h1>
                    <div className="h-1 w-32 bg-gradient-to-r from-amber-500 to-transparent mx-auto mb-3"></div>
                    <p className="text-zinc-500 uppercase tracking-widest text-sm">Optimized Multi-Stratergy Analysis</p>
                </header>

                <main className="flex flex-col gap-12">
                    {regressionStrategy && <RegressionCharts strategy={regressionStrategy} />}

                    {otherStrategies.length > 0 && (
                        <section>
                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-2">Trade Signals</h2>
                            <p className="text-zinc-400 mb-6">Buy/No-Buy decisions from various strategies.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherStrategies.map((strategy, index) => (
                                    <StrategyCard key={index} strategy={strategy} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <footer className="mt-16 pt-8 border-t border-white/10 text-center">
                    <p className="text-zinc-500 text-sm">© 2025 TradeSense PORTFOLIO MANAGEMENT SYSTEM</p>
                    <p className="text-xs text-amber-500/50 mt-2 font-mono">HIGH RISK • HIGH REWARD</p>
                </footer>
            </div>
        </div>
    );
}

export default PortfolioHub;