

// Updated UI for CompanyAnalyticsForm
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Cover from "../assets/BG.png";
import Navbar from '../components/navbar';

const companyData: { name: string; ticker: string }[] = [
    { name: "Apple Inc.", ticker: "AAPL" }, { name: "Microsoft Corporation", ticker: "MSFT" },
    { name: "Amazon.com, Inc.", ticker: "AMZN" }, { name: "NVIDIA Corporation", ticker: "NVDA" },
    { name: "Alphabet Inc. (Class A)", ticker: "GOOGL" }, { name: "Alphabet Inc. (Class C)", ticker: "GOOG" },
    { name: "Meta Platforms, Inc.", ticker: "META" }, { name: "Tesla, Inc.", ticker: "TSLA" },
    { name: "Berkshire Hathaway Inc.", ticker: "BRK-B" }, { name: "Eli Lilly and Company", ticker: "LLY" },
    { name: "Broadcom Inc.", ticker: "AVGO" }, { name: "JPMorgan Chase & Co.", ticker: "JPM" },
    { name: "Visa Inc.", ticker: "V" }, { name: "Exxon Mobil Corporation", ticker: "XOM" },
    { name: "UnitedHealth Group Incorporated", ticker: "UNH" }, { name: "Johnson & Johnson", ticker: "JNJ" },
    { name: "Mastercard Incorporated", ticker: "MA" }, { name: "The Procter & Gamble Company", ticker: "PG" },
    { name: "Costco Wholesale Corporation", ticker: "COST" }, { name: "The Home Depot, Inc.", ticker: "HD" },
    { name: "Merck & Co., Inc.", ticker: "MRK" }, { name: "AbbVie Inc.", ticker: "ABBV" },
    { name: "Chevron Corporation", ticker: "CVX" }, { name: "Adobe Inc.", ticker: "ADBE" },
    { name: "Salesforce, Inc.", ticker: "CRM" }, { name: "PepsiCo, Inc.", ticker: "PEP" },
    { name: "The Coca-Cola Company", ticker: "KO" }, { name: "Walmart Inc.", ticker: "WMT" },
    { name: "Bank of America Corporation", ticker: "BAC" }, { name: "Netflix, Inc.", ticker: "NFLX" },
    { name: "Oracle Corporation", ticker: "ORCL" }, { name: "Advanced Micro Devices, Inc.", ticker: "AMD" },
    { name: "McDonald's Corporation", ticker: "MCD" }, { name: "Accenture plc", ticker: "ACN" },
    { name: "Linde plc", ticker: "LIN" }, { name: "Thermo Fisher Scientific Inc.", ticker: "TMO" },
    { name: "Cisco Systems, Inc.", ticker: "CSCO" }, { name: "Abbott Laboratories", ticker: "ABT" },
    { name: "General Electric Company", ticker: "GE" }, { name: "Walt Disney Company", ticker: "DIS" },
    { name: "Qualcomm, Inc.", ticker: "QCOM" }, { name: "Intel Corporation", ticker: "INTC" },
    { name: "Verizon Communications Inc.", ticker: "VZ" }, { name: "Caterpillar Inc.", ticker: "CAT" },
    { name: "International Business Machines Corporation", ticker: "IBM" }, { name: "Pfizer Inc.", ticker: "PFE" },
    { name: "Comcast Corporation", ticker: "CMCSA" }, { name: "Wells Fargo & Company", ticker: "WFC" },
    { name: "Danaher Corporation", ticker: "DHR" }, { name: "Amgen Inc.", ticker: "AMGN" },
    { name: "Texas Instruments Incorporated", ticker: "TXN" }, { name: "Intuitive Surgical, Inc.", ticker: "ISRG" },
    { name: "United Parcel Service, Inc.", ticker: "UPS" }, { name: "Philip Morris International Inc.", ticker: "PM" },
    { name: "RTX Corporation", ticker: "RTX" }, { name: "Union Pacific Corporation", ticker: "UNP" },
    { name: "The Goldman Sachs Group, Inc.", ticker: "GS" }, { name: "Honeywell International Inc.", ticker: "HON" },
    { name: "Applied Materials, Inc.", ticker: "AMAT" }, { name: "Morgan Stanley", ticker: "MS" },
    { name: "Deere & Company", ticker: "DE" }, { name: "Boeing Company", ticker: "BA" },
    { name: "BlackRock, Inc.", ticker: "BLK" }, { name: "Prologis, Inc.", ticker: "PLD" },
    { name: "ServiceNow, Inc.", ticker: "NOW" }, { name: "Lowe's Companies, Inc.", ticker: "LOW" },
    { name: "Vertex Pharmaceuticals Incorporated", ticker: "VRTX" }, { name: "S&P Global Inc.", ticker: "SPGI" },
    { name: "Regeneron Pharmaceuticals, Inc.", ticker: "REGN" }, { name: "Starbucks Corporation", ticker: "SBUX" },
    { name: "Booking Holdings Inc.", ticker: "BKNG" }, { name: "American Express Company", ticker: "AXP" },
    { name: "Elevance Health, Inc.", ticker: "ELV" }, { name: "Citigroup Inc.", ticker: "C" },
    { name: "Medtronic plc", ticker: "MDT" }, { name: "Gilead Sciences, Inc.", ticker: "GILD" },
    { name: "Intuit Inc.", ticker: "INTU" }, { name: "The Charles Schwab Corporation", ticker: "SCHW" },
    { name: "Bristol Myers Squibb Company", ticker: "BMY" }, { name: "CVS Health Corporation", ticker: "CVS" },
    { name: "Automatic Data Processing, Inc.", ticker: "ADP" }, { name: "TJX Companies, Inc.", ticker: "TJX" },
    { name: "Marsh & McLennan Companies, Inc.", ticker: "MMC" }, { name: "Lam Research Corporation", ticker: "LRCX" },
    { name: "Analog Devices, Inc.", ticker: "ADI" }, { name: "Equinix, Inc.", ticker: "EQIX" },
    { name: "Waste Management, Inc.", ticker: "WM" }, { name: "Cigna Group", ticker: "CI" },
    { name: "AT&T Inc.", ticker: "T" }, { name: "Boston Scientific Corporation", ticker: "BSX" },
    { name: "Progressive Corporation", ticker: "PGR" }, { name: "Stryker Corporation", ticker: "SYK" },
    { name: "Eaton Corporation plc", ticker: "ETN" }, { name: "Chubb Limited", ticker: "CB" },
    { name: "General Motors Company", ticker: "GM" }, { name: "Ford Motor Company", ticker: "F" },
    { name: "FedEx Corporation", ticker: "FDX" }, { name: "Nike, Inc.", ticker: "NKE" }
];

