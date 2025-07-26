import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem("QUANT-TOKEN");

    const handleLogout = () => {
        localStorage.removeItem("QUANT-TOKEN");
        navigate("/auth");
    };

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50">
            <nav className="container mx-auto px-6 py-3 flex justify-between items-center bg-black/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
                {/* Brand */}
                <button onClick={() => navigate("/")} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">
                    TradeSense
                </button>

                {/* Links */}
                <div className="hidden md:flex items-center gap-6">
                    <button onClick={() => navigate("/portfolio")} className="text-gray-300 hover:text-amber-400 transition-colors">
                        Portfolio
                    </button>
                    <button onClick={() => navigate("/portfolio-hub")} className="text-gray-300 hover:text-amber-400 transition-colors">
                        Portfolio Hub
                    </button>
                    <button onClick={() => navigate("/select")} className="text-gray-300 hover:text-amber-400 transition-colors">
                        Analyze Company
                    </button>

                </div>

                {/* Auth Controls */}
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <>

                            <button
                                onClick={handleLogout}
                                className="bg-red-500/20 border border-red-400/50 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500/40 transition-all"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate("/auth")}
                            className="bg-sky-500/20 border border-sky-400/50 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-500/40 transition-all"
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
