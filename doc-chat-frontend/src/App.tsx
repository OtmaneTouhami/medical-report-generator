import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatProvider>
            <ChatInterface />
          </ChatProvider>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App