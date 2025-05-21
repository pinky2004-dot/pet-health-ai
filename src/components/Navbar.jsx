import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Send, X, Loader, PawPrint } from "lucide-react";

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side */}
                    {/* <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <img className="h-8 w-8" src="#" alt="Logo" />
                            <PawPrint className="h-4 w-4 mr-1 text-blue-500" />
                        </div>
                    </div> */}
                    <div className="flex items-center">
                        <PawPrint className="h-8 w-8 text-blue-500" />
                        <span className="ml-2 text-xl font-semibold text-blue-500">PetHealth AI</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link to="/" className="hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                                Home
                            </Link>
                            <Link to="/chat" className="hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                                Chat
                            </Link>
                            <Link to="/emergency" className="hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                                Emergency
                            </Link>
                            <Link to="/about" className="hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                                About
                            </Link>
                            <Link to="/contact" className="hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                                Contact
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-300 hover:text-white focus:outline-none"
                        >
                            {isOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-gray-800">
                    <Link to="/" className="hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                        Home
                    </Link>
                    <Link to="/chat" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Chat
                    </Link>
                    <Link to="/emergency" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Emergency
                    </Link>
                    <Link to="/about" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        About
                    </Link>
                    <Link to="/contact" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Contact
                    </Link>
                </div>
            )}
        </nav>
    );
}

export default Navbar;