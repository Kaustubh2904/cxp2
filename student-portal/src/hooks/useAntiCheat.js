import { useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../utils/api';

// Violation thresholds
const VIOLATION_THRESHOLDS = {
  tab_switch: 3,
  fullscreen_exit: 3,
  right_click: 6,
  screenshot: 2,
  copy: null,  // Warning only
  paste: null  // Warning only
};

export const useAntiCheat = (onDisqualified, isExamActive) => {
  console.log('useAntiCheat - isExamActive:', isExamActive); // Debug log
  
  const recordViolation = useCallback(async (violationType) => {
    if (!isExamActive) {
      console.log('Violation not recorded - exam not active');
      return;
    }

    console.log('Recording violation:', violationType); // Debug log
    
    try {
      const token = localStorage.getItem('student_access_token');
      const response = await axios.post(
        API_ENDPOINTS.recordViolation,
        { violation_type: violationType },
        { params: { token } }
      );

      if (response.data.is_disqualified) {
        onDisqualified(response.data.disqualification_reason);
      } else {
        // Show warning for violations
        const threshold = VIOLATION_THRESHOLDS[violationType];
        const current = response.data.current_violations[violationType];
        
        if (threshold !== null) {
          const remaining = threshold - current;
          if (remaining === 0) {
            alert(`Warning: You have used all ${threshold} allowed ${violationType.replace('_', ' ')} attempts. Next violation will disqualify you.`);
          } else if (remaining > 0 && remaining <= 2) {
            alert(`Warning: ${violationType.replace('_', ' ')} detected! ${remaining} attempt(s) remaining.`);
          }
        } else {
          // Warning only violations
          alert(`Warning: ${violationType.replace('_', ' ')} detected! This is being monitored.`);
        }
      }
    } catch (error) {
      console.error('Error recording violation:', error);
    }
  }, [onDisqualified, isExamActive]);

  // Tab switch detection
  useEffect(() => {
    if (!isExamActive) {
      console.log('Tab switch detection NOT active');
      return;
    }

    console.log('Tab switch detection ACTIVATED');

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab switch detected!');
        recordViolation('tab_switch');
      }
    };

    const handleBlur = () => {
      console.log('Window blur detected!');
      recordViolation('tab_switch');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      console.log('Tab switch detection DEACTIVATED');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [recordViolation, isExamActive]);

  // Fullscreen exit detection
  useEffect(() => {
    if (!isExamActive) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        console.log('Fullscreen exit detected!');
        recordViolation('fullscreen_exit');
        // DON'T try to re-enter fullscreen - just record the violation
        // This was causing a loop where any click would trigger fullscreen
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [recordViolation, isExamActive]);

  // Right-click prevention
  useEffect(() => {
    if (!isExamActive) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      recordViolation('right_click');
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [recordViolation, isExamActive]);

  // Screenshot detection (keyboard shortcuts)
  useEffect(() => {
    if (!isExamActive) return;

    const handleKeyDown = (e) => {
      // Print Screen
      if (e.key === 'PrintScreen') {
        recordViolation('screenshot');
        e.preventDefault();
      }
      
      // Windows Snipping Tool (Win + Shift + S)
      if (e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        recordViolation('screenshot');
        e.preventDefault();
      }

      // Mac screenshot shortcuts
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        recordViolation('screenshot');
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [recordViolation, isExamActive]);

  // Copy detection
  useEffect(() => {
    if (!isExamActive) return;

    const handleCopy = (e) => {
      recordViolation('copy');
      // Don't prevent - just record
    };

    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('copy', handleCopy);
    };
  }, [recordViolation, isExamActive]);

  // Paste detection
  useEffect(() => {
    if (!isExamActive) return;

    const handlePaste = (e) => {
      recordViolation('paste');
      // Don't prevent - just record
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [recordViolation, isExamActive]);

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    }
  };

  return { requestFullscreen };
};
