import axios from 'axios';

import { OpenRouterService } from './openRouterService';

const BHASHINI_BASE_URL = '/api/bhashini';
const USER_ID = import.meta.env.VITE_BHASHINI_USER_ID || '1da76fdf6efc4c05ba0901be278f9006';
const UDYAT_KEY = import.meta.env.VITE_BHASHINI_ULCA_KEY || '09f78bf3e7-efe4-40d0-8b5d-8442c6f994d0';
const INTERFACE_KEY = import.meta.env.VITE_BHASHINI_INTERFACE_KEY || 'PUIFRldG4nTBWacgcl1JyRt7kddwKmqVKjMan0POOPNWZTzjt6Boewc4BGbtBvvK';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const INDIAN_LANGUAGES: Language[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

export class BhashiniService {
  private static instance: BhashiniService;
  private authToken: string | null = null;

  static getInstance(): BhashiniService {
    if (!BhashiniService.instance) {
      BhashiniService.instance = new BhashiniService();
    }
    return BhashiniService.instance;
  }

  private transformCallbackUrl(callbackUrl: string): string {
    // Transform external Bhashini callback URLs to use our proxy
    if (callbackUrl.includes('meity-auth.ulcacontrib.org')) {
      return callbackUrl.replace('https://meity-auth.ulcacontrib.org', '/api/bhashini');
    }
    return callbackUrl;
  }

  private async getAuthToken(): Promise<string> {
    if (this.authToken) return this.authToken;

    try {
      const response = await axios.post(`${BHASHINI_BASE_URL}/ulca/apis/v0/model/getModelsPipeline`, {
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: 'hi',
                targetLanguage: 'en'
              }
            }
          }
        ],
        pipelineRequestConfig: {
          pipelineId: '64392f96daac500b55c543cd'
        }
      }, {
        headers: {
          'userID': USER_ID,
          'ulcaApiKey': UDYAT_KEY,
          'Content-Type': 'application/json'
        }
      });

      this.authToken = response.data.pipelineResponseConfig[0].config[0].serviceId;
      return this.authToken;
    } catch (error) {
      console.error('Bhashini Auth Error:', error);
      throw new Error('Failed to authenticate with Bhashini');
    }
  }

  async translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    console.log(`BhashiniService: Translating "${text}" from ${sourceLang} to ${targetLang}`);
    
    // If same language, return original text
    if (sourceLang === targetLang) {
      return text;
    }
    
    // Use GPT-4o as primary translation service
    try {
      const openRouterService = OpenRouterService.getInstance();
      const sourceLangName = INDIAN_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
      const targetLangName = INDIAN_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
      
      const translationPrompt = `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. 

Important guidelines:
- Provide only the translated text, no explanations
- Maintain the original meaning and context
- Use appropriate formal/informal tone based on context
- For legal/police contexts, use proper terminology

Text to translate: "${text}"`;

      const translatedText = await openRouterService.sendMessage(translationPrompt);
      console.log(`GPT-4o translation (${sourceLangName} → ${targetLangName}):`, translatedText);
      return translatedText.replace(/^["']|["']$/g, '').trim(); // Remove quotes if present
    } catch (error) {
      console.warn('GPT-4o translation failed, falling back to Bhashini:', error);
    }
    
    try {
      // Use Bhashini API directly for translation
      const response = await axios.post(`${BHASHINI_BASE_URL}/ulca/apis/v0/model/compute`, {
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: sourceLang,
                targetLanguage: targetLang
              }
            }
          }
        ],
        inputData: {
          input: [
            {
              source: text
            }
          ]
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'userID': USER_ID,
          'ulcaApiKey': UDYAT_KEY
        }
      });

      console.log('Bhashini translation response:', response.data);

      if (response.data && response.data.pipelineResponse && response.data.pipelineResponse[0] && response.data.pipelineResponse[0].output) {
        const translatedText = response.data.pipelineResponse[0].output[0].target;
        console.log('Bhashini translation result:', translatedText);
        return translatedText || text;
      }

      throw new Error('Invalid response from Bhashini');
    } catch (error) {
      console.error('Translation Error:', error);
      
      // Fallback to MyMemory API
      try {
        console.log('Bhashini failed, trying MyMemory fallback...');
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
          console.log('MyMemory translation successful:', data.responseData.translatedText);
          return data.responseData.translatedText;
        }
      } catch (fallbackError) {
        console.error('MyMemory fallback failed:', fallbackError);
      }
      
      // If all fails, return original text
      return text;
    }
  }

  async speechToText(audioBlob: Blob, language: string): Promise<string> {
    try {
      // Convert blob to base64
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });
      
      // Use Bhashini API directly for ASR
      const response = await axios.post(`${BHASHINI_BASE_URL}/ulca/apis/v0/model/compute`, {
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: {
                sourceLanguage: language
              }
            }
          }
        ],
        inputData: {
          audio: [
            {
              audioContent: base64Audio
            }
          ]
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'userID': USER_ID,
          'ulcaApiKey': UDYAT_KEY,
        }
      });

      console.log('Bhashini ASR response:', response.data);

      if (response.data && response.data.pipelineResponse && response.data.pipelineResponse[0] && response.data.pipelineResponse[0].output) {
        const transcribedText = response.data.pipelineResponse[0].output[0].source;
        console.log('Bhashini ASR result:', transcribedText);
        return transcribedText || 'Could not transcribe audio';
      }
      
      throw new Error('Invalid response from Bhashini ASR');
    } catch (error) {
      console.error('STT Error:', error);
      return 'Error in speech recognition';
    }
  }

  async textToSpeech(text: string, language: string): Promise<string> {
    // First try OpenRouter TTS for high-quality audio
    try {
      const openRouterService = OpenRouterService.getInstance();
      
      // Select appropriate voice based on language
      const voice = language === 'hi' ? 'nova' : 'alloy'; // nova works better for Indian languages
      
      console.log(`Using OpenAI TTS for ${language}: "${text}"`);
      const audioUrl = await openRouterService.generateTTS(text, voice);
      console.log('OpenAI TTS audio generated successfully');
      return audioUrl;
    } catch (error) {
      console.warn('OpenRouter TTS failed, falling back to Bhashini:', error);
    }
    
    try {
      // Use Bhashini API directly for TTS
      const response = await axios.post(`${BHASHINI_BASE_URL}/ulca/apis/v0/model/compute`, {
        pipelineTasks: [
          {
            taskType: 'tts',
            config: {
              language: {
                sourceLanguage: language
              }
            }
          }
        ],
        inputData: {
          input: [
            {
              source: text
            }
          ]
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'userID': USER_ID,
          'ulcaApiKey': UDYAT_KEY,
        }
      });

      console.log('Bhashini TTS response:', response.data);

      if (response.data && response.data.pipelineResponse && response.data.pipelineResponse[0] && response.data.pipelineResponse[0].audio) {
        const audioContent = response.data.pipelineResponse[0].audio[0].audioContent;
        console.log('Bhashini TTS audio generated successfully');
        return `data:audio/wav;base64,${audioContent}`;
      }
      
      throw new Error('Invalid response from Bhashini TTS');
    } catch (error) {
      console.error('Bhashini TTS Error:', error);
      console.warn('All TTS services failed, falling back to browser speech synthesis');
      throw new Error('External TTS services unavailable');
    }
  }
}