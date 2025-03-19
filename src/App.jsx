import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
//import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import Home from './pages/Home.jsx'
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';

/**
  const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<Header />}>
      <Route index element={<Home />} />
    </Route>
  )
)
*/

function App({routes}) {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
    //<>
      //<RouterProvider router={router} />
    //</>
  );
}

export default App;
