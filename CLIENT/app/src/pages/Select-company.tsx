// src/components/CompanyAnalyticsForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BrainCircuit } from 'lucide-react';
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


// --- DATA & TYPE DEFINITIONS (Unchanged) ---
const companyData: { name: string; ticker: string }[] = [
    { name: "Apple Inc.", ticker: "AAPL" }, { name: "Microsoft Corporation", ticker: "MSFT" }, { name: "Amazon.com, Inc.", ticker: "AMZN" }, { name: "NVIDIA Corporation", ticker: "NVDA" }, { name: "Alphabet Inc. (Class A)", ticker: "GOOGL" }, { name: "Alphabet Inc. (Class C)", ticker: "GOOG" }, { name: "Meta Platforms, Inc.", ticker: "META" }, { name: "Tesla, Inc.", ticker: "TSLA" }, { name: "Berkshire Hathaway Inc.", ticker: "BRK-B" }, { name: "Eli Lilly and Company", ticker: "LLY" }, { name: "Broadcom Inc.", ticker: "AVGO" }, { name: "JPMorgan Chase & Co.", ticker: "JPM" }, { name: "Visa Inc.", ticker: "V" }, { name: "Exxon Mobil Corporation", ticker: "XOM" }, { name: "UnitedHealth Group Incorporated", ticker: "UNH" }, { name: "Johnson & Johnson", ticker: "JNJ" }, { name: "Mastercard Incorporated", ticker: "MA" }, { name: "The Procter & Gamble Company", ticker: "PG" }, { name: "Costco Wholesale Corporation", ticker: "COST" }, { name: "The Home Depot, Inc.", ticker: "HD" }, { name: "Merck & Co., Inc.", ticker: "MRK" }, { name: "AbbVie Inc.", ticker: "ABBV" }, { name: "Chevron Corporation", ticker: "CVX" }, { name: "Adobe Inc.", ticker: "ADBE" }, { name: "Salesforce, Inc.", ticker: "CRM" }, { name: "PepsiCo, Inc.", ticker: "PEP" }, { name: "The Coca-Cola Company", ticker: "KO" }, { name: "Walmart Inc.", ticker: "WMT" }, { name: "Bank of America Corporation", ticker: "BAC" }, { name: "Netflix, Inc.", ticker: "NFLX" }, { name: "Oracle Corporation", ticker: "ORCL" }, { name: "Advanced Micro Devices, Inc.", ticker: "AMD" }, { name: "McDonald's Corporation", ticker: "MCD" }, { name: "Accenture plc", ticker: "ACN" }, { name: "Linde plc", ticker: "LIN" }, { name: "Thermo Fisher Scientific Inc.", ticker: "TMO" }, { name: "Cisco Systems, Inc.", ticker: "CSCO" }, { name: "Abbott Laboratories", ticker: "ABT" }, { name: "General Electric Company", ticker: "GE" }, { name: "Walt Disney Company", ticker: "DIS" }, { name: "Qualcomm, Inc.", ticker: "QCOM" }, { name: "Intel Corporation", ticker: "INTC" }, { name: "Verizon Communications Inc.", ticker: "VZ" }, { name: "Caterpillar Inc.", ticker: "CAT" }, { name: "International Business Machines Corporation", ticker: "IBM" }, { name: "Pfizer Inc.", ticker: "PFE" }, { name: "Comcast Corporation", ticker: "CMCSA" }, { name: "Wells Fargo & Company", ticker: "WFC" }, { name: "Danaher Corporation", ticker: "DHR" }, { name: "Amgen Inc.", ticker: "AMGN" }, { name: "Texas Instruments Incorporated", ticker: "TXN" }, { name: "Intuitive Surgical, Inc.", ticker: "ISRG" }, { name: "United Parcel Service, Inc.", ticker: "UPS" }, { name: "Philip Morris International Inc.", ticker: "PM" }, { name: "RTX Corporation", ticker: "RTX" }, { name: "Union Pacific Corporation", ticker: "UNP" }, { name: "The Goldman Sachs Group, Inc.", ticker: "GS" }, { name: "Honeywell International Inc.", ticker: "HON" }, { name: "Applied Materials, Inc.", ticker: "AMAT" }, { name: "Morgan Stanley", ticker: "MS" }, { name: "Deere & Company", ticker: "DE" }, { name: "Boeing Company", ticker: "BA" }, { name: "BlackRock, Inc.", ticker: "BLK" }, { name: "Prologis, Inc.", ticker: "PLD" }, { name: "ServiceNow, Inc.", ticker: "NOW" }, { name: "Lowe's Companies, Inc.", ticker: "LOW" }, { name: "Vertex Pharmaceuticals Incorporated", ticker: "VRTX" }, { name: "S&P Global Inc.", ticker: "SPGI" }, { name: "Regeneron Pharmaceuticals, Inc.", ticker: "REGN" }, { name: "Starbucks Corporation", ticker: "SBUX" }, { name: "Booking Holdings Inc.", ticker: "BKNG" }, { name: "American Express Company", ticker: "AXP" }, { name: "Elevance Health, Inc.", ticker: "ELV" }, { name: "Citigroup Inc.", ticker: "C" }, { name: "Medtronic plc", ticker: "MDT" }, { name: "Gilead Sciences, Inc.", ticker: "GILD" }, { name: "Intuit Inc.", ticker: "INTU" }, { name: "The Charles Schwab Corporation", ticker: "SCHW" }, { name: "Bristol Myers Squibb Company", ticker: "BMY" }, { name: "CVS Health Corporation", ticker: "CVS" }, { name: "Automatic Data Processing, Inc.", ticker: "ADP" }, { name: "TJX Companies, Inc.", ticker: "TJX" }, { name: "Marsh & McLennan Companies, Inc.", ticker: "MMC" }, { name: "Lam Research Corporation", ticker: "LRCX" }, { name: "Analog Devices, Inc.", ticker: "ADI" }, { name: "Equinix, Inc.", ticker: "EQIX" }, { name: "Waste Management, Inc.", ticker: "WM" }, { name: "Cigna Group", ticker: "CI" }, { name: "AT&T Inc.", ticker: "T" }, { name: "Boston Scientific Corporation", ticker: "BSX" }, { name: "Progressive Corporation", ticker: "PGR" }, { name: "Stryker Corporation", ticker: "SYK" }, { name: "Eaton Corporation plc", ticker: "ETN" }, { name: "Chubb Limited", ticker: "CB" }, { name: "General Motors Company", ticker: "GM" }, { name: "Ford Motor Company", ticker: "F" }, { name: "FedEx Corporation", ticker: "FDX" }, { name: "Nike, Inc.", ticker: "NKE" }
];

