import { useEffect, useCallback, useRef } from 'react';
import { fetchWithAuth } from '../lib/fetch-with-auth';
import { useNotifications } from './useNotifications';
import { useServiceWorker } from './useServiceWorker';

interface Reminder {
  id: string;
  reminder_time: string;
  recording_id: string;
  sent: boolean;
  recordings?: {
    title: string;
    subject_id: string;
    subjects?: {
      name: string;
      icon: string;
    };
  };
}

export function useReminderChecker() {
  const { permission, showNotification } = useNotifications();
  const { showNativeNotification, triggerBackgroundSync } = useServiceWorker();
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef<number>(0);

  const checkReminders = useCallback(async () => {
    // Prevent duplicate simultaneous checks
    if (isCheckingRef.current) {
      console.log('[Reminders] Check already in progress, skipping');
      return;
    }

    // Don't check too frequently (minimum 10 seconds between checks)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 10000) {
      console.log('[Reminders] Checked recently, skipping');
      return;
    }

    if (permission !== 'granted') {
      console.log('[Reminders] Permission not granted');
      return;
    }

    isCheckingRef.current = true;
    lastCheckTimeRef.current = now;

    try {
      console.log('[Reminders] Starting reminder check...');
      // Fetch all pending reminders
      const response = await fetchWithAuth('/api/reminders');
      if (!response.ok) {
        console.error('[Reminders] Failed to fetch reminders:', response.status);
        return;
      }

      const data = await response.json();
      const reminders: Reminder[] = data.reminders || [];

      const currentTime = new Date();
      const pending = reminders.filter(r => !r.sent);

      console.log(`[Reminders] Found ${pending.length} pending reminders`);

      for (const reminder of pending) {
        const reminderTime = new Date(reminder.reminder_time);
        const diffInMinutes = (reminderTime.getTime() - currentTime.getTime()) / (1000 * 60);

        // Show notification if reminder time has passed (within last 5 minutes)
        if (diffInMinutes <= 0 && diffInMinutes >= -5) {
          const subjectName = reminder.recordings?.subjects?.name || 'Subject';
          const subjectIcon = reminder.recordings?.subjects?.icon || '📚';
          const recordingTitle = reminder.recordings?.title || 'Recording';

          console.log(`[Reminders] Showing notification for: ${subjectName}`);

          // Show custom in-app notification
          showNotification(
            `${subjectIcon} Review Reminder: ${subjectName}`,
            {
              body: `Time to review: ${recordingTitle}`,
              tag: reminder.id,
              icon: subjectIcon,
              onClick: () => {
                // Navigate to the recording when clicked
                if (typeof window !== 'undefined') {
                  window.location.href = `/transcription/${reminder.recording_id}/${reminder.recordings?.subject_id || ''}`;
                }
              },
            }
          );

          // Also show native notification for mobile/background
          showNativeNotification(
            `${subjectIcon} Review Reminder: ${subjectName}`,
            {
              body: `Time to review: ${recordingTitle}`,
              tag: reminder.id,
              data: {
                url: `/transcription/${reminder.recording_id}/${reminder.recordings?.subject_id || ''}`,
                reminderId: reminder.id,
              },
            }
          );

          // Mark reminder as sent
          try {
            const updateResponse = await fetchWithAuth('/api/reminders', {
              method: 'PUT',
              body: JSON.stringify({
                id: reminder.id,
                sent: true,
              }),
            });

            if (!updateResponse.ok) {
              console.error('[Reminders] Failed to mark reminder as sent');
            }
          } catch (error) {
            console.error('[Reminders] Error marking reminder as sent:', error);
          }
        }
      }
    } catch (error: any) {
      console.error('[Reminders] Error in checkReminders:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [permission, showNotification, showNativeNotification]);

  // Setup periodic checking when tab is active
  useEffect(() => {
    if (permission !== 'granted') return;

    console.log('[Reminders] Setting up periodic reminder checks');

    // Check immediately
    checkReminders();

    // Check every 30 seconds while tab is active
    const interval = setInterval(checkReminders, 30000);

    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Reminders] Tab became visible, checking reminders');
        checkReminders();
      } else {
        console.log('[Reminders] Tab became hidden, triggering background sync');
        // Trigger background sync when tab goes to background
        triggerBackgroundSync?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also check when page regains focus
    const handleFocus = () => {
      console.log('[Reminders] Window regained focus, checking reminders');
      checkReminders();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [permission, checkReminders, triggerBackgroundSync]);

  return { checkReminders };
}
