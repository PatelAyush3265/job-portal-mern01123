import { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ type: 'bot', text: 'Hi there! How can I help you today?' }]);
    }
  }, [isOpen]); // Run when isOpen changes

  const sendMessage = async () => {
    const userMsg = inputValue.trim();
    if (!userMsg) return;

    setInputValue('');
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);

    try {
      const res = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { type: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: '❌: Error fetching reply' }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      <button 
        className="chat-toggle" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src="https://www.mobiletime.com.br/wp-content/uploads/2024/02/Captura-de-Tela-2024-02-09-as-08.20.28-1280x640.jpg" 
          alt="Chatbot Icon" 
          className="chat-icon" 
        />
      </button>

      {isOpen && (
        <div className="chat-box">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.type === 'user' ? <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc19L_Y8syN78Z52h6Q40VLEBa59EzAVEh4Q&s" alt="User Icon" className="user-icon" /> : '🤖: '}{msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask something..."
              className="user-input"
            />
            <button onClick={sendMessage} className="send-btn">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot; 
