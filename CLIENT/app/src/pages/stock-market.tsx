import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchStockData } from "../api-calls/stock"; // Assuming this API call is defined
import StockChart from '../components/chart-comp';
import Navbar from '../components/navbar';
import {
    ArrowUpCircle, ArrowDownCircle, Zap, Anchor, Scale, LineChart, Globe, AlertTriangle, Loader
} from 'lucide-react';
import Cover from "../assets/BG.png"; // Assuming this asset is available

// --- Data Transformation Helpers ---
// This map translates raw API strategy names into user-friendly text.
const STRATEGY_MAP: { [key: string]: string } = {
    'gemini_ai': 'GeoPolitics & Social Sentiment',
    'avg_crossover': 'Average Crossover',
    'mean_reversion': 'Mean Reversion',
    'momentum': 'Momentum Strategy',
    'volatility': 'Volatility Analysis',
};

// Function to transform the strategy name
const transformStrategyName = (rawName: string = ''): string => {
    const key = rawName.toLowerCase();
    return STRATEGY_MAP[key] || key.replace(/_/g, ' ');
};

// Function to format the decision text
const formatDecisionText = (decision: string = '') => {
    const key = decision.toUpperCase();
    switch (key) {
        case 'BUY':
        case 'BUY_SIGNAL':
            return 'Positive Signal';
        case 'NO BUY':
        case 'NO_BUY':
        case 'NO_BUY_SIGNAL':
        case 'SELL_SIGNAL':
            return 'Negative Signal';
        default:
            return key.replace(/_/g, ' ');
    }
};

const CompanyBasedAnalytics: React.FC = () => {
    const { ticker, quantity, startDate, endDate } = useParams<{ ticker: string; quantity: string; startDate: string; endDate: string; }>();
    const [responses, setResponses] = useState<any[]>([]);
    const [finalDecision, setFinalDecision] = useState<string>('');
    const [yahooData, setYahooData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            if (!ticker || !quantity || !startDate || !endDate) {
                setError("Missing required analytics parameters from URL.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const result = await fetchStockData(ticker, quantity, startDate, endDate);
                setResponses(result.responses || []);
                setFinalDecision(result.finalDecision || '');
                const baseResponse = (result.responses || []).find((r: any) => !r.strategy);
                if (baseResponse && baseResponse.yahoo_data) {
                    setYahooData(baseResponse.yahoo_data);
                }
            } catch (err) {
                setError('Failed to fetch stock data. The markets may be closed or the API is unavailable.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ticker, quantity, startDate, endDate]);

    const getStrategyIcon = (strategyName: string) => {
        const key = strategyName.toLowerCase();
        if (key.includes('crossover')) return <LineChart className="w-6 h-6" />;
        if (key.includes('reversion')) return <Anchor className="w-6 h-6" />;
        if (key.includes('momentum')) return <Zap className="w-6 h-6" />;
        if (key.includes('volatility')) return <Scale className="w-6 h-6" />;
        if (key.includes('geopolitics') || key.includes('social')) return <Globe className="w-6 h-6" />;
        return <LineChart className="w-6 h-6" />;
    };

    if (loading) {
        return (
            <div className="relative min-h-screen bg-black text-zinc-300 font-sans flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black"></div>
                <div className="absolute inset-0 bg-cover opacity-10" style={{ backgroundImage: `url(${Cover})` }}></div>
                <div className="relative z-10 text-center">
                    <Loader className="w-12 h-12 mx-auto text-amber-500 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold text-zinc-200">Executing Analysis on {ticker}...</h2>
                    <p className="text-zinc-400">Please wait while we run the numbers.</p>
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
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <h2 className="text-2xl font-bold text-white mb-2">Analysis Failed</h2>
                    <p className="text-zinc-300">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black text-zinc-300 font-sans">
            <Navbar />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black"></div>
            <div className="absolute inset-0 bg-cover opacity-10" style={{ backgroundImage: `url(${Cover})` }}></div>

            <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <header className="mt-16 mb-12 text-center">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-2 tracking-tighter">
                        Intelligence Briefing: {ticker}
                    </h1>
                    <div className="h-1 w-32 bg-gradient-to-r from-amber-500 to-transparent mx-auto mb-3"></div>
                    <p className="text-zinc-500 uppercase tracking-widest text-sm">A multi-vector analysis of market position and potential</p>
                </header>

                <section className="mb-12">
                    <div className={`p-6 rounded-2xl border backdrop-blur-md shadow-2xl ${finalDecision === 'BUY_OVERALL' ? 'bg-green-500/10 border-green-500/30 shadow-green-500/10' : 'bg-red-500/10 border-red-500/30 shadow-red-500/10'}`}>
                        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
                            {finalDecision === 'BUY_OVERALL'
                                ? <ArrowUpCircle className="w-16 h-16 text-green-400 flex-shrink-0" />
                                : <ArrowDownCircle className="w-16 h-16 text-red-400 flex-shrink-0" />
                            }
                            <div>
                                <p className="uppercase text-sm tracking-widest text-zinc-400">Executive Verdict</p>
                                <h3 className={`text-4xl font-bold ${finalDecision === 'BUY_OVERALL' ? 'text-green-300' : 'text-red-300'}`}>
                                    {finalDecision === 'BUY_OVERALL' ? 'STRONG BUY' : 'LIQUIDATE POSITION'}
                                </h3>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-6">Tactical Breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {responses.filter(r => r.strategy).map((response, idx) => {
                            const strategyName = transformStrategyName(response.strategy);
                            const decisionText = formatDecisionText(response.decision);
                            const isBuy = decisionText === 'Positive Signal';

                            return (
                                <div key={idx} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-amber-400/30 hover:shadow-amber-500/20">
                                    <div className="flex items-start gap-4 mb-3">
                                        <div className={`p-2 rounded-lg ${isBuy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {getStrategyIcon(strategyName)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-amber-300 text-lg">{strategyName}</h3>
                                            <span className={`text-sm font-semibold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>{decisionText}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-400">{response.reason}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-6">Price Performance</h2>
                    {yahooData.length > 0 ? (
                        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg">
                            <StockChart data={yahooData} />
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-zinc-900/40 border border-dashed border-white/10 rounded-2xl">
                            <p className="text-zinc-500">Price chart data is not available for this asset.</p>
                        </div>
                    )}
                </section>

                <footer className="pt-8 text-center border-t border-white/10">
                    <p className="text-zinc-500 text-sm">© 2025 The Wolf: Capital Analytics</p>
                    <p className="text-xs text-amber-500/50 mt-1 font-mono">MARKET INTELLIGENCE • MULTI-STRATEGY SYSTEM</p>
                </footer>
            </div>
        </div>
    );
};

export default CompanyBasedAnalytics;