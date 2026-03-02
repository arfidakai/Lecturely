import { useEffect, useCallback } from 'react';
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
  const { showNativeNotification } = useServiceWorker();

  const checkReminders = useCallback(async () => {
    if (permission !== 'granted') {
      return;
    }

    try {
      // Fetch all pending reminders
      const response = await fetchWithAuth('/api/reminders');
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const reminders: Reminder[] = data.reminders || [];

      const now = new Date();
      const pending = reminders.filter(r => !r.sent);

      for (const reminder of pending) {
        const reminderTime = new Date(reminder.reminder_time);
        const diffInMinutes = (reminderTime.getTime() - now.getTime()) / (1000 * 60);

        // Show notification if reminder time has passed (within last 5 minutes)
        // This ensures we don't miss notifications due to timing
        if (diffInMinutes <= 0 && diffInMinutes >= -5) {
          const subjectName = reminder.recordings?.subjects?.name || 'Subject';
          const subjectIcon = reminder.recordings?.subjects?.icon || '📚';
          const recordingTitle = reminder.recordings?.title || 'Recording';

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
              },
            }
          );

          // Mark reminder as sent
          const updateResponse = await fetchWithAuth('/api/reminders', {
            method: 'PUT',
            body: JSON.stringify({
              id: reminder.id,
              sent: true,
            }),
          });
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }, [permission, showNotification]);

  useEffect(() => {
    if (permission !== 'granted') return;

    // Check immediately
    checkReminders();

    // Check every 30 seconds
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [permission, checkReminders]);

  return { checkReminders };
}
