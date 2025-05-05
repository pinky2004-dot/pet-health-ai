import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from './layouts/MainLayout.jsx';
import Home from './pages/Home.jsx'
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Chat from './pages/Chat.jsx';
import Emergency from './pages/Emergency.jsx';

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
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path='/chat' element={<MainLayout><Chat /></MainLayout>} />
        <Route path='/emergency' element={<MainLayout><Emergency /></MainLayout>} />
        <Route path="/about" element={<MainLayout><About /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
      </Routes>
    </Router>
    //<>
      //<RouterProvider router={router} />
    //</>
  );
}

export default App;
