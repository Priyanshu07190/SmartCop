import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Download, Search, FileText, Save } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { SupabaseService } from '../services/supabaseService';
import { BhashiniService, INDIAN_LANGUAGES } from '../services/bhashiniService';
import { addActivity } from '../utils/activityLogger';

interface FIRFormData {
  fullName: string;
  age: string;
  address: string;
  dateOfBirth: string;
  incidentType: string;
  incidentDescription: string;
  locationOfIncident: string;
  dateTimeOfIncident: string;
  witnesses: string;
  additionalInformation: string;
}

interface FIRDraft {
  id: string;
  case_id: string;
  status: 'draft' | 'submitted';
  form_data_local: FIRFormData;
  form_data_english: FIRFormData;
  language: string;
  created_at: string;
  updated_at: string;
}

const FIRDrafting: React.FC = () => {
  const supabaseService = SupabaseService.getInstance();
  const bhashiniService = BhashiniService.getInstance();
  
  const [currentStep, setCurrentStep] = useState(0); // 0: language, 1: input method, 2: form
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [inputMethod, setInputMethod] = useState<'voice' | 'text' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [formDataLocal, setFormDataLocal] = useState<FIRFormData>({
    fullName: '',
    age: '',
    address: '',
    dateOfBirth: '',
    incidentType: '',
    incidentDescription: '',
    locationOfIncident: '',
    dateTimeOfIncident: '',
    witnesses: '',
    additionalInformation: ''
  });
  
  const [formDataEnglish, setFormDataEnglish] = useState<FIRFormData>({
    fullName: '',
    age: '',
    address: '',
    dateOfBirth: '',
    incidentType: '',
    incidentDescription: '',
    locationOfIncident: '',
    dateTimeOfIncident: '',
    witnesses: '',
    additionalInformation: ''
  });
  
  const [savedFIRs, setSavedFIRs] = useState<FIRDraft[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecognitionActive = useRef(false);
  const isListeningRef = useRef(false);

  // Multilingual translations for UI text
  const translations = {
    en: {
      title: 'FIR Drafting Assistant',
      selectLanguage: 'Select your preferred language',
      chooseLanguage: 'Choose Language',
      continue: 'Continue',
      back: 'Back',
      chooseInputMethod: 'Choose Input Method',
      howToProvideInfo: 'How would you like to provide information?',
      voiceInput: 'Voice Input',
      speakResponses: 'Speak your responses',
      textInput: 'Text Input',
      typeResponses: 'Type your responses',
      firInformation: 'FIR Information',
      fillDetails: 'Fill in the details below',
      changeInputMethod: 'Change Input Method',
      voiceInputAnswerQuestions: 'Voice Input - Answer the Questions',
      currentQuestion: 'Current Question',
      repeatQuestion: 'Repeat Question',
      stopListening: 'Stop Listening',
      startListening: 'Start Listening',
      nextQuestion: 'Next Question',
      yourVoiceResponse: 'Your voice response will appear here...',
      currentlyAnswering: 'Currently answering',
      instructions: 'Instructions: 1) Click "Ask Question" to hear question 2) Click "Start Listening" 3) Speak your answer unlimited 4) Click "Send" when done',
      listening: 'Listening for your answer...',
      askingQuestion: 'Asking question...',
      typeInformation: 'Type your information here...',
      saveDraft: 'Save Draft',
      saving: 'Saving...',
      submitFir: 'Submit FIR',
      submitting: 'Submitting...',
      form: 'Form',
      savedFirs: 'Saved FIRs',
      searchFirs: 'Search FIRs...',
      submitted: 'Submitted',
      draft: 'Draft',
      name: 'Name',
      incident: 'Incident',
      created: 'Created',
      noFirsFound: 'No FIRs found matching your search.',
      noSavedFirs: 'No saved FIRs yet.'
    },
    hi: {
      title: 'FIR ड्राफ्टिंग सहायक',
      selectLanguage: 'अपनी पसंदीदा भाषा चुनें',
      chooseLanguage: 'भाषा चुनें',
      continue: 'आगे बढ़ें',
      back: 'वापस',
      chooseInputMethod: 'इनपुट विधि चुनें',
      howToProvideInfo: 'आप जानकारी कैसे देना चाहते हैं?',
      voiceInput: 'आवाज़ इनपुट',
      speakResponses: 'अपने जवाब बोलें',
      textInput: 'टेक्स्ट इनपुट',
      typeResponses: 'अपने जवाब टाइप करें',
      firInformation: 'FIR जानकारी',
      fillDetails: 'नीचे विवरण भरें',
      changeInputMethod: 'इनपुट विधि बदलें',
      voiceInputAnswerQuestions: 'आवाज़ इनपुट - प्रश्नों का उत्तर दें',
      currentQuestion: 'वर्तमान प्रश्न',
      repeatQuestion: 'प्रश्न दोहराएं',
      stopListening: 'सुनना बंद करें',
      startListening: 'सुनना शुरू करें',
      nextQuestion: 'अगला प्रश्न',
      yourVoiceResponse: 'आपका आवाज़ उत्तर यहाँ दिखाई देगा...',
      currentlyAnswering: 'वर्तमान में उत्तर दे रहे हैं',
      instructions: 'निर्देश: 1) "प्रश्न पूछें" दबाएं प्रश्न सुनने के लिए 2) "सुनना शुरू करें" दबाएं 3) असीमित अपना उत्तर बोलें 4) पूरा होने पर "Send" दबाएं',
      listening: 'आपका उत्तर सुन रहा हूँ...',
      askingQuestion: 'प्रश्न पूछ रहा हूँ...',
      typeInformation: 'यहाँ अपनी जानकारी टाइप करें...',
      saveDraft: 'ड्राफ्ट सेव करें',
      saving: 'सेव हो रहा है...',
      submitFir: 'FIR जमा करें',
      submitting: 'जमा हो रहा है...',
      form: 'फॉर्म',
      savedFirs: 'सेव किए गए FIR',
      searchFirs: 'FIR खोजें...',
      submitted: 'जमा किया गया',
      draft: 'ड्राफ्ट',
      name: 'नाम',
      incident: 'घटना',
      created: 'बनाया गया',
      noFirsFound: 'आपकी खोज से मेल खाने वाला कोई FIR नहीं मिला।',
      noSavedFirs: 'अभी तक कोई FIR सेव नहीं किया गया।'
    }
  };

  const fields = [
    { 
      key: 'fullName', 
      labels: {
        hi: 'पूरा नाम',
        en: 'Full Name',
        bn: 'পূর্ণ নাম',
        te: 'పూర్తి పేరు',
        mr: 'पूर्ण नाव',
        ta: 'முழு பெயர்',
        gu: 'સંપૂર્ણ નામ',
        ur: 'مکمل نام',
        kn: 'ಪೂರ್ಣ ಹೆಸರು',
        ml: 'പൂർണ്ണ നാമം',
        or: 'ସମ୍ପୂର୍ଣ୍ଣ ନାମ',
        pa: 'ਪੂਰਾ ਨਾਮ',
        as: 'সম্পূর্ণ নাম'
      },
      questions: {
        hi: 'आपका पूरा नाम क्या है?',
        en: 'What is your full name?',
        bn: 'আপনার পূর্ণ নাম কি?',
        te: 'మీ పూర్తి పేరు ఏమిటి?',
        mr: 'तुमचे पूर्ण नाव काय आहे?',
        ta: 'உங்கள் முழு பெயர் என்ன?',
        gu: 'તમારું સંપૂર્ણ નામ શું છે?',
        ur: 'آپ کا مکمل نام کیا ہے؟',
        kn: 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?',
        ml: 'നിങ്ങളുടെ പൂർണ്ണ നാമം എന്താണ്?',
        or: 'ଆପଣଙ୍କର ସମ୍ପୂର୍ଣ୍ଣ ନାମ କଣ?',
        pa: 'ਤੁਹਾਡਾ ਪੂਰਾ ਨਾਮ ਕੀ ਹੈ?',
        as: 'আপোনাৰ সম্পূৰ্ণ নাম কি?'
      },
      extractPattern: /(?:name|नाम|নাম|పేరు|नाव|பெயர்|નામ|نام|ಹೆಸರು|നാമം|ନାମ|ਨਾਮ)[\s:]*(?:is|है|কি|ఏమిటి|आहे|என்ன|છે|ہے|ಏನು|എന്താണ്|କଣ|ਹੈ|কি)?\s*([^,.\n]+)/i
    },
    { 
      key: 'age', 
      labels: {
        hi: 'उम्र',
        en: 'Age',
        bn: 'বয়স',
        te: 'వయస్సు',
        mr: 'वय',
        ta: 'வயது',
        gu: 'ઉંમર',
        ur: 'عمر',
        kn: 'ವಯಸ್ಸು',
        ml: 'പ്രായം',
        or: 'ବୟସ',
        pa: 'ਉਮਰ',
        as: 'বয়স'
      },
      questions: {
        hi: 'आपकी उम्र क्या है?',
        en: 'What is your age?',
        bn: 'আপনার বয়স কত?',
        te: 'మీ వయస్సు ఎంత?',
        mr: 'तुमचे वय किती आहे?',
        ta: 'உங்கள் வயது என்ன?',
        gu: 'તમારી ઉંમર કેટલી છે?',
        ur: 'آپ کی عمر کتنی ہے؟',
        kn: 'ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?',
        ml: 'നിങ്ങളുടെ പ്രായം എത്രയാണ്?',
        or: 'ଆପଣଙ୍କର ବୟସ କେତେ?',
        pa: 'ਤੁਹਾਡੀ ਉਮਰ ਕਿੰਨੀ ਹੈ?',
        as: 'আপোনাৰ বয়স কিমান?'
      },
      extractPattern: /(?:age|उम्र|বয়স|వయస్సు|वय|வயது|ઉંમર|عمر|ವಯಸ್ಸು|പ്രായം|ବୟସ|ਉਮਰ)[\s:]*(?:is|है|কত|ఎంత|किती|என்ன|કેટલી|کتنی|ಎಷ್ಟು|എത്രയാണ്|କେତେ|ਕਿੰਨੀ|কিমান)?\s*(\d+)/i
    },
    { 
      key: 'address', 
      labels: {
        hi: 'पता',
        en: 'Address',
        bn: 'ঠিকানা',
        te: 'చిరునామా',
        mr: 'पत्ता',
        ta: 'முகவரி',
        gu: 'સરનામું',
        ur: 'پتہ',
        kn: 'ವಿಳಾಸ',
        ml: 'വിലാസം',
        or: 'ଠିକଣା',
        pa: 'ਪਤਾ',
        as: 'ঠিকনা'
      },
      questions: {
        hi: 'आपका पता क्या है?',
        en: 'What is your address?',
        bn: 'আপনার ঠিকানা কি?',
        te: 'మీ చిరునామా ఏమిటి?',
        mr: 'तुमचा पत्ता काय आहे?',
        ta: 'உங்கள் முகவரி என்ன?',
        gu: 'તમારું સરનામું શું છે?',
        ur: 'آپ کا پتہ کیا ہے؟',
        kn: 'ನಿಮ್ಮ ವಿಳಾಸ ಏನು?',
        ml: 'നിങ്ങളുടെ വിലാസം എന്താണ്?',
        or: 'ଆପଣଙ୍କର ଠିକଣା କଣ?',
        pa: 'ਤੁਹਾਡਾ ਪਤਾ ਕੀ ਹੈ?',
        as: 'আপোনাৰ ঠিকনা কি?'
      },
      extractPattern: /(?:address|पता|ঠিকানা|చిరునామా|पत्ता|முகவரி|સરનામું|پتہ|ವಿಳಾಸ|വിലാസം|ଠିକଣା|ਪਤਾ|ঠিকনা)[\s:]*(?:is|है|কি|ఏమిటి|आहे|என்ன|છે|ہے|ಏನು|എന്താണ്|କଣ|ਹੈ|কি)?\s*([^,.\n]+)/i
    },
    { 
      key: 'dateOfBirth', 
      labels: {
        hi: 'जन्म तिथि',
        en: 'Date of Birth',
        bn: 'জন্ম তারিখ',
        te: 'జన్మ తేదీ',
        mr: 'जन्म तारीख',
        ta: 'பிறந்த தேதி',
        gu: 'જન્મ તારીખ',
        ur: 'تاریخ پیدائش',
        kn: 'ಜನ್ಮ ದಿನಾಂಕ',
        ml: 'ജനന തീയതി',
        or: 'ଜନ୍ମ ତାରିଖ',
        pa: 'ਜਨਮ ਦਿਨ',
        as: 'জন্ম তাৰিখ'
      },
      questions: {
        hi: 'आपकी जन्म तिथि क्या है?',
        en: 'What is your date of birth?',
        bn: 'আপনার জন্ম তারিখ কি?',
        te: 'మీ జన్మ తేదీ ఏమిటి?',
        mr: 'तुमची जन्म तारीख काय आहे?',
        ta: 'உங்கள் பிறந்த தேதி என்ன?',
        gu: 'તમારી જન્મ તારીખ શું છે?',
        ur: 'آپ کی تاریخ پیدائش کیا ہے؟',
        kn: 'ನಿಮ್ಮ ಜನ್ಮ ದಿನಾಂಕ ಏನು?',
        ml: 'നിങ്ങളുടെ ജനന തീയതി എന്താണ്?',
        or: 'ଆପଣଙ୍କର ଜନ୍ମ ତାରିଖ କଣ?',
        pa: 'ਤੁਹਾਡਾ ਜਨਮ ਦਿਨ ਕੀ ਹੈ?',
        as: 'আপোনাৰ জন্ম তাৰিখ কি?'
      },
      extractPattern: /(?:birth|जन्म|জন্ম|జన్మ|जन्म|பிறந்த|જન્મ|پیدائش|ಜನ್ಮ|ജനന|ଜନ୍ମ|ਜਨਮ)[\s:]*(?:date|तिथि|তারিখ|తేదీ|तारीख|தேதி|તારીખ|تاریخ|ದಿನಾಂಕ|തീയതി|ତାରିଖ|ਦਿਨ|তাৰিখ|is|है|কি|ఏమిటి|आहे|என்ன|છે|ہے|ಏನು|എന്താണ്|କଣ|ਹੈ|কি)?\s*([^,.\n]+)/i
    },
    { 
      key: 'incidentType', 
      labels: {
        hi: 'घटना का प्रकार',
        en: 'Incident Type',
        bn: 'ঘটনার ধরন',
        te: 'సంఘటన రకం',
        mr: 'घटनेचा प्रकार',
        ta: 'சம்பவ வகை',
        gu: 'ઘટનાનો પ્રકાર',
        ur: 'واقعے کی قسم',
        kn: 'ಘಟನೆಯ ಪ್ರಕಾರ',
        ml: 'സംഭവത്തിന്റെ തരം',
        or: 'ଘଟଣାର ପ୍ରକାର',
        pa: 'ਘਟਨਾ ਦੀ ਕਿਸਮ',
        as: 'ঘটনাৰ প্ৰকাৰ'
      },
      questions: {
        hi: 'क्या प्रकार की घटना हुई है?',
        en: 'What type of incident occurred?',
        bn: 'কি ধরনের ঘটনা ঘটেছে?',
        te: 'ఎలాంటి సంఘటన జరిగింది?',
        mr: 'कोणत्या प्रकारची घटना घडली आहे?',
        ta: 'என்ன வகையான சம்பவம் நடந்தது?',
        gu: 'કેવા પ્રકારની ઘટના બની છે?',
        ur: 'کس قسم کا واقعہ پیش آیا؟',
        kn: 'ಯಾವ ರೀತಿಯ ಘಟನೆ ನಡೆದಿದೆ?',
        ml: 'എന്ത് തരത്തിലുള്ള സംഭവം നടന്നു?',
        or: 'କେଉଁ ପ୍ରକାରର ଘଟଣା ଘଟିଛି?',
        pa: 'ਕਿਸ ਕਿਸਮ ਦੀ ਘਟਨਾ ਹੋਈ ਹੈ?',
        as: 'কি ধৰণৰ ঘটনা সংঘটিত হৈছে?'
      },
      extractPattern: /(?:incident|घटना|ঘটনা|సంఘటన|घटना|சம்பவம்|ઘટના|واقعہ|ಘಟನೆ|സംഭവം|ଘଟଣା|ਘਟਨਾ|ঘটনা)[\s:]*(?:type|प्रकार|ধরন|రకం|प्रकार|வகை|પ્રકાર|قسم|ಪ್ರಕಾರ|തരം|ପ୍ରକାର|ਕਿਸਮ|প্ৰকাৰ|is|है|কি|ఏమిటি|आहे|என்ன|છે|ہے|ಏನು|എന്താണ്|କଣ|ਹੈ|কি)?\s*([^,.\n]+)/i
    },
    { 
      key: 'incidentDescription', 
      labels: {
        hi: 'घटना का विवरण',
        en: 'Incident Description',
        bn: 'ঘটনার বিবরণ',
        te: 'సంఘటన వివరణ',
        mr: 'घटनेचे वर्णन',
        ta: 'சம்பவ விளக்கம்',
        gu: 'ઘટનાનું વર્ણન',
        ur: 'واقعے کی تفصیل',
        kn: 'ಘಟನೆಯ ವಿವರಣೆ',
        ml: 'സംഭവത്തിന്റെ വിവരണം',
        or: 'ଘଟଣାର ବର୍ଣ୍ଣନା',
        pa: 'ਘਟਨਾ ਦਾ ਵਰਣਨ',
        as: 'ঘটনাৰ বিৱৰণ'
      },
      questions: {
        hi: 'कृपया घटना का विस्तार से वर्णन करें',
        en: 'Please describe the incident in detail',
        bn: 'অনুগ্রহ করে ঘটনার বিস্তারিত বর্ণনা দিন',
        te: 'దయచేసి సంఘటనను వివరంగా వర్ణించండి',
        mr: 'कृपया घटनेचे तपशीलवार वर्णन करा',
        ta: 'தயவுசெய்து சம்பவத்தை விரிவாக விளக்குங்கள்',
        gu: 'કૃપા કરીને ઘટનાનું વિગતવાર વર્ણન કરો',
        ur: 'براہ کرم واقعے کی تفصیل بیان کریں',
        kn: 'ದಯವಿಟ್ಟು ಘಟನೆಯನ್ನು ವಿವರವಾಗಿ ವರ್ಣಿಸಿ',
        ml: 'ദയവായി സംഭവത്തെ വിശദമായി വിവരിക്കുക',
        or: 'ଦୟାକରି ଘଟଣାର ବିସ୍ତୃତ ବର୍ଣ୍ଣନା କରନ୍ତୁ',
        pa: 'ਕਿਰਪਾ ਕਰਕੇ ਘਟਨਾ ਦਾ ਵਿਸਤਾਰ ਨਾਲ ਵਰਣਨ ਕਰੋ',
        as: 'অনুগ্ৰহ কৰি ঘটনাটোৰ বিশদ বিৱৰণ দিয়ক'
      },
      extractPattern: /(.+)/i
    },
    { 
      key: 'locationOfIncident', 
      labels: {
        hi: 'घटना का स्थान',
        en: 'Location of Incident',
        bn: 'ঘটনার স্থান',
        te: 'సంఘటన స్థలం',
        mr: 'घटनेचे ठिकाण',
        ta: 'சம்பவ இடம்',
        gu: 'ઘટનાનું સ્થળ',
        ur: 'واقعے کا مقام',
        kn: 'ಘಟನೆಯ ಸ್ಥಳ',
        ml: 'സംഭവ സ്ഥലം',
        or: 'ଘଟଣା ସ୍ଥାନ',
        pa: 'ਘਟਨਾ ਦਾ ਸਥਾਨ',
        as: 'ঘটনাৰ স্থান'
      },
      questions: {
        hi: 'घटना कहाँ हुई थी?',
        en: 'Where did the incident occur?',
        bn: 'ঘটনা কোথায় ঘটেছিল?',
        te: 'సంఘటన ఎక్కడ జరిగింది?',
        mr: 'घटना कुठे घडली होती?',
        ta: 'சம்பவம் எங்கே நடந்தது?',
        gu: 'ઘટના ક્યાં બની હતી?',
        ur: 'واقعہ کہاں پیش آیا؟',
        kn: 'ಘಟನೆ ಎಲ್ಲಿ ನಡೆಯಿತು?',
        ml: 'സംഭവം എവിടെ നടന്നു?',
        or: 'ଘଟଣା କେଉଁଠାରେ ଘଟିଥିଲା?',
        pa: 'ਘਟਨਾ ਕਿੱਥੇ ਹੋਈ ਸੀ?',
        as: 'ঘটনা কত সংঘটিত হৈছিল?'
      },
      extractPattern: /(?:location|स्थान|স্থান|స్థలం|ठिकाण|இடம்|સ્થળ|مقام|ಸ್ಥಳ|സ്ഥലം|ସ୍ଥାନ|ਸਥਾਨ|স্থান|where|कहाँ|কোথায়|ఎక్కడ|कुठे|எங்கே|ક્યાં|کہاں|ಎಲ್ಲಿ|എവിടെ|କେଉଁଠାରେ|ਕਿੱਥੇ|ক'ত)[\s:]*(?:is|है|কি|ఏమిటి|आहे|என்ன|છે|ہے|ಏನು|എന്താണ്|କଣ|ਹੈ|কি|at|पर|তে|లో|वर|ல்|માં|میں|ಯಲ್ಲಿ|ൽ|ରେ|ਵਿੱਚ|ত)?\s*([^,.\n]+)/i
    },
    { 
      key: 'dateTimeOfIncident', 
      labels: {
        hi: 'घटना की तारीख और समय',
        en: 'Date & Time of Incident',
        bn: 'ঘটনার তারিখ ও সময়',
        te: 'సంఘటన తేదీ మరియు సమయం',
        mr: 'घटनेची तारीख आणि वेळ',
        ta: 'சம்பவ தேதி மற்றும் நேரம்',
        gu: 'ઘટનાની તારીખ અને સમય',
        ur: 'واقعے کی تاریخ اور وقت',
        kn: 'ಘಟನೆಯ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ',
        ml: 'സംഭവ തീയതിയും സമയും',
        or: 'ଘଟଣାର ତାରିଖ ଏବଂ ସମୟ',
        pa: 'ਘਟਨਾ ਦੀ ਤਾਰੀਖ਼ ਅਤੇ ਸਮਾਂ',
        as: 'ঘটনাৰ তাৰিখ আৰু সময়'
      },
      questions: {
        hi: 'घटना कब हुई थी?',
        en: 'When did the incident occur?',
        bn: 'ঘটনা কখন ঘটেছিল?',
        te: 'సంఘటన ఎప్పుడు జరిగింది?',
        mr: 'घटना केव्हा घडली होती?',
        ta: 'சம்பவம் எப்போது நடந்தது?',
        gu: 'ઘટના ક્યારે બની હતી?',
        ur: 'واقعہ کب پیش آیا؟',
        kn: 'ಘಟನೆ ಯಾವಾಗ ನಡೆಯಿತು?',
        ml: 'സംഭവം എപ്പോൾ നടന്നു?',
        or: 'ଘଟଣା କେବେ ଘଟିଥିଲା?',
        pa: 'ਘਟਨਾ ਕਦੋਂ ਹੋਈ ਸੀ?',
        as: 'ঘটনা কেতিয়া সংঘটিত হৈছিল?'
      },
      extractPattern: /(?:when|कब|কখন|ఎప్పుడు|केव्हा|எப்போது|ક્યારે|کب|ಯಾವಾಗ|എപ്പോൾ|କେବେ|ਕਦੋਂ|কেতিয়া|date|तारीख|তারিখ|తేదీ|तारीख|தேதி|તારીખ|تاریخ|ದಿನಾಂಕ|തീയതി|ତାରିଖ|ਤਾਰੀਖ਼|তাৰিখ|time|समय|সময়|సమయం|वेळ|நேரம்|સમય|وقت|ಸಮಯ|സമയം|ସମୟ|ਸਮਾਂ|সময়)[\s:]*(?:is|है|কি|ఏమিటి|आहे|என்ன|છે|ہے|ಏನು|എന്താണ്|କଣ|ਹੈ|কি)?\s*([^,.\n]+)/i
    },
    { 
      key: 'witnesses', 
      labels: {
        hi: 'गवाह',
        en: 'Witnesses',
        bn: 'সাক্ষী',
        te: 'సాక్షులు',
        mr: 'साक्षीदार',
        ta: 'சாட்சிகள்',
        gu: 'સાક્ષીઓ',
        ur: 'گواہ',
        kn: 'ಸಾಕ್ಷಿಗಳು',
        ml: 'സാക്ഷികൾ',
        or: 'ସାକ୍ଷୀ',
        pa: 'ਗਵਾਹ',
        as: 'সাক্ষী'
      },
      questions: {
        hi: 'क्या कोई गवाह थे?',
        en: 'Were there any witnesses?',
        bn: 'কোনো সাক্ষী ছিল কি?',
        te: 'ఏదైనా సాక్షులు ఉన్నారా?',
        mr: 'काही साक्षीदार होते का?',
        ta: 'ஏதேனும் சாட்சிகள் இருந்தார்களா?',
        gu: 'કોઈ સાક્ષીઓ હતા?',
        ur: 'کیا کوئی گواہ تھے؟',
        kn: 'ಯಾವುದೇ ಸಾಕ್ಷಿಗಳು ಇದ್ದರೆ?',
        ml: 'എന്തെങ്കിലും സാക്ഷികൾ ഉണ്ടായിരുന്നോ?',
        or: 'କୌଣସି ସାକ୍ଷୀ ଥିଲେ କି?',
        pa: 'ਕੀ ਕੋਈ ਗਵਾਹ ਸਨ?',
        as: 'কোনো সাক্ষী আছিল নেকি?'
      },
      extractPattern: /(?:witness|गवाह|সাক্ষী|సాక్షులు|साक्षीदार|சாட்சிகள்|સાક્ષીઓ|گواہ|ಸಾಕ್ಷಿಗಳು|സാക്ഷികൾ|ସାକ୍ଷୀ|ਗਵਾਹ|সাক্ষী)[\s:]*(?:were|थे|ছিল|ఉన్నారు|होते|இருந்தார்கள்|હતા|تھے|ಇದ್ದರು|ഉണ്ടായിരുന്നു|ଥିଲେ|ਸਨ|আছিল|is|है|কি|ఏమిటి|आहे|என்ன|છે|ہے|ಏನು|എന്താണ്|କଣ|ਹੈ|কি)?\s*([^,.\n]+)/i
    },
    { 
      key: 'additionalInformation', 
      labels: {
        hi: 'अतिरिक्त जानकारी',
        en: 'Additional Information',
        bn: 'অতিরিক্ত তথ্য',
        te: 'అదనపు సమాచారం',
        mr: 'अतिरिक्त माहिती',
        ta: 'கூடுதல் தகவல்',
        gu: 'વધારાની માહિતી',
        ur: 'اضافی معلومات',
        kn: 'ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ',
        ml: 'അധിക വിവരങ്ങൾ',
        or: 'ଅତିରିକ୍ତ ସୂଚନା',
        pa: 'ਵਾਧੂ ਜਾਣਕਾਰੀ',
        as: 'অতিৰিক্ত তথ্য'
      },
      questions: {
        hi: 'कोई अतिरिक्त जानकारी?',
        en: 'Any additional information?',
        bn: 'কোনো অতিরিক্ত তথ্য?',
        te: 'ఏదైనా అదనపు సమాచారం?',
        mr: 'काही अतिरिक्त माहिती?',
        ta: 'ஏதேனும் கூடுதல் தகவல்?',
        gu: 'કોઈ વધારાની માહિતી?',
        ur: 'کوئی اضافی معلومات؟',
        kn: 'ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ?',
        ml: 'എന്തെങ്കിലും അധിക വിവരങ്ങൾ?',
        or: 'କୌଣସି ଅତିରିକ୍ତ ସୂଚନା?',
        pa: 'ਕੋਈ ਵਾਧੂ ਜਾਣਕਾਰੀ?',
        as: 'কোনো অতিৰিক্ত তথ্য?'
      },
      extractPattern: /(.+)/i
    }
  ];

  useEffect(() => {
    loadSavedFIRs();
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current && isRecognitionActive.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const loadSavedFIRs = async () => {
    try {
      const firs = await supabaseService.getFIRDrafts();
      setSavedFIRs(firs);
    } catch (error) {
      console.error('Error loading FIRs:', error);
    }
  };

  const askCurrentQuestion = async () => {
    if (currentQuestionIndex >= fields.length) return;
    
    setIsAskingQuestion(true);
    const currentFieldData = fields[currentQuestionIndex];
    setCurrentField(currentFieldData.key);
    const questionText = currentFieldData.questions[selectedLanguage as keyof typeof currentFieldData.questions] || currentFieldData.questions.en;
    
    console.log(`Asking question ${currentQuestionIndex + 1}: ${questionText}`);
    
    try {
     // Use text-to-speech to ask the question
     const audioUrl = await bhashiniService.textToSpeech(questionText, selectedLanguage);
     const audio = new Audio(audioUrl);
     audio.onended = () => setIsAskingQuestion(false);
     audio.play();
    } catch (error) {
      console.warn('TTS failed, using browser speech synthesis');
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(questionText);
        const langMap: { [key: string]: string } = {
          'hi': 'hi-IN', 'en': 'en-US', 'bn': 'bn-IN', 'te': 'te-IN',
          'mr': 'mr-IN', 'ta': 'ta-IN', 'gu': 'gu-IN', 'ur': 'ur-PK',
          'kn': 'kn-IN', 'ml': 'ml-IN', 'or': 'or-IN', 'pa': 'pa-IN', 'as': 'as-IN'
        };
        utterance.lang = langMap[selectedLanguage] || 'hi-IN';
        utterance.onend = () => setIsAskingQuestion(false);
        speechSynthesis.speak(utterance);
      } else {
        setIsAskingQuestion(false);
      }
    }
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < fields.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentInput('');
      // Don't auto-ask next question, let user control
    }
  };
  const initializeSpeechRecognition = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false; // Changed to false to prevent errors
      recognition.interimResults = true; // Show interim results
      recognition.maxAlternatives = 1;
      
      const langMap: { [key: string]: string } = {
        'hi': 'hi-IN', 'en': 'en-US', 'bn': 'bn-IN', 'te': 'te-IN',
        'mr': 'mr-IN', 'ta': 'ta-IN', 'gu': 'gu-IN', 'ur': 'ur-PK',
        'kn': 'kn-IN', 'ml': 'ml-IN', 'or': 'or-IN', 'pa': 'pa-IN', 'as': 'as-IN'
      };
      
      recognition.lang = langMap[selectedLanguage] || 'hi-IN';

      recognition.onstart = () => {
        isRecognitionActive.current = true;
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update current input with both final and interim results
        const fullTranscript = finalTranscript + interimTranscript;
        setCurrentInput(fullTranscript);
      };

      recognition.onend = () => {
        isRecognitionActive.current = false;
        console.log('Speech recognition ended');
        
        // Auto-restart if user hasn't stopped manually and still wants to listen
        if (isListeningRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && !isRecognitionActive.current && isListeningRef.current) {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.log('Recognition restart failed:', error);
                setIsListening(false);
                isListeningRef.current = false;
              }
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecognitionActive.current = false;
        
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setIsListening(false);
          isListeningRef.current = false;
          alert('Microphone access denied. Please allow microphone access in your browser settings and try again.');
        } else if (event.error === 'no-speech' || event.error === 'aborted') {
          console.log('No speech detected, but continuing...');
          // Let onend handler manage the restart
        } else if (event.error === 'network') {
          setIsListening(false);
          isListeningRef.current = false;
          alert('Network error: Please check your internet connection and try again.');
        } else {
          setIsListening(false);
          isListeningRef.current = false;
          alert(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported');
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  };

  const startListening = () => {
    // Initialize if not already done
    if (!recognitionRef.current) {
      initializeSpeechRecognition();
    }
    
    if (recognitionRef.current && !isRecognitionActive.current) {
      const langMap: { [key: string]: string } = {
        'hi': 'hi-IN', 'en': 'en-US', 'bn': 'bn-IN', 'te': 'te-IN',
        'mr': 'mr-IN', 'ta': 'ta-IN', 'gu': 'gu-IN', 'ur': 'ur-PK',
        'kn': 'kn-IN', 'ml': 'ml-IN', 'or': 'or-IN', 'pa': 'pa-IN', 'as': 'as-IN'
      };
      recognitionRef.current.lang = langMap[selectedLanguage] || 'hi-IN';
      
      try {
        setCurrentInput(''); // Clear previous input
        setIsListening(true);
        isListeningRef.current = true;
        recognitionRef.current.start();
        console.log('Starting speech recognition...');
      } catch (error) {
        console.error('Could not start speech recognition:', error);
        isRecognitionActive.current = false;
        setIsListening(false);
        isListeningRef.current = false;
        
        if (error instanceof Error && error.name === 'InvalidStateError') {
          // Recognition is already running, stop and restart
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            setTimeout(() => {
              if (recognitionRef.current) {
                recognitionRef.current.start();
              }
            }, 100);
          }
        } else {
          alert('Microphone access error. Please allow microphone access and try again.');
        }
      }
    } else if (isRecognitionActive.current) {
      console.log('Recognition already active');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    isListeningRef.current = false;
    if (recognitionRef.current && isRecognitionActive.current) {
      recognitionRef.current.stop();
      isRecognitionActive.current = false;
    }
  };

  const extractKeywords = (text: string, fieldKey: string): string => {
    const cleanText = text.trim().toLowerCase();
    
    switch (fieldKey) {
      case 'fullName':
        // Extract name patterns
        const namePatterns = [
          /(?:my name is|मेरा नाम है|मेरा नाम|name is|नाम है)\s+(.+?)(?:\s|$)/i,
          /(?:i am|मैं हूं|मैं|main hun)\s+(.+?)(?:\s|$)/i,
          /^(.+?)(?:\s+है|$)/i // Fallback for direct name
        ];
        for (const pattern of namePatterns) {
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            return match[1].trim().replace(/\b\w/g, l => l.toUpperCase()); // Capitalize
          }
        }
        return cleanText.replace(/\b\w/g, l => l.toUpperCase());
        
      case 'age':
        const agePatterns = [
          /(?:i am|मैं|main)\s+(\d+)\s*(?:years old|साल का|साल की|years|साल)/i,
          /(?:my age is|मेरी उम्र है|उम्र है|age is)\s+(\d+)/i,
          /(\d+)\s*(?:years old|साल का|साल की|years|साल)/i,
          /(\d+)/i // Fallback for just numbers
        ];
        for (const pattern of agePatterns) {
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
        return cleanText;
        
      case 'address':
        const addressPatterns = [
          /(?:my address is|मेरा पता है|मेरा पता|address is|पता है)\s+(.+)/i,
          /(?:i live at|मैं रहता हूं|मैं रहती हूं|live at|रहता हूं)\s+(.+)/i,
          /(.+)/i // Fallback for full text
        ];
        for (const pattern of addressPatterns) {
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return cleanText;
        
      case 'dateOfBirth':
        const dobPatterns = [
          /(?:born on|जन्म|birth|जन्म तिथि)\s*(?:is|है)?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
          /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i
        ];
        for (const pattern of dobPatterns) {
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
        return cleanText;
        
      case 'incidentType':
        const incidentPatterns = [
          /(?:incident type is|घटना का प्रकार|incident is|घटना है)\s+(.+)/i,
          /(?:it was|यह था|this was)\s+(.+)/i,
          /(.+)/i // Fallback
        ];
        for (const pattern of incidentPatterns) {
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return cleanText;
        
      case 'locationOfIncident':
        const locationPatterns = [
          /(?:incident happened at|घटना हुई|happened at|occurred at|हुई)\s+(.+)/i,
          /(?:location is|स्थान है|at|पर)\s+(.+)/i,
          /(.+)/i // Fallback
        ];
        for (const pattern of locationPatterns) {
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return cleanText;
        
      case 'dateTimeOfIncident':
        const dateTimePatterns = [
          /(?:incident happened on|घटना हुई|happened on|occurred on)\s+(.+)/i,
          /(?:on|पर|at|में)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}.*)/i,
          /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}.*)/i
        ];
        for (const pattern of dateTimePatterns) {
          const match = cleanText.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return cleanText;
        
      case 'witnesses':
        const witnessPatterns = [
          /(?:witnesses were|गवाह थे|witnesses are|गवाह हैं)\s+(.+)/i,
          /(?:yes|हां|han)\s*,?\s*(.+)/i,
          /(?:no|नहीं|nahi)/i,
          /(.+)/i // Fallback
        ];
        for (const pattern of witnessPatterns) {
          const match = cleanText.match(pattern);
          if (match) {
            if (pattern.source.includes('no|नहीं|nahi')) {
              return 'No witnesses';
            }
            if (match[1]) {
              return match[1].trim();
            }
          }
        }
        return cleanText;
        
      default:
        // For description fields, return full text
        return text.trim();
    }
  };

  const handleFieldUpdate = async (fieldKey: string, value: string) => {
    if (!value.trim()) return;

    const extractedText = extractKeywords(value.trim(), fieldKey);
    
    // Update local language form
    setFormDataLocal(prev => ({
      ...prev,
      [fieldKey]: extractedText
    }));

    // Translate to English
    let englishText = extractedText;
    if (selectedLanguage !== 'en') {
      try {
        englishText = await bhashiniService.translateText(extractedText, selectedLanguage, 'en');
      } catch (error) {
        console.warn('Translation failed, using original text:', error);
      }
    }

    // Update English form
    setFormDataEnglish(prev => ({
      ...prev,
      [fieldKey]: englishText
    }));
  };

  const processVoiceInput = async (text: string, fieldKey: string) => {
    if (!text.trim()) return;
    
    const field = fields.find(f => f.key === fieldKey);
    if (!field) return;
    
    let extractedValue = '';
    
    // Extract value using the field's pattern
    const match = text.match(field.extractPattern);
    if (match) {
      extractedValue = match[1].trim();
    } else {
      // If no pattern match, use the entire response for description fields
      if (field.key === 'incidentDescription' || field.key === 'additionalInformation') {
        extractedValue = text.trim();
      } else {
        // For other fields, try to extract meaningful content
        extractedValue = text.replace(/^(my|मेरा|मेरी|the|यह|है|is)\s*/i, '').trim();
      }
    }
    
    if (extractedValue) {
      await handleFieldUpdate(field.key, extractedValue);
      
      // Move to next question after a short delay
      setTimeout(() => {
        moveToNextQuestion();
      }, 2000);
    }
  };

  const extractFromFullText = () => {
    if (!currentInput.trim()) return;
    
    let extractedCount = 0;
    
    fields.forEach(field => {
      const match = currentInput.match(field.extractPattern);
      if (match && match[1]) {
        const extractedValue = match[1].trim();
        if (extractedValue && extractedValue.length > 0) {
          handleFieldUpdate(field.key, extractedValue);
          extractedCount++;
        }
      }
    });
    
    // Show success message
    if (extractedCount > 0) {
      setSuccessMessage(
        selectedLanguage === 'en' 
          ? `Successfully extracted information for ${extractedCount} field(s)!`
          : selectedLanguage === 'hi'
          ? `${extractedCount} फील्ड(s) के लिए जानकारी सफलतापूर्वक निकाली गई!`
          : selectedLanguage === 'bn'
          ? `${extractedCount} ক্ষেত্রের জন্য তথ্য সফলভাবে বের করা হয়েছে!`
          : selectedLanguage === 'te'
          ? `${extractedCount} ఫీల్డ్(లకు) సమాచారం విజయవంతంగా సేకరించబడింది!`
          : selectedLanguage === 'mr'
          ? `${extractedCount} क्षेत्रासाठी माहिती यशस्वीरित्या काढली गेली!`
          : selectedLanguage === 'ta'
          ? `${extractedCount} புலத்திற்கான தகவல் வெற்றிகரமாக பிரித்தெடுக்கப்பட்டது!`
          : selectedLanguage === 'gu'
          ? `${extractedCount} ફીલ્ડ(ઓ) માટે માહિતી સફળતાપૂર્વક કાઢવામાં આવી!`
          : selectedLanguage === 'ur'
          ? `${extractedCount} فیلڈ(ز) کے لیے معلومات کامیابی سے نکالی گئی!`
          : selectedLanguage === 'kn'
          ? `${extractedCount} ಕ್ಷೇತ್ರ(ಗಳ) ಮಾಹಿತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಹೊರತೆಗೆಯಲಾಗಿದೆ!`
          : selectedLanguage === 'ml'
          ? `${extractedCount} ഫീൽഡ്(കൾ) വിവരങ്ങൾ വിജയകരമായി എക്സ്ട്രാക്റ്റ് ചെയ്തു!`
          : selectedLanguage === 'or'
          ? `${extractedCount} କ୍ଷେତ୍ର(ଗୁଡ଼ିକ) ପାଇଁ ସୂଚନା ସଫଳଭାବେ ବାହାର କରାଯାଇଛି!`
          : selectedLanguage === 'pa'
          ? `${extractedCount} ਫੀਲਡ(ਾਂ) ਲਈ ਜਾਣਕਾਰੀ ਸਫਲਤਾਪੂਰਵਕ ਕੱਢੀ ਗਈ!`
          : selectedLanguage === 'as'
          ? `${extractedCount} ক্ষেত্ৰৰ বাবে তথ্য সফলভাৱে উলিওৱা হৈছে!`
          : `Successfully extracted information for ${extractedCount} field(s)!`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
      setCurrentInput(''); // Clear the input after extraction
    } else {
      setError(
        selectedLanguage === 'en' 
          ? 'No extractable information found. Please check your text format.'
          : selectedLanguage === 'hi'
          ? 'कोई निकालने योग्य जानकारी नहीं मिली। कृपया अपने टेक्स्ट प्रारूप की जांच करें।'
          : selectedLanguage === 'bn'
          ? 'কোনো বের করার যোগ্য তথ্য পাওয়া যায়নি। অনুগ্রহ করে আপনার টেক্সট ফরম্যাট চেক করুন।'
          : selectedLanguage === 'te'
          ? 'వెలికితీయదగిన సమాచారం కనుగొనబడలేదు. దయచేసి మీ టెక్స్ట్ ఫార్మాట్ను తనిఖీ చేయండి।'
          : selectedLanguage === 'mr'
          ? 'काढण्यासारखी माहिती सापडली नाही. कृपया तुमचे मजकूर स्वरूप तपासा.'
          : selectedLanguage === 'ta'
          ? 'பிரித்தெடுக்கக்கூடிய தகவல் எதுவும் கிடைக்கவில்லை. உங்கள் உரை வடிவமைப்பைச் சரிபார்க்கவும்.'
          : selectedLanguage === 'gu'
          ? 'કોઈ કાઢી શકાય તેવી માહિતી મળી નથી. કૃપા કરીને તમારું ટેક્સ્ટ ફોર્મેટ તપાસો.'
          : selectedLanguage === 'ur'
          ? 'کوئی قابل نکالنے والی معلومات نہیں ملیں۔ براہ کرم اپنے ٹیکسٹ فارمیٹ کو چیک کریں۔'
          : selectedLanguage === 'kn'
          ? 'ಯಾವುದೇ ಹೊರತೆಗೆಯಬಹುದಾದ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪಠ್ಯ ಸ್ವರೂಪವನ್ನು ಪರಿಶೀಲಿಸಿ.'
          : selectedLanguage === 'ml'
          ? 'എക്സ്ട്രാക്റ്റ് ചെയ്യാവുന്ന വിവരങ്ങളൊന്നും കണ്ടെത്താനായില്ല. നിങ്ങളുടെ ടെക്സ്റ്റ് ഫോർമാറ്റ് പരിശോധിക്കുക.'
          : selectedLanguage === 'or'
          ? 'କୌଣସି ବାହାର କରିବାଯୋଗ୍ୟ ସୂଚନା ମିଳିଲା ନାହିଁ। ଦୟାକରି ଆପଣଙ୍କର ପାଠ୍ୟ ଫର୍ମାଟ୍ ଯାଞ୍ଚ କରନ୍ତୁ।'
          : selectedLanguage === 'pa'
          ? 'ਕੋਈ ਕੱਢਣਯੋਗ ਜਾਣਕਾਰੀ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਟੈਕਸਟ ਫਾਰਮੈਟ ਦੀ ਜਾਂਚ ਕਰੋ।'
          : selectedLanguage === 'as'
          ? 'কোনো উলিয়াব পৰা তথ্য পোৱা নগল। অনুগ্ৰহ কৰি আপোনাৰ টেক্সট ফৰমেট পৰীক্ষা কৰক।'
          : 'No extractable information found. Please check your text format.'
      );
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      const caseId = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const savedData = await supabaseService.saveFIRDraft(formDataLocal, formDataEnglish, selectedLanguage, 'draft');
      
      if (savedData) {
        addActivity('fir', `FIR Draft Saved - ${caseId}`, caseId, {
          status: 'draft',
          language: selectedLanguage,
          completedFields: Object.values(formDataLocal).filter(v => v.trim() !== '').length,
          totalFields: Object.keys(formDataLocal).length
        });
        
        await loadSavedFIRs();
        console.log('Draft saved successfully');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFIRPDF = (formData: FIRFormData, caseId: string): Blob => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FIRST INFORMATION REPORT (FIR)', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Case ID: ${caseId}`, 105, 30, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let yPosition = 50;
    const lineHeight = 8;
    const leftMargin = 20;
    const pageWidth = 170;
    
    const pdfFields = [
      { label: 'Full Name', value: formData.fullName },
      { label: 'Age', value: formData.age + ' years' },
      { label: 'Address', value: formData.address },
      { label: 'Date of Birth', value: formData.dateOfBirth },
      { label: 'Incident Type', value: formData.incidentType },
      { label: 'Incident Description', value: formData.incidentDescription },
      { label: 'Location of Incident', value: formData.locationOfIncident },
      { label: 'Date & Time of Incident', value: formData.dateTimeOfIncident },
      { label: 'Witnesses', value: formData.witnesses },
      { label: 'Additional Information', value: formData.additionalInformation }
    ];
    
    pdfFields.forEach(field => {
      if (field.value) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${field.label}:`, leftMargin, yPosition);
        
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(field.value, pageWidth - 40);
        doc.text(lines, leftMargin + 40, yPosition);
        
        yPosition += lineHeight * Math.max(1, lines.length) + 3;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      }
    });
    
    yPosition += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated by SmartCop AI System', leftMargin, yPosition);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, leftMargin, yPosition + 5);
    
    return doc.output('blob');
  };

  const handleSubmitFIR = async () => {
    try {
      setIsLoading(true);
      const caseId = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      const firData = await supabaseService.saveFIRDraft(formDataLocal, formDataEnglish, selectedLanguage, 'submitted');
      
      if (firData) {
        // Generate PDF with the case ID from the saved data or use the generated one
        const actualCaseId = (firData as any)?.case_id || caseId;
        const pdfBlob = generateFIRPDF(formDataEnglish, actualCaseId);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FIR_${actualCaseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addActivity('fir', `FIR Submitted - ${actualCaseId}`, actualCaseId, {
          status: 'submitted',
          language: selectedLanguage,
          pdfGenerated: true,
          submittedToSupabase: true,
          incidentType: formDataEnglish.incidentType,
          complainantName: formDataEnglish.fullName
        });

        await loadSavedFIRs();
        
        // Reset form
        setFormDataLocal({
          fullName: '', age: '', address: '', dateOfBirth: '', incidentType: '',
          incidentDescription: '', locationOfIncident: '', dateTimeOfIncident: '',
          witnesses: '', additionalInformation: ''
        });
        setFormDataEnglish({
          fullName: '', age: '', address: '', dateOfBirth: '', incidentType: '',
          incidentDescription: '', locationOfIncident: '', dateTimeOfIncident: '',
          witnesses: '', additionalInformation: ''
        });
        setCurrentInput('');
        
        // Generate case ID if not present
        const currentCaseId = (firData as any)?.case_id || caseId;
        
        setSuccessMessage(`FIR submitted successfully! Case ID: ${currentCaseId}`);
        setTimeout(() => setSuccessMessage(''), 5000);
        
        console.log('FIR submitted successfully and PDF downloaded');
      }
    } catch (error) {
      console.error('Submit FIR error:', error);
      setError('Failed to submit FIR. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFIR = (fir: FIRDraft) => {
    if (fir.status === 'submitted') {
      const pdfBlob = generateFIRPDF(fir.form_data_english, fir.case_id);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FIR_${fir.case_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const dataStr = JSON.stringify(fir, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FIR_Draft_${fir.case_id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSendVoiceResponse = async () => {
    if (!currentInput.trim()) return;
    
    const currentField = fields[currentQuestionIndex];
    if (currentField) {
      await processVoiceInput(currentInput, currentField.key);
      setCurrentInput('');
    }
  };

  const filteredFIRs = savedFIRs.filter(fir =>
    fir.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fir.form_data_english.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fir.form_data_english.incidentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Step 0: Language Selection
  if (currentStep === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{translations[selectedLanguage as keyof typeof translations]?.title || translations.en.title}</h2>
          <p className="text-gray-600">{translations[selectedLanguage as keyof typeof translations]?.selectLanguage || translations.en.selectLanguage}</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{translations[selectedLanguage as keyof typeof translations]?.chooseLanguage || translations.en.chooseLanguage}</h3>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          >
            {INDIAN_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentStep(1)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            {translations[selectedLanguage as keyof typeof translations]?.continue || translations.en.continue}
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Input Method Selection
  if (currentStep === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {translations[selectedLanguage as keyof typeof translations]?.chooseInputMethod || translations.en.chooseInputMethod}
          </h2>
          <p className="text-gray-600">
            {translations[selectedLanguage as keyof typeof translations]?.howToProvideInfo || translations.en.howToProvideInfo}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => {
              setInputMethod('voice');
              setCurrentStep(2);
            }}
            className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Mic className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {translations[selectedLanguage as keyof typeof translations]?.voiceInput || translations.en.voiceInput}
            </h3>
            <p className="text-gray-600">
              {translations[selectedLanguage as keyof typeof translations]?.speakResponses || translations.en.speakResponses}
            </p>
          </button>

          <button
            onClick={() => {
              setInputMethod('text');
              setCurrentStep(2);
            }}
            className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {translations[selectedLanguage as keyof typeof translations]?.textInput || translations.en.textInput}
            </h3>
            <p className="text-gray-600">
              {translations[selectedLanguage as keyof typeof translations]?.typeResponses || translations.en.typeResponses}
            </p>
          </button>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentStep(0)}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {translations[selectedLanguage as keyof typeof translations]?.back || translations.en.back}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: FIR Form
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {translations[selectedLanguage as keyof typeof translations]?.firInformation || translations.en.firInformation}
            </h2>
            <p className="text-gray-600">
              {translations[selectedLanguage as keyof typeof translations]?.fillDetails || translations.en.fillDetails}
            </p>
          </div>
          <button
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {translations[selectedLanguage as keyof typeof translations]?.changeInputMethod || translations.en.changeInputMethod}
          </button>
        </div>

        {/* Success and Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Voice/Text Input Section */}
        {inputMethod === 'voice' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {translations[selectedLanguage as keyof typeof translations]?.voiceInputAnswerQuestions || translations.en.voiceInputAnswerQuestions}
                </h3>
                <p className="text-sm text-blue-600 mt-1">
                  {translations[selectedLanguage as keyof typeof translations]?.currentQuestion || translations.en.currentQuestion} {currentQuestionIndex + 1}/{fields.length}: {fields[currentQuestionIndex]?.questions[selectedLanguage as keyof typeof fields[0]['questions']] || fields[currentQuestionIndex]?.questions.en}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={askCurrentQuestion}
                  disabled={isAskingQuestion}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {translations[selectedLanguage as keyof typeof translations]?.repeatQuestion || translations.en.repeatQuestion}
                </button>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  {isListening 
                    ? (translations[selectedLanguage as keyof typeof translations]?.stopListening || translations.en.stopListening)
                    : (translations[selectedLanguage as keyof typeof translations]?.startListening || translations.en.startListening)
                  }
                </button>
                <button
                  onClick={moveToNextQuestion}
                  disabled={currentQuestionIndex >= fields.length - 1}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {translations[selectedLanguage as keyof typeof translations]?.nextQuestion || translations.en.nextQuestion}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={selectedLanguage === 'en' ? 'Your voice response will appear here...' : 'आपका आवाज़ उत्तर यहाँ दिखाई देगा...'}
                className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
              <button
                onClick={() => handleSendVoiceResponse()}
                disabled={!currentInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
            
            {currentField && (
              <p className="text-sm text-blue-600 mt-2">
                {selectedLanguage === 'en' 
                  ? `Currently answering: ${fields.find(f => f.key === currentField)?.labels.en}`
                  : `वर्तमान में उत्तर दे रहे हैं: ${fields.find(f => f.key === currentField)?.labels.hi}`
                }
              </p>
            )}
            
            <p className="text-sm text-gray-600 mb-4">
              {selectedLanguage === 'en'
                ? 'Instructions: 1) Click "Ask Question" to hear question 2) Click "Start Listening" 3) Speak your answer unlimited 4) Click "Send" when done'
                : 'निर्देश: 1) "प्रश्न पूछें" दबाएं प्रश्न सुनने के लिए 2) "सुनना शुरू करें" दबाएं 3) असीमित अपना उत्तर बोलें 4) पूरा होने पर "Send" दबाएं'
              }
            </p>
            
            {isListening && (
              <p className="text-sm text-green-600 font-medium mt-2">
                🎤 {selectedLanguage === 'en' ? 'Listening for your answer...' : 'आपका उत्तर सुन रहा हूँ...'}
              </p>
            )}
            
            {isAskingQuestion && (
              <p className="text-sm text-blue-600 font-medium mt-2">
                🔊 {selectedLanguage === 'en' ? 'Asking question...' : 'प्रश्न पूछ रहा हूँ...'}
              </p>
            )}
          </div>
        )}

        {inputMethod === 'text' && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {translations[selectedLanguage as keyof typeof translations]?.textInput || translations.en.textInput}
            </h3>
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={
                selectedLanguage === 'en' 
                  ? 'Type your information here...' 
                  : selectedLanguage === 'hi'
                  ? 'यहाँ अपनी जानकारी टाइप करें...'
                  : selectedLanguage === 'bn'
                  ? 'এখানে আপনার তথ্য টাইপ করুন...'
                  : selectedLanguage === 'te'
                  ? 'మీ సమాచారాన్ని ఇక్కడ టైప్ చేయండి...'
                  : selectedLanguage === 'mr'
                  ? 'तुमची माहिती येथे टाइप करा...'
                  : selectedLanguage === 'ta'
                  ? 'உங்கள் தகவலை இங்கே தட்டச்சு செய்யுங்கள்...'
                  : selectedLanguage === 'gu'
                  ? 'તમારી માહિતી અહીં ટાઈપ કરો...'
                  : selectedLanguage === 'ur'
                  ? 'اپنی معلومات یہاں ٹائپ کریں...'
                  : selectedLanguage === 'kn'
                  ? 'ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...'
                  : selectedLanguage === 'ml'
                  ? 'നിങ്ങളുടെ വിവരങ്ങൾ ഇവിടെ ടൈപ്പ് ചെയ്യുക...'
                  : selectedLanguage === 'or'
                  ? 'ଆପଣଙ୍କର ସୂଚନା ଏଠାରେ ଟାଇପ୍ କରନ୍ତୁ...'
                  : selectedLanguage === 'pa'
                  ? 'ਆਪਣੀ ਜਾਣਕਾਰੀ ਇੱਥੇ ਟਾਈਪ ਕਰੋ...'
                  : selectedLanguage === 'as'
                  ? 'আপোনাৰ তথ্য ইয়াত টাইপ কৰক...'
                  : 'Type your information here...'
              }
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={extractFromFullText}
                disabled={!currentInput.trim() || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <FileText size={16} />
                {
                  selectedLanguage === 'en' 
                    ? 'Extract from Text'
                    : selectedLanguage === 'hi'
                    ? 'टेक्स्ट से निकालें'
                    : selectedLanguage === 'bn'
                    ? 'টেক্সট থেকে বের করুন'
                    : selectedLanguage === 'te'
                    ? 'టెక్స్ట్ నుండి సేకరించండి'
                    : selectedLanguage === 'mr'
                    ? 'मजकूरातून काढा'
                    : selectedLanguage === 'ta'
                    ? 'உரையிலிருந்து பிரித்தெடுக்கவும்'
                    : selectedLanguage === 'gu'
                    ? 'ટેક્સ્ટમાંથી કાઢો'
                    : selectedLanguage === 'ur'
                    ? 'ٹیکسٹ سے نکالیں'
                    : selectedLanguage === 'kn'
                    ? 'ಪಠ್ಯದಿಂದ ಹೊರತೆಗೆಯಿರಿ'
                    : selectedLanguage === 'ml'
                    ? 'ടെക്സ്റ്റിൽ നിന്ന് എക്സ്ട്രാക്റ്റ് ചെയ്യുക'
                    : selectedLanguage === 'or'
                    ? 'ପାଠ୍ୟରୁ ବାହାର କରନ୍ତୁ'
                    : selectedLanguage === 'pa'
                    ? 'ਟੈਕਸਟ ਤੋਂ ਕੱਢੋ'
                    : selectedLanguage === 'as'
                    ? 'টেক্সটৰ পৰা উলিয়াওক'
                    : 'Extract from Text'
                }
              </button>
              <button
                onClick={() => setCurrentInput('')}
                disabled={!currentInput.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {
                  selectedLanguage === 'en' 
                    ? 'Clear Text'
                    : selectedLanguage === 'hi'
                    ? 'टेक्स्ट साफ करें'
                    : selectedLanguage === 'bn'
                    ? 'টেক্সট সাফ করুন'
                    : selectedLanguage === 'te'
                    ? 'టెక్స్ట్ క్లియర్ చేయండి'
                    : selectedLanguage === 'mr'
                    ? 'मजकूर साफ करा'
                    : selectedLanguage === 'ta'
                    ? 'உரையை அழிக்கவும்'
                    : selectedLanguage === 'gu'
                    ? 'ટેક્સ્ટ સાફ કરો'
                    : selectedLanguage === 'ur'
                    ? 'ٹیکسٹ صاف کریں'
                    : selectedLanguage === 'kn'
                    ? 'ಪಠ್ಯವನ್ನು ತೆರವುಗೊಳಿಸಿ'
                    : selectedLanguage === 'ml'
                    ? 'ടെക്സ്റ്റ് ക്ലിയർ ചെയ്യുക'
                    : selectedLanguage === 'or'
                    ? 'ପାଠ୍ୟ ସଫା କରନ୍ତୁ'
                    : selectedLanguage === 'pa'
                    ? 'ਟੈਕਸਟ ਸਾਫ਼ ਕਰੋ'
                    : selectedLanguage === 'as'
                    ? 'টেক্সট চাফা কৰক'
                    : 'Clear Text'
                }
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Save size={20} />
            {isLoading ? (selectedLanguage === 'en' ? 'Saving...' : 'सेव हो रहा है...') : (selectedLanguage === 'en' ? 'Save Draft' : 'ड्राफ्ट सेव करें')}
          </button>
          
          <button
            onClick={handleSubmitFIR}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <FileText size={20} />
            {isLoading ? (selectedLanguage === 'en' ? 'Submitting...' : 'जमा हो रहा है...') : (selectedLanguage === 'en' ? 'Submit FIR' : 'FIR जमा करें')}
          </button>
        </div>
      </div>

      {/* Dual Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Language Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {translations[selectedLanguage as keyof typeof translations]?.form || translations.en.form} ({INDIAN_LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName})
          </h3>
          
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.labels[selectedLanguage as keyof typeof field.labels] || field.labels.en}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formDataLocal[field.key as keyof FIRFormData]}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormDataLocal(prev => ({ ...prev, [field.key]: value }));
                      handleFieldUpdate(field.key, value);
                    }}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={field.questions[selectedLanguage as keyof typeof field.questions] || field.questions.en}
                  />
                  {inputMethod === 'text' && (
                    <button
                      onClick={() => {
                        setCurrentField(field.key);
                        if (currentInput.trim()) {
                          handleFieldUpdate(field.key, currentInput);
                          setCurrentInput('');
                        }
                      }}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      title={`Fill ${field.labels.en} from text input`}
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* English Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Form (English)</h3>
          
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.labels.en}
                </label>
                <input
                  type="text"
                  value={formDataEnglish[field.key as keyof FIRFormData]}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder={field.questions.en}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Saved FIRs Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {selectedLanguage === 'en' ? 'Saved FIRs' : 'सेव किए गए FIR'}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={selectedLanguage === 'en' ? 'Search FIRs...' : 'FIR खोजें...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredFIRs.map((fir) => (
            <div key={fir.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">{fir.case_id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    fir.status === 'submitted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fir.status === 'submitted' 
                      ? (selectedLanguage === 'en' ? 'Submitted' : 'जमा किया गया')
                      : (selectedLanguage === 'en' ? 'Draft' : 'ड्राफ्ट')
                    }
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadFIR(fir)}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                      fir.status === 'submitted'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Download size={16} />
                    {fir.status === 'submitted' ? 'PDF' : 'JSON'}
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>{selectedLanguage === 'en' ? 'Name:' : 'नाम:'}</strong> {fir.form_data_english.fullName}</p>
                <p><strong>{selectedLanguage === 'en' ? 'Incident:' : 'घटना:'}</strong> {fir.form_data_english.incidentType}</p>
                <p><strong>{selectedLanguage === 'en' ? 'Created:' : 'बनाया गया:'}</strong> {new Date(fir.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          
          {filteredFIRs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm 
                ? (selectedLanguage === 'en' ? 'No FIRs found matching your search.' : 'आपकी खोज से मेल खाने वाला कोई FIR नहीं मिला।')
                : (selectedLanguage === 'en' ? 'No saved FIRs yet.' : 'अभी तक कोई FIR सेव नहीं किया गया।')
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FIRDrafting;