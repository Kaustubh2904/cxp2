import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { score, total_marks, percentage, submitted_at } = location.state || {};

  if (!score && score !== 0) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mb-6">
            {percentage >= 40 ? (
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exam Submitted Successfully!
          </h1>
          <p className="text-gray-600">
            Your exam has been submitted on {new Date(submitted_at).toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-indigo-600 mb-2">
              {percentage.toFixed(2)}%
            </div>
            <p className="text-gray-600">Your Score</p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">{score}</p>
              <p className="text-gray-600">Marks Obtained</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{total_marks}</p>
              <p className="text-gray-600">Total Marks</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-center">
            <strong>Note:</strong> Your detailed results will be shared by the company recruiting team.
            Please check your email for further communication.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={handleLogout}
            className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
