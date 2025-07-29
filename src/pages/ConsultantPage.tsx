import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Send, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
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
  const { isLoggedIn, questions, addQuestion } = useUser();
  const [newQuestion, setNewQuestion] = useState('');

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const success = await addQuestion({
      title: newQuestion.slice(0, 50) + (newQuestion.length > 50 ? '...' : ''),
      message: newQuestion
    });

    if (success) {
      console.log('Question successfully saved to database');
      setNewQuestion('');
    } else {
      alert('Soru gönderilirken hata oluştu. Lütfen tekrar deneyin.');
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

        {/* Ask Question Form */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Soru Sor</h3>
          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sorunuz
              </label>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Beslenme, egzersiz veya vücut gelişimi hakkında merak ettiğiniz her şeyi sorabilirsiniz..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Soru Gönder
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
          <h3 className="text-lg font-semibold text-green-900 mb-3">📞 Acil Durumlarda</h3>
          <p className="text-green-800 mb-2">
            Sağlık konularında acil durumlar için lütfen doktorunuza başvurun.
          </p>
          <p className="text-green-700 text-sm">
            Danışmanlarımız genellikle 24 saat içinde yanıt verir.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultantPage;