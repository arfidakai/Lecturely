"use client";
import { Mic, BookOpen, Clock, Bell, Search, LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Subject, Recording } from "../types";
import { getSlugFromUUID } from "../lib/subjectMapping";
import { useState, useEffect } from "react";
import GlobalSearch from "./GlobalSearch";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { useReminderChecker } from "../hooks/useReminderChecker";
import { useServiceWorker } from "../hooks/useServiceWorker";
import NotificationToast from "./NotificationToast";

type DashboardProps = {
  subjects: Subject[];
  recordings: Recording[];
  onStartRecording: (subject: Subject) => void;
  onNavigateToSubjects: () => void;
  onNavigateToNotesList: (subjectId: string) => void;
};

export default function Homepage({
  subjects,
  recordings,
  onStartRecording,
  onNavigateToSubjects,
  onNavigateToNotesList,
}: DashboardProps) {
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const recentRecordings = recordings.slice(0, 5);
function getTodayDayName(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

function filterSubjectsByToday(subjects: Subject[]): Subject[] {
  const today = getTodayDayName();
  return subjects.filter(subj => Array.isArray(subj.schedule_days) && subj.schedule_days.includes(today));
}
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const { user, signOut } = useAuth();

  // Initialize notification system
  const { permission, requestPermission, showNotification, removeNotification, notifications } = useNotifications();
  useReminderChecker(); // Start automatic reminder checking
  useServiceWorker(); // Register service worker for PWA

  const handleLogout = async () => {
    await signOut();
  };

  // Check if user is new (no subjects/recordings)
  const isNewUser = subjects.length === 0 && recordings.length === 0;

  // Check notification permission on mount
  useEffect(() => {
    if (permission === 'default' && !isNewUser) {
      // Show banner after 2 seconds if user hasn't decided yet
      const timer = setTimeout(() => {
        setShowNotificationBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [permission, isNewUser]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      showNotification('Notifications Enabled! 🎉', {
        body: 'You\'ll now receive reminder notifications',
        icon: '🎉',
      });
    }
    setShowNotificationBanner(false);
  };

  // Test notification function
  const handleTestNotification = () => {
    if (permission === 'granted') {
      showNotification('🔔 Test Notification', {
        body: 'This is a test notification. If you see this, notifications are working perfectly!',
        icon: '🔔',
      });
    } else {
      alert('Please enable notifications first');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-purple-400">{today}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
              title="Search"
            >
              <Search className="w-5 h-5 text-purple-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                title="Account"
              >
                <UserIcon className="w-5 h-5 text-purple-600" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Only show greeting for existing users */}
        {!isNewUser && (
          <>
            <h1 className="text-3xl text-gray-900 mb-1">Good Morning</h1>
            <p className="text-gray-500">Ready to record knowledge?</p>
          </>
        )}
        
        {/* My Reminders Link - Only show for existing users */}
        {!isNewUser && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => router.push('/my-reminders')}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>My Reminders</span>
            </button>
            {permission === 'granted' && (
              <button
                onClick={handleTestNotification}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors active:scale-95"
              >
                Test 🔔
              </button>
            )}
          </div>
        )}
      </div>
    
      {/* Notification Permission Banner */}
      {showNotificationBanner && !isNewUser && (
        <div className="mx-6 mb-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-full mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Enable Reminder Notifications</h3>
              <p className="text-sm text-purple-100 mb-3">
                Get notified when it's time to review your notes and never miss a study session!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleEnableNotifications}
                  className="px-4 py-2 bg-white text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-50 transition-colors active:scale-95"
                >
                  Enable Notifications
                </button>
                <button
                  onClick={() => setShowNotificationBanner(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors active:scale-95"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Record Button - Only show for existing users */}
      {!isNewUser && (
        <div className="px-6 mb-8">
          <button
            onClick={onNavigateToSubjects}
            className="w-full bg-purple-600 text-white rounded-3xl py-5 px-6 shadow-lg shadow-purple-200 flex items-center justify-center gap-3 hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <Mic className="w-6 h-6" />
            </div>
            <span className="text-lg">Start Recording</span>
          </button>
        </div>
      )}

      {/* Welcome Guide for New Users */}
      {isNewUser ? (
        <div className="flex-1 px-6 pb-8 overflow-y-auto">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-5 mb-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-3xl">🎓</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Welcome to Lecturely!
              </h2>
              <p className="text-sm text-gray-600">
                Your AI-powered lecture note companion
              </p>
            </div>

            {/* Features Highlight - Moved to top */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🎤</div>
                <div className="text-xs font-medium text-gray-900">Audio Recording</div>
                <div className="text-[10px] text-gray-500 mt-0.5">High quality capture</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">📝</div>
                <div className="text-xs font-medium text-gray-900">Auto Transcribe</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Speech to text</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">✨</div>
                <div className="text-xs font-medium text-gray-900">AI Summary</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Smart key points</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🔔</div>
                <div className="text-xs font-medium text-gray-900">Reminders</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Never miss review</div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                      Add Your Subjects
                    </h3>
                    <p className="text-xs text-gray-600">
                      Create subjects for your classes and organize notes by topic
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                      Record Your Lectures
                    </h3>
                    <p className="text-xs text-gray-600">
                      Tap "Start Recording" and select a subject to capture audio
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                      Get AI Transcription
                    </h3>
                    <p className="text-xs text-gray-600">
                      Recordings are automatically transcribed to text
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                      Generate Summaries
                    </h3>
                    <p className="text-xs text-gray-600">
                      AI creates concise summaries with key points
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToSubjects}
              className="w-full mt-4 bg-purple-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-purple-700 transition-all active:scale-[0.98]"
            >
              Get Started - Add Your First Subject
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Today's Subjects */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-gray-900">Today's Subjects</h2>
              <button
                onClick={() => router.push('/all-subjects')}
                className="text-sm text-purple-500"
              >
                See All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filterSubjectsByToday(subjects).slice(0, 4).map((subject) => {
                const subjectSlug = getSlugFromUUID(subject.id) || subject.id;
                return (
                  <button
                    key={subject.id}
                    onClick={() => onNavigateToNotesList(subjectSlug)}
                    className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-2xl"
                      style={{ backgroundColor: `${subject.color}20` }}
                    >
                      {subject.icon}
                    </div>
                    <div className="text-sm text-gray-900 mb-1 line-clamp-1">
                      {subject.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {recordings.filter((r) => r.subjectId === subject.id).length}{" "}
                      notes
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Recordings */}
          <div className="px-6 pb-8 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-purple-500" />
              <h2 className="text-lg text-gray-900">Recent</h2>
            </div>

            <div className="space-y-3">
              {recentRecordings.map((recording) => {
                const recordingDate = new Date(recording.date);
                const formattedDate = recordingDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const formattedTime = recordingDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });
                const durationMin = Math.floor(recording.duration / 60);
                const subjectSlug = getSlugFromUUID(recording.subjectId) || recording.subjectId;

                return (
                  <button
                    key={recording.id}
                    onClick={() => router.push(`/transcription/${recording.id}/${recording.subjectId}`)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2.5 rounded-xl">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 mb-1">
                          {recording.title && recording.title.trim() ? recording.title : recording.subjectName}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span>{formattedTime}</span>
                          <span>•</span>
                          <span>{durationMin} min</span>
                        </div>
                      </div>
                      {recording.transcribed && (
                        <div className="bg-purple-500 text-white text-xs px-2.5 py-1 rounded-full">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Global Search Modal */}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* Custom Notification Toasts */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          show={true}
          title={notification.title}
          message={notification.message}
          icon={notification.icon}
          onClose={() => removeNotification(notification.id)}
          onClick={notification.onClick}
        />
      ))}
    </div>
  );
}
