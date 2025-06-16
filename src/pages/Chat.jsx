// src/pages/Chat.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader, PawPrint, MessageSquareMore, XCircle, Bot, User, Paperclip } from "lucide-react"; // Added Paperclip
import { fetchAuthSession } from 'aws-amplify/auth'; // Keep this import

// Ensure this matches the Flask app's port (app.py uses 5000)
const API_URL = "http://localhost:5000/api/chat";

function Chat() {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm PetHealth AI. How can I help you and your pet today? You can describe symptoms or upload an image for skin analysis.", sender: "ai", type: "text" } // Updated initial message
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // NEW STATES FOR IMAGE UPLOAD
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null); // Ref for hidden file input

    const messagesEndRef = useRef(null);
    const navigate = useNavigate(); // Removed as per previous discussions for security redirect

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // NEW IMAGE HANDLING FUNCTIONS
    const handleImageFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type and size
            if ((file.type === "image/jpeg" || file.type === "image/png") && file.size <= 5 * 1024 * 1024) { // Max 5MB
                setSelectedImageFile(file);
                const reader = new FileReader();
                reader.onloadend = () => { setImagePreview(reader.result); };
                reader.readAsDataURL(file);
            } else {
                alert("Please select a valid image file (JPEG or PNG, max 5MB).");
                if(fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
            }
        }
    };

    const removeSelectedImage = () => {
        setSelectedImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
    };


    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const trimmedInput = inputValue.trim();
        // Updated validation to check for either text or image
        if (trimmedInput === "" && !selectedImageFile) {
            // You can replace this alert with a more styled message in the UI
            alert("Please type a message or upload an image.");
            return;
        }

        setIsLoading(true);

        // Determine user message text for UI display
        const userMessageText = trimmedInput || (selectedImageFile ? "User uploaded an image for analysis." : "");
        const userMessageForUI = {
            id: Date.now(),
            text: userMessageText,
            sender: "user",
            type: "text", // Using 'text' type for now, can be 'image_upload' if needed for specific styling
            imagePreview: selectedImageFile ? imagePreview : null // Store preview for UI
        };

        // For backend, we need the chat history for context (text only for history)
        const historyForBackend = messages.map(msg => ({
            sender: msg.sender,
            text: msg.text // Only send text content of past messages
        }));

        // Use FormData for sending files and text together
        const formData = new FormData();
        formData.append('message', trimmedInput); // Send actual typed message
        formData.append('chat_history', JSON.stringify(historyForBackend));
        if (selectedImageFile) {
            formData.append('image', selectedImageFile, selectedImageFile.name); // Append the image file
        }

        // Update UI immediately
        setMessages(prevMessages => [...prevMessages, userMessageForUI]);
        setInputValue("");
        if (selectedImageFile) removeSelectedImage(); // Clear image selection after sending

        try {
            // Get the current authenticated user's session using fetchAuthSession
            const { tokens } = await fetchAuthSession();
            const idToken = tokens.idToken.toString();

            const response = await fetch(API_URL, {
                method: 'POST',
                // IMPORTANT: Do NOT set 'Content-Type': 'multipart/form-data' explicitly for FormData.
                // The browser sets it automatically with the correct boundary.
                headers: {
                    'Authorization': `Bearer ${idToken}`
                },
                body: formData, // Send FormData object
            });

            if (!response.ok) {
                let errorData = { error: `HTTP error! status: ${response.status}` };
                try {
                    const backendError = await response.json();
                    if (backendError && backendError.error) {
                        errorData.error = backendError.error;
                    }
                } catch (jsonParseError) {
                    console.warn("Could not parse JSON error response from backend.", jsonParseError);
                }
                throw new Error(errorData.error);
            }

            const data = await response.json();

            // This block correctly handles the new, cleaner backend response
            const aiMessageForDisplay = {
                id: Date.now() + 1,
                text: data.response || "Sorry, I couldn't get a response for that.",
                sender: "ai",
                // Use the 'urgency' field to set the message type for styling
                type: data.urgency === "URGENT" ? "error" : "text",
                urgency: data.urgency,
                additional_data: data.data,
            };
            setMessages(prevMessages => [...prevMessages, aiMessageForDisplay]);

            // 3. UNCOMMENT THIS BLOCK TO ENABLE NAVIGATION ON URGENT ALERTS
            if (data.urgency === "URGENT" && data.data?.navigate_to_emergency_page) {
                navigate('/emergency', { 
                    state: { 
                        initialUrgentMessage: data.response,
                        aiSagemakerAnalysis: data.data?.sagemaker_analysis,
                    }
                });
            }

            // Handle backend response that includes potentially full chat history or single message
            // if (data.chat_history_suggestion && Array.isArray(data.chat_history_suggestion)) {
            //     // This path is for when backend sends back entire updated chat history (from previous old UI)
            //     const newMessages = data.chat_history_suggestion.map((msg, index) => ({
            //         id: msg.id || (Date.now() + Math.random() * 1000 + index),
            //         text: msg.text, sender: msg.sender,
            //         type: msg.urgency ? (msg.urgency === "URGENT" ? "urgent_ai" : "ai_text") : (msg.sender === "ai" ? "ai_text" : "user_text"),
            //         urgency: msg.urgency, additional_data: msg.data
            //     }));
            //     setMessages(newMessages);

            //     // Check for navigation to emergency page (if backend dictates it)
            //     const lastAiMessage = newMessages[newMessages.length - 1];
            //     if (lastAiMessage?.sender === 'ai' && lastAiMessage.urgency === "URGENT" && lastAiMessage.additional_data?.navigate_to_emergency_page) {
            //         // navigate('/emergency', { state: { // Re-enable if you want navigation
            //         //     initialUrgentMessage: lastAiMessage.text,
            //         //     aiSagemakerAnalysis: lastAiMessage.additional_data?.sagemaker_analysis,
            //         // }});
            //     }
            // } else {
            //     // This path is for when backend sends a single message response (from current UI)
            //     const aiMessageForDisplay = {
            //         id: Date.now() + 1,
            //         text: data.response || "Sorry, I couldn't get a response for that.", // Assuming 'response' key from your backend
            //         sender: "ai",
            //         // You might need to add urgency/additional_data from backend if your backend supports it
            //         // type: data.urgency === "URGENT" ? "urgent_ai" : "text",
            //         // urgency: data.urgency,
            //         // additional_data: data.data,
            //         type: "text", // Defaulting to 'text' for now, adapt based on your backend response structure
            //     };
            //     setMessages(prevMessages => [...prevMessages, aiMessageForDisplay]);
            // }

        } catch (error) {
            console.error("Failed to send message or get AI response:", error);
            if (error.name === 'NotSignedInException' || error.message === 'The user is not authenticated') {
                const errorMessage = {
                    id: Date.now() + 1,
                    text: "Your session has expired or you are not logged in. Please log in again to chat.",
                    sender: "ai",
                    type: "error"
                };
                setMessages(prevMessages => [...prevMessages, errorMessage]);
            } else {
                const errorMessage = {
                    id: Date.now() + 1,
                    text: `Error: ${error.message || "Could not connect to PetHealth AI services. Please try again later."}`,
                    sender: "ai",
                    type: "error"
                };
                setMessages(prevMessages => [...prevMessages, errorMessage]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            { id: Date.now(), text: "Hello! I'm PetHealth AI. How can I help you and your pet today? You can describe symptoms or upload an image for skin analysis.", sender: "ai", type: "text" }
        ]);
    };

    const formatMessage = (text) => {
        if (typeof text !== 'string') {
            console.warn("formatMessage received non-string text:", text);
            return "";
        }
        return text.split('\n').map((item, key) => (
            <React.Fragment key={key}>
                {item}
                {key < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] relative overflow-hidden
                        bg-gradient-to-br from-gray-950 via-gray-900 to-black
                        text-white selection:bg-teal-500 selection:text-white">

            {/* Unique Animated Background Overlay: Neural Net / Data Flow */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="w-full h-full bg-ai-grid-pattern animate-ai-pulse"></div>
                {/* Subtle animated particles/nodes using core colors */}
                <div className="absolute inset-0 w-full h-full bg-gradient-radial from-blue-500/10 via-transparent to-transparent animate-zoom-fade-out" style={{ animationDelay: '0s' }}></div>
                <div className="absolute inset-0 w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent animate-zoom-fade-out" style={{ animationDelay: '2s' }}></div>
            </div>


            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto relative z-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6 py-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-message-converge`}
                        >
                            <div
                                className={`max-w-[75%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[50%] p-4 rounded-xl shadow-lg border-2
                                    relative overflow-hidden group
                                    ${message.sender === "user"
                                      ? "bg-gradient-to-tr from-blue-700 to-purple-800 border-blue-500 text-white rounded-tl-3xl rounded-br-lg"
                                      : message.type === "error"
                                        ? "bg-red-900/80 text-red-300 border-red-600 rounded-br-3xl rounded-tl-lg"
                                        : "bg-gray-800/80 text-gray-200 border-gray-700 rounded-br-3xl rounded-tl-lg"
                                    } transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
                            >
                                {/* Inner glowing border on hover - uses primary AI gradient colors */}
                                <div className={`absolute inset-0 rounded-xl pointer-events-none
                                    ${message.sender === "user" ? "border-blue-300" : "border-teal-300"}
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 `}
                                    style={{ borderWidth: '2px', animation: `glow-border 1.5s infinite alternate ${message.sender === "user" ? '0.1s' : '0.3s'} ease-in-out` }}
                                ></div>

                                {message.sender === "ai" && (
                                    <div className="flex items-center mb-2">
                                        {message.type === "error" ? (
                                            <XCircle className="h-5 w-5 mr-2 text-red-500" />
                                        ) : (
                                            <Bot className="h-5 w-5 mr-2 text-teal-400 animate-pulse-light" />
                                        )}
                                        <span className={`text-xs font-semibold ${message.type === "error" ? "text-red-400" : "text-teal-300"}`}>
                                            PetHealth AI
                                        </span>
                                    </div>
                                )}
                                {message.sender === "user" && (
                                    <div className="flex items-center mb-2 justify-end">
                                        <span className="text-xs font-semibold text-blue-300 mr-2">You</span>
                                        <User className="h-5 w-5 text-blue-400" />
                                    </div>
                                )}
                                {/* Display image preview if it's a user image message */}
                                {message.sender === "user" && message.imagePreview && (
                                    <img src={message.imagePreview} alt="Uploaded pet concern" className="max-w-xs max-h-48 my-2 rounded-md border border-gray-700"/>
                                )}
                                <div className="prose prose-sm max-w-none text-sm leading-relaxed text-shadow-sm">
                                  {formatMessage(message.text)}
                                </div>
                                {/* AI Image Analysis Insights (if your backend returns it) */}
                                {message.sender === "ai" && message.additional_data?.sagemaker_analysis?.summary && message.additional_data.sagemaker_analysis.summary.indexOf("No image") === -1 && (
                                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs italic text-gray-400">
                                        <p className="font-semibold text-teal-300">AI Image Analysis Insights:</p>
                                        <p>{message.additional_data.sagemaker_analysis.summary}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start animate-message-converge">
                            <div className="bg-gray-800/80 text-gray-200 border border-gray-700 p-4 rounded-xl rounded-br-3xl rounded-tl-lg shadow-xl animate-pulse-bubble">
                                <div className="flex flex-col">
                                    <div className="flex items-center mb-2">
                                        <Bot className="h-5 w-5 mr-2 text-teal-400 animate-pulse-light" />
                                        <span className="text-xs font-semibold text-teal-300">PetHealth AI</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="thinking-dots">
                                            <span className="dot dot-1"></span>
                                            <span className="dot dot-2"></span>
                                            <span className="dot dot-3"></span>
                                        </div>
                                        <span className="text-sm text-gray-400">Processing...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 border-t border-gray-800 p-4 bg-gradient-to-t from-gray-950/90 to-gray-900/90 backdrop-blur-md shadow-2xl z-20">
                <div className="max-w-3xl mx-auto relative">
                    {/* Image Preview Area - Integrated into new design */}
                    {imagePreview && (
                        <div className="mb-3 p-3 bg-gray-800/70 border border-gray-700 rounded-lg relative flex items-center justify-between shadow-inner animate-fade-in-up">
                            <div className="flex items-center overflow-hidden">
                                <img src={imagePreview} alt="Selected preview" className="h-14 w-14 object-cover rounded-md mr-3 border border-gray-600"/>
                                <span className="text-sm text-gray-300 truncate font-mono">{selectedImageFile?.name}</span>
                            </div>
                            <button onClick={removeSelectedImage} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <XCircle size={20}/>
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder={imagePreview ? "Add a message with your image..." : "Query the AI or upload an image..."} // Dynamic placeholder
                            className="flex-1 bg-gray-800/70 border border-gray-700 rounded-full px-5 py-3 text-sm text-white placeholder-gray-400
                                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner
                                       hover:border-blue-400 animate-input-glow"
                            disabled={isLoading}
                            aria-label="Chat input"
                        />
                        {/* Paperclip Button for Image Upload */}
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-700/60 hover:bg-gray-600/70 text-gray-300 rounded-full cursor-pointer shadow-md transition-colors transform hover:scale-105" aria-label="Attach image">
                            <Paperclip size={20} />
                        </button>
                        <input id="image-upload" type="file" accept="image/jpeg, image/png" onChange={handleImageFileChange} className="hidden" ref={fileInputRef} />

                        <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white p-3 rounded-full flex items-center justify-center
                                       disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-105 active:scale-95 animate-button-pulse"
                            disabled={isLoading || (inputValue.trim() === "" && !selectedImageFile)}
                            aria-label="Send message"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                    <div className="text-xs text-gray-500 mt-2 text-center px-2 opacity-80">
                        AI responses are informational and not a substitute for professional veterinary advice.
                    </div>
                    <button onClick={clearChat} className="mt-3 text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors flex items-center mx-auto">
                        <MessageSquareMore size={14} className="inline-block mr-1 text-blue-400" /> Reset Session
                    </button>
                </div>
            </div>

            {/* Custom Styles for animations and unique elements */}
            <style>{`
                /* AI Grid Pattern Background */
                .bg-ai-grid-pattern {
                    background-image:
                        linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px), /* blue-500 */
                        linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px); /* blue-500 */
                    background-size: 40px 40px;
                    animation: pan-background 90s linear infinite;
                }

                /* Background Panning Animation */
                @keyframes pan-background {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 100% 100%; }
                }

                /* Particle Zoom Fade Out */
                @keyframes zoom-fade-out {
                    0% { transform: scale(0.1); opacity: 0; }
                    50% { transform: scale(1); opacity: 0.1; }
                    100% { transform: scale(2); opacity: 0; }
                }
                .animate-zoom-fade-out {
                    animation: zoom-fade-out 4s linear infinite;
                }

                /* Message Converge Entry Animation */
                @keyframes message-converge {
                    0% { opacity: 0; transform: translateY(15px) scale(0.95); filter: blur(3px); }
                    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                }
                .animate-message-converge {
                    animation: message-converge 0.4s ease-out forwards;
                }
                
                /* Fade In Up animation for image preview */
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }


                /* Inner Glow Border on Message Cards */
                @keyframes glow-border {
                    0%, 100% { filter: brightness(1) drop-shadow(0 0 2px rgba(59, 130, 246, 0.4)); } /* blue-500 */
                    50% { filter: brightness(1.2) drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)); } /* blue-500 */
                }

                /* Thinking Dots Animation */
                @keyframes dot-blink {
                    0%, 80%, 100% { transform: scale(0); opacity: 0; }
                    40% { transform: scale(1); opacity: 1; }
                }
                .thinking-dots .dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background-color: #60a5fa; /* blue-400 */
                    border-radius: 50%;
                    margin: 0 2px;
                    animation: dot-blink 1.2s infinite ease-in-out both;
                }
                .thinking-dots .dot-1 { animation-delay: 0s; }
                .thinking-dots .dot-2 { animation-delay: 0.2s; }
                .thinking-dots .dot-3 { animation-delay: 0.4s; }

                /* Icon Pulse Light */
                @keyframes pulse-light {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.95); }
                }
                .animate-pulse-light {
                    animation: pulse-light 2s infinite ease-in-out;
                }

                /* Input Field Glow */
                @keyframes input-glow {
                    0%, 100% { box-shadow: 0 0 0px rgba(0,0,0,0), inset 0 0 0px rgba(0,0,0,0); }
                    50% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.4), inset 0 0 8px rgba(59, 130, 246, 0.2); } /* blue-500 */
                }
                .animate-input-glow {
                    animation: input-glow 4s infinite alternate ease-in-out;
                }

                /* Button Pulse */
                @keyframes button-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                    50% { transform: scale(1.02); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4); } /* indigo-500 or blue-700 */
                }
                .animate-button-pulse {
                    animation: button-pulse 3s infinite ease-in-out;
                }

                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.5); /* blue-500 with transparency */
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.7);
                }
            `}</style>
        </div>
    );
}

export default Chat;