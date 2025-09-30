import * as pdfjsLib from 'pdfjs-dist';
import OpenAI from 'openai';

// Configure PDF.js worker for browser environment
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Configure OpenAI client for OpenRouter
const openaiClient = new OpenAI({
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || 'your-api-key-here',
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true // Required for browser usage
});

export interface PDFProcessingResult {
  extractedText: string;
  summary: string;
  metadata: {
    fileName: string;
    pageCount: number;
    textLength: number;
    processingTime: number;
  };
}

export class PDFService {
  private static instance: PDFService;

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  /**
   * Extract text from PDF file (browser-compatible version)
   */
  async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('🔄 Starting PDF text extraction for:', file.name);
      const startTime = Date.now();

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: data,
        verbosity: 0, // Reduce console output
        useWorkerFetch: false,
        isEvalSupported: false
      });

      const pdfDocument = await loadingTask.promise;
      console.log(`📄 PDF loaded: ${pdfDocument.numPages} pages`);

      let fullText = '';
      const numPages = pdfDocument.numPages;
      const maxPages = Math.min(numPages, 10); // Limit for performance

      // Extract text from each page
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const content = await page.getTextContent();

          // Extract and format text items
          let pageText = '';
          content.items.forEach((item: any) => {
            if (item.str && item.str.trim()) {
              pageText += item.str + ' ';
            }
          });

          if (pageText.trim()) {
            fullText += `\n--- Page ${pageNum} ---\n${pageText.trim()}\n`;
          }

          console.log(`✓ Processed page ${pageNum}/${maxPages}`);
        } catch (pageError) {
          console.warn(`⚠️ Error on page ${pageNum}:`, pageError);
          continue; // Skip problematic pages
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Text extraction complete in ${processingTime}ms`);

      if (!fullText.trim()) {
        throw new Error('No readable text found in PDF. Document may be image-based or encrypted.');
      }

      return fullText.trim();
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          throw new Error('Invalid PDF file format');
        } else if (error.message.includes('password')) {
          throw new Error('PDF is password protected');
        } else if (error.message.includes('worker')) {
          throw new Error('PDF processing service temporarily unavailable');
        } else {
          throw new Error(`PDF extraction failed: ${error.message}`);
        }
      }
      
      throw new Error('Unknown PDF processing error');
    }
  }

  /**
   * Generate AI summary using OpenRouter API
   */
  async summarizeText(extractedText: string, summaryLength: 'concise' | 'detailed' = 'detailed'): Promise<string> {
    try {
      console.log('🔄 Starting AI summarization...');
      
      // Limit text length to prevent token overflow
      const maxLength = summaryLength === 'detailed' ? 8000 : 4000;
      const textToSummarize = extractedText.length > maxLength 
        ? extractedText.substring(0, maxLength) + '\n\n[Document truncated for processing...]'
        : extractedText;

      const response = await openaiClient.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a legal AI assistant specializing in document analysis. Create a ${summaryLength} summary focusing on:

1. **Document Type & Purpose**: Identify what kind of legal document this is
2. **Key Legal Points**: Main provisions, clauses, arguments, or legal concepts
3. **Important Details**: Dates, parties, amounts, deadlines, jurisdiction
4. **Legal References**: Statutes, regulations, case law, or legal precedents mentioned
5. **Action Items**: Required steps, deadlines, or compliance requirements
6. **Risk Assessment**: Potential legal issues or areas requiring attention

Format your response with clear headings and bullet points for easy reading.`
          },
          {
            role: 'user',
            content: `Please analyze and summarize this legal document:\n\n${textToSummarize}`
          }
        ],
        temperature: 0.3, // Lower for more factual summaries
        max_tokens: summaryLength === 'detailed' ? 1500 : 800
      });

      const summary = response.choices[0]?.message?.content?.trim();
      
      if (!summary) {
        throw new Error('No summary generated by AI');
      }

      console.log('✅ AI summarization complete');
      return summary;
    } catch (error) {
      console.error('❌ Summarization failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('AI service configuration error. Please check API key.');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('AI service quota exceeded. Please try again later.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else {
          throw new Error(`AI summarization failed: ${error.message}`);
        }
      }
      
      throw new Error('Unknown AI processing error');
    }
  }

  /**
   * Main function to process PDF: Extract + Summarize
   */
  async processLegalPDF(file: File, summaryLength: 'concise' | 'detailed' = 'detailed'): Promise<PDFProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting PDF processing for: ${file.name}`);

      // Step 1: Extract text
      const extractedText = await this.extractTextFromPDF(file);
      console.log(`📄 Extracted ${extractedText.length} characters`);

      // Step 2: Generate summary
      const summary = await this.summarizeText(extractedText, summaryLength);

      const processingTime = Date.now() - startTime;
      
      const result: PDFProcessingResult = {
        extractedText,
        summary,
        metadata: {
          fileName: file.name,
          pageCount: 0, // Will be updated if needed
          textLength: extractedText.length,
          processingTime
        }
      };

      console.log(`✅ PDF processing complete in ${processingTime}ms`);
      return result;
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      throw error;
    }
  }

  /**
   * Fallback method for manual text analysis
   */
  async analyzeText(text: string): Promise<string> {
    try {
      console.log('🔄 Analyzing provided text...');
      
      if (!text.trim()) {
        throw new Error('No text provided for analysis');
      }

      return await this.summarizeText(text, 'detailed');
    } catch (error) {
      console.error('❌ Text analysis failed:', error);
      throw error;
    }
  }
}

export default PDFService;
