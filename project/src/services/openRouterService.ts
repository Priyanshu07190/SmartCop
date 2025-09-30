import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export class OpenRouterService {
  private static instance: OpenRouterService;

  static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  async sendMessage(message: string): Promise<string> {
    try {
      // Check if API key is available
      if (!API_KEY || API_KEY.trim() === '') {
        console.warn('OpenRouter API key not found, using fallback response');
        return this.getFallbackResponse(message);
      }

      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: 'openai/gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for law enforcement officers. You can answer questions about legal procedures, laws, regulations, general knowledge, and provide guidance on police work. Be professional, accurate, and helpful.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SmartCop AI Assistant'
          }
        }
      );

      return response.data.choices[0]?.message?.content || 'Sorry, I could not process your request.';
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      
      // Provide fallback response instead of generic error
      return this.getFallbackResponse(message);
    }
  }

  async generateTTS(text: string, voice: string = 'alloy'): Promise<string> {
    try {
      // Check if API key is available
      if (!API_KEY || API_KEY.trim() === '' || API_KEY === 'undefined') {
        console.warn('OpenRouter API key not configured, skipping TTS');
        throw new Error('OpenRouter API key not configured');
      }

      const response = await axios.post(
        'https://openrouter.ai/api/v1/audio/speech',
        {
          model: 'openai/tts-1-hd',
          input: text,
          voice: voice,
          response_format: 'mp3'
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SmartCop AI Assistant'
          },
          responseType: 'arraybuffer'
        }
      );

      // Convert array buffer to base64 data URL
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } catch (error) {
      console.error('OpenRouter TTS Error:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error('OpenRouter API key not configured or invalid');
      }
      throw new Error('OpenRouter TTS service unavailable');
    }
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Legal-related responses
    if (lowerMessage.includes('miranda') || lowerMessage.includes('rights')) {
      return 'Miranda Rights: You have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney. If you cannot afford an attorney, one will be provided for you.';
    }
    
    if (lowerMessage.includes('search') && lowerMessage.includes('seizure')) {
      return 'Search and Seizure: The Fourth Amendment protects against unreasonable searches and seizures. Generally, a warrant is required unless there are exigent circumstances, consent, or other established exceptions.';
    }
    
    if (lowerMessage.includes('arrest') || lowerMessage.includes('procedure')) {
      return 'Arrest Procedures: 1) Establish probable cause, 2) Identify yourself as law enforcement, 3) Inform the person they are under arrest, 4) Read Miranda rights if interrogation will follow, 5) Use only necessary force, 6) Document everything properly.';
    }
    
    if (lowerMessage.includes('evidence') || lowerMessage.includes('collection')) {
      return 'Evidence Collection: 1) Secure the scene, 2) Document everything with photos/video, 3) Use proper chain of custody procedures, 4) Wear protective equipment, 5) Label and seal evidence properly, 6) Maintain detailed logs.';
    }
    
    if (lowerMessage.includes('traffic') || lowerMessage.includes('violation')) {
      return 'Traffic Violations: Common violations include speeding, running red lights, improper lane changes, and DUI. Always ensure officer safety, be professional, explain the violation clearly, and follow proper citation procedures.';
    }
    
    if (lowerMessage.includes('witness') || lowerMessage.includes('interview')) {
      return 'Witness Interviews: 1) Create a comfortable environment, 2) Ask open-ended questions first, 3) Listen actively, 4) Avoid leading questions, 5) Document statements accurately, 6) Get contact information for follow-up.';
    }
    
    // General helpful response
    return `I understand you're asking about: "${message}". While I'm currently operating in offline mode, I recommend consulting your department's policy manual, legal resources, or speaking with a supervisor for specific guidance on this matter.`;
  }
}