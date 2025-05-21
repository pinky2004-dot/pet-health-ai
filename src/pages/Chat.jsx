import React, { useState, useRef, useEffect } from "react";
import { Send, Loader, PawPrint } from "lucide-react";

// Ensure this matches the Flask app's port (app.py uses 5000)
const API_URL = "http://localhost:5000/api/chat"; 

function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm PetHealth AI. How can I help you and your pet today?", sender: "ai", type: "text" } // Added type for consistency
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => { // Made handleSubmit async for await fetch
    if (e) e.preventDefault();
    
    const trimmedInput = inputValue.trim();
    if (trimmedInput === "") return;
    
    const userMessage = {
      id: Date.now(),
      text: trimmedInput,
      sender: "user", // 'user' for human messages
      type: "text"    // Added type
    };
    
    // Update UI immediately with user's message
    // Use functional update to ensure I have the latest messages state if updates are rapid
    const updatedMessagesForUI = [...messages, userMessage];
    setMessages(updatedMessagesForUI);
    setInputValue("");
    setIsLoading(true);
    
    // Preparing chat history for the backend
    // Send all messages *before* the current userMessage was added to the UI list for this turn.
    // The backend expects a list of objects: { sender: "user" or "ai", text: "..." }
    // I map over the 'messages' state *before* adding the current userMessage to it for the API call.
    const historyForBackend = messages.map(msg => ({
        sender: msg.sender, // 'user' or 'ai'
        text: msg.text
    }));
    // To exclude the very first greeting message from history unless user has replied:
    // const historyPayload = messages.length > 1 ? messages.map(m => ({ sender: m.sender, text: m.text })) : [];

    try {
      const response = await fetch(API_URL, { // Using await
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send current message AND the history
        body: JSON.stringify({ 
            message: trimmedInput, // The new message text
            chat_history: historyForBackend // The history *before* this new message
        }),
      });

      if (!response.ok) {
        // Try to parse a JSON error response from the backend
        let errorData = { error: `HTTP error! status: ${response.status}` }; // Default error
        try {
            const backendError = await response.json();
            if (backendError && backendError.error) {
                errorData.error = backendError.error;
            }
        } catch (jsonParseError) {
            // If backend doesn't send JSON error, stick with HTTP status
            console.warn("Could not parse JSON error response from backend.", jsonParseError);
        }
        throw new Error(errorData.error);
      }

      const data = await response.json();
      
      const aiResponse = {
        id: Date.now() + 1, 
        // The backend (app.py) sends the reply in a key named "response"
        text: data.response || "Sorry, I couldn't get a response for that.", 
        sender: "ai", // 'ai' for assistant messages
        type: "text" // Added type
      };
      // Add AI response to the messages list
      setMessages(prevMessages => [...prevMessages, aiResponse]);

    } catch (error) {
      console.error("Failed to send message or get AI response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `Error: ${error.message || "Could not connect to PetHealth AI services. Please try again later."}`,
        sender: "ai",
        type: "error" // Custom type for styling error messages differently if desired
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear chat - useful for testing memory
  const clearChat = () => {
    setMessages([
      { id: Date.now(), text: "Hello! I'm PetHealth AI. How can I help you and your pet today?", sender: "ai", type: "text" }
    ]);
  };

  const formatMessage = (text) => {
    if (typeof text !== 'string') {
        console.warn("formatMessage received non-string text:", text);
        return ""; // Or handle appropriately
    }
    // Simple new line handling. For markdown, I'd use a library like 'react-markdown'.
    return text.split('\n').map((item, key) => (
        <React.Fragment key={key}>
            {item}
            {key < text.split('\n').length - 1 && <br />}
        </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">      
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl p-3 rounded-xl shadow-md break-words ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : message.type === "error" 
                        ? "bg-red-100 text-red-700 border border-red-300 rounded-bl-none" 
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  {message.sender === "ai" && (
                    <div className="flex items-center mb-1">
                      <PawPrint className={`h-5 w-5 mr-2 ${message.type === "error" ? "text-red-500" : "text-blue-500"}`} />
                      <span className={`text-xs font-semibold ${message.type === "error" ? "text-red-600" : "text-blue-600"}`}>PetHealth AI</span>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none text-sm">
                    {formatMessage(message.text)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <PawPrint className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-600">PetHealth AI</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader size={18} className="animate-spin text-gray-500" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white shadow- ऊपर"> {/* Using a subtle top shadow */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Ask about your pet's health..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              disabled={isLoading}
              aria-label="Chat input"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || inputValue.trim() === ""}
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-2 text-center px-2">
            Note: PetHealth AI provides general guidance. For emergencies or serious conditions, please contact a veterinarian immediately.
          </div>
          {/* Optional: Clear Chat Button for testing memory */}
          <button onClick={clearChat} className="mt-2 text-xs text-blue-500 hover:text-blue-700">Clear Chat</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;