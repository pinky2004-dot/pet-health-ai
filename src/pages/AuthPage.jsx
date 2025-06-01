// src/pages/AuthPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle, XCircle } from "lucide-react";
// Corrected Imports for Amplify Auth functions
import { signIn, signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
// Also ensure Amplify is imported at the top level for general configuration
import { Amplify } from 'aws-amplify'; // Add this line if not already there, ensures Amplify is configured properly


const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [showVerification, setShowVerification] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [authError, setAuthError] = useState("");
    const [authSuccess, setAuthSuccess] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        setAuthError("");
        setAuthSuccess("");
        setFirstName("");
        setLastName("");
    }, [isLogin]);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setAuthError("");
        setAuthSuccess("");

        if (isLogin) {
            try {
                const user = await signIn({ username: email, password });
                console.log("Logged in user:", user);
                setAuthSuccess("Login successful! Redirecting...");
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userEmail', email);
                navigate("/welcome");
            } catch (error) {
                console.error("Login error:", error);
                if (error.name === 'UserNotConfirmedException') {
                    setAuthError("Account not confirmed. Please verify your email or resend code.");
                    setShowVerification(true);
                } else if (error.name === 'UserNotFoundException' || error.name === 'NotAuthorizedException') {
                    setAuthError("Invalid email or password.");
                } else {
                    setAuthError(error.message || "An unknown error occurred during login.");
                }
            }
        } else { // Sign Up
            if (password !== confirmPassword) {
                setAuthError("Passwords do not match.");
                return;
            }
            try {
                const { user } = await signUp({
                    username: email,
                    password,
                    options: {
                        userAttributes: {
                            email,
                            given_name: firstName,
                            family_name: lastName,
                        },
                    },
                    // attributes: {
                    //     email,
                    //     // NEW: Add name.formatted attribute here
                    //     // Cognito expects "name" as the attribute key for 'name.formatted'
                    //     // You might need to adjust this key based on your exact Cognito setup.
                    //     // Common standard attributes are 'given_name', 'family_name', 'preferred_username'.
                    //     // If it truly expects 'name.formatted', sending it as 'name' might work,
                    //     // or you might have to map it to a different standard attribute.
                    //     // Let's try `name` first, as Cognito often implicitly maps this.
                    //     given_name: firstName,
                    //     family_name: lastName,
                    // }
                });
                console.log("Signed up user:", user);
                setAuthSuccess("Sign up successful! Please check your email for a verification code.");
                setShowVerification(true);
            } catch (error) {
                console.error("Sign up error:", error);
                if (error.name === 'UsernameExistsException') {
                    setAuthError("An account with this email already exists. Please log in or reset password.");
                } else if (error.name === 'InvalidPasswordException') {
                    setAuthError(error.message);
                } else {
                    setAuthError(error.message || "An unknown error occurred during sign up.");
                }
            }
        }
    };

    const handleConfirmSignUp = async (e) => {
        e.preventDefault();
        setAuthError("");
        setAuthSuccess("");
        try {
            await confirmSignUp({ username: email, confirmationCode: verificationCode });
            setAuthSuccess("Account confirmed successfully! You can now log in.");
            setShowVerification(false);
            setIsLogin(true);
            setEmail("");
            setPassword("");
            setVerificationCode("");
        } catch (error) {
            console.error("Confirmation error:", error);
            setAuthError(error.message || "Failed to confirm account. Please try again.");
        }
    };

    const handleResendCode = async () => {
        setAuthError("");
        setAuthSuccess("");
        try {
            await resendSignUpCode({ username: email });
            setAuthSuccess("Verification code sent to your email again!");
        } catch (error) {
            console.error("Resend code error:", error);
            setAuthError(error.message || "Failed to resend code.");
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white p-4 selection:bg-teal-500 selection:text-white">
            <div className="bg-gray-800/70 backdrop-blur-lg p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 animate-fade-in-down">
                <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                    {isLogin ? "Welcome Back!" : "Join PetHealth AI"}
                </h2>

                {authError && (
                    <div className="bg-red-900/40 border border-red-600 text-red-300 p-3 rounded-lg mb-4 flex items-center animate-fade-in">
                        <XCircle size={20} className="mr-2" />
                        {authError}
                    </div>
                )}
                {authSuccess && (
                    <div className="bg-green-900/40 border border-green-600 text-green-300 p-3 rounded-lg mb-4 flex items-center animate-fade-in">
                        <CheckCircle size={20} className="mr-2" />
                        {authSuccess}
                    </div>
                )}

                {!showVerification ? (
                    <form onSubmit={handleAuthAction} className="space-y-5">
                        {!isLogin && (
                            <>
                                <div className="relative">
                                    <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all"
                                    />
                                </div>
                            </>
                        )}
                        <div className="relative">
                            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all"
                            />
                        </div>
                        {!isLogin && (
                            <div className="relative">
                                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all"
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center py-3 px-4 rounded-lg font-semibold
                                       bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800
                                       text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={authSuccess !== ""}
                        >
                            {isLogin ? <><LogIn size={20} className="mr-2"/> Login</> : <><UserPlus size={20} className="mr-2"/> Sign Up</>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirmSignUp} className="space-y-5">
                        <p className="text-center text-gray-300">Enter the verification code sent to {email}</p>
                        <div className="relative">
                            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Verification Code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center py-3 px-4 rounded-lg font-semibold
                                       bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800
                                       text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            // MODIFIED DISABLED CONDITION:
                            // The button should be disabled if verificationCode is empty OR if there's a success message from *signing up*
                            // but NOT if the user is actively entering the code.
                            // Better: Disable if the code input is empty.
                            disabled={verificationCode.trim() === ""}
                        >
                            Confirm Account
                        </button>
                        <button
                            type="button"
                            onClick={handleResendCode}
                            className="w-full text-center text-blue-400 hover:text-blue-300 transition-colors mt-3"
                        >
                            Resend Code
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setShowVerification(false);
                            setEmail("");
                            setPassword("");
                            setConfirmPassword("");
                            setVerificationCode("");
                            setFirstName("");
                            setLastName("");
                            setAuthError("");
                            setAuthSuccess("");
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                        {isLogin ? "Need an account? Sign Up" : "Already have an account? Log In"}
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-down { animation: fade-in-down 0.7s ease-out forwards; opacity: 0; }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; opacity: 0; }
            `}</style>
        </div>
    );
};

export default AuthPage;