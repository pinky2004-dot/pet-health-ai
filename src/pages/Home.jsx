import React from "react";
import Navbar from "../components/Navbar";

const Home = () => {
    return(
        <div>
            <Navbar />
            <h1 className="text-3xl font-bold text-center mt-6">
                This is the home page!
            </h1>
        </div>
    );
} 

export default Home;