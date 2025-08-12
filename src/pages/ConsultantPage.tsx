import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Send, MessageCircle, Clock, CheckCircle, Bot, User, Sparkles } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { generateConsultantResponse } from '../services/aiService';
import { forwardQuestionToSponsor } from '../services/adminService';
import Layout from '../components/Layout';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isUser: boolean;
}

interface Question {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'answered';
  answer?: string;
  answerTimestamp?: string;
}

const ConsultantPage: React.FC = () => {
  const { user, isLoggedIn, questions, addQuestion } = useUser();
  const [newQuestion, setNewQuestion] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isGeminiConnected, setIsGeminiConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    isAI?: boolean;
  }>>([]);
  const [chatInput, setChatInput] = useState('');

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check Gemini connection on component mount
  React.useEffect(() => {
    const checkGeminiConnection = () => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      setIsGeminiConnected(!!apiKey);
    };
    
    checkGeminiConnection();
  }, []);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const questionSuccess = await addQuestion({
      title: newQuestion.slice(0, 50) + (newQuestion.length > 50 ? '...' : ''),
      message: newQuestion
    });

    if (questionSuccess) {
      console.log('Question successfully saved to database');
      
      // Try to forward question to sponsor if available
      try {
        const lastQuestion = questions[0]; // Get the most recent question
        if (lastQuestion) {
          await forwardQuestionToSponsor(lastQuestion.id, user!.id);
          console.log('Question forwarded to sponsor');
        }
      } catch (error) {
        console.error('Error forwarding question to sponsor:', error);
      }
      
      setNewQuestion('');
    } else {
      alert('Soru gönderilirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isGeneratingResponse) return;

    const userMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isUser: true,
      timestamp: new Date().toISOString(),
      isAI: false
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsGeneratingResponse(true);

    try {
      const aiResponse = await generateConsultantResponse(chatInput, user);
      
      if (aiResponse.success && aiResponse.response) {
        // If response doesn't contain fallback warning, Gemini is working
        if (!aiResponse.response.includes('AI servisi geçici olarak kullanılamıyor')) {
          setIsGeminiConnected(true);
        }
        
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.response,
          isUser: false,
          timestamp: new Date().toISOString(),
          isAI: true
        };
        setChatMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.',
          isUser: false,
          timestamp: new Date().toISOString(),
          isAI: true
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        isUser: false,
        timestamp: new Date().toISOString(),
        isAI: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danışman Desteği</h1>
          <p className="text-gray-600 mt-1">
            Beslenme ve egzersiz konularında uzmanlarımızdan yardım alın
          </p>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Günün İpucu</h3>
          <p className="text-blue-800">
            Sabah tartısı en doğru sonucu verir. Tuvalete gittikten sonra ve kahvaltıdan önce tartılmayı unutmayın!
          </p>
        </div>

        {/* AI Chat Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3 relative">
                <Bot className="h-6 w-6 text-white" />
                {isGeminiConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  AI Danışman (Google Gemini)
                  <Sparkles className={`h-4 w-4 ml-2 text-yellow-500 ${isGeminiConnected ? 'animate-bounce' : ''}`} />
                  {isGeminiConnected && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse flex items-center">
                      <span className="animate-bounce">😉</span>
                      <span className="ml-1">Bağlı</span>
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {isGeminiConnected 
                    ? '🚀 Gerçek AI ile anında kişisel öneriler' 
                    : '⚡ Pattern-based akıllı yanıtlar'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <div className="relative inline-block mb-4">
                  <div className="relative">
                    <Bot className={`h-12 w-12 mx-auto ${isGeminiConnected ? 'text-purple-500' : 'text-gray-400'}`} />
                    {isGeminiConnected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse">
                        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                      </div>
                    )}
                  </div>
                  {isGeminiConnected && (
                    <div className="absolute top-0 right-0 text-2xl animate-bounce">
                      😉
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {isGeminiConnected 
                    ? '😉 Google Gemini AI Danışmanınız Hazır!' 
                    : '⚡ AI Danışmanınız Hazır!'}
                </h4>
                <p className="text-gray-600 mb-4">
                  {isGeminiConnected 
                    ? '🚀 Gerçek AI ile kişiselleştirilmiş beslenme ve fitness önerileri' 
                    : 'Akıllı pattern-matching ile beslenme ve fitness önerileri'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setChatInput('Kilo vermek için ne yapmalıyım?')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    Kilo verme
                  </button>
                  <button
                    onClick={() => setChatInput('Kas yapmak için beslenme önerisi')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                  >
                    Kas yapma
                  </button>
                  <button
                    onClick={() => setChatInput('Egzersiz programı önerisi')}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                  >
                    Egzersiz
                  </button>
                </div>
              </div>
            )}
            
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-xs lg:max-w-md ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.isUser ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.isUser 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      {message.isUser ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    message.isUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                    <div className={`text-xs mt-1 ${
                      message.isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isGeneratingResponse && (
              <div className="flex justify-start">
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center relative">
                      <Bot className="h-4 w-4 text-white" />
                      {isGeminiConnected && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse">
                          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                      )}
                      {isGeminiConnected && (
                        <div className="absolute -top-1 -right-1 text-xs animate-bounce">😉</div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Chat Input */}
          <div className="p-6 border-t border-gray-200">
            <form onSubmit={handleChatSubmit} className="flex space-x-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Sorunuzu yazın... (örn: Kilo vermek için ne yapmalıyım?)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={isGeneratingResponse}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isGeneratingResponse}
                className={`${isGeminiConnected 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                } text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
              >
                {isGeneratingResponse ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {isGeminiConnected && <span className="ml-1 animate-bounce">😉</span>}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Ask Question Form */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uzman Danışmana Soru Sor
            <span className="text-sm font-normal text-gray-600 ml-2">(İnsan danışman yanıtı)</span>
          </h3>
          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sorunuz
              </label>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Detaylı analiz gerektiren sorularınızı uzman danışmanımıza sorabilirsiniz..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Uzman Danışmana Gönder
            </button>
          </form>
        </div>

        {/* Questions History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sorularım</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {questions.map((question) => (
              <div key={question.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">{question.title}</h4>
                  <div className="flex items-center ml-4">
                    {question.status === 'pending' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Bekliyor
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Yanıtlandı
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <MessageCircle className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-500">
                      {new Date(question.timestamp).toLocaleDateString('tr-TR')} - 
                      {new Date(question.timestamp).toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700">{question.message}</p>
                </div>

                {question.answer && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">D</span>
                      </div>
                      <div className="ml-3">
                        <span className="font-medium text-blue-900">Danışman</span>
                        <span className="text-sm text-blue-600 ml-2">
                          {new Date(question.answerTimestamp!).toLocaleDateString('tr-TR')} - 
                          {new Date(question.answerTimestamp!).toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-blue-800 mt-2">{question.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz soru yok</h3>
              <p className="text-gray-600">İlk sorunuzu sorarak başlayın.</p>
            </div>
          )}
        </div>

        {/* Consultant Info */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">ℹ️ Danışman Hizmetleri</h3>
          <p className="text-green-800 mb-2">
            <strong>🤖 AI Danışman:</strong> Anında yanıt, genel öneriler, hızlı sorular
          </p>
          <p className="text-green-700 text-sm">
            <strong>👨‍⚕️ Uzman Danışman:</strong> Detaylı analiz, kişisel program, 24 saat içinde yanıt
          </p>
          <p className="text-green-600 text-xs mt-2">
            Acil sağlık durumları için lütfen doktorunuza başvurun.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultantPage;