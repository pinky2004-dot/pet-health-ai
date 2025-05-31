// src/pages/About.jsx
import React from "react";
import { Zap, BrainCircuit, ShieldCheck, Wifi, Heart, Users, Lightbulb } from "lucide-react";

const About = () => {
    return (
        <div className="py-12 md:py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 text-gray-800 selection:bg-teal-500 selection:text-white min-h-screen flex flex-col">
            <div className="container mx-auto px-6 flex-grow">
                <header className="text-center mb-16 md:mb-20 animate-fade-in-down">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-teal-700 drop-shadow-md">
                        About Pet Health AI
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed opacity-90">
                        Empowering pet owners with accessible, AI-driven health insights to ensure pets live healthier, happier lives.
                    </p>
                </header>

                {/* Our Mission & The Challenge */}
                <section className="grid md:grid-cols-2 gap-12 mb-16 md:mb-20 items-center p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/80 animate-fade-in">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-4 text-emerald-600 flex items-center">
                                <Heart size={32} className="mr-3 text-pink-500 animate-pulse-sm" />
                                Our Mission
                            </h2>
                            <p className="text-lg leading-relaxed text-gray-700">
                                To be the leading AI companion for proactive pet wellness, bridging the gap between pet owners and veterinary care through innovative technology.
                            </p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-4 text-red-500 flex items-center">
                                <Lightbulb size={32} className="mr-3 text-yellow-500 animate-glow" />
                                The Challenge We Address
                            </h2>
                            <p className="text-lg leading-relaxed text-gray-700">
                                Pet owners often face uncertainty when pets show signs of illness. Is it an emergency? Can it be managed at home? Pet Health AI provides immediate, reliable guidance, reducing anxiety and improving access to care.
                            </p>
                        </div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-200 to-purple-200 rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-300"> {/* Used blue/purple gradient */}
                        <img src="https://d23ltuj4aaogm5.cloudfront.net/wp-content/uploads/2021/04/4-27-21-Property-Managers-Take-Note-Happy-Pet-Owners-Mean-Happy-Long-Term-Residents.png" alt="Pet Health AI Concept" className="rounded-xl shadow-lg mx-auto border-4 border-white" />
                        <p className="mt-4 text-sm text-gray-600 italic">Visualizing a healthier future for pets, together.</p>
                    </div>
                </section>


                {/* Our Solution: Powered by AWS */}
                <section className="mb-16 md:mb-20 p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/80 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-teal-700">
                        Innovative Pet Care, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Powered by AWS</span> {/* Changed orange to blue for consistency */}
                    </h2>

                    {/* Simplified Flow Diagram */}
                    <div className="text-center mb-12 p-6 bg-white rounded-2xl shadow-lg max-w-4xl mx-auto border border-gray-200 animate-slide-in-up">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Our AI Workflow</h3>
                        <p className="text-md text-gray-700 leading-relaxed font-mono text-sm md:text-base">
                            User Input (Text/Media) <span className="text-teal-500 font-bold mx-1">&rarr;</span>
                            <BrainCircuit className="inline h-6 w-6 text-purple-600 mx-1 animate-pulse-sm"/> Amazon Bedrock (Triage & NLP) <span className="text-teal-500 font-bold mx-1">&rarr;</span>
                            <span className="block md:inline mt-2 md:mt-0">
                                [ Emergency Path <span className="text-red-500 font-bold mx-1">&rarr;</span> Vet Locator |
                                Non-Emergency <span className="text-emerald-500 font-bold mx-1">&rarr;</span>
                                <BrainCircuit className="inline h-6 w-6 text-blue-600 mx-1 animate-pulse-sm"/> Amazon SageMaker (Media Analysis) + RAG Knowledge Base ] {/* Changed orange to blue */}
                            </span>
                            <span className="text-teal-500 font-bold mx-1">&rarr;</span> AI Response
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="p-8 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-[1.01] border border-gray-100 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <div className="p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-5 shadow-inner">
                                <Zap size={32} className="text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3 text-gray-900">Amazon Bedrock</h3>
                            <p className="text-sm leading-relaxed text-gray-700">
                                We use Amazon Bedrock for sophisticated natural language understanding and real-time emergency classification, ensuring users get to the right care path quickly.
                            </p>
                        </div>
                        <div className="p-8 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-[1.01] border border-gray-100 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
                            <div className="p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-5 shadow-inner"> {/* Changed orange to blue */}
                                <BrainCircuit size={32} className="text-blue-600" /> {/* Changed orange to blue */}
                            </div>
                            <h3 className="text-2xl font-semibold mb-3 text-gray-900">Amazon SageMaker</h3>
                            <p className="text-sm leading-relaxed text-gray-700">
                                Custom models on Amazon SageMaker analyze uploaded images, audio, or video, offering deeper AI-driven insights into your pet's symptoms.
                            </p>
                        </div>
                        <div className="p-8 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-[1.01] border border-gray-100 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                             <div className="p-3 bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mb-5 shadow-inner"> {/* Changed green to emerald */}
                                <ShieldCheck size={32} className="text-emerald-600" /> {/* Changed green to emerald */}
                            </div>
                            <h3 className="text-2xl font-semibold mb-3 text-gray-900">RAG Architecture</h3>
                            <p className="text-sm leading-relaxed text-gray-700">
                                Our non-emergency advice is powered by a Retrieval Augmented Generation (RAG) system, grounding information in a curated veterinary knowledge base.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Connectivity Section */}
                <section className="mb-16 md:mb-20 p-8 md:p-12 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl shadow-2xl transform hover:scale-[1.01] transition-transform duration-300 animate-fade-in" style={{ animationDelay: '750ms' }}>
                    <h2 className="text-3xl font-bold text-center mb-6 drop-shadow-md">Built for a <span className="underline decoration-blue-300 decoration-4">Connected</span> World</h2> {/* Changed sky to blue */}
                    <div className="flex flex-col md:flex-row items-center justify-center text-center md:text-left">
                        <Wifi size={70} className="text-blue-300 mr-0 md:mr-6 mb-4 md:mb-0 animate-bounce-slow" /> {/* Changed sky to blue */}
                        <p className="text-lg leading-relaxed max-w-2xl opacity-90 drop-shadow-sm">
                            Our platform's ability to handle rich media uploads (images, audio, video) leverages robust connectivity (like 5G) for faster, more detailed AI consultations, showcasing how telecommunications and AI work together for better accessibility.
                        </p>
                    </div>
                </section>

                {/* Hackathon Statement */}
                <div className="text-center p-8 bg-emerald-700 text-white rounded-xl shadow-xl border border-emerald-600 animate-fade-in" style={{ animationDelay: '900ms' }}>
                    <h3 className="text-2xl font-semibold mb-3 drop-shadow-md">AWS Breaking Barriers Virtual Challenge</h3>
                    <p className="text-md leading-relaxed max-w-3xl mx-auto opacity-90">
                        Pet Health AI is a proud submission aiming to create a solution with measurable real-world impact in healthcare by making pet wellness more accessible through cutting-edge AWS technology.
                    </p>
                </div>
            </div>
            {/* Footer added to About page for consistency */}
            <footer className="mt-16 md:mt-24 border-t border-gray-200 bg-white shadow-inner">
                <div className="container mx-auto px-6 py-8 text-center">
                    <p className="text-sm text-gray-600 mb-1">
                        &copy; {new Date().getFullYear()} Pet Health AI.
                        A project for the AWS Breaking Barriers Virtual Challenge.
                    </p>
                    <p className="text-xs text-gray-500">
                        This is a Hackathon project and not a substitute for professional veterinary advice.
                        In case of emergencies, please contact a qualified veterinarian immediately.
                    </p>
                </div>
            </footer>
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-sm {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                @keyframes glow {
                    0%, 100% { filter: drop-shadow(0 0 4px rgba(253, 224, 71, 0.5)); }
                    50% { filter: drop-shadow(0 0 10px rgba(253, 224, 71, 0.8)); }
                }
                @keyframes slide-in-up {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .animate-fade-in { animation: fade-in 0.8s ease-out forwards; opacity: 0; }
                .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; opacity: 0; }
                .animate-fade-in-up { animation: fade-in-up 0.7s ease-out forwards; opacity: 0; }
                .animate-pulse-sm { animation: pulse-sm 2s infinite ease-in-out; }
                .animate-glow { animation: glow 2s infinite alternate; }
                .animate-slide-in-up { animation: slide-in-up 0.8s ease-out forwards; opacity: 0; }
                .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
            `}</style>
        </div>
    );
}

export default About;