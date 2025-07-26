import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cover from '../assets/bg.png'; // Make sure this path is correct
import Navbar from '../components/navbar';
// --- SVG ICONS ---
// (Icons remain the same, they will be styled with CSS)
const BrainCircuitIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12c0-2.063 1.687-3.75 3.75-3.75S17 9.937 17 12s-1.687 3.75-3.75 3.75S9.5 14.063 9.5 12zM12 9.75V7.5m0 9v-2.25m-3.75-3.75H6m9 0h-2.25m-6.375 6.375L6 15.75m7.5-7.5l1.875-1.875M6 8.25l1.875 1.875m7.5 7.5l1.875 1.875" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 0115 0" />
    </svg>
);
const LayersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V7.5m0 9V7.5m-3.75 9V7.5m7.5 9V7.5M3 12h18M4.5 7.5h15M4.5 16.5h15" />
    </svg>
);
const BoltIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);


// --- MAIN HOMEPAGE COMPONENT ---
const HomePage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('QUANT-TOKEN');
        setIsLoggedIn(!!token);

        // Add scroll-based animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('QUANT-TOKEN');
        setIsLoggedIn(false);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-gray-200 font-sans overflow-x-hidden">
            {/* Background Image & Gradient Overlay */}
            <div className="fixed inset-0 w-full h-full">
                <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-in-out scale-105"
                    style={{ backgroundImage: `url(${Cover})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
            </div>

            <Navbar></Navbar>
            <main className="relative z-10">
                {/* Hero Section */}
                <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-24">
                    <h2 className="text-5xl md:text-8xl font-black text-white leading-tight tracking-tighter animate-fade-in-down">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">AI-Powered</span>
                        <br />
                        Portfolio Intelligence
                    </h2>
                    <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-3xl animate-fade-in-up animation-delay-300">
                        Go beyond speculation. Leverage institutional-grade analytics to forecast trends, manage risk, and execute with data-driven confidence.
                    </p>
                    <div className="mt-10 flex gap-4 animate-fade-in-up animation-delay-500">
                        <button onClick={() => navigate(isLoggedIn ? '/select' : '/auth')} className="bg-amber-500 text-slate-900 font-bold py-3 px-8 rounded-xl hover:bg-amber-400 scale-100 hover:scale-105 transition-all shadow-lg shadow-amber-500/30">
                            Get Started
                        </button>

                    </div>
                </section>

                {/* What is TradeSense? Section */}
                <section className="py-24 px-4 container mx-auto text-center fade-in">
                    <h3 className="text-4xl font-bold mb-4">
                        <span className="text-3xl mr-2">🧠</span> What is TradeSense?
                    </h3>
                    <p className="text-lg text-gray-400 max-w-4xl mx-auto">
                        TradeSense is an intelligent stock analysis and prediction platform that empowers users—retail investors, analysts, and fintech teams—to make smarter portfolio decisions using AI-powered strategies and real-time financial data.
                    </p>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 px-4 container mx-auto fade-in">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl font-bold">
                            <span className="text-3xl mr-2">⚙️</span> The Engine Behind Your Edge
                        </h3>
                        <p className="text-lg text-gray-400 mt-2">Analyse your portfolio using multiple financial strategies.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-slate-800/20 p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/20 transition-transform hover:-translate-y-2">
                            <BrainCircuitIcon className="w-12 h-12 text-amber-400 mb-4" />
                            <h4 className="text-2xl font-bold mb-2">Predictive Insights</h4>
                            <p className="text-gray-400">Run regression models on single or multiple stocks to forecast future price trends based on historical data.</p>
                        </div>
                        <div className="bg-slate-800/20 p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/20 transition-transform hover:-translate-y-2">
                            <LayersIcon className="w-12 h-12 text-sky-400 mb-4" />
                            <h4 className="text-2xl font-bold mb-2">Strategy Aggregation</h4>
                            <p className="text-gray-400">Combines mean reversion, moving average crossover, and linear regression under one smart decision engine.</p>
                        </div>
                        <div className="bg-slate-800/20 p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/20 transition-transform hover:-translate-y-2 md:col-span-2 lg:col-span-1">
                            <BoltIcon className="w-12 h-12 text-green-400 mb-4" />
                            <h4 className="text-2xl font-bold mb-2">Performance & Scalability</h4>
                            <p className="text-gray-400">Redis-backed caching for low latency and message queues for scalable, parallel processing.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-24 px-4 container mx-auto text-center fade-in">
                    <h3 className="text-4xl font-bold mb-16">Get Insights in 3 Simple Steps</h3>
                    <div className="relative grid md:grid-cols-3 gap-8">
                        {/* Connecting lines */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent -translate-y-1/2"></div>

                        <div className="relative bg-slate-900/30 p-8 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center text-2xl font-extrabold text-slate-900 bg-amber-400 rounded-full border-4 border-slate-900">1</div>
                            <h4 className="text-xl font-bold mb-2 mt-8">Input Your Stocks</h4>
                            <p className="text-gray-400">Enter your stocks or entire portfolio to begin the analysis.</p>
                        </div>
                        <div className="relative bg-slate-900/30 p-8 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center text-2xl font-extrabold text-slate-900 bg-sky-400 rounded-full border-4 border-slate-900">2</div>
                            <h4 className="text-xl font-bold mb-2 mt-8">Select a Strategy</h4>
                            <p className="text-gray-400">Choose a proven strategy or let our auto-analysis find the best fit.</p>
                        </div>
                        <div className="relative bg-slate-900/30 p-8 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center text-2xl font-extrabold text-slate-900 bg-green-400 rounded-full border-4 border-slate-900">3</div>
                            <h4 className="text-xl font-bold mb-2 mt-8">View Predictions</h4>
                            <p className="text-gray-400">Receive clear, actionable buy/sell insights to inform your decisions.</p>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-4 text-center fade-in">
                    <div className="bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-green-500/20 p-12 rounded-3xl container mx-auto border border-white/10 backdrop-blur-xl">
                        <h3 className="text-4xl font-bold text-white">Ready to trade smarter?</h3>
                        <p className="text-lg text-gray-400 mt-4 max-w-2xl mx-auto">Stop guessing. Start winning. Your journey to data-driven trading begins now.</p>
                        <button onClick={() => navigate(isLoggedIn ? '/analytics-form' : '/auth')} className="mt-8 bg-amber-500 text-slate-900 font-bold py-4 px-10 rounded-xl hover:bg-amber-400 scale-100 hover:scale-105 transition-all shadow-lg shadow-amber-500/30">
                            Start Predicting Now
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-8 text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} TradeSense. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;
