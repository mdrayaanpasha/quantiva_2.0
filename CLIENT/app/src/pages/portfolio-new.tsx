import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, GitCommit, BrainCircuit, CheckCircle, XCircle, AlertTriangle, Send, DollarSign, X, Bot, User, Loader, Globe } from 'lucide-react';
import Cover from "../assets/BG.png";
import Navbar from '../components/navbar';

// Helper for hiding scrollbars (requires a plugin like tailwind-scrollbar-hide)
// You can add this to your global CSS:
/*
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
*/

// --- TypeScript Interfaces (Unchanged) ---
interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}
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
interface PortfolioChatProps {
    isOpen: boolean;
    onClose: () => void;
    strategies: Strategy[];
}

// --- Skeleton Loader (Unchanged but validated for modern look) ---
const SkeletonLoader = () => (
    <div className="relative min-h-screen bg-black text-zinc-300 font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black"></div>
        <div className="absolute inset-0 bg-cover opacity-10" style={{ backgroundImage: `url(${Cover})`, filter: 'grayscale(80%)' }}></div>
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <header className="mb-12 text-center">
                <div className="h-16 bg-white/10 rounded-lg w-3/4 mx-auto mb-4 animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded w-1/4 mx-auto animate-pulse"></div>
            </header>
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

// --- UI State Helper Components (Unchanged) ---
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

// --- Portfolio Chat Component (MODIFIED) ---
const PortfolioChat = ({ isOpen, onClose, strategies }: PortfolioChatProps) => {
    // NEW: Added a default welcome message from 'The Wolf'
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: "The market never sleeps. I've analyzed the latest data. What's our next move? Ask me anything." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const formatStrategiesForPrompt = (strategies: Strategy[]): string => {
        let context = "Here is the current portfolio analysis summary:\n\n";
        strategies.forEach(s => {
            context += `Strategy: ${s.strategy}\n`;
            if (s.response.confidence) context += `Confidence: ${s.response.confidence}\n`;
            const data = s.response.data || s.response.details;
            if (Array.isArray(data)) {
                (data as any[]).forEach(item => {
                    if (item.stockSymbol) {
                        context += `- Stock: ${item.stockSymbol}`;
                        if (item.decision) context += `, Decision: ${item.decision}, Reason: ${item.reason}\n`;
                        else if (item.yahoo_data) {
                            const last = item.yahoo_data[item.yahoo_data.length - 1];
                            context += `, Last Close: ${last?.close?.toFixed(2)}, Predicted: ${last?.predicted?.toFixed(2)}\n`;
                        } else {
                            context += '\n';
                        }
                    }
                });
            } else if (data) {
                const geminiData = data as GeminiData;
                context += `  Sentiment Score: ${geminiData.score}\n  Reasoning: ${geminiData.reasoning}\n`;
            }
            context += "\n";
        });
        return context;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        try {
            const portfolioContext = formatStrategiesForPrompt(strategies);
            const fullMessage = `${portfolioContext}\n\nUser Question: "${input}"`;
            const response = await axios.post('http://localhost:3000/portfolio-chat', {
                message: fullMessage.trim(),
                question: input.trim()
            });
            const aiMessage: ChatMessage = { sender: 'ai', text: response.data.text };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat API error:", error);
            const errorMessage: ChatMessage = { sender: 'ai', text: "My apologies, I'm having trouble connecting to the exchange. Give me a moment." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl h-[80vh] bg-zinc-900/70 backdrop-blur-xl border border-amber-400/20 rounded-2xl flex flex-col shadow-2xl shadow-amber-500/20">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <BrainCircuit className="h-7 w-7 text-amber-400" />
                        {/* NAME CHANGE: From 'Portfolio Analyst' to 'The Wolf' */}
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">The Wolf</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                </div>

                {/* Messages Area - SCROLLBAR HIDDEN */}
                <div className="flex-grow p-4 space-y-6 overflow-y-auto scrollbar-hide">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && (
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                                    <Bot className="h-5 w-5 text-amber-300" />
                                </div>
                            )}
                            <div className={`max-w-md rounded-xl prose prose-sm prose-invert prose-p:my-0 ${msg.sender === 'user' ? 'bg-zinc-700 text-zinc-200 rounded-br-none px-4 py-2.5' : 'bg-transparent rounded-bl-none'}`}>
                                <ReactMarkdown
                                    components={{ p: ({ node, ...props }) => <p className="text-zinc-300" {...props} /> }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                            {msg.sender === 'user' && (
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-zinc-700/50 flex items-center justify-center border border-zinc-600">
                                    <User className="h-5 w-5 text-zinc-400" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                <Bot className="h-5 w-5 text-amber-300" />
                            </div>
                            <div className="max-w-md rounded-xl px-4 py-3 bg-zinc-800/50 text-zinc-300 rounded-bl-none">
                                <Loader className="h-5 w-5 text-zinc-400 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <div className="p-4 border-t border-white/10 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Tell me what to do..."
                            className="flex-grow bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-2.5 bg-amber-500 text-black rounded-lg disabled:bg-zinc-600 disabled:text-zinc-400 hover:bg-amber-400 transition-colors">
                            <Send className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- Core UI Components (MODIFIED) ---
const StrategyCard = ({ strategy }: { strategy: Strategy }) => {
    const { strategy: strategyName, response } = strategy;
    const getIcon = () => {
        const iconProps = { className: "h-8 w-8 text-amber-400" };
        switch (strategyName) {
            case 'Mean Reversion': return <GitCommit {...iconProps} />;
            case 'Avg Crossover': return <TrendingUp {...iconProps} />;
            // NAME CHANGE: From 'Gemini Strategy'
            case 'GeoPolitics + Social Media': return <Globe {...iconProps} />;
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
        switch (strategyName) {
            case 'Mean Reversion':
            case 'Avg Crossover':
                const items = (response.data as DecisionItem[]) || response.details;
                if (!items || items.length === 0) return <p className="p-4 text-zinc-500">No signals generated.</p>;
                return (
                    <div className="divide-y divide-white/5">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-start space-x-3 p-4 group hover:bg-amber-500/5 transition-colors">
                                <DecisionIcon decision={item.decision} />
                                <div>
                                    <p className="font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors">
                                        {item.stockSymbol}
                                        <span className={`text-xs font-mono ml-2 px-2 py-0.5 rounded-full ${item.decision === 'BUY' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                            {item.decision === 'BUY' ? 'Prime' : 'Weak'}
                                        </span>
                                    </p>
                                    <div className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors prose prose-sm prose-invert prose-p:my-1">
                                        <ReactMarkdown>{item.reason}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            // NAME CHANGE: From 'Gemini Strategy'
            case 'GeoPolitics + Social Media':
                const geminiData = response.data as GeminiData;
                if (!geminiData) return null;
                return (
                    <div className="p-4 space-y-4 prose prose-sm prose-invert prose-p:my-1">
                        <div>
                            <h4 className="font-bold text-zinc-200 mb-1 not-prose">Sentiment Score</h4>
                            <p className="text-md text-amber-300 whitespace-pre-wrap"><ReactMarkdown>{geminiData.score}</ReactMarkdown></p>
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-200 mb-1 not-prose">The Rationale</h4>
                            <div className="text-zinc-400"><ReactMarkdown>{geminiData.reasoning}</ReactMarkdown></div>
                        </div>
                    </div>
                );
            default:
                return <p className="p-4 text-zinc-500">No display available for this strategy.</p>;
        }
    };
    return (
        <div className="bg-zinc-900/40 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber-400/30 hover:shadow-amber-500/20">
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
        <div className="bg-zinc-900/40 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg p-4 sm:p-6 h-full transition-all duration-300 hover:border-amber-400/30 hover:shadow-amber-500/20">
            <h3 className="text-xl font-bold text-amber-300 mb-4">{stock.stockSymbol} Forecast</h3>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" horizontal={true} vertical={false} />
                    <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa' }} />
                    <YAxis stroke="#a1a1aa" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} tickFormatter={(value) => `$${Number(value).toFixed(2)}`} tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa' }} />
                    <Tooltip contentStyle={{ background: 'rgba(20, 20, 22, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '0.75rem' }} labelStyle={{ color: '#fcd34d', fontWeight: 'bold' }} itemStyle={{ color: '#e4e4e7' }} formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "14px" }} />
                    <Line type="monotone" dataKey="close" stroke="#a1a1aa" name="Historical" dot={false} strokeWidth={2} activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#000' }} />
                    <Line type="monotone" dataKey="predicted" stroke="#f59e0b" name="Predicted" strokeDasharray="5 5" dot={false} strokeWidth={2} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#f59e0b' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// COMPONENT MODIFIED: New text and scrollbar hidden
const RegressionCharts = ({ strategy }: { strategy: Strategy }) => {
    const regressionData = strategy.response.data as RegressionStockData[];
    if (!regressionData || regressionData.length === 0) return null;
    return (
        <section>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-2">Price Forecasts</h2>
            <p className="text-zinc-400 mb-6">Predicting the next market move with quantitative precision.</p>
            {/* SCROLLBAR HIDDEN */}
            <div className="flex space-x-6 overflow-x-auto pb-4 -mb-4 scrollbar-hide">
                {regressionData.map((stock) => (
                    <div key={stock.stockSymbol} className="flex-shrink-0 w-[90%] sm:w-[60%] md:w-[45%] lg:w-[35%]">
                        <SingleRegressionChart stock={stock} />
                    </div>
                ))}
            </div>
        </section>
    );
};


// --- Main PortfolioHub Component (MODIFIED) ---
const PortfolioHub = () => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

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

                // DATA MIGRATION: Rename strategy on the fly for display
                const migratedStrategies = data.strategies.map((s: Strategy) => {
                    if (s.strategy === 'Gemini Strategy') {
                        return { ...s, strategy: 'GeoPolitics + Social Media' };
                    }
                    return s;
                });
                setStrategies(migratedStrategies || []);

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
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black"></div>
            <div className="absolute inset-0 bg-cover opacity-10" style={{ backgroundImage: `url(${Cover})`, filter: 'grayscale(80%)' }}></div>

            <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <Navbar />
                <header className="mt-16 mb-12 text-center">
                    {/* UI CHANGE: Bolder, more thematic header */}
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-2 tracking-tighter">
                        Market Domination Analysis
                    </h1>
                    <div className="h-1 w-32 bg-gradient-to-r from-amber-500 to-transparent mx-auto mb-3"></div>
                    <p className="text-zinc-500 uppercase tracking-widest text-sm">Multi-Strategy Execution & Intelligence</p>
                </header>

                <main className="flex flex-col gap-12">
                    {regressionStrategy && <RegressionCharts strategy={regressionStrategy} />}

                    {otherStrategies.length > 0 && (
                        <section>
                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-2">Alpha Signals</h2>
                            <p className="text-zinc-400 mb-6">Actionable intelligence from our top strategies.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherStrategies.map((strategy, index) => (
                                    <StrategyCard key={index} strategy={strategy} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <footer className="mt-16 pt-8 border-t border-white/10 text-center">
                    {/* NAME CHANGE: From 'TradeSense' to 'The Wolf' */}
                    <p className="text-zinc-500 text-sm">© 2025 The Wolf: Market Analysis</p>
                    <p className="text-xs text-amber-500/50 mt-2 font-mono">HIGH RISK • HIGH REWARD</p>
                </footer>
            </div>

            {/* UI CHANGE: Floating Action Button icon changed */}
            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-6 right-6 z-30 h-16 w-16 bg-amber-500 text-black rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center hover:bg-amber-400 transition-transform hover:scale-110"
                    aria-label="Open The Wolf chat"
                >
                    <DollarSign className="h-8 w-8" />
                </button>
            )}

            <PortfolioChat
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                strategies={strategies}
            />
        </div>
    );
}

export default PortfolioHub;