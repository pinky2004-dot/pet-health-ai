import React, { useState, useRef, useEffect } from "react";

function Chat() {
  const [messages, setMessages] = useState([]);
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
    e.preventDefault();
    
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
    
    // Simulate AI response (would be replaced with actual API call)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: "This is a simulated response. Connect to an actual LLM API for real responses.",
        sender: "ai"
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <p className="text-xl font-semibold">Tell us what happened</p>
                <p className="mt-2">Type a message below to begin chatting</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Ask about your pet's health..."
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
              disabled={isLoading || inputValue.trim() === ""}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;