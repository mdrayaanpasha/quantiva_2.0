import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Briefcase, BarChart, FileText } from 'lucide-react';

// Define navigation links in an array for cleaner code
const navLinks = [
    { name: 'Ledger', href: '/portfolio', icon: Briefcase },
    { name: 'Analysis Hub', href: '/portfolio-hub', icon: BarChart },
    { name: 'Run Analysis', href: '/select', icon: FileText },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem("QUANT-TOKEN");

    const handleLogout = () => {
        localStorage.removeItem("QUANT-TOKEN");
        navigate("/auth"); // Redirect to your login/auth page
    };

    // Reusable NavLink component for the mobile menu
    const MobileLink = ({ href, children, icon: Icon }: { href: string, children: React.ReactNode, icon: React.ElementType }) => (
        <NavLink
            to={href}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                }`
            }
            onClick={() => setIsOpen(false)}
        >
            <Icon className="w-5 h-5" />
            {children}
        </NavLink>
    );

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
            <nav className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/20">
                {/* Brand Logo */}
                <NavLink to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 hover:opacity-80 transition-opacity">
                    The Wolf
                </NavLink>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-2">
                    {navLinks.map(link => (
                        <NavLink
                            key={link.name}
                            to={link.href}
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive
                                    ? 'text-amber-300 bg-white/5'
                                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {link.name}
                        </NavLink>
                    ))}
                </div>

                {/* Auth Controls & Mobile Menu Toggle */}
                <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="hidden md:block p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/auth")}
                            className="hidden md:block bg-amber-500/20 border border-amber-400/50 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-500/40 transition-all text-sm"
                        >
                            Login
                        </button>
                    )}

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors">
                            <Menu />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Panel */}
            {isOpen && (
                <div className="md:hidden mt-2 p-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-zinc-200">Navigation</span>
                        <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors">
                            <X />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {navLinks.map(link => (
                            <MobileLink key={link.name} href={link.href} icon={link.icon}>
                                {link.name}
                            </MobileLink>
                        ))}
                        <hr className="border-white/10 my-2" />
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        ) : (
                            <button onClick={() => navigate('/auth')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-amber-300 hover:bg-amber-500/10 transition-colors">
                                <LogOut className="w-5 h-5" />
                                Login
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;