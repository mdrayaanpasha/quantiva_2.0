import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';

function Auth() {
    const [isRegistering, setIsRegistering] = useState(true); // true for register, false for login
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Base URL for your backend API
    const API_BASE_URL = 'http://localhost:3000'; // This is correct as the base, we'll add the prefix in fetch calls


    /**
     * Handles the registration form submission.
     * @param {Event} e - The form submission event.
     */
    const handleRegister = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        const registerToastId = toast.loading('Registering user...');

        try {
            const response = await fetch(`${API_BASE_URL}/api/userAuth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Corrected typo here!
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Registration successful! Please log in.', { id: registerToastId });
                // Clear form fields and switch to login
                setName('');
                setEmail('');
                setPassword('');
                setIsRegistering(false);
                localStorage.setItem("QUANT-TOKEN", data.token);
            } else {
                toast.error(data.error || 'Registration failed. Try again!', { id: registerToastId });
            }
        } catch (error) {
            console.error('Network error during registration:', error);
            toast.error('Network error. Check your connection.', { id: registerToastId });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles the login form submission.
     * @param {Event} e - The form submission event.
     */
    const handleLogin = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        const loginToastId = toast.loading('Logging in...');

        try {
            // Corrected the path to include /api/userAuth/
            const response = await fetch(`${API_BASE_URL}/api/userAuth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Login successful! Welcome back.', { id: loginToastId });
                // In a real app, you'd store the token (if any) here and redirect.
                // For now, just clear fields:
                setEmail('');
                setPassword('');
                console.log('User logged in:', data); // Log user data
                localStorage.setItem("QUANT-TOKEN", data.token);

            } else {
                toast.error(data.error || 'Login failed. Invalid credentials.', { id: loginToastId });
            }
        } catch (error) {
            console.error('Network error during login:', error);
            toast.error('Network error. Check your connection.', { id: loginToastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
                    {isRegistering ? 'Join Us! 🚀' : 'Welcome Back! 👋'}
                </h2>

                {isRegistering ? (
                    // Registration Form
                    <form onSubmit={handleRegister}>
                        <div className="mb-5">
                            <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Name</label>
                            <input
                                type="text"
                                id="name"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out placeholder-gray-400 text-gray-800"
                                placeholder="Your Name"
                                value={name}
                                onChange={(e: any) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-5">
                            <label htmlFor="regEmail" className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                id="regEmail"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out placeholder-gray-400 text-gray-800"
                                placeholder="your@example.com"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="regPassword" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                            <input
                                type="password"
                                id="regPassword"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out placeholder-gray-400 text-gray-800"
                                placeholder="********"
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                ) : (
                    // Login Form
                    <form onSubmit={handleLogin}>
                        <div className="mb-5">
                            <label htmlFor="loginEmail" className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                id="loginEmail"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out placeholder-gray-400 text-gray-800"
                                placeholder="your@example.com"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="loginPassword" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                            <input
                                type="password"
                                id="loginPassword"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out placeholder-gray-400 text-gray-800"
                                placeholder="********"
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Logging In...' : 'Log In'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-base transition-colors duration-200 ease-in-out focus:outline-none"
                    >
                        {isRegistering ? 'Already have an account? Login here!' : 'Don\'t have an account? Register here!'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Auth;
