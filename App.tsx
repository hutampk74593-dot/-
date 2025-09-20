import React, { useState, useCallback, FormEvent } from 'react';
import { marked } from 'marked';
import { getFinancialTermDefinition } from './services/geminiService';

// --- Helper Components (Defined outside the main App component) ---

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6">
    <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
      <i className="fa-solid fa-book-open-reader mr-3"></i>
      AI 금융 용어 사전
    </h1>
    <p className="text-gray-400 mt-2">최신 금융 단어의 뜻을 AI에게 물어보세요.</p>
  </header>
);

interface SearchFormProps {
  isLoading: boolean;
  onSubmit: (term: string) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ isLoading, onSubmit }) => {
  const [term, setTerm] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!term.trim() || isLoading) return;
    onSubmit(term.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex items-center border-b-2 border-blue-400 py-2">
        <input
          className="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:outline-none placeholder-gray-500"
          type="text"
          placeholder="예: 스톡옵션, ESG, 핀테크..."
          aria-label="금융 용어"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          disabled={isLoading}
        />
        <button
          className={`flex-shrink-0 bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 text-sm border-4 text-white py-2 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
            <i className="fa-solid fa-magnifying-glass-chart mr-2"></i>
            <span>조회</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const LoadingIndicator: React.FC = () => (
  <div className="text-center p-8 text-gray-400">
    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p>AI가 용어를 분석하고 있습니다. 잠시만 기다려주세요...</p>
  </div>
);

const ResultDisplay: React.FC<{ term: string; definition: string }> = ({ term, definition }) => {
  const htmlDefinition = marked.parse(definition) as string;
  
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg animate-fade-in-up mt-8 border border-gray-700">
      <h2 className="text-2xl font-semibold text-blue-300 mb-4">{term}</h2>
      <div 
        className="result-content text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlDefinition }} 
      />
    </div>
  );
};

const InitialState: React.FC = () => (
    <div className="text-center p-8 text-gray-500 mt-8">
        <i className="fa-solid fa-lightbulb text-4xl mb-4 text-yellow-300"></i>
        <p>궁금한 금융 용어를 검색하여 정의를 확인해보세요.</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mt-8" role="alert">
        <strong className="font-bold">오류: </strong>
        <span className="block sm:inline">{message}</span>
    </div>
);


// --- Main App Component ---

const App: React.FC = () => {
  const [searchedTerm, setSearchedTerm] = useState<string | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (term: string) => {
    setIsLoading(true);
    setError(null);
    setDefinition(null);
    setSearchedTerm(term);

    try {
      const result = await getFinancialTermDefinition(term);
      // Check if the result indicates an error from the service itself
      if (result.startsWith('API 호출 중 오류가 발생했습니다:') || result.startsWith('알 수 없는 오류가 발생하여')) {
        setError(result);
      } else {
        setDefinition(result);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const renderContent = () => {
    if (isLoading) {
        return <LoadingIndicator />;
    }
    if (error) {
        return <ErrorDisplay message={error} />;
    }
    if (definition && searchedTerm) {
        return <ResultDisplay term={searchedTerm} definition={definition} />;
    }
    return <InitialState />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4">
        <style>{`
            @keyframes fade-in-up {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.5s ease-out forwards;
            }
            .result-content ul {
                list-style-type: disc;
                padding-left: 20px;
                margin-top: 1em;
                margin-bottom: 1em;
            }
            .result-content li {
                margin-bottom: 0.5em;
            }
            .result-content strong {
                color: #a5b4fc;
                font-weight: 600;
            }
        `}</style>
      <div className="w-full max-w-3xl mx-auto flex-grow flex flex-col pt-8 md:pt-16">
        <Header />
        <main className="w-full mt-8">
          <SearchForm isLoading={isLoading} onSubmit={handleSearch} />
          <div className="mt-6 min-h-[200px]">
            {renderContent()}
          </div>
        </main>
      </div>
      <footer className="w-full text-center text-gray-600 text-sm p-4">
        Powered by Google Gemini API
      </footer>
    </div>
  );
};

export default App;