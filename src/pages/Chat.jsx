import React, { useState, useRef, useEffect } from "react";
import { Send, Loader, PawPrint } from "lucide-react";

function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm PetHealth AI. How can I help you and your pet today?", sender: "ai" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (inputValue.trim() === "") return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user"
    };
    
    setMessages([...messages, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Call backend API
    fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage.text }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const aiResponse = {
          id: Date.now() + 1,
          text: data.response,
          sender: "ai"
        };
        setMessages(prevMessages => [...prevMessages, aiResponse]);
      })
      .catch(error => {
        console.error('Error fetching AI response:', error);
        // Add error message
        const errorResponse = {
          id: Date.now() + 1,
          text: "Sorry, I encountered an error. Please try again later.",
          sender: "ai"
        };
        setMessages(prevMessages => [...prevMessages, errorResponse]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Function to clear chat - reset to initial state
  const clearChat = () => {
    setMessages([
      { id: Date.now(), text: "Hello! I'm PetHealth AI. How can I help you and your pet today?", sender: "ai" }
    ]);
  };

  // Function to format code blocks if needed
  const formatMessage = (text) => {
    return text;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">      
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
                  className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {message.sender === "ai" && (
                    <div className="flex items-center mb-1">
                      <PawPrint className="h-4 w-4 mr-1 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-600">PetHealth AI</span>
                    </div>
                  )}
                  {formatMessage(message.text)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm">
                  <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <PawPrint className="h-4 w-4 mr-1 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600">PetHealth AI</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Loader size={16} className="animate-spin text-gray-400" />
                    <span className="text-gray-500">Thinking...</span>
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
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center justify-center disabled:bg-blue-300"
              disabled={isLoading || inputValue.trim() === ""}
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-2 text-center">
          Note: This is an AI assistant for general pet health guidance. For emergencies or serious conditions, please contact a veterinarian immediately.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;