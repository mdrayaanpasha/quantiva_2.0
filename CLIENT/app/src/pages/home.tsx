import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import Cover from '../assets/bg.png';
import { TrendingUp, BrainCircuit, Globe } from 'lucide-react';

const HomePage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('QUANT-TOKEN');
        setIsLoggedIn(!!token);

        // Scroll-based fade-in animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const handleGetStarted = () => {
        // Navigate to the analysis form if logged in, otherwise to the auth page
        navigate(isLoggedIn ? '/company-analytics' : '/auth');
    };

    return (
        <div className="min-h-screen bg-black text-zinc-300 font-sans overflow-x-hidden">
            {/* Background Image & Gradient Overlay */}
            <div className="fixed inset-0 w-full h-full">
                <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-in-out scale-105"
                    style={{ backgroundImage: `url(${Cover})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/90 to-black"></div>
            </div>

            <Navbar />

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-24">
                    <h1 className="text-5xl md:text-8xl font-black text-white leading-tight tracking-tighter animate-fade-in-down">
                        Don't Play The Market.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                            Dominate It.
                        </span>
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-3xl animate-fade-in-up animation-delay-300">
                        This isn't a game for amateurs. Wield institutional-grade alpha and execute with the precision of a predator.
                    </p>
                    <div className="mt-10 animate-fade-in-up animation-delay-500">
                        <button
                            onClick={handleGetStarted}
                            className="bg-amber-500 text-black font-bold py-4 px-10 rounded-xl hover:bg-amber-400 scale-100 hover:scale-105 active:scale-100 transition-all shadow-lg shadow-amber-500/30"
                        >
                            Unleash The Wolf
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 px-4 container mx-auto fade-in">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold">
                            The Engine Behind Your Edge
                        </h2>
                        <p className="text-lg text-zinc-400 mt-4 max-w-2xl mx-auto">
                            Our proprietary system analyzes the market from every angle, so you have no blind spots.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature Card 1 */}
                        <div className="bg-zinc-900/40 p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/50">
                            <TrendingUp className="w-12 h-12 text-amber-400 mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Alpha Generation</h3>
                            <p className="text-zinc-400">Uncover market-beating opportunities. Our models analyze price action, volatility, and mean reversion to generate high-probability trade signals.</p>
                        </div>
                        {/* Feature Card 2 */}
                        <div className="bg-zinc-900/40 p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/50">
                            <BrainCircuit className="w-12 h-12 text-amber-400 mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Multi-Vector Analysis</h3>
                            <p className="text-zinc-400">One angle isn't enough. We triangulate data from technical indicators and quantitative models to build a complete intelligence picture.</p>
                        </div>
                        {/* Feature Card 3 */}
                        <div className="bg-zinc-900/40 p-8 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/50 md:col-span-2 lg:col-span-1">
                            <Globe className="w-12 h-12 text-amber-400 mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Geopolitical Edge</h3>
                            <p className="text-zinc-400">Markets don't exist in a vacuum. We process news and social sentiment to show how world events impact your assets, so you can act before the herd.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-24 px-4 container mx-auto text-center fade-in">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16">Your Path to Domination</h2>
                    <div className="relative grid md:grid-cols-3 gap-12 md:gap-8">
                        {/* Connecting lines for desktop */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>

                        {/* Step 1 */}
                        <div className="relative bg-zinc-900/30 p-8 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center text-3xl font-extrabold text-black bg-amber-400 rounded-full border-4 border-black">1</div>
                            <h3 className="text-xl font-bold mb-2 mt-10">Isolate Your Target</h3>
                            <p className="text-zinc-400">Select a stock or upload your portfolio. Define your battlefield.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="relative bg-zinc-900/30 p-8 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center text-3xl font-extrabold text-black bg-amber-400 rounded-full border-4 border-black">2</div>
                            <h3 className="text-xl font-bold mb-2 mt-10">Run The Numbers</h3>
                            <p className="text-zinc-400">Deploy our multi-strategy engine for a full-spectrum analysis.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="relative bg-zinc-900/30 p-8 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center text-3xl font-extrabold text-black bg-amber-400 rounded-full border-4 border-black">3</div>
                            <h3 className="text-xl font-bold mb-2 mt-10">Execute With Conviction</h3>
                            <p className="text-zinc-400">Receive a clear, decisive verdict. No ambiguity, just actionable intelligence.</p>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-4 text-center fade-in">
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 p-12 rounded-3xl container mx-auto border border-white/10 backdrop-blur-xl">
                        <h2 className="text-4xl md:text-5xl font-bold text-white">The Herd Reacts. The Wolf Acts.</h2>
                        <p className="text-lg text-zinc-400 mt-4 max-w-2xl mx-auto">The choice is simple. Follow the market, or lead it. Your ascent begins now.</p>
                        <button
                            onClick={handleGetStarted}
                            className="mt-8 bg-amber-500 text-black font-bold py-4 px-10 rounded-xl hover:bg-amber-400 scale-100 hover:scale-105 active:scale-100 transition-all shadow-lg shadow-amber-500/30"
                        >
                            Seize Your Edge
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-8 text-center text-zinc-500">
                <p>&copy; {new Date().getFullYear()} The Wolf. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;