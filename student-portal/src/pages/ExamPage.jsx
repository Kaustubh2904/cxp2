import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { API_ENDPOINTS } from '../utils/api';
import SafeStorage from '../utils/safeStorage';

const ExamPage = () => {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  
  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  const handleDisqualified = useCallback((reason) => {
    navigate('/disqualified', { state: { reason } });
  }, [navigate]);

  const { requestFullscreen } = useAntiCheat(handleDisqualified, examStarted);

  // Define submit handlers before they're used in effects
  const handleSubmit = useCallback(async (isAuto = false) => {
    console.log('handleSubmit called, isAuto:', isAuto);
    console.log('Current answers:', answers);
    console.log('examData:', examData);
    
    // Check if examData is loaded
    if (!examData || !examData.questions) {
      console.error('Cannot submit: examData not loaded');
      alert('Exam data not loaded. Please refresh and try again.');
      return;
    }
    
    if (!isAuto) {
      const confirm = window.confirm(
        'Are you sure you want to submit your exam? You cannot change your answers after submission.'
      );
      if (!confirm) {
        console.log('User cancelled submission');
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('student_access_token');
      
      // Prepare answers in the required format
      const answersList = examData.questions.map(q => ({
        question_id: q.id,
        selected_option: answers[q.id] || null,
        marked_for_review: markedForReview[q.id] || false
      }));

      console.log('Submitting answers:', answersList);

      const response = await axios.post(
        API_ENDPOINTS.submitExam,
        { answers: answersList },
        { params: { token } }
      );

      console.log('Submit response:', response.data);

      // Clear SafeStorage
      SafeStorage.removeItem('exam_answers');

      // Navigate to results
      navigate('/result', { 
        state: { 
          score: response.data.score,
          total_marks: response.data.total_marks,
          percentage: response.data.percentage,
          submitted_at: response.data.submitted_at
        } 
      });
    } catch (error) {
      console.error('Error submitting exam:', error);
      console.error('Error details:', error.response?.data);
      alert('Error submitting exam. Please try again.');
      setSubmitting(false);
    }
  }, [examData, answers, markedForReview, navigate]);

  const handleAutoSubmit = useCallback(() => {
    handleSubmit(true);
  }, [handleSubmit]);

  // Load exam data
  useEffect(() => {
    const loadExam = async () => {
      try {
        const token = localStorage.getItem('student_access_token');
        
        // Try to start the exam (will fail if already started, which is fine)
        try {
          await axios.post(API_ENDPOINTS.startExam, {}, { params: { token } });
          console.log('Exam started successfully');
        } catch (startError) {
          // If exam already started, that's okay - we'll just get the questions
          if (startError.response?.status === 400 && startError.response?.data?.detail?.includes('already started')) {
            console.log('Exam already started, continuing...');
          } else {
            console.error('Unexpected error starting exam:', startError);
            throw startError;
          }
        }
        
        // Get questions
        const response = await axios.get(API_ENDPOINTS.getQuestions, { params: { token } });
        setExamData(response.data);
        
        console.log('Exam data received:', response.data); // Debug log
        console.log('expected_end:', response.data.expected_end);
        console.log('actual_end:', response.data.actual_end);
        console.log('duration_minutes:', response.data.duration_minutes);
        console.log('exam_started_at:', response.data.exam_started_at);
        
        // Calculate time remaining - use expected_end for timer
        let remaining;
        if (response.data.actual_end) {
          // Exam has been manually ended
          console.log('Exam manually ended, setting time to 0');
          remaining = 0;
        } else if (response.data.expected_end && response.data.exam_started_at) {
          // Use calculated end time (student.exam_started_at + duration)
          const endTime = new Date(response.data.expected_end);
          const now = new Date();
          remaining = Math.floor((endTime - now) / 1000);
          console.log('Time calculation:', { 
            expected_end: response.data.expected_end,
            endTime: endTime.toISOString(), 
            now: now.toISOString(), 
            remaining,
            remainingMinutes: Math.floor(remaining / 60)
          }); // Debug log
          
          // Safety check: if time is negative, exam time has expired
          if (remaining < 0) {
            console.error('ERROR: Exam time has already expired!');
            remaining = 0;
          }
        } else {
          // Critical error: cannot calculate time properly
          console.error('CRITICAL: Cannot calculate exam time - missing expected_end or exam_started_at');
          throw new Error('Unable to determine exam duration. Please contact support.');
        }
        
        setTimeRemaining(remaining > 0 ? remaining : 0);
        console.log('Time remaining set to:', remaining > 0 ? remaining : 0, 'seconds =', Math.floor((remaining > 0 ? remaining : 0) / 60), 'minutes'); // Debug log
        
        // Load saved answers using SafeStorage
        const savedAnswers = SafeStorage.getItem('exam_answers');
        if (savedAnswers) {
          setAnswers(savedAnswers);
        }
        
        setExamStarted(true);
        setLoading(false);
        
        // Enter fullscreen
        requestFullscreen();
      } catch (error) {
        console.error('Error loading exam:', error);
        console.error('Error details:', error.response?.data);
        const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
        alert(`Error loading exam: ${errorMessage}\n\nPlease try again.`);
        navigate('/waiting-room');
      }
    };

    loadExam();
  }, [navigate, requestFullscreen]);

  // Timer countdown
  useEffect(() => {
    if (!examStarted || timeRemaining === null) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Don't auto-submit if exam just started (within 5 seconds)
          // This prevents accidental immediate submission due to calculation errors
          if (examData && examData.exam_started_at) {
            const examStartTime = new Date(examData.exam_started_at);
            const timeSinceStart = (new Date() - examStartTime) / 1000;
            if (timeSinceStart < 5) {
              console.error('PREVENTED IMMEDIATE AUTO-SUBMIT! Exam just started', timeSinceStart, 'seconds ago');
              console.error('This indicates a timer calculation error');
              return prev; // Don't decrease, keep the timer
            }
          }
          handleAutoSubmit();
          return 0;
        }
        
        // Show warning at 5 minutes remaining (only once)
        if (prev === 300) {
          alert('⚠️ Warning: Only 5 minutes remaining!');
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, examData, handleAutoSubmit]);

  // Auto-save answers using SafeStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      SafeStorage.setItem('exam_answers', answers);
    }
  }, [answers]);

  const handleAnswerSelect = (questionId, option) => {
    console.log('Answer selected - Question:', questionId, 'Option:', option);
    setAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: option
      };
      console.log('Updated answers:', updated);
      return updated;
    });
  };

  const handleMarkForReview = (questionId) => {
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return '00:00:00';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId) => {
    if (markedForReview[questionId]) return 'review';
    if (answers[questionId]) return 'answered';
    return 'not-answered';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading exam...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = examData?.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - Question Navigator */}
      <div className="w-64 bg-white shadow-lg p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Questions</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>✅ Answered: {Object.keys(answers).length}</p>
            <p>⭐ Review: {Object.keys(markedForReview).filter(k => markedForReview[k]).length}</p>
            <p>⚪ Not Answered: {examData?.question_count - Object.keys(answers).length}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {examData?.questions.map((q, idx) => {
            const status = getQuestionStatus(q.id);
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`
                  w-12 h-12 rounded-lg font-semibold transition-all
                  ${currentQuestionIndex === idx ? 'ring-2 ring-indigo-500' : ''}
                  ${status === 'answered' ? 'bg-green-500 text-white' : ''}
                  ${status === 'review' ? 'bg-yellow-500 text-white' : ''}
                  ${status === 'not-answered' ? 'bg-gray-200 text-gray-700' : ''}
                `}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
        >
          {submitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>

      {/* Main Content - Question Display */}
      <div className="flex-1 p-6">
        {/* Header with Timer */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{examData?.drive_title}</h1>
            <p className="text-gray-600">Question {currentQuestionIndex + 1} of {examData?.question_count}</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-600">Time Remaining</p>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Question {currentQuestionIndex + 1}
              </h2>
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                {currentQuestion?.marks} {currentQuestion?.marks === 1 ? 'mark' : 'marks'}
              </span>
            </div>
            <p className="text-lg text-gray-800 whitespace-pre-wrap">
              {currentQuestion?.question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {['a', 'b', 'c', 'd'].map(option => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  ${answers[currentQuestion.id] === option
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                  }
                `}
              >
                <div className="flex items-start">
                  <span className="font-bold text-indigo-600 mr-3">{option.toUpperCase()}.</span>
                  <span className="text-gray-800">{currentQuestion[`option_${option}`]}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={() => handleMarkForReview(currentQuestion.id)}
              className={`
                px-6 py-2 rounded-lg font-semibold transition-all
                ${markedForReview[currentQuestion.id]
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }
              `}
            >
              {markedForReview[currentQuestion.id] ? 'Unmark Review' : 'Mark for Review'}
            </button>

            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(examData.question_count - 1, prev + 1))}
              disabled={currentQuestionIndex === examData.question_count - 1}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
