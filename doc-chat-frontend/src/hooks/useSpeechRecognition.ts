import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  text: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetText: () => void;
  setText: (text: string) => void;
  hasRecognitionSupport: boolean;
  errorMessage: string | null;
}

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [text, setText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Store the latest transcript to avoid setText in the recognition callback causing effect reruns
  const latestTextRef = useRef<string>('');
  
  // Log text changes
  useEffect(() => {
    if (text) {
      console.log('🎤 Current speech text:', text);
    }
    latestTextRef.current = text;
  }, [text]);
  
  // Initialize speech recognition (run once)
  useEffect(() => {
    console.log('🎤 Setting up speech recognition');
    // Check for browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      setHasRecognitionSupport(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR';
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Clear any previous errors when we get results
        if (errorMessage) {
          setErrorMessage(null);
        }
        
        let newTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          newTranscript += event.results[i][0].transcript;
        }
        
        console.log('🎤 Speech recognition event received:', event.results.length, 'results');
        // Detailed logging for debugging
        for (let i = 0; i < event.results.length; i++) {
          console.log(`🎤 Detail - Result [${i}]: "${event.results[i][0].transcript}" (isFinal: ${event.results[i].isFinal}, confidence: ${event.results[i][0].confidence ? event.results[i][0].confidence.toFixed(2) : 'N/A'})`);
        }
        
        setText(newTranscript);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('🎤 Speech recognition error:', event.error);
        
        // Handle specific error types
        switch (event.error) {
          case 'network':
            setErrorMessage("Problème de connexion réseau. Vérifiez votre connexion Internet.");
            console.log('🎤 Network error - speech recognition requires internet connection');
            break;
          case 'no-speech':
            setErrorMessage("Aucune parole détectée. Veuillez parler plus fort.");
            console.log('🎤 No speech detected');
            break;
          case 'not-allowed':
          case 'permission-denied':
            setErrorMessage("Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
            console.log('🎤 Microphone permission denied');
            break;
          case 'audio-capture':
            setErrorMessage("Microphone non détecté. Vérifiez votre microphone.");
            console.log('🎤 No microphone detected');
            break;
          case 'aborted':
            // This is normal when stopping, don't show error
            console.log('🎤 Recognition aborted');
            break;
          default:
            setErrorMessage(`Erreur de reconnaissance vocale: ${event.error}`);
            break;
        }
        
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('🎤 Speech recognition session ended');
        
        // Only try to restart if we're still in listening mode and it wasn't explicitly stopped
        if (isListening) {
          try {
            // Add a small delay before restarting to prevent rapid cycling
            setTimeout(() => {
              if (isListening && recognitionRef.current) {
                recognitionRef.current.start();
                console.log('🎤 Speech recognition restarted after delay');
              }
            }, 1000);
          } catch (error) {
            console.error('🎤 Error restarting recognition:', error);
            setIsListening(false);
          }
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        console.log('🎤 Cleaning up speech recognition instance');
        try {
          recognitionRef.current.stop();
          console.log('🎤 Speech recognition stopped on final cleanup');
        } catch (error) {
          console.error('🎤 Error stopping recognition on cleanup:', error);
        }
      }
    };
  }, []); // Empty dependencies - run once
  
  // Handle listening state changes
  useEffect(() => {
    console.log('🎤 Listening state changed to:', isListening);
    
    // Clear error message when starting listening again
    if (isListening && errorMessage) {
      setErrorMessage(null);
    }
    
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        console.log('🎤 Speech recognition started due to isListening change');
      } catch (error) {
        // DOMException: Failed to execute 'start' on 'SpeechRecognition': recognition has already started.
        if (error instanceof DOMException && error.message.includes('already started')) {
          console.log('🎤 Recognition was already running');
        } else {
          console.error('🎤 Error starting speech recognition:', error);
          setIsListening(false);
          setErrorMessage("Erreur au démarrage de la reconnaissance vocale. Veuillez réessayer.");
        }
      }
    } else if (!isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('🎤 Speech recognition stopped due to isListening change');
      } catch (error) {
        console.error('🎤 Error stopping speech recognition:', error);
      }
    }
  }, [isListening, errorMessage]);
  
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setErrorMessage(null); // Clear previous errors
        console.log("🎤 Speech recognition started");
      } catch (error: any) {
        console.error('🎤 Error starting speech recognition:', error);
      }
    }
  }, [isListening]);
  
  const stopListening = useCallback(() => {
    console.log('🎤 Stop listening called');
    if (!recognitionRef.current) {
      console.log('🎤 No recognition instance available');
      return;
    }
    
    setIsListening(false);
  }, []);
  
  const resetText = useCallback(() => {
    setText('');
    console.log("🎤 Text reset");
  }, []);
  
  return {
    text,
    isListening,
    startListening,
    stopListening,
    resetText,
    setText,
    hasRecognitionSupport,
    errorMessage
  };
};

export default useSpeechRecognition;