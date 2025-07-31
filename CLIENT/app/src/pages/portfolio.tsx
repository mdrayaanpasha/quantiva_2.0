import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, PlusCircle, Edit, Trash2, X } from 'lucide-react'; // Using lucide-react for cleaner icons
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

// --- DATA & API (Unchanged) ---
const companyData: { name: string; ticker: string }[] = [
    { name: "Apple Inc.", ticker: "AAPL" }, { name: "Microsoft Corporation", ticker: "MSFT" }, { name: "Amazon.com, Inc.", ticker: "AMZN" }, { name: "NVIDIA Corporation", ticker: "NVDA" }, { name: "Alphabet Inc. (Class A)", ticker: "GOOGL" }, { name: "Alphabet Inc. (Class C)", ticker: "GOOG" }, { name: "Meta Platforms, Inc.", ticker: "META" }, { name: "Tesla, Inc.", ticker: "TSLA" }, { name: "Berkshire Hathaway Inc.", ticker: "BRK-B" }, { name: "Eli Lilly and Company", ticker: "LLY" }, { name: "Broadcom Inc.", ticker: "AVGO" }, { name: "JPMorgan Chase & Co.", ticker: "JPM" }, { name: "Visa Inc.", ticker: "V" }, { name: "Exxon Mobil Corporation", ticker: "XOM" }, { name: "UnitedHealth Group Incorporated", ticker: "UNH" }, { name: "Johnson & Johnson", ticker: "JNJ" }, { name: "Mastercard Incorporated", ticker: "MA" }, { name: "The Procter & Gamble Company", ticker: "PG" }, { name: "Costco Wholesale Corporation", ticker: "COST" }, { name: "The Home Depot, Inc.", ticker: "HD" }, { name: "Merck & Co., Inc.", ticker: "MRK" }, { name: "AbbVie Inc.", ticker: "ABBV" }, { name: "Chevron Corporation", ticker: "CVX" }, { name: "Adobe Inc.", ticker: "ADBE" }, { name: "Salesforce, Inc.", ticker: "CRM" }, { name: "PepsiCo, Inc.", ticker: "PEP" }, { name: "The Coca-Cola Company", ticker: "KO" }, { name: "Walmart Inc.", ticker: "WMT" }, { name: "Bank of America Corporation", ticker: "BAC" }, { name: "Netflix, Inc.", ticker: "NFLX" }, { name: "Oracle Corporation", ticker: "ORCL" }, { name: "Advanced Micro Devices, Inc.", ticker: "AMD" }, { name: "McDonald's Corporation", ticker: "MCD" }, { name: "Accenture plc", ticker: "ACN" }, { name: "Linde plc", ticker: "LIN" }, { name: "Thermo Fisher Scientific Inc.", ticker: "TMO" }, { name: "Cisco Systems, Inc.", ticker: "CSCO" }, { name: "Abbott Laboratories", ticker: "ABT" }, { name: "General Electric Company", ticker: "GE" }, { name: "Walt Disney Company", ticker: "DIS" }, { name: "Qualcomm, Inc.", ticker: "QCOM" }, { name: "Intel Corporation", ticker: "INTC" }, { name: "Verizon Communications Inc.", ticker: "VZ" }, { name: "Caterpillar Inc.", ticker: "CAT" }, { name: "International Business Machines Corporation", ticker: "IBM" }, { name: "Pfizer Inc.", ticker: "PFE" }, { name: "Comcast Corporation", ticker: "CMCSA" }, { name: "Wells Fargo & Company", ticker: "WFC" }, { name: "Danaher Corporation", ticker: "DHR" }, { name: "Amgen Inc.", ticker: "AMGN" }, { name: "Texas Instruments Incorporated", ticker: "TXN" }, { name: "Intuitive Surgical, Inc.", ticker: "ISRG" }, { name: "United Parcel Service, Inc.", ticker: "UPS" }, { name: "Philip Morris International Inc.", ticker: "PM" }, { name: "RTX Corporation", ticker: "RTX" }, { name: "Union Pacific Corporation", ticker: "UNP" }, { name: "The Goldman Sachs Group, Inc.", ticker: "GS" }, { name: "Honeywell International Inc.", ticker: "HON" }, { name: "Applied Materials, Inc.", ticker: "AMAT" }, { name: "Morgan Stanley", ticker: "MS" }, { name: "Deere & Company", ticker: "DE" }, { name: "Boeing Company", ticker: "BA" }, { name: "BlackRock, Inc.", ticker: "BLK" }, { name: "Prologis, Inc.", ticker: "PLD" }, { name: "ServiceNow, Inc.", ticker: "NOW" }, { name: "Lowe's Companies, Inc.", ticker: "LOW" }, { name: "Vertex Pharmaceuticals Incorporated", ticker: "VRTX" }, { name: "S&P Global Inc.", ticker: "SPGI" }, { name: "Regeneron Pharmaceuticals, Inc.", ticker: "REGN" }, { name: "Starbucks Corporation", ticker: "SBUX" }, { name: "Booking Holdings Inc.", ticker: "BKNG" }, { name: "American Express Company", ticker: "AXP" }, { name: "Elevance Health, Inc.", ticker: "ELV" }, { name: "Citigroup Inc.", ticker: "C" }, { name: "Medtronic plc", ticker: "MDT" }, { name: "Gilead Sciences, Inc.", ticker: "GILD" }, { name: "Intuit Inc.", ticker: "INTU" }, { name: "The Charles Schwab Corporation", ticker: "SCHW" }, { name: "Bristol Myers Squibb Company", ticker: "BMY" }, { name: "CVS Health Corporation", ticker: "CVS" }, { name: "Automatic Data Processing, Inc.", ticker: "ADP" }, { name: "TJX Companies, Inc.", ticker: "TJX" }, { name: "Marsh & McLennan Companies, Inc.", ticker: "MMC" }, { name: "Lam Research Corporation", ticker: "LRCX" }, { name: "Analog Devices, Inc.", ticker: "ADI" }, { name: "Equinix, Inc.", ticker: "EQIX" }, { name: "Waste Management, Inc.", ticker: "WM" }, { name: "Cigna Group", ticker: "CI" }, { name: "AT&T Inc.", ticker: "T" }, { name: "Boston Scientific Corporation", ticker: "BSX" }, { name: "Progressive Corporation", ticker: "PGR" }, { name: "Stryker Corporation", ticker: "SYK" }, { name: "Eaton Corporation plc", ticker: "ETN" }, { name: "Chubb Limited", ticker: "CB" }, { name: "General Motors Company", ticker: "GM" }, { name: "Ford Motor Company", ticker: "F" }, { name: "FedEx Corporation", ticker: "FDX" }, { name: "Nike, Inc.", ticker: "NKE" }
];
interface PortfolioItem { id: number; company_tikker: string; company_name: string; company_share_amount: number; investment_start_date: string; userId: number; }
type NewPortfolioItem = Omit<PortfolioItem, 'id' | 'userId'>;
type UpdatePortfolioData = Partial<Pick<PortfolioItem, 'company_share_amount' | 'investment_start_date'>>;
const JWT_TOKEN = localStorage.getItem("QUANT-TOKEN");
const API_BASE_URL = 'http://localhost:3000/api/portfolio';
const apiService = {
    getHeaders: () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${JWT_TOKEN}` }),
    getPortfolio: async (): Promise<PortfolioItem[]> => { const response = await fetch(API_BASE_URL, { headers: apiService.getHeaders() }); if (!response.ok) throw new Error('Failed to fetch portfolio'); return response.json(); },
    addPortfolio: async (item: NewPortfolioItem): Promise<any> => { const response = await fetch(API_BASE_URL, { method: 'POST', headers: apiService.getHeaders(), body: JSON.stringify([item]) }); if (!response.ok) throw new Error('Failed to add portfolio item'); return response.json(); },
    updatePortfolio: async (id: number, data: UpdatePortfolioData): Promise<PortfolioItem> => { const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'PUT', headers: apiService.getHeaders(), body: JSON.stringify(data) }); if (!response.ok) throw new Error('Failed to update portfolio item'); return response.json(); },
    deletePortfolio: async (id: number): Promise<void> => { const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE', headers: apiService.getHeaders() }); if (!response.ok) throw new Error('Failed to delete portfolio item'); }
};

// --- HELPER COMPONENTS (MODIFIED) ---
const Notification = ({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void; }) => {
    useEffect(() => { const timer = setTimeout(onDismiss, 5000); return () => clearTimeout(timer); }, [onDismiss]);
    const baseClasses = 'fixed top-5 right-5 p-4 rounded-xl shadow-lg text-white text-sm z-50 transition-all duration-300 transform-gpu animate-fade-in-down backdrop-blur-lg border';
    const typeClasses = type === 'success' ? 'bg-green-500/20 border-green-400/50' : 'bg-red-500/20 border-red-400/50';
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void; }) => (
    <div className="fixed inset-0 bg-black/70 z-40 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"> <X /> </button>
            {children}
        </div>
    </div>
);

const SkeletonRow = () => (
    <tr className="border-b border-white/10 animate-pulse">
        <td className="p-4"><div className="h-4 bg-white/10 rounded w-3/4"></div></td>
        <td className="p-4 hidden sm:table-cell"><div className="h-4 bg-white/10 rounded w-full"></div></td>
        <td className="p-4 text-right"><div className="h-4 bg-white/10 rounded w-1/2 ml-auto"></div></td>
        <td className="p-4 hidden md:table-cell"><div className="h-4 bg-white/10 rounded w-3/4"></div></td>
        <td className="p-4"><div className="flex justify-end gap-2"><div className="h-8 w-8 bg-white/10 rounded-full"></div><div className="h-8 w-8 bg-white/10 rounded-full"></div></div></td>
    </tr>
);

// --- FORM COMPONENTS (MODIFIED) ---
const CompanySelector = ({ onSelect, value, onClear }: { onSelect: (company: { name: string; ticker: string; }) => void; value: string; onClear: () => void; }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const filteredCompanies = query === '' ? [] : companyData.filter(company => company.name.toLowerCase().includes(query.toLowerCase()) || company.ticker.toLowerCase().includes(query.toLowerCase())).slice(0, 7);
    useEffect(() => { function handleClickOutside(event: MouseEvent) { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); } document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, [wrapperRef]);
    useEffect(() => { setQuery(value); }, [value]);
    const handleSelect = (company: { name: string, ticker: string }) => { setQuery(company.name); onSelect(company); setIsOpen(false); };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); if (!e.target.value) onClear(); setIsOpen(true); };
    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="text-zinc-500 w-5 h-5" /></span>
                <input type="text" value={query} onChange={handleInputChange} onFocus={() => setIsOpen(true)} placeholder="Hunt for Company or Ticker..." className="w-full bg-black/20 text-white border border-white/10 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors" autoComplete="off" />
            </div>
            {isOpen && filteredCompanies.length > 0 && (
                // SCROLLBAR HIDDEN
                <ul className="absolute z-10 w-full bg-zinc-900/80 backdrop-blur-lg border border-white/10 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg scrollbar-hide">
                    {filteredCompanies.map(company => (
                        <li key={company.ticker} onClick={() => handleSelect(company)} className="px-4 py-2 text-zinc-200 hover:bg-amber-500/20 cursor-pointer flex justify-between items-center transition-colors">
                            <span>{company.name}</span> <span className="font-mono text-zinc-400">{company.ticker}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const AddPortfolioForm = ({ onAdd, isAdding }: { onAdd: (item: NewPortfolioItem) => void; isAdding: boolean; }) => {
    const [item, setItem] = useState<NewPortfolioItem>({ company_tikker: '', company_name: '', company_share_amount: 0, investment_start_date: '' });
    const [companyQuery, setCompanyQuery] = useState('');
    const handleCompanySelect = (company: { name: string; ticker: string; }) => { setItem(prev => ({ ...prev, company_name: company.name, company_tikker: company.ticker })); setCompanyQuery(company.name); };
    const handleClearCompany = () => { setItem(prev => ({ ...prev, company_name: '', company_tikker: '' })); setCompanyQuery(''); };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value, type } = e.target; setItem(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value })); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAdd(item); setItem({ company_tikker: '', company_name: '', company_share_amount: 0, investment_start_date: '' }); setCompanyQuery(''); };
    return (
        <div className="bg-zinc-900/30 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg p-6 mb-8">
            {/* TEXT CHANGE */}
            <h2 className="text-2xl font-bold text-amber-300 mb-6">Secure a New Position</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="flex flex-col lg:col-span-2">
                    <label className="text-sm font-medium text-zinc-400 mb-1">Company</label>
                    <CompanySelector onSelect={handleCompanySelect} value={companyQuery} onClear={handleClearCompany} />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="company_share_amount" className="text-sm font-medium text-zinc-400 mb-1">Shares</label>
                    <input type="number" name="company_share_amount" placeholder="e.g., 100" value={item.company_share_amount || ''} onChange={handleChange} className="bg-black/20 text-white border border-white/10 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors" required min="0.0001" step="any" />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="investment_start_date" className="text-sm font-medium text-zinc-400 mb-1">Date Acquired</label>
                    <input type="date" name="investment_start_date" value={item.investment_start_date} onChange={handleChange} className="bg-black/20 text-white border border-white/10 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors" required />
                </div>
                {/* TEXT CHANGE */}
                <button type="submit" disabled={isAdding || !item.company_tikker} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/50 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors h-[46px] md:col-start-auto">
                    {isAdding ? 'Securing...' : <><PlusCircle className="w-5 h-5 mr-2" /> Secure Position</>}
                </button>
            </form>
        </div>
    );
};


// --- MAIN COMPONENTS (MODIFIED) ---
const EditPortfolioModal = ({ item, onUpdate, onClose, isUpdating }: { item: PortfolioItem; onUpdate: (id: number, data: UpdatePortfolioData) => void; onClose: () => void; isUpdating: boolean; }) => {
    const [data, setData] = useState<UpdatePortfolioData>({ company_share_amount: item.company_share_amount, investment_start_date: item.investment_start_date.split('T')[0] });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value, type } = e.target; setData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value })); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onUpdate(item.id, { ...data, investment_start_date: data.investment_start_date ? new Date(data.investment_start_date).toISOString() : undefined }); };
    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold text-amber-300 mb-2">Edit Position</h2>
            <p className="text-zinc-400 font-mono mb-6">{item.company_name} ({item.company_tikker})</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col">
                    <label htmlFor="edit_company_share_amount" className="text-sm font-medium text-zinc-400 mb-1">Shares</label>
                    <input type="number" id="edit_company_share_amount" name="company_share_amount" value={data.company_share_amount} onChange={handleChange} className="bg-black/20 text-white border border-white/10 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors" required min="0" step="any" />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="edit_investment_start_date" className="text-sm font-medium text-zinc-400 mb-1">Date Acquired</label>
                    <input type="date" id="edit_investment_start_date" name="investment_start_date" value={data.investment_start_date} onChange={handleChange} className="bg-black/20 text-white border border-white/10 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors" required />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-zinc-700/50 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                    {/* TEXT CHANGE */}
                    <button type="submit" disabled={isUpdating} className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        {isUpdating ? 'Saving...' : 'Update Position'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default function Portfolio() {
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => { setNotification({ message, type }); };
    const fetchPortfolio = useCallback(async () => {
        setIsLoading(true);
        try { const data = await apiService.getPortfolio(); setPortfolio(data); }
        catch (err) { showNotification(err instanceof Error ? err.message : 'An unknown error occurred', 'error'); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

    const handleAddItem = async (item: NewPortfolioItem) => {
        setIsSubmitting(true);
        try {
            await apiService.addPortfolio(item);
            showNotification('Position secured successfully!', 'success');
            fetchPortfolio();
        } catch (err) { showNotification(err instanceof Error ? err.message : 'Failed to secure position', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleUpdateItem = async (id: number, data: UpdatePortfolioData) => {
        setIsSubmitting(true);
        try {
            const updatedItem = await apiService.updatePortfolio(id, data);
            setPortfolio(prev => prev.map(p => p.id === id ? { ...p, ...updatedItem } : p));
            showNotification('Ledger updated.', 'success');
            setEditingItem(null);
        } catch (err) { showNotification(err instanceof Error ? err.message : 'Failed to update ledger', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteItem = async (id: number) => {
        if (!window.confirm('Are you sure you want to liquidate this position?')) return;
        setIsSubmitting(true);
        try {
            await apiService.deletePortfolio(id);
            setPortfolio(prev => prev.filter(p => p.id !== id));
            showNotification('Position liquidated.', 'success');
        } catch (err) { showNotification(err instanceof Error ? err.message : 'Failed to liquidate position', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-CA');

    return (
        <div className="relative min-h-screen bg-black text-zinc-300 font-sans overflow-hidden">
            <Navbar />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black"></div>
            <div className="absolute inset-0 bg-cover opacity-15" style={{ backgroundImage: `url(${Cover})`, filter: 'grayscale(80%)' }}></div>
            {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
            {editingItem && <EditPortfolioModal item={editingItem} onClose={() => setEditingItem(null)} onUpdate={handleUpdateItem} isUpdating={isSubmitting} />}

            <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <header className="mt-16 mb-12 text-center">
                    {/* TEXT CHANGE */}
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-2 tracking-tighter">THE WOLF'S LEDGER</h1>
                    <div className="h-1 w-32 bg-gradient-to-r from-amber-500 to-transparent mx-auto mb-3"></div>
                    <p className="text-zinc-500 uppercase tracking-widest text-sm">Track and command your assets</p>
                </header>

                <AddPortfolioForm onAdd={handleAddItem} isAdding={isSubmitting} />

                <div className="bg-zinc-900/30 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden">
                    {/* SCROLLBAR HIDDEN */}
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left">
                            <thead className="border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Ticker</th>
                                    <th className="p-4 text-sm font-semibold uppercase tracking-wider text-zinc-400 hidden sm:table-cell">Company</th>
                                    <th className="p-4 text-sm font-semibold uppercase tracking-wider text-zinc-400 text-right">Shares</th>
                                    <th className="p-4 text-sm font-semibold uppercase tracking-wider text-zinc-400 hidden md:table-cell">Acquired</th>
                                    <th className="p-4 text-sm font-semibold uppercase tracking-wider text-zinc-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (<><SkeletonRow /><SkeletonRow /><SkeletonRow /></>) : portfolio.length > 0 ? (portfolio.map(item => (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-mono text-amber-300 font-bold">{item.company_tikker}</td>
                                        <td className="p-4 hidden sm:table-cell text-zinc-200">{item.company_name}</td>
                                        <td className="p-4 text-right font-medium">{item.company_share_amount.toLocaleString()}</td>
                                        <td className="p-4 hidden md:table-cell text-zinc-400">{formatDate(item.investment_start_date)}</td>
                                        <td className="p-4">
                                            <div className="flex justify-end items-center gap-2">
                                                <button onClick={() => setEditingItem(item)} className="p-2 rounded-full text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors" aria-label="Edit"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="p-2 rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))) : (
                                    // TEXT CHANGE
                                    <tr><td colSpan={5} className="text-center p-8 text-zinc-500">The ledger is clear. Time to hunt for opportunities.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}