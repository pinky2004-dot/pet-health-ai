import React from "react";
import Navbar from "../components/Navbar";

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen"> {/* Ensure the layout itself takes full height */}
      <Navbar />
      {/* Removed container classes from main to allow children to fill the width */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;