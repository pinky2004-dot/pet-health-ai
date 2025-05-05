import React from "react";
import Navbar from "../components/Navbar";

const MainLayout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default MainLayout;