const CompanySelector = ({ onSelect, value, onClear }: any) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const filtered = query === '' ? [] : companyData.filter(
        (c) => c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.ticker.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);

    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => setQuery(value), [value]);

    return (
        <>


            <div ref={wrapperRef} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!e.target.value) onClear();
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Search Company or Ticker..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/20 border border-white/20 text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                    />
                </div>
                {isOpen && filtered.length > 0 && (
                    <ul className="absolute z-20 w-full mt-1 rounded-lg border border-white/10 bg-zinc-900/80 backdrop-blur max-h-60 overflow-y-auto text-sm">
                        {filtered.map((c) => (
                            <li
                                key={c.ticker}
                                onClick={() => {
                                    onSelect(c);
                                    setIsOpen(false);
                                }}
                                className="flex justify-between items-center px-3 py-2 text-zinc-200 hover:bg-amber-500/20 cursor-pointer"
                            >
                                <span>{c.name}</span>
                                <span className="font-mono text-zinc-400">{c.ticker}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

const CompanyAnalyticsForm = () => {
    const [stockSymbol, setStockSymbol] = useState('');
    const [companyQuery, setCompanyQuery] = useState('');
    const [quantity, setQuantity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const today = new Date();
        const lastYear = today.getFullYear() - 1;
        setStartDate(`${lastYear}-01-01`);
        setEndDate(`${lastYear}-12-31`);
    }, []);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        const errs = [];
        if (!stockSymbol) errs.push("Stock Symbol is required");
        if (!quantity || parseInt(quantity) <= 0) errs.push("Quantity must be a positive number");
        if (!startDate) errs.push("Start Date is required");
        if (!endDate) errs.push("End Date is required");
        if (new Date(startDate) > new Date(endDate)) errs.push("Start Date must be before End Date");

        setLoading(true);
        navigate(`/company-based/${stockSymbol}/quantity/${quantity}/Sd/${startDate}/Ed/${endDate}`);
    };

    return (
        <div className="relative min-h-screen bg-black text-white">
            <Navbar></Navbar>
            <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${Cover})` }} />
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/70 via-black to-black" />
            <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
                <form onSubmit={handleSubmit} className="bg-zinc-900/40 backdrop-blur border border-white/10 rounded-2xl shadow-xl max-w-xl w-full p-8 space-y-6">
                    <h1 className="text-2xl font-bold text-center text-amber-400">Company Analytics Input</h1>

                    {errors.length > 0 && (
                        <ul className="text-red-400 list-disc list-inside text-sm">
                            {errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                    )}

                    <div>
                        <label className="block mb-1 font-medium text-zinc-300">Company</label>
                        <CompanySelector value={companyQuery} onSelect={(c: any) => {
                            setCompanyQuery(c.name);
                            setStockSymbol(c.ticker);
                        }} onClear={() => {
                            setCompanyQuery('');
                            setStockSymbol('');
                        }} />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-zinc-300">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g., 100"
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/20 text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium text-zinc-300">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-zinc-300">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-lg font-semibold transition-colors ${loading ? 'bg-amber-700/40 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'} text-white`}
                    >
                        {loading ? 'Redirecting...' : 'Analyse Now'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompanyAnalyticsForm;
