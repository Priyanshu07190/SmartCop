import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Globe, Volume2, Download, Users, Play, Pause, Send } from 'lucide-react';
import { BhashiniService, INDIAN_LANGUAGES, Language } from '../services/bhashiniService';

const TranscriptionView: React.FC = () => {
  const [isRecordingMe, setIsRecordingMe] = useState(false);
  const [isRecordingOther, setIsRecordingOther] = useState(false);
  const [myLanguage, setMyLanguage] = useState('en');
  const [otherLanguage, setOtherLanguage] = useState('hi');
  const [myInput, setMyInput] = useState('');
  const [otherInput, setOtherInput] = useState('');
  const [transcript, setTranscript] = useState<Array<{
    id: string;
    speaker: 'me' | 'other';
    originalText: string;
    translatedText: string;
    originalLang: string;
    translatedLang: string;
    timestamp: string;
  }>>([]);

  const bhashiniService = BhashiniService.getInstance();

  const startVoiceInput = (speaker: 'me' | 'other') => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Map language codes to speech recognition language codes
    const langMap: { [key: string]: string } = {
      'hi': 'hi-IN',
      'en': 'en-US',
      'bn': 'bn-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'gu': 'gu-IN',
      'ur': 'ur-PK',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'pa': 'pa-IN',
      'as': 'as-IN'
    };
    
    // Set recognition language based on speaker's selected language
    const selectedLang = speaker === 'me' ? myLanguage : otherLanguage;
    recognition.lang = langMap[selectedLang] || 'en-US';
    
    console.log(`Starting speech recognition for ${speaker} in language: ${selectedLang} (${recognition.lang})`);
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      if (speaker === 'me') {
        setIsRecordingMe(true);
      } else {
        setIsRecordingOther(true);
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log(`Speech recognized for ${speaker}: "${transcript}" in ${selectedLang}`);
      if (speaker === 'me') {
        setMyInput(transcript);
        setIsRecordingMe(false);
      } else {
        setOtherInput(transcript);
        setIsRecordingOther(false);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        console.warn('No speech detected, this is normal behavior');
        // Don't show alert for no-speech errors as they are common and not critical
      } else if (event.error === 'network') {
        alert('Speech recognition network error: Please check your internet connection and ensure your browser has permission to access the microphone. You may also need to check your firewall settings.');
      } else {
        alert(`Speech recognition error: ${event.error}. Please try again.`);
      }
      setIsRecordingMe(false);
      setIsRecordingOther(false);
    };

    recognition.onend = () => {
      setIsRecordingMe(false);
      setIsRecordingOther(false);
    };

    recognition.start();
  };

  const handleSendMessage = async (speaker: 'me' | 'other') => {
    const inputText = speaker === 'me' ? myInput : otherInput;
    if (!inputText.trim()) return;

    // When I speak: my language -> other person's language
    // When other person speaks: their language -> my language
    const sourceLang = speaker === 'me' ? myLanguage : otherLanguage;
    const targetLang = speaker === 'me' ? otherLanguage : myLanguage;
    
    let translatedText = inputText; // Default to original text
    
    try {
      // Always translate to help both parties understand
      if (sourceLang !== targetLang) {
        console.log(`Translating ${speaker === 'me' ? 'my speech' : 'other person\'s speech'} from ${sourceLang} to ${targetLang}:`, inputText);
        translatedText = await bhashiniService.translateText(inputText, sourceLang, targetLang);
        console.log('Translation result:', translatedText);
      }
    } catch (error) {
      console.error('Translation failed, using original text:', error);
      // Keep original text if translation fails
    }
      
    const newEntry = {
      id: Date.now().toString(),
      speaker,
      originalText: inputText,
      translatedText,
      originalLang: sourceLang,
      translatedLang: targetLang,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTranscript(prev => [...prev, newEntry]);
    
    // Clear input
    if (speaker === 'me') {
      setMyInput('');
    } else {
      setOtherInput('');
    }
  };

  const handlePlayTranslation = async (text: string, language: string) => {
    try {
      // Try external TTS services first
      try {
        const audioUrl = await bhashiniService.textToSpeech(text, language);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          // Clean up object URL if it was created
          if (audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
          }
        };
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          // Clean up object URL if it was created
          if (audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
          }
        };
        
        audio.play();
      } catch (ttsError) {
        console.warn('External TTS services failed, using browser TTS:', ttsError);
        
        // Fallback to browser's built-in speech synthesis
        if ('speechSynthesis' in window) {
          // Cancel any ongoing speech
          speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Set language based on selected language
          const langMap: { [key: string]: string } = {
            'hi': 'hi-IN',
            'en': 'en-US',
            'bn': 'bn-IN',
            'te': 'te-IN',
            'mr': 'mr-IN',
            'ta': 'ta-IN',
            'gu': 'gu-IN',
            'ur': 'ur-PK',
            'kn': 'kn-IN',
            'ml': 'ml-IN',
            'or': 'or-IN',
            'pa': 'pa-IN',
            'as': 'as-IN'
          };
          
          utterance.lang = langMap[language] || 'en-US';
          utterance.rate = 0.7; // Slower for better clarity
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utterance.onerror = (event) => {
            if (event.error === 'interrupted') {
              console.warn('Speech synthesis interrupted (normal behavior):', event.error);
            } else {
              console.error('Speech synthesis error:', event);
              alert('Text-to-speech is currently unavailable. Please check your browser settings or try again later.');
            }
          };
          
          speechSynthesis.speak(utterance);
        } else {
          console.error('Speech synthesis not supported in this browser');
          alert('Text-to-speech is not supported in your browser.');
        }
      }
    } catch (error) {
      console.error('All TTS methods failed:', error);
      alert('Text-to-speech is currently unavailable. Please try again later.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Language Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">My Language</label>
            <select
              value={myLanguage}
              onChange={(e) => setMyLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Person's Language</label>
            <select
              value={otherLanguage}
              onChange={(e) => setOtherLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* My Input */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">My Speech ({INDIAN_LANGUAGES.find(l => l.code === myLanguage)?.name})</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startVoiceInput('me')}
                disabled={isRecordingMe}
                className={`p-2 rounded-md transition-colors ${
                  isRecordingMe 
                    ? 'bg-red-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={myInput}
                onChange={(e) => setMyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage('me')}
                placeholder="Type or speak your message..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSendMessage('me')}
                disabled={!myInput.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {isRecordingMe && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Recording...</span>
              </div>
            )}
          </div>

          {/* Other Person Input */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-3">Other Person ({INDIAN_LANGUAGES.find(l => l.code === otherLanguage)?.name})</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startVoiceInput('other')}
                disabled={isRecordingOther}
                className={`p-2 rounded-md transition-colors ${
                  isRecordingOther 
                    ? 'bg-red-600 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={otherInput}
                onChange={(e) => setOtherInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage('other')}
                placeholder="Type or speak their message..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => handleSendMessage('other')}
                disabled={!otherInput.trim()}
                className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {isRecordingOther && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Recording...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transcript Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Transcript & Translation</h3>
          <button className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {transcript.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mic className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Start recording to see transcription and translation</p>
            </div>
          ) : (
            transcript.map((entry) => (
              <div key={entry.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-16 text-xs font-medium px-2 py-1 rounded-full text-center ${
                    entry.speaker === 'me' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {entry.speaker === 'me' ? 'Me' : 'Other'}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {/* Original Text */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          Original ({INDIAN_LANGUAGES.find(l => l.code === entry.originalLang)?.name})
                        </span>
                        <button 
                          onClick={() => handlePlayTranslation(entry.originalText, entry.originalLang)}
                          className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Play</span>
                        </button>
                      </div>
                      <p className="text-gray-900">{entry.originalText}</p>
                    </div>
                    
                    {/* Translated Text */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-600">
                          {entry.speaker === 'me' ? 'For Other Person' : 'For Me'} ({INDIAN_LANGUAGES.find(l => l.code === entry.translatedLang)?.name})
                        </span>
                        <button 
                          onClick={() => handlePlayTranslation(entry.translatedText, entry.translatedLang)}
                          className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Play</span>
                        </button>
                      </div>
                      <p className="text-blue-900 font-medium">{entry.translatedText}</p>
                    </div>
                    
                    <div className="text-xs text-gray-500">{entry.timestamp}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;