import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import WaitingRoom from './pages/WaitingRoom';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import DisqualifiedPage from './pages/DisqualifiedPage';
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/disqualified" element={<DisqualifiedPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App
