// src/pages/WelcomeUser.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smile, Home as HomeIcon, MessageCircle } from "lucide-react"; // Renamed Home to HomeIcon to avoid conflict

const WelcomeUser = () => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState("");
    const [displayName, setDisplayName] = useState("User");

    useEffect(() => {
        // Retrieve user email from local storage or context
        const email = localStorage.getItem('userEmail');
        if (email) {
            setUserEmail(email);
            setDisplayName(email.split('@')[0]);
        } else {
            // If no user email, redirect to home or login
            navigate('/');
        }

        // Set a timer to redirect to chat or home after a short delay
        // const timer = setTimeout(() => {
        //     navigate('/chat'); // Redirect to chat page after welcome
        // }, 3000); // 3 seconds

        // return () => clearTimeout(timer); // Clean up the timer
    }, [navigate]);

    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white p-4 selection:bg-teal-500 selection:text-white">
            <div className="text-center bg-gray-800/70 backdrop-blur-sm rounded-3xl p-10 md:p-16 shadow-2xl transform hover:scale-[1.01] transition-transform duration-500 animate-appear">
                <Smile className="mx-auto mb-8 text-teal-300 animate-bounce-slow" size={72} />
                <h2 className="text-4xl md:text-5xl font-black mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                    Welcome Home, {displayName}!
                </h2>
                <p className="text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed text-gray-200 mb-8">
                    You're successfully authenticated. Get ready to explore Pet Health AI's features!
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => navigate('/chat')}
                        className="group relative bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white font-bold py-5 px-10 md:py-6 md:px-12 rounded-full text-lg md:text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out inline-flex items-center overflow-hidden border border-purple-500 hover:border-blue-500"
                    >
                        <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <MessageCircle className="mr-3 group-hover:rotate-12 transition-transform duration-300 relative z-10" size={24} />
                        <span className="relative z-10">Chat with Pet Health AI</span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="group relative bg-gray-700 hover:bg-gray-600 text-white font-bold py-5 px-10 md:py-6 md:px-12 rounded-full text-lg md:text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out inline-flex items-center"
                    >
                        <HomeIcon className="mr-3" size={24} /> Back to Home
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes appear {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-appear {
                    animation: appear 0.6s ease-out forwards;
                    opacity: 0;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default WelcomeUser;