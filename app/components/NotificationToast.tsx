"use client";
import { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';

interface NotificationToastProps {
  show: boolean;
  title: string;
  message: string;
  icon?: string;
  onClose: () => void;
  onClick?: () => void;
}

export default function NotificationToast({
  show,
  title,
  message,
  icon = '🔔',
  onClose,
  onClick,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto close after 10 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onClose();
    }, 300);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      handleClose();
    }
  };

  if (!isVisible && !show) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div
        className={`pointer-events-auto w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ${
          isExiting
            ? 'opacity-0 translate-x-full scale-95'
            : 'opacity-100 translate-x-0 scale-100'
        } ${!isExiting && show ? 'animate-slideIn' : ''}`}
      >
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500" />
        
        <div
          className={`p-4 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
          onClick={handleClick}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <span className="text-2xl">{icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                  {title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {message}
              </p>
              {onClick && (
                <div className="mt-2 text-xs text-purple-600 font-medium">
                  Tap to view →
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 animate-progress"
            style={{ animationDuration: '10s' }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-progress {
          animation: progress linear;
        }
      `}</style>
    </div>
  );
}
