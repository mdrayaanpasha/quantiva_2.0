import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchStockData } from "../api-calls/stock";
import StockChart from '../components/chart-comp';
import {
    ArrowUp,
    ArrowDown,
    Zap,
    Anchor,
    Scale,
    LineChart,
    BarChart2,
    DollarSign,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

const CompanyBasedAnalytics: React.FC = () => {
    // ... existing state and logic remains the same ...
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

                // 📌 Pick the base response (the one without strategy)
                const baseResponse = result.responses.find((r: any) => !r.strategy);
                if (baseResponse && baseResponse.yahoo_data) {
                    setYahooData(baseResponse.yahoo_data);
                    console.log(baseResponse.yahoo_data);
                } else {
                    console.warn('Yahoo data not found in base response.');
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
        return <div className="p-10 text-red-500 font-bold text-lg">🚫 Please provide a valid ticker and quantity in URL.</div>;
    }

    if (loading) return <div className="p-10">⏳ Loading...</div>;
    if (error) return <div className="p-10 text-red-500">{error}</div>;
    // Map strategies to Lucide icons
    const getStrategyIcon = (strategyName: string) => {
        const strategy = strategyName.toLowerCase();
        if (strategy.includes('momentum')) return <Zap className="w-5 h-5" />;
        if (strategy.includes('mean reversion')) return <Anchor className="w-5 h-5" />;
        if (strategy.includes('volatility')) return <Scale className="w-5 h-5" />;
        return <LineChart className="w-5 h-5" />; // Default icon
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
            {/* Animated Ticker Tape */}
            <div className="bg-yellow-500 text-black py-2 px-4 font-mono text-sm overflow-hidden whitespace-nowrap mb-8">
                <div className="animate-marquee inline-block">
                    {Array(10).fill(null).map((_, i) => (
                        <span key={i} className="mx-4">NYSE | NASDAQ | {ticker} | BULL MARKET | BEAR MARKET | BLUE CHIPS | </span>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10 border-b border-gray-700 pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-yellow-500" />
                                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-yellow-300">
                                    {ticker} Analysis
                                </h1>
                            </div>
                            <p className="mt-2 text-gray-400 italic">"The easiest way to make money is to create the perception of demand" - Jordan Belfort</p>
                        </div>
                        <div className="bg-black bg-opacity-50 p-3 rounded-lg border border-yellow-600">
                            <p className="text-xs uppercase tracking-wider text-gray-400">Position Size</p>
                            <p className="text-xl font-mono flex items-center gap-1">
                                <DollarSign className="w-4 h-4" /> {quantity} Shares
                            </p>
                        </div>
                    </div>
                </header>

                {/* Final Decision */}
                <div className={`mb-12 p-6 rounded-xl backdrop-blur-md bg-gray-800 bg-opacity-70 border flex items-center gap-6 ${finalDecision === 'BUY_OVERALL'
                    ? 'border-green-500 shadow-lg shadow-green-500/10'
                    : 'border-red-500 shadow-lg shadow-red-500/10'
                    }`}>
                    <div className="flex-shrink-0">
                        {finalDecision === 'BUY_OVERALL' ? (
                            <ArrowUp className="w-12 h-12 text-green-400" />
                        ) : (
                            <ArrowDown className="w-12 h-12 text-red-400" />
                        )}
                    </div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-1">Expert Verdict</h2>
                                <h3 className={`text-3xl font-bold ${finalDecision === 'BUY_OVERALL' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {finalDecision === 'BUY_OVERALL' ? 'STRONG BUY' : 'SELL IMMEDIATELY'}
                                </h3>
                            </div>
                            <div className="bg-black bg-opacity-60 px-4 py-2 rounded-lg border border-gray-700">
                                <p className="text-xs text-gray-400">Date Range</p>
                                <p className="font-mono">{startDate} → {endDate}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className={`h-2 rounded-full ${finalDecision === 'BUY_OVERALL'
                                ? 'bg-gradient-to-r from-green-400 to-emerald-600'
                                : 'bg-gradient-to-r from-red-400 to-rose-600'
                                }`}></div>
                        </div>
                    </div>
                </div>

                {/* Strategy Cards */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                        Trading Strategies Analysis
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {responses.filter(r => r.strategy).map((response, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`p-1 rounded-md ${response.decision.includes('BUY')
                                        ? 'bg-green-900/30 text-green-400'
                                        : 'bg-red-900/30 text-red-400'
                                        }`}>
                                        {getStrategyIcon(response.strategy)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-yellow-400">{response.strategy === "GEMINI_AI" ? "Geo-politics + Social Media" : response.strategy}</h3>
                                        <span className={`text-xs font-bold ${response.decision.includes('BUY')
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                            }`}>
                                            {response.decision}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 pl-11">{response.reason}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Stock Performance */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center">
                            <BarChart2 className="w-5 h-5 text-yellow-500 mr-2" />
                            Price Performance
                        </h2>
                        <div className="text-sm font-mono bg-black bg-opacity-40 px-3 py-1 rounded flex items-center gap-2">
                            <Scale className="w-4 h-4 text-yellow-500" />
                            {yahooData.length} Sessions
                        </div>
                    </div>

                    {yahooData.length > 0 && (
                        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
                            <StockChart data={yahooData} />
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className="mt-16 text-center text-gray-500 text-sm border-t border-gray-800/50 pt-6">
                    <p>This report is strictly confidential. Unauthorized distribution is a federal offense.</p>
                    <p className="mt-2 font-mono tracking-wider">WOLF CAPITAL ANALYTICS</p>
                </footer>
            </div>
        </div>
    );
};

export default CompanyBasedAnalytics;