interface Company { name: string; ticker: string; }
interface CompanySelectorProps {
    onSelect: (company: Company) => void;
    value: string;
    onClear: () => void;
}

// --- RE-STYLED COMPONENTS ---
const CompanySelector = ({ onSelect, value, onClear }: CompanySelectorProps) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredCompanies = query === '' ? [] : companyData.filter(
        c => c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.ticker.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => { setQuery(value); }, [value]);

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!e.target.value) onClear();
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Hunt for Company or Ticker..."
                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-black/20 border border-white/20 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
            </div>
            {isOpen && filteredCompanies.length > 0 && (
                // SCROLLBAR HIDDEN
                <ul className="absolute z-20 w-full mt-1 rounded-lg border border-white/10 bg-zinc-900/80 backdrop-blur-lg max-h-60 overflow-y-auto text-sm scrollbar-hide">
                    {filteredCompanies.map((c) => (
                        <li key={c.ticker} onClick={() => { onSelect(c); setIsOpen(false); }}
                            className="flex justify-between items-center px-4 py-2.5 text-zinc-200 hover:bg-amber-500/20 cursor-pointer transition-colors">
                            <span>{c.name}</span>
                            <span className="font-mono text-zinc-400">{c.ticker}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const CompanyAnalyticsForm = () => {
    const [stockSymbol, setStockSymbol] = useState('');
    const [companyQuery, setCompanyQuery] = useState('');
    const [quantity, setQuantity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const today = new Date();
        const lastYear = today.getFullYear() - 1;
        setStartDate(`${lastYear}-01-01`);
        setEndDate(`${lastYear}-12-31`);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: string[] = [];
        if (!stockSymbol) errs.push("A company must be selected.");
        if (!quantity || parseInt(quantity) <= 0) errs.push("Position size must be a positive number.");
        if (!startDate) errs.push("A start date is required.");
        if (!endDate) errs.push("An end date is required.");
        if (new Date(startDate) >= new Date(endDate)) errs.push("Start date must be before the end date.");

        setErrors(errs);
        if (errs.length > 0) return;

        setLoading(true);
        // Simulate API call and redirect
        setTimeout(() => {
            navigate(`/company-based/${stockSymbol}/quantity/${quantity}/Sd/${startDate}/Ed/${endDate}`);
        }, 1000);
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans">
            <Navbar />
            <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${Cover})` }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
                <div className="w-full max-w-xl text-center mb-8">
                    {/* TEXT CHANGE: Thematic Header */}
                    <h1 className="mt-16 text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-2 tracking-tighter">
                        Run The Numbers
                    </h1>
                    <div className="h-1 w-32 bg-gradient-to-r from-amber-500 to-transparent mx-auto mb-3"></div>
                    <p className="text-zinc-400 uppercase tracking-widest text-sm">Isolate a target for deep analysis</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-amber-500/10 w-full max-w-xl p-8 space-y-6">
                    {errors.length > 0 && (
                        <ul className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg list-disc list-inside text-sm space-y-1">
                            {errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                    )}

                    <div>
                        <label className="block mb-2 font-medium text-zinc-300">Target Company</label>
                        <CompanySelector value={companyQuery} onSelect={(c) => { setCompanyQuery(c.name); setStockSymbol(c.ticker); }} onClear={() => { setCompanyQuery(''); setStockSymbol(''); }} />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium text-zinc-300">Position Size (Quantity)</label>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g., 100"
                            className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/20 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 font-medium text-zinc-300">Analysis Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-medium text-zinc-300">Analysis End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* TEXT CHANGE: Thematic Button Text */}
                    <button type="submit" disabled={loading}
                        className="w-full py-3 mt-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2
                        bg-amber-500 hover:bg-amber-400 text-black
                        disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed
                        transform hover:scale-[1.02] active:scale-[0.98]">
                        {loading ? 'Executing...' : 'Execute Analysis'}
                        {!loading && <BrainCircuit className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompanyAnalyticsForm;