// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PawPrint } from "lucide-react";
// CORRECTED IMPORT: Import specific Auth functions used in THIS component
import { signOut } from 'aws-amplify/auth'; // Only signOut is directly used in Navbar for logout

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // Determine if user is authenticated
    // This check is simple (localStorage). PrivateRoute handles robust session check.
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    const handleLogout = async () => {
        try {
            await signOut(); // Call the specific signOut function
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userEmail');
            setIsOpen(false); // Close mobile menu if open
            navigate('/'); // Navigate to home or login page
        } catch (error) {
            console.error("Error signing out: ", error);
            // Optionally set an error message in UI
        }
    };

    return (
        <nav className="relative sticky top-0 z-50 overflow-hidden
                        bg-gradient-to-r from-gray-950/80 via-purple-950/80 to-black/80 backdrop-blur-xl border-b border-white/10
                        shadow-lg animate-navbar-fade-in
                        selection:bg-teal-500 selection:text-white">

            {/* Subtle internal glow/orb effect using the primary AI gradient */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute w-full h-full bg-gradient-radial-navbar opacity-10 animate-orb-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex items-center justify-between h-16">
                    {/* Left side: Logo and App Name */}
                    <div className="flex items-center">
                        <PawPrint className="h-8 w-8 text-blue-400 drop-shadow-md animate-paw-sway" />
                        <span className="ml-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-lg">
                            PetHealth AI
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <NavLink to="/" text="Home" />
                            {/* Conditional rendering based on authentication status */}
                            {isAuthenticated ? (
                                <>
                                    <NavLink to="/chat" text="Chat" />
                                    <NavLink to="/emergency" text="Emergency" isEmergency />
                                    <NavLink to="/about" text="About" />
                                    <NavLink to="/contact" text="Contact" />
                                    <button onClick={handleLogout} className="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <NavLink to="/about" text="About" />
                                    <NavLink to="/contact" text="Contact" />
                                    <NavLink to="/auth" text="Login / Signup" /> {/* Link to AuthPage */}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-200 hover:text-white focus:outline-none transition-colors duration-300"
                            aria-label="Toggle mobile menu"
                        >
                            {isOpen ? (
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-gradient-to-b from-gray-950/90 via-purple-950/90 to-black/90 border-t border-white/20 pb-2">
                    <MobileNavLink to="/" text="Home" />
                    {/* Conditional rendering for mobile */}
                    {isAuthenticated ? (
                        <>
                            <MobileNavLink to="/chat" text="Chat" />
                            <MobileNavLink to="/emergency" text="Emergency" isEmergency />
                            <MobileNavLink to="/about" text="About" />
                            <MobileNavLink to="/contact" text="Contact" />
                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-base font-medium text-red-300 hover:bg-red-800/50 transition-colors duration-300">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <MobileNavLink to="/about" text="About" />
                            <MobileNavLink to="/contact" text="Contact" />
                            <MobileNavLink to="/auth" text="Login / Signup" />
                        </>
                    )}
                </div>
            )}
            <style jsx>{`
                @keyframes navbar-fade-in {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-navbar-fade-in {
                    animation: navbar-fade-in 0.6s ease-out forwards;
                }

                @keyframes paw-sway {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                }
                .animate-paw-sway {
                    animation: paw-sway 3s infinite ease-in-out;
                }

                /* Orb Pulse Background for Navbar - uses blue/purple accent */
                .bg-gradient-radial-navbar {
                    background: radial-gradient(circle at 50% 120%, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.1) 30%, transparent 60%); /* blue-500, purple-500 */
                }
                @keyframes orb-pulse {
                    0%, 100% { transform: scale(1) translateY(0); opacity: 0.1; }
                    50% { transform: scale(1.1) translateY(-5px); opacity: 0.2; }
                }
                .animate-orb-pulse {
                    animation: orb-pulse 8s infinite ease-in-out;
                }

                /* NavLink Hover Underline */
                .group-hover .group-underline {
                    transform: scaleX(1);
                    opacity: 1;
                }
            `}</style>
        </nav>
    );
}

// Helper component for Desktop Nav Links
const NavLink = ({ to, text, isEmergency }) => (
    <Link to={to} className={`text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium
                              relative group transition-colors duration-300 hover:bg-white/10`}
    >
        {text}
        <span className={`absolute inset-x-0 bottom-0 h-0.5
                          ${isEmergency ? 'bg-gradient-to-r from-red-400 to-orange-400' : 'bg-gradient-to-r from-blue-400 to-purple-400'}
                          transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 opacity-0 group-hover:opacity-100 group-underline`}></span>
    </Link>
);

// Helper component for Mobile Nav Links
const MobileNavLink = ({ to, text, isEmergency }) => (
    <Link to={to} className={`block px-4 py-2 text-base font-medium
                              ${isEmergency ? 'text-red-200 hover:bg-red-800/50' : 'text-gray-100 hover:bg-blue-800/50'}
                              hover:text-white transition-colors duration-300`}
    >
        {text}
    </Link>
);

export default Navbar;