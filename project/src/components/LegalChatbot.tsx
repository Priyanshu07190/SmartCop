import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, BookOpen, AlertCircle, Search, FileText, Mic, MicOff } from 'lucide-react';
import { OpenRouterService } from '../services/openRouterService';

const LegalChatbot: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      content: 'Hello Officer! I\'m your AI legal assistant. I can answer any questions you have about legal procedures, laws, regulations, or any other topic. How can I assist you today?',
      timestamp: '09:00:00'
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const openRouterService = OpenRouterService.getInstance();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsRecording(true);
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        // Add error message to chat
        const errorMessage = {
          id: Date.now().toString(),
          type: 'bot' as const,
          content: `🎤 Voice input error: ${event.error}. Please try again or use text input.`,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
      recognitionRef.current = recognitionInstance;
    }
  }, []);

  // Voice recording functions
  const startVoiceRecording = () => {
    if (recognition && !isRecording) {
      try {
        recognition.start();
        
        // Add user feedback message
        const voiceMessage = {
          id: Date.now().toString(),
          type: 'bot' as const,
          content: '🎤 Listening... Speak your question now.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, voiceMessage]);
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
      }
    }
  };

  const stopVoiceRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Check if speech recognition is supported
  const isSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    const quickQuestions = [
    'Miranda rights requirements',
    'Evidence collection procedures', 
    'Search and seizure laws',
    'Traffic violation codes',
    'Arrest procedures',
    'Witness interview guidelines'
  ];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    // Get AI response
    openRouterService.sendMessage(currentInput).then(response => {
      const botResponse = {
        id: Date.now().toString(),
        type: 'bot' as const,
        content: response,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }).catch(error => {
      console.error('AI Response Error:', error);
      const errorResponse = {
        id: Date.now().toString(),
        type: 'bot' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorResponse]);
      setIsTyping(false);
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Legal AI Assistant</h2>
            <p className="text-gray-600">AI-powered assistant for any questions or guidance</p>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-96">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-center space-x-2 mb-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.type === 'bot' && <Bot className="h-4 w-4 text-blue-600" />}
                    {message.type === 'user' && <User className="h-4 w-4 text-gray-600" />}
                    <span className="text-xs text-gray-500">{message.timestamp}</span>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-line text-sm">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {/* Voice Input Button */}
              {isSpeechSupported && (
                <button
                  onClick={toggleVoiceRecording}
                  className={`p-2 border border-gray-300 rounded-md transition-colors ${
                    isRecording 
                      ? 'bg-red-100 border-red-300 text-red-600 animate-pulse' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}
              
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything - legal procedures, general questions, or any topic..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            {/* Input Info */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>Type your legal questions or general inquiries</span>
              </div>
              
              {isSpeechSupported && (
                <div className="flex items-center space-x-1">
                  <Mic className="h-3 w-3" />
                  <span>{isRecording ? 'Listening...' : 'Click mic for voice input'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Questions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Questions</h3>
            
            <div className="space-y-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(question)}
                  className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Input Section */}
          {isSpeechSupported && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Input</h3>
              
              <button
                onClick={toggleVoiceRecording}
                className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-100 border-2 border-red-300 text-red-700 animate-pulse' 
                    : 'bg-blue-50 border-2 border-blue-300 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-5 w-5" />
                    <span className="font-medium">Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    <span className="font-medium">Start Voice Input</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isRecording 
                  ? '🎤 Listening... Speak your legal question now.' 
                  : 'Click to ask questions using your voice. Works best in quiet environments.'
                }
              </p>
            </div>
          )}

          {/* Legal Resources */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Resources</h3>
            
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
                <BookOpen className="h-4 w-4" />
                <span>State Traffic Code</span>
              </button>
              
              <button className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
                <Search className="h-4 w-4" />
                <span>Case Law Search</span>
              </button>
              
              <button className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
                <AlertCircle className="h-4 w-4" />
                <span>Recent Updates</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalChatbot;