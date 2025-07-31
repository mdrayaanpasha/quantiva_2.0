import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Cover from '../assets/bg.png'; // Make sure this path is correct
import { User, Mail, KeyRound } from 'lucide-react'; // Import icons

// Define props for the input field to avoid using `any`
interface InputFieldProps {
    id: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: React.ElementType;
}

// Reusable input component for a cleaner form
const InputField: React.FC<InputFieldProps> = ({ id, type, placeholder, value, onChange, icon: Icon }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <Icon className="h-5 w-5 text-zinc-500" />
        </span>
        <input
            id={id}
            type={type}
            className="w-full pl-12 pr-4 py-3 bg-black/20 text-white border border-white/20 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required
            autoComplete="off"
        />
    </div>
);


const Auth = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:3000';

    // **BUG FIX**: This function clears the form fields when toggling
    const handleToggleForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setIsRegistering(prevState => !prevState);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = isRegistering ? 'register' : 'login';
        const payload = isRegistering ? { name, email, password } : { email, password };
        const toastId = toast.loading(isRegistering ? 'Creating your profile...' : 'Authenticating...');

        try {
            const response = await fetch(`${API_BASE_URL}/api/userAuth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (response.ok) {
                const successMessage = isRegistering ? 'Welcome to the pack. Logging you in.' : 'Welcome back.';
                toast.success(successMessage, { id: toastId });
                localStorage.setItem("QUANT-TOKEN", data.token);
                setTimeout(() => window.location.href = "/portfolio-hub", 1000); // Redirect after a short delay
            } else {
                toast.error(data.error || 'An unexpected error occurred.', { id: toastId });
            }
        } catch (error) {
            toast.error('Network error. Please check your connection.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4 font-sans">
            {/* Toaster with dark theme */}
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#18181b', // zinc-900
                        color: '#e4e4e7', // zinc-200
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    success: {
                        iconTheme: { primary: '#f59e0b', secondary: 'black' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: 'white' },
                    },
                }}
            />

            {/* Background Image & Gradient */}
            <div className="fixed inset-0 w-full h-full">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${Cover})` }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/90 to-black"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-amber-400 cursor-pointer" onClick={() => navigate('/')}>
                        The Wolf
                    </h1>
                </div>
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/20 p-8">
                    <h2 className="text-3xl font-extrabold text-center text-white mb-2">
                        {isRegistering ? 'Join The Pack' : 'The Wolf Returns'}
                    </h2>
                    <p className="text-zinc-400 text-center mb-8">
                        {isRegistering ? 'Create your account to gain your edge.' : 'Enter the den to continue your hunt.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isRegistering && (
                            <InputField id="name" type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} icon={User} />
                        )}
                        <InputField id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} />
                        <InputField id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={KeyRound} />

                        <button
                            type="submit"
                            className="w-full bg-amber-500 text-black py-3 rounded-lg font-bold text-base hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (isRegistering ? 'Claim Your Seat' : 'Enter The Den')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleToggleForm} // Use the new handler here
                            className="text-zinc-400 hover:text-amber-400 font-medium text-sm transition-colors"
                        >
                            {isRegistering ? 'Already in the pack? Enter the den.' : "New to the hunt? Join the pack."}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;