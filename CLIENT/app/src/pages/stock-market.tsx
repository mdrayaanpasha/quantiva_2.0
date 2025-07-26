import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchStockData } from "../api-calls/stock";
import StockChart from '../components/chart-comp';
import Navbar from '../components/navbar';

import {
    ArrowUp,
    ArrowDown,
    Zap,
    Anchor,
    Scale,
    LineChart,
    DollarSign,
    TrendingUp
} from 'lucide-react';
import Cover from "../assets/BG.png";

const CompanyBasedAnalytics: React.FC = () => {
    const { ticker, quantity, startDate, endDate } = useParams();
    const [responses, setResponses] = useState<any[]>([]);
    const [finalDecision, setFinalDecision] = useState<string>('');
    const [yahooData, setYahooData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await fetchStockData(ticker, quantity, startDate, endDate);
                setResponses(result.responses);
                setFinalDecision(result.finalDecision);

                const baseResponse = result.responses.find((r: any) => !r.strategy);
                if (baseResponse && baseResponse.yahoo_data) {
                    setYahooData(baseResponse.yahoo_data);
                }
            } catch (err) {
                setError('Failed to fetch stock data');
            } finally {
                setLoading(false);
            }
        };

        if (ticker && quantity !== '0') {
            fetchData();
        }
    }, [ticker, quantity]);

    if (!ticker || quantity === '0') {
        return <div className="p-10 text-red-500 font-bold text-lg">🚫 Invalid ticker or quantity in URL.</div>;
    }

    if (loading) {
        return (
            <div className="relative min-h-screen bg-black text-zinc-300 font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black"></div>
                <div className="absolute inset-0 bg-cover opacity-15" style={{ backgroundImage: `url(${Cover})`, filter: 'grayscale(80%)' }}></div>
                <div className="relative z-10 flex items-center justify-center h-screen">
                    <div className="text-lg text-zinc-400">⏳ Fetching stock analytics...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-black p-4">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black"></div>
                <div className="absolute inset-0 bg-cover opacity-10 filter grayscale" style={{ backgroundImage: `url(${Cover})` }}></div>
                <div className="relative bg-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-lg text-center shadow-2xl shadow-red-500/10">
                    <p className="text-lg text-zinc-300 font-bold">Error: {error}</p>
                </div>
            </div>
        );
    }

    const getStrategyIcon = (strategyName: string) => {
        const strategy = strategyName.toLowerCase();
        if (strategy.includes('momentum')) return <Zap className="w-5 h-5" />;
        if (strategy.includes('mean reversion')) return <Anchor className="w-5 h-5" />;
        if (strategy.includes('volatility')) return <Scale className="w-5 h-5" />;
        return <LineChart className="w-5 h-5" />;
    };

    return (
        <div className="relative min-h-screen bg-black text-zinc-300 font-sans">
            <Navbar></Navbar>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black"></div>
            <div className="absolute inset-0 bg-cover opacity-15" style={{ backgroundImage: `url(${Cover})`, filter: 'grayscale(80%)' }}></div>

            <div className="relative z-10 p-6 max-w-7xl mx-auto">
                <header className="mt-16 mb-12 text-center">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-2 tracking-tight">
                        {ticker} Analysis Report
                    </h1>
                    <p className="text-zinc-500 text-sm italic">Analysis from multiple strategies and market predictors</p>
                </header>

                <section className="mb-10">
                    <div className={`p-6 rounded-xl border backdrop-blur-md shadow-lg ${finalDecision === 'BUY_OVERALL' ? 'border-green-500 shadow-green-500/10' : 'border-red-500 shadow-red-500/10'}`}>
                        <div className="flex items-center gap-4">
                            {finalDecision === 'BUY_OVERALL' ? (
                                <ArrowUp className="w-10 h-10 text-green-400" />
                            ) : (
                                <ArrowDown className="w-10 h-10 text-red-400" />
                            )}
                            <div>
                                <p className="uppercase text-xs text-zinc-400">Final Decision</p>
                                <h3 className={`text-3xl font-bold ${finalDecision === 'BUY_OVERALL' ? 'text-green-400' : 'text-red-400'}`}>{finalDecision === 'BUY_OVERALL' ? 'STRONG BUY' : 'SELL IMMEDIATELY'}</h3>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 text-amber-300">Strategies Evaluated</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {responses.filter(r => r.strategy).map((response, idx) => (
                            <div key={idx} className="bg-zinc-900/30 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-white/20">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`p-2 rounded-md ${response.decision.includes('BUY') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{getStrategyIcon(response.strategy)}</div>
                                    <div>
                                        <h3 className="font-bold text-amber-300">{response.strategy}</h3>
                                        <span className={`text-xs font-bold ${response.decision.includes('BUY') ? 'text-green-400' : 'text-red-400'}`}>{response.decision}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-300 pl-11">{response.reason}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-4 text-amber-300">Price Chart</h2>
                    {yahooData.length > 0 && (
                        <div className="bg-zinc-900/30 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <StockChart data={yahooData} />
                        </div>
                    )}
                </section>

                <footer className="pt-6 text-center border-t border-white/10">
                    <p className="text-zinc-500 text-sm">© 2025 TradeSense CAPITAL ANALYTICS</p>
                    <p className="text-xs text-amber-500/50 mt-1 font-mono">MARKET INTELLIGENCE • MULTI-STRATEGY SYSTEM</p>
                </footer>
            </div>
        </div>
    );
};

export default CompanyBasedAnalytics;