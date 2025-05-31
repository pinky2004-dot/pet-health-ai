// src/pages/Contact.jsx
import React, { useState } from "react";
import { Mail, Github, AlertTriangle, Send, ExternalLink } from "lucide-react";

const Contact = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage("");
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, you'd send this data to a backend service
        console.log("Form submitted:", formData);

        setIsSubmitting(false);
        setSubmitMessage("Thank you for your message! We'll be in touch soon. (Demo)");
        setFormData({ name: "", email: "", subject: "", message: "" });

        setTimeout(() => setSubmitMessage(""), 5000); // Clear message after 5 seconds
    };

    return (
        <div className="py-12 md:py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 selection:bg-teal-500 selection:text-white min-h-screen flex flex-col">
            <div className="container mx-auto px-6 flex-grow">
                <header className="text-center mb-12 md:mb-16 animate-fade-in-down">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-teal-700 drop-shadow-md">
                        Get in Touch
                    </h1>
                    <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto opacity-90">
                        We'd love to hear from you! Whether you have a question, feedback, or just want to say hello.
                    </p>
                </header>

                <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-xl shadow-2xl border border-white/90 animate-zoom-in">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
                                   className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all bg-white hover:border-teal-400"/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required
                                   className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all bg-white hover:border-teal-400"/>
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} required
                                   className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all bg-white hover:border-teal-400"/>
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea name="message" id="message" rows="5" value={formData.message} onChange={handleChange} required
                                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all resize-none bg-white hover:border-teal-400"></textarea>
                        </div>
                        <div>
                            <button type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center py-3 px-6 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 disabled:bg-gray-400">
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} className="mr-2" /> Send Message
                                    </>
                                )}
                            </button>
                        </div>
                        {submitMessage && (
                            <p className={`text-sm mt-4 p-3 rounded-md animate-fade-in ${submitMessage.includes("Thank you") ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                                {submitMessage}
                            </p>
                        )}
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-200 animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Mail size={22} className="mr-3 text-blue-600" /> Other Ways to Reach Us
                        </h3>
                        <p className="text-gray-700 mb-3">
                            For support or inquiries: <a href="mailto:support@pethealthai.example.com" className="text-teal-600 hover:text-teal-700 hover:underline transition-colors font-medium">support@pethealthai.example.com</a>
                        </p>
                        <p className="text-gray-700">
                            <a href="https://github.com/pinky2004-dot/pet-health-ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-teal-600 hover:text-teal-700 hover:underline transition-colors group font-medium">
                                <Github size={20} className="mr-2" /> View our Project on GitHub
                                <ExternalLink size={16} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"/>
                            </a>
                        </p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-12 md:mt-16 max-w-3xl mx-auto p-6 bg-amber-100 border-l-4 border-amber-500 text-amber-800 rounded-lg shadow-md animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-amber-900">Important Disclaimer</h3>
                            <p className="mt-1 text-sm leading-relaxed">
                                Pet Health AI provides general guidance and is not a substitute for professional veterinary advice, diagnosis, or treatment. For emergencies or serious conditions, please contact a qualified veterinarian immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <footer className="mt-12 md:mt-20 border-t border-gray-200 bg-white shadow-inner">
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
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes zoom-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; opacity: 0; }
                .animate-zoom-in { animation: zoom-in 0.7s ease-out forwards; opacity: 0; }
                .animate-fade-in { animation: fade-in 0.6s ease-out forwards; opacity: 0; }
            `}</style>
        </div>
    );
}

export default Contact;