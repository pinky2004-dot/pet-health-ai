import React from "react";

function Navbar() {
    return (
        <div>
            <nav className="bg-purple-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <img
                                    className="h-8  w-8"
                                    src="#"
                                    alt="Logo"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default Navbar;