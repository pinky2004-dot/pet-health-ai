// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { MessageCircle, Camera, BookOpen, MapPin, Zap, ArrowRight, Sparkles, Heart, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setIsVisible(true);

        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const navigateToChat = () => {
        console.log("Navigate to Chat Page");
        // In a real application, you would use React Router or similar here:
        navigate('/auth');
    };

    const features = [
        {
            icon: Zap,
            title: "AI-Powered Triage",
            description: "Is it an emergency? Our AWS Bedrock-powered chat instantly assesses and guides you.",
            gradient: "from-purple-500 to-pink-500", // Part of core palette
            delay: "0ms"
        },
        {
            icon: Camera,
            title: "Smart Symptom Analysis",
            description: "Upload photos, audio, or video. Our AWS SageMaker model provides AI-driven insights.",
            gradient: "from-blue-500 to-cyan-500", // Part of core palette
            delay: "200ms"
        },
        {
            icon: BookOpen,
            title: "Vet-Reviewed Home Care",
            description: "For non-critical issues, get reliable advice from our RAG-powered knowledge base.",
            gradient: "from-emerald-500 to-teal-500", // Used teal instead of green for consistency
            delay: "400ms"
        },
        {
            icon: MapPin,
            title: "Emergency Vet Locator",
            description: "In critical moments, quickly find the nearest emergency veterinary services.",
            gradient: "from-orange-500 to-red-500", // Part of core palette
            delay: "600ms"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-purple-950 to-black text-white relative overflow-hidden selection:bg-teal-500 selection:text-white">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating orbs */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute top-40 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-teal-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '6s' }}></div>

                {/* Mouse follower gradient */}
                <div
                    className="absolute w-96 h-96 bg-gradient-radial from-white/10 to-transparent rounded-full blur-3xl transition-all duration-1000 ease-out pointer-events-none"
                    style={{
                        left: mousePosition.x - 192,
                        top: mousePosition.y - 192,
                    }}
                ></div>
            </div>

            {/* Hero Section */}
            <section className="flex-shrink-0 py-24 md:py-40 relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)]">
                <div className="container mx-auto px-6 text-center">
                    <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <Sparkles className="absolute -top-4 -left-4 text-yellow-300 animate-sparkle" size={28} />
                                <Heart className="text-pink-500 animate-heartbeat" size={60} />
                                <Sparkles className="absolute -bottom-4 -right-4 text-blue-300 animate-sparkle" size={24} />
                            </div>
                        </div>

                        <h1 className="mb-8 text-5xl font-black md:text-7xl lg:text-8xl leading-tight tracking-tight">
                            <span className="relative inline-block">
                                <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent animate-text-glow blur-sm"></span>
                                <span className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                                    Pet Health AI
                                </span>
                            </span>
                        </h1>

                        <div className="space-y-4 mb-14">
                            <p className="text-2xl md:text-3xl font-bold text-gray-100 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                Instant, Intelligent Care for Your Best Friend.
                            </p>
                            <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                                Leveraging advanced AWS generative AI to provide immediate pet health guidance,
                                emergency detection, and multimedia analysis for your peace of mind.
                            </p>
                        </div>

                        <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                            <button
                                onClick={navigateToChat}
                                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 px-10 md:py-6 md:px-12 rounded-full text-lg md:text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out inline-flex items-center overflow-hidden border border-blue-500 hover:border-purple-500"
                            >
                                <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                <MessageCircle size={24} className="mr-3 group-hover:rotate-12 transition-transform duration-300 relative z-10" />
                                <span className="relative z-10">Chat with Pet Health AI</span>
                                <ArrowRight size={24} className="ml-3 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="flex-shrink-0 py-20 relative z-10 bg-gradient-to-b from-transparent via-gray-900/70 to-gray-950">
                <div className="container mx-auto px-6 relative">
                    <h2 className="text-4xl md:text-5xl font-black text-center mb-20 animate-fade-in-up bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                        How We <span className="text-white">Empower</span> You
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {features.map((feature, index) => {
                            const IconComponent = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="group relative animate-fade-in-up hover:animate-none"
                                    style={{ animationDelay: feature.delay }}
                                >
                                    <div className="relative backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 ease-in-out transform hover:-translate-y-3 hover:scale-105 group">
                                        {/* Inner glow effect on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}></div>

                                        <div className="relative z-10">
                                            <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 w-fit mx-auto group-hover:rotate-6 transition-transform duration-300`}>
                                                <IconComponent size={36} className="text-white drop-shadow-lg" />
                                            </div>

                                            <h3 className="text-xl font-bold mb-4 text-center group-hover:text-white transition-colors duration-300">
                                                {feature.title}
                                            </h3>

                                            <p className="text-gray-300 text-center text-sm leading-relaxed group-hover:text-gray-100 transition-colors duration-300">
                                                {feature.description}
                                            </p>
                                        </div>

                                        {/* Hover glow effect (outer) */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 -z-10`}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Impact Statement Section */}
            <section className="flex-shrink-0 py-24 relative z-10 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-teal-900/50 border-t border-b border-white/10">
                <div className="container mx-auto px-6 text-center relative">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-12 md:p-16 shadow-2xl transform hover:scale-[1.01] transition-transform duration-500">
                        <Shield className="mx-auto mb-8 text-teal-300 animate-bounce-slow" size={72} />

                        <h2 className="text-4xl md:text-5xl font-black mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                            Breaking Barriers in Pet Care
                        </h2>

                        <p className="text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed text-gray-200 mb-8">
                            Pet Health AI utilizes next-generation AWS AI and connectivity to make expert pet health guidance accessible to everyone, anytime, anywhere.
                        </p>

                        <p className="text-lg max-w-3xl mx-auto leading-relaxed text-gray-300">
                            We aim to reduce anxiety for pet owners and improve outcomes for pets, demonstrating the real-world impact of combining telecommunications networks and AI.
                        </p>

                        {/* Animated stats */}
                        <div className="grid md:grid-cols-3 gap-8 mt-12">
                            <div className="text-center group">
                                <div className="text-4xl font-black text-blue-400 group-hover:scale-110 transition-transform duration-300 animate-appear">24/7</div>
                                <div className="text-sm text-gray-400">AI Availability</div>
                            </div>
                            <div className="text-center group">
                                <div className="text-4xl font-black text-purple-400 group-hover:scale-110 transition-transform duration-300 animate-appear" style={{ animationDelay: '100ms' }}>Instant</div>
                                <div className="text-sm text-gray-400">Emergency Detection</div>
                            </div>
                            <div className="text-center group">
                                <div className="text-4xl font-black text-teal-400 group-hover:scale-110 transition-transform duration-300 animate-appear" style={{ animationDelay: '200ms' }}>Smart</div>
                                <div className="text-sm text-gray-400">Media Analysis</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="flex-shrink-0 relative z-10 border-t border-white/20 bg-black/30 backdrop-blur-md">
                <div className="container mx-auto px-6 py-12 text-center">
                    <div className="space-y-4">
                        <p className="text-gray-300 text-lg font-semibold">
                            &copy; {new Date().getFullYear()} Pet Health AI
                        </p>
                        <p className="text-sm text-purple-300 font-medium">
                            A project for the AWS Breaking Barriers Virtual Challenge
                        </p>
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                        <p className="text-xs text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            This is a Hackathon project and not a substitute for professional veterinary advice.
                            In case of emergencies, please contact a qualified veterinarian immediately.
                        </p>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.1); opacity: 0.3; }
                }

                @keyframes heartbeat {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                @keyframes sparkle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }

                @keyframes text-glow {
                    0%, 100% { text-shadow: 0 0 5px rgba(255,255,255,0.2), 0 0 10px rgba(59,130,246,0.3); } /* Using blue */
                    50% { text-shadow: 0 0 10px rgba(255,255,255,0.4), 0 0 20px rgba(59,130,246,0.6); } /* Using blue */
                }

                @keyframes appear {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 6s infinite ease-in-out;
                }

                .animate-heartbeat {
                    animation: heartbeat 1.5s infinite ease-in-out;
                }

                .animate-sparkle {
                    animation: sparkle 2s infinite ease-in-out;
                }

                .animate-text-glow {
                    animation: text-glow 3s infinite alternate ease-in-out;
                }

                .animate-appear {
                    animation: appear 0.6s ease-out forwards;
                    opacity: 0;
                }

                .bg-gradient-radial {
                    background: radial-gradient(circle, var(--tw-gradient-stops));
                }
            `}</style>
        </div>
    );
}

export default Home;