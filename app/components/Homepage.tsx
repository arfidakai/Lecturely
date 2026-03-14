  "use client";
  import { Mic, BookOpen, Clock, Bell, Search, LogOut, User as UserIcon } from "lucide-react";
  import { useRouter } from "next/navigation";
  import { Subject, Recording } from "../types";
  import { getSlugFromUUID } from "../lib/subjectMapping";
  import { useState, useEffect } from "react";
  import { useLanguage } from "../contexts/LanguageContext";
  import GlobalSearch from "./GlobalSearch";
  import { useAuth } from "../contexts/AuthContext";
  import { useNotifications } from "../hooks/useNotifications";
  import { useReminderChecker } from "../hooks/useReminderChecker";
  import { useServiceWorker } from "../hooks/useServiceWorker";
  import NotificationToast from "./NotificationToast";
  import LanguageToggle from "./LanguageToggle";

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

    const { t, locale } = useLanguage();
    const today = new Date().toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const recentRecordings = recordings.slice(0, 5);
  function getTodayDayName(): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }

    const [showSearch, setShowSearch] = useState(false);
    const [onboardingComplete, setOnboardingComplete] = useState(false);
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
    const isNewUser = subjects.length === 0 && recordings.length === 0 && !onboardingComplete;

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
        showNotification(`${t.home.enableBtn}! 🎉`, {
          body: t.home.notificationDesc,
          icon: '🎉',
        });
      }
      setShowNotificationBanner(false);
    };
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return { greeting: t.greeting.morning, emoji: "☀️" };
    if (hour >= 12 && hour < 17) return { greeting: t.greeting.afternoon, emoji: "🌤️" };
    if (hour >= 17 && hour < 21) return { greeting: t.greeting.evening, emoji: "🌆" };
    return { greeting: t.greeting.night, emoji: "🌙" };
  };

  //name parsing for greeting
  const firstName = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ")[0]
    : "there";

  const { greeting, emoji } = getGreeting();
    // Test notification function

    //logic subject
  const filterSubjectsByToday = (subjects: Subject[]) => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[new Date().getDay()].toLowerCase();

    return subjects.filter(subject =>
      subject.schedule_days?.some((d: string) => d.toLowerCase() === todayName)
    );
  };

  const getNextScheduledDay = (subjects: Subject[]) => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date().getDay(); // 0=Sun, 1=Mon, dst

    let minDiff = 8;
    let nearestDayIndex = -1;

    subjects.forEach(subject => {
      subject.schedule_days?.forEach((dayStr: string) => {
        // Normalize kapitalisasi: "sunday" → "Sunday"
        const normalized = dayStr.charAt(0).toUpperCase() + dayStr.slice(1).toLowerCase();
        const dayIndex = dayNames.indexOf(normalized);
        if (dayIndex === -1) return;

        let diff = dayIndex - today;
        if (diff <= 0) diff += 7; // wrap ke minggu depan
        if (diff < minDiff) {
          minDiff = diff;
          nearestDayIndex = dayIndex;
        }
      });
    });

    if (nearestDayIndex === -1) return null;

    const nearestSubjects = subjects.filter(s =>
      s.schedule_days?.some((d: string) => 
        d.toLowerCase() === dayNames[nearestDayIndex].toLowerCase()
      )
    );

    return { subjects: nearestSubjects, nearestDayIndex, minDiff };
  };

  const getLocalizedDayLabel = (dayIndex: number) => {
    const now = new Date();
    const diff = (dayIndex - now.getDay() + 7) % 7 || 7;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return targetDate.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
      weekday: "long",
    });
  };

    return (
    // <div className="h-full flex flex-col" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white">
    {/* Header */}
    <div className="px-6 pt-8 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs font-medium text-purple-400 tracking-wide uppercase">{today}</div>
        <div className="flex items-center gap-2">
          {/* {!isNewUser && (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
              title="Search"
            >
              <Search className="w-4 h-4 text-purple-500" />
            </button>
          )} */}
          <LanguageToggle />
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
              title="Account"
            >
              <UserIcon className="w-4 h-4 text-purple-500" />
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
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Greeting */}
      {!isNewUser && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-purple-400 tracking-widest uppercase mb-1">
            {t.greeting.hi}, {firstName} 
          </p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {emoji} {greeting}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t.greeting.subtitle}</p>
        </div>
      )}

      {/* My Reminders */}
      {/* {!isNewUser && (
        <button
          onClick={() => router.push('/my-reminders')}
          className="flex items-center gap-2 text-xs font-medium text-purple-500 bg-white px-3 py-2 rounded-full hover:text-purple-600 transition-all active:scale-95"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{t.home.myReminders}</span>
        </button>
      )} */}
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
    {/* Quick Record Button - Only show for existing users */}
  {!isNewUser && (
    <div className="px-6 mb-6">
      <button
        onClick={onNavigateToSubjects}
        className="w-full bg-purple-600 text-white rounded-[16px] py-3 px-5 shadow-lg shadow-purple-200 flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-[0.98]"
        style={{ minHeight: 44 }}
      >
        <div className="bg-white/20 p-1.5 rounded-[10px]">
          <Mic className="w-5 h-5" />
        </div>
        <span className="text-base font-medium">{t.home.startRecording}</span>
      </button>
    </div>
  )}

  {/* My Reminders Section - Only show for existing users */}
  {!isNewUser && (
    <div className="px-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
           {/* <Bell className="w-4 h-4 text-purple-500" /> */}
          <h2 className="text-lg text-gray-900">{t.home.myReminders}</h2>
        </div>
        <button
          onClick={() => router.push('/my-reminders')}
          className="text-sm text-purple-500"
        >
          {t.common.seeAll}
        </button>
      </div>
      <button
        onClick={() => router.push('/my-reminders')}
        className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left flex items-center gap-3"
      >
        <div className="bg-purple-100 p-2.5 rounded-xl">
          <Bell className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{t.home.viewReminders}</p>
          <p className="text-xs text-gray-400">{t.home.viewRemindersDesc}</p>
        </div>
        <span className="text-purple-400 text-lg">›</span>
      </button>
    </div>
  )}

  {/* Today's Subjects */}
  {/* ... sisa kode sama seperti sebelumnya ... */}

        {/* Welcome Guide for New Users */}
        {isNewUser ? (
          <div className="flex-1 px-6 pb-8 overflow-y-auto">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-5 mb-4">
              <div className="text-center mb-4">
              <div className="mb-1">
    <span className="text-sm text-purple-500 font-medium">Hi, {firstName} 👋</span>
    <h2 className="text-xl font-bold text-gray-900">
      Welcome to Lecturely!
    </h2>
  </div>
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
                onClick={() => {
                  setOnboardingComplete(true);
                  onNavigateToSubjects();
                }}
                className="w-full mt-4 bg-purple-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-purple-700 transition-all active:scale-[0.98]"
              >
                Get Started - Add Your First Subject
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Today's Subjects */}
            {/* Today's Subjects */}
  <div className="px-6 mb-6">
    {(() => {
      const todaySubjects = filterSubjectsByToday(subjects);
      const hasToday = todaySubjects.length > 0;
      const upcoming = !hasToday ? getNextScheduledDay(subjects) : null;
      const displaySubjects = hasToday ? todaySubjects : upcoming?.subjects ?? [];
      const dayLabel = upcoming
        ? (upcoming.minDiff === 1 ? t.home.tomorrow : getLocalizedDayLabel(upcoming.nearestDayIndex))
        : "";
      const sectionTitle = hasToday
        ? t.home.todaySubjects
        : upcoming
          ? `${t.home.upcoming} · ${dayLabel}`
          : null;

      return (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-gray-900">
              {sectionTitle ?? t.home.todaySubjects}
            </h2>
            <button
              onClick={() => router.push('/all-subjects')}
              className="text-sm text-purple-500"
            >
              {t.common.seeAll}
            </button>
          </div>

          {displaySubjects.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {displaySubjects.slice(0, 4).map((subject) => {
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
                      {recordings.filter((r) => r.subjectId === subject.id).length} {t.common.notes}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            // Empty state — ga ada subject sama sekali
            <button
              onClick={() => router.push('/all-subjects')}
              className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col items-center gap-2 text-center"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl">
                📚
              </div>
              <p className="text-sm font-medium text-gray-900">{t.home.noSubjectsYet}</p>
              <p className="text-xs text-gray-400">{t.home.noSubjectsTap}</p>
            </button>
          )}
        </>
      );
    })()}
  </div>
            {/* <div className="px-6 mb-6">
              {(() => {
                const todaySubjects = filterSubjectsByToday(subjects);
                if (todaySubjects.length > 0) {
                  // Ada subject hari ini
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg text-gray-900">Today's Subjects</h2>
                        <button
                          onClick={() => router.push('/all-subjects')}
                          className="text-sm text-purple-500"
                        >
                          See All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {todaySubjects.slice(0, 4).map((subject) => {
                          const subjectSlug = getSlugFromUUID(subject.id) || subject.id;
                          return (
                            <button
                              key={subject.id}
                              onClick={() => onNavigateToNotesList(subjectSlug)}
                              className="bg-white rounded-2xl p-5 transition-all active:scale-[0.98] text-left"
                              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
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
                    </>
                  );
                }
                // Tidak ada subject hari ini, cek upcoming
                // Cari hari terdekat yang ada subject
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const todayIdx = new Date().getDay();
                let foundDayIdx = null;
                let foundSubjects = [];
                for (let offset = 1; offset <= 6; offset++) {
                  const idx = (todayIdx + offset) % 7;
                  const dayName = days[idx];
                  const upcoming = subjects.filter(subj => Array.isArray(subj.schedule_days) && subj.schedule_days.includes(dayName));
                  if (upcoming.length > 0) {
                    foundDayIdx = idx;
                    foundSubjects = upcoming;
                    break;
                  }
                }
                if (foundSubjects.length > 0) {
                  // Ada upcoming
                  const label = foundDayIdx === (todayIdx + 1) % 7 ? 'Tomorrow' : days[foundDayIdx].slice(0, 3);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg text-gray-900">Upcoming · {label}</h2>
                        <button
                          onClick={() => router.push('/all-subjects')}
                          className="text-sm text-purple-500"
                        >
                          See All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {foundSubjects.slice(0, 4).map((subject) => {
                          const subjectSlug = getSlugFromUUID(subject.id) || subject.id;
                          return (
                            <button
                              key={subject.id}
                              onClick={() => onNavigateToNotesList(subjectSlug)}
                              className="bg-white rounded-2xl p-5 transition-all active:scale-[0.98] text-left"
                              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
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
                    </>
                  );
                }
                // Tidak ada subject sama sekali
                return (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="text-5xl mb-3">📚</div>
                    <div className="text-lg font-semibold text-gray-700 mb-2">No Subjects Yet</div>
                    <div className="text-sm text-gray-400 mb-4 text-center">Add your first subject to get started organizing your lectures!</div>
                    <button
                      onClick={() => router.push('/all-subjects')}
                      className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors active:scale-95"
                    >
                      Go to All Subjects
                    </button>
                  </div>
                );
              })()}
            </div> */}

            {/* Recent Recordings */}
            <div className="px-6 pb-8 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <h2 className="text-lg text-gray-900">{t.home.recent}</h2>
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
                      className="w-full bg-white rounded-2xl p-4 transition-all active:scale-[0.98] text-left"
                      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
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
