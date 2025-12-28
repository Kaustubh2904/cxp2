import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../utils/api';

const WaitingRoom = () => {
  const { student, validateToken, logout } = useAuth();
  const navigate = useNavigate();
  const [driveStatus, setDriveStatus] = useState(null);
  const [driveDetails, setDriveDetails] = useState(null);
  const [canStart, setCanStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [windowTimeRemaining, setWindowTimeRemaining] = useState(null);

  // Function to check drive status
  const checkDriveStatus = async () => {
    try {
      const token = localStorage.getItem('student_access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Validate token and check status
      const validation = await validateToken();
      
      if (!validation.valid) {
        if (validation.disqualified) {
          navigate('/disqualified', { state: { reason: validation.reason } });
        } else {
          logout();
          navigate('/login');
        }
        return;
      }

      // Re-login to get fresh drive status (this doesn't create a new token, just refreshes data)
      const response = await axios.post(API_ENDPOINTS.login, {
        email: student.email,
        access_token: token
      });

      const freshData = response.data;
      setDriveStatus(freshData.drive_status);
      
      // Fetch drive details to get window information
      try {
        const driveResponse = await axios.get(`${API_ENDPOINTS.base}/student/drive-info`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDriveDetails(driveResponse.data);
        
        // Calculate window time remaining
        if (driveResponse.data.actual_window_end || driveResponse.data.window_end) {
          const windowEnd = new Date(driveResponse.data.actual_window_end || driveResponse.data.window_end);
          const now = new Date();
          const diffMs = windowEnd - now;
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / 3600000);
            const minutes = Math.floor((diffMs % 3600000) / 60000);
            setWindowTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setWindowTimeRemaining('Closed');
          }
        }
      } catch (err) {
        console.error('Error fetching drive details:', err);
      }
      
      // Check if exam can be started
      if (freshData.drive_status === 'live' || freshData.drive_status === 'ongoing') {
        setCanStart(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking drive status:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!student) {
      navigate('/login');
      return;
    }

    // Initial check
    checkDriveStatus();

    // Poll for drive status every 5 seconds
    const interval = setInterval(() => {
      checkDriveStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [student, navigate]);

  const handleStartExam = () => {
    navigate('/exam');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{student?.drive_title}</h1>
          <p className="text-gray-600">Welcome, {student?.name}!</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Checking exam status...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {canStart ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-lg font-semibold text-green-800 mb-2">
                    🎯 The exam window is now live!
                  </p>
                  {windowTimeRemaining && windowTimeRemaining !== 'Closed' && (
                    <p className="text-sm text-gray-700 mb-2">
                      Window closes in: <strong>{windowTimeRemaining}</strong>
                    </p>
                  )}
                  {driveDetails?.exam_duration_minutes && (
                    <p className="text-sm text-gray-700 mb-4">
                      Your exam duration: <strong>{driveDetails.exam_duration_minutes} minutes</strong>
                    </p>
                  )}
                  <button
                    onClick={handleStartExam}
                    className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg"
                  >
                    Start Exam
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <div className="inline-block animate-pulse mb-3">
                    <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                  </div>
                  <p className="text-lg font-semibold text-yellow-800 mb-2">
                    ⏳ Waiting for exam window to open...
                  </p>
                  {driveDetails?.window_start && (
                    <p className="text-gray-600 mb-2">
                      Window opens at: <strong>{new Date(driveDetails.window_start).toLocaleString()}</strong>
                    </p>
                  )}
                  {driveDetails?.window_end && (
                    <p className="text-gray-600 mb-2">
                      Window closes at: <strong>{new Date(driveDetails.window_end).toLocaleString()}</strong>
                    </p>
                  )}
                  {driveDetails?.exam_duration_minutes && (
                    <p className="text-gray-600 mb-2">
                      Your exam duration: <strong>{driveDetails.exam_duration_minutes} minutes</strong>
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-3">
                    (Checking every 5 seconds - no need to refresh)
                  </p>
                </div>
              </>
            )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Instructions</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>The exam will open in <strong>fullscreen mode</strong>. Do not exit fullscreen.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>Do not switch tabs or minimize the browser window.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>Right-clicking and taking screenshots are restricted.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>Your answers are automatically saved as you go.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span>You can mark questions for review and navigate freely.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span><strong>Warning:</strong> Excessive violations will result in disqualification.</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Details</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> {student?.email}</p>
              <p><strong>Drive:</strong> {student?.drive_title}</p>
              <p><strong>Status:</strong> <span className={`font-semibold ${
                driveStatus === 'live' || driveStatus === 'ongoing' ? 'text-green-600' : 
                driveStatus === 'upcoming' ? 'text-yellow-600' : 'text-gray-600'
              }`}>{driveStatus || student?.drive_status || 'Unknown'}</span></p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
