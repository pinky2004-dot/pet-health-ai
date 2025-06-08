// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import MainLayout from './layouts/MainLayout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Chat from './pages/Chat.jsx';
import Emergency from './pages/Emergency.jsx';
import AuthPage from './pages/AuthPage.jsx';
import WelcomeUser from './pages/WelcomeUser.jsx';
// Corrected Imports for Amplify Auth functions
import { signOut, fetchAuthSession } from 'aws-amplify/auth';
// Also ensure Amplify is imported at the top level for general configuration
import { Amplify } from 'aws-amplify'; // Add this line if not already there, ensures Amplify is configured properly


// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loadingAuth, setLoadingAuth] = React.useState(true);
  const navigate = useNavigate(); // Initialize useNavigate here

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        await fetchAuthSession(); // This attempts to get the current session
        setIsAuthenticated(true);
      } catch (error) {
        // If fetchAuthSession throws an error, it means no active session
        console.log("No authenticated session found. Redirecting to auth page:", error);
        setIsAuthenticated(false); // Ensure this is false
        // Immediately navigate to the auth page if not authenticated
        navigate('/auth', { replace: true });
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]); // Add navigate to dependency array for useEffect

  if (loadingAuth) {
    // Show a loading spinner or message while checking auth status
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950 to-black text-white">
        <div className="flex items-center text-xl">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Verifying authentication...
        </div>
      </div>
    );
  }

  // If we reach here and isAuthenticated is false, it means checkAuth already redirected,
  // or there was a very rare race condition. The primary redirect happens inside checkAuth.
  // This Navigate will act as a fallback, though it ideally won't be hit if checkAuth redirects.
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

function App() {
  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      window.location.href = '/'; // Simple full page reload to clear state
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/about" element={<MainLayout><About /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
        <Route path="/auth" element={<MainLayout><AuthPage /></MainLayout>} />
        <Route path="/welcome" element={<MainLayout><WelcomeUser /></MainLayout>} />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <MainLayout><Chat /></MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/emergency"
          element={
            <PrivateRoute>
              <MainLayout><Emergency /></MainLayout>
            </PrivateRoute>
          }
        />

        {/* Add a logout route or button on protected pages/navbar */}
         <Route path="/logout" element={<MainLayout><LogoutPage onLogout={handleLogout} /></MainLayout>} />
      </Routes>
    </Router>
  );
}

const LogoutPage = ({ onLogout }) => {
    React.useEffect(() => {
        onLogout(); // Call logout function when component mounts
    }, [onLogout]);
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950 to-black text-white p-4">
            <h1 className="text-3xl font-bold text-center">Logging you out...</h1>
        </div>
    );
};

export default App;