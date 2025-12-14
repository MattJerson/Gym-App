// services/NotificationService.js
// Service for fetching and managing user notifications

import { supabase } from './supabase';

export const NotificationService = {
  /**
   * Fetch user notifications (both manual broadcasts and automated notifications)
   */
  async fetchUserNotifications(userId, limit = 20) {
    try {
      if (!userId) {
        if (__DEV__) console.log('[Notifications] No userId provided');
        return [];
      }

      if (__DEV__) console.log('[Notifications] Fetching for user:', userId);

      // First, get dismissed notifications to filter them out
      const { data: dismissedData, error: dismissedError } = await supabase
        .from('notification_dismissals')
        .select('notification_id, notification_source')
        .eq('user_id', userId);

      if (dismissedError) {
        console.error('Error fetching dismissed notifications:', dismissedError.message);
      }

      const dismissedManual = new Set(
        (dismissedData || [])
          .filter(d => d.notification_source === 'manual')
          .map(d => d.notification_id)
      );
      const dismissedAutomated = new Set(
        (dismissedData || [])
          .filter(d => d.notification_source === 'automated')
          .map(d => d.notification_id)
      );

      if (__DEV__) {
        console.log('[Notifications] Dismissed counts - Manual:', dismissedManual.size, 'Automated:', dismissedAutomated.size);
      }

      // Get user's registration date to filter notifications
      const { data: userData, error: userError } = await supabase
        .from('registration_profiles')
        .select('created_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user registration date:', userError.message);
      }

      const userRegistrationDate = userData?.created_at;

      // Fetch both manual broadcasts AND automated notifications in parallel
      const [manualResult, automatedResult] = await Promise.all([
        // Manual broadcasts (sent to all users) - only show notifications sent AFTER user registered
        supabase
          .from('notifications')
          .select('*')
          .eq('status', 'sent')
          .gte('sent_at', userRegistrationDate || new Date(0).toISOString()) // Only notifications sent after registration
          .order('sent_at', { ascending: false })
          .limit(limit * 2), // Fetch more to account for dismissed ones
        
        // Automated notifications (all notification_logs for this user)
        // This includes both trigger-based and any other user-specific notifications
        supabase
          .from('notification_logs')
          .select('*')
          .eq('user_id', userId)
          .order('sent_at', { ascending: false })
          .limit(limit * 2) // Fetch more to account for dismissed ones
      ]);

      let manualNotifications = manualResult.data || [];
      let automatedNotifications = automatedResult.data || [];

      if (manualResult.error) {
        console.error('Error fetching manual notifications:', manualResult.error.message);
      }
      
      if (automatedResult.error) {
        console.error('Error fetching automated notifications:', automatedResult.error.message);
      }

      // Filter out dismissed notifications
      manualNotifications = manualNotifications.filter(n => !dismissedManual.has(n.id));
      automatedNotifications = automatedNotifications.filter(n => !dismissedAutomated.has(n.id));

      // Transform automated logs to match notification format
      const transformedAutomated = automatedNotifications.map(log => ({
        id: log.id,
        title: log.title,
        message: log.message,
        type: log.type || 'info',
        created_at: log.sent_at,
        sent_at: log.sent_at,
        status: 'sent',
        source: 'automated' // Mark as automated
      }));

      // Transform manual notifications
      const transformedManual = manualNotifications.map(notif => ({
        ...notif,
        source: 'manual' // Mark as manual broadcast
      }));

      // Combine and sort by date
      const allNotifications = [...transformedManual, ...transformedAutomated]
        .sort((a, b) => new Date(b.sent_at || b.created_at) - new Date(a.sent_at || a.created_at))
        .slice(0, limit);

      if (allNotifications.length === 0) {
        if (__DEV__) console.log('[Notifications] No notifications found for user');
        return [];
      }

      // Get read status for manual notifications only (automated don't have read tracking yet)
      const manualIds = allNotifications
        .filter(n => n.source === 'manual')
        .map(n => n.id);

      let readsMap = new Map();
      if (manualIds.length > 0) {
        const { data: reads, error: readsError } = await supabase
          .from('notification_reads')
          .select('notification_id, is_read, read_at')
          .eq('user_id', userId)
          .in('notification_id', manualIds);

        if (readsError) {
          console.error('Error fetching read status:', readsError.message);
        } else {
          readsMap = new Map(reads?.map(r => [r.notification_id, r]) || []);
        }
      }

      if (__DEV__) {
        console.log(`[Notifications] Returning ${allNotifications.length} notifications`);
      }

      // Merge with read status
      return allNotifications.map(notification => {
        if (notification.source === 'automated') {
          // Automated notifications are shown as unread until user dismisses them
          // (They don't have database tracking, just UI state)
          return {
            ...notification,
            is_read: false, // Show as unread in UI
            read_at: null
          };
        }
        
        const readStatus = readsMap.get(notification.id);
        return {
          ...notification,
          is_read: readStatus?.is_read || false,
          read_at: readStatus?.read_at || null
        };
      });

    } catch (error) {
      console.error('Error in fetchUserNotifications:', error.message || 'Unknown error');
      return [];
    }
  },

  /**
   * Get unread notification count (manual broadcasts + automated that aren't dismissed)
   */
  async getUnreadCount(userId) {
    try {
      if (!userId) {
        if (__DEV__) console.log('[Notifications] No userId for unread count');
        return 0;
      }

      // Get dismissed notifications to filter them out
      const { data: dismissedData, error: dismissedError } = await supabase
        .from('notification_dismissals')
        .select('notification_id, notification_source')
        .eq('user_id', userId);

      if (dismissedError) {
        console.error('Error fetching dismissed notifications for count:', dismissedError.message);
      }

      const dismissedManual = new Set(
        (dismissedData || [])
          .filter(d => d.notification_source === 'manual')
          .map(d => d.notification_id)
      );
      const dismissedAutomated = new Set(
        (dismissedData || [])
          .filter(d => d.notification_source === 'automated')
          .map(d => d.notification_id)
      );

      // Get user's registration date to filter notifications
      const { data: userData, error: userError } = await supabase
        .from('registration_profiles')
        .select('created_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user registration date for count:', userError.message);
      }

      const userRegistrationDate = userData?.created_at;

      // Get all sent manual notifications (broadcast to all) - only those sent AFTER user registered
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id')
        .eq('status', 'sent')
        .gte('sent_at', userRegistrationDate || new Date(0).toISOString());

      if (notifError) {
        console.error('Error fetching notifications for count:', notifError.message || 'Unknown error');
        return 0;
      }

      // Filter out dismissed manual notifications
      const unDismissedManual = (notifications || []).filter(n => !dismissedManual.has(n.id));

      if (unDismissedManual.length === 0) {
        // No manual notifications, just check automated
        const { data: automatedNotifs, error: automatedError } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', userId);

        if (automatedError) {
          console.error('Error fetching automated notifications for count:', automatedError.message);
          return 0;
        }

        // Filter out dismissed automated
        const unDismissedAutomated = (automatedNotifs || []).filter(n => !dismissedAutomated.has(n.id));
        
        if (__DEV__) {
        }

        return unDismissedAutomated.length;
      }

      const notificationIds = unDismissedManual.map(n => n.id);

      // Get read notifications for this user
      const { data: reads, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', userId)
        .eq('is_read', true)
        .in('notification_id', notificationIds);

      if (readsError) {
        console.error('Error fetching read count:', readsError.message || 'Unknown error');
        return unDismissedManual.length; // Assume all unread if we can't check
      }

      const readCount = reads?.length || 0;
      const manualUnreadCount = unDismissedManual.length - readCount;

      // Get count of automated notifications (excluding dismissed ones)
      const { data: automatedNotifs, error: automatedError } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('user_id', userId);

      if (automatedError) {
        console.error('Error fetching automated notifications for count:', automatedError.message);
        
        if (__DEV__) {
        }
        
        return manualUnreadCount;
      }

      // Filter out dismissed automated
      const unDismissedAutomated = (automatedNotifs || []).filter(n => !dismissedAutomated.has(n.id));

      const totalUnread = manualUnreadCount + unDismissedAutomated.length;

      if (__DEV__) {
      }
      
      return totalUnread;

    } catch (error) {
      console.error('Error in getUnreadCount:', error.message || 'Unknown error');
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(userId, notificationId) {
    try {
      const { error } = await supabase
        .from('notification_reads')
        .upsert({
          user_id: userId,
          notification_id: notificationId,
          is_read: true,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,notification_id'
        });

      if (error) {
        console.error('Error marking notification as read:', error.message);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error.message || 'Unknown error');
      return false;
    }
  },

  /**
   * Mark all notifications as read/dismissed (manual marked read, automated deleted)
   */
  async markAllAsRead(userId) {
    try {
      // Use the SQL function to mark ALL manual as read and delete ALL automated
      const { data, error } = await supabase
        .rpc('mark_all_notifications_read', { p_user_id: userId });
      
      if (error) {
        console.error('Error marking all as read:', error.message);
        throw error;
      }
      
      if (__DEV__) {
      }
      
      return data; // Returns { manual_marked_read, automated_deleted, total_processed }
    } catch (error) {
      console.error('Error in markAllAsRead:', error.message || 'Unknown error');
      return null;
    }
  },

  /**
   * Dismiss all notifications for a user (both manual and automated)
   * This is used for "Clear All" functionality
   */
  async dismissAllNotifications(userId) {
    try {
      // Use the SQL function to dismiss ALL notifications efficiently
      const { data, error } = await supabase
        .rpc('dismiss_all_notifications', { p_user_id: userId });
      
      if (error) {
        console.error('Error dismissing all notifications:', error.message);
        throw error;
      }
      
      if (__DEV__) {
      }
      
      return data; // Returns { manual_dismissed, automated_dismissed, total_dismissed }
    } catch (error) {
      console.error('Error in dismissAllNotifications:', error.message || 'Unknown error');
      return null;
    }
  },

  /**
   * Subscribe to real-time notifications (both manual broadcasts and automated) with retry logic
   */
  subscribeToNotifications(userId, onNewNotification) {
    if (!userId) {
      if (__DEV__) {
      }
      return { unsubscribe: () => {} };
    }

    if (__DEV__) {
    }

    // Create unique channel name to avoid conflicts
    const channelName = `notifications-${userId}-${Date.now()}`;
    
    // Track connection attempts and errors
    let errorCount = 0;
    let errorTimeout = null;
    const MAX_RETRY_WAIT = 120000; // 2 minutes (120 seconds)
    
    const channel = supabase
      .channel(channelName)
      // Listen for manual broadcast notifications (INSERT)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'status=eq.sent'
      }, payload => {
        if (__DEV__) {
        }
        errorCount = 0;
        if (errorTimeout) {
          clearTimeout(errorTimeout);
          errorTimeout = null;
        }
        
        if (onNewNotification && payload.new.status === 'sent') {
          onNewNotification({
            ...payload.new,
            source: 'manual',
            is_read: false,
            read_at: null
          });
        }
      })
      // Listen for manual notifications status updates (draft -> sent)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, payload => {
        if (__DEV__) {
        }
        
        const wasNotSent = payload.old?.status !== 'sent';
        const isNowSent = payload.new?.status === 'sent';
        
        if (wasNotSent && isNowSent) {
          if (__DEV__) {
          }
          errorCount = 0;
          if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
          }
          
          if (onNewNotification) {
            onNewNotification({
              ...payload.new,
              source: 'manual',
              is_read: false,
              read_at: null
            });
          }
        } else {
          if (__DEV__) {
          }
        }
      })
      // Listen for automated notifications (user-specific)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_logs',
        filter: `user_id=eq.${userId}`
      }, payload => {
        if (__DEV__) {
        }
        errorCount = 0;
        if (errorTimeout) {
          clearTimeout(errorTimeout);
          errorTimeout = null;
        }
        
        if (onNewNotification) {
          onNewNotification({
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type || 'info',
            created_at: payload.new.sent_at,
            sent_at: payload.new.sent_at,
            status: 'sent',
            source: 'automated',
            is_read: false, // Show as unread in UI (same as manual)
            read_at: null
          });
        }
      })
      .subscribe((status, err) => {
        if (__DEV__) {
        }
        
        if (status === 'SUBSCRIBED') {
          if (__DEV__) {
          }
          errorCount = 0;
          if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
          }
        } else if (status === 'CHANNEL_ERROR') {
          errorCount++;
          
          if (!errorTimeout) {
            if (__DEV__) {
            }
            
            errorTimeout = setTimeout(() => {
              if (errorCount > 0) {
                if (__DEV__) {
                  console.error('❌ NotificationService: Subscription failed after retry period', err);
                }
                errorTimeout = null;
              }
            }, MAX_RETRY_WAIT);
          }
        }
      });

    return {
      unsubscribe: () => {
        try {
          if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
          }
          if (__DEV__) {
          }
          supabase.removeChannel(channel);
        } catch (e) {
          console.error('Error unsubscribing:', e.message || 'Unknown error');
        }
      }
    };
  },

  /**
   * Create a chat notification for a user
   * @param {string} recipientUserId - User who will receive the notification
   * @param {string} senderUsername - Username of the sender
   * @param {string} messagePreview - Preview of the message (first ~50 chars)
   * @param {string} chatType - 'dm' or 'channel'
   * @param {string} chatId - Conversation ID or channel ID
   */
  async createChatNotification(recipientUserId, senderUsername, messagePreview, chatType = 'dm', chatId = null) {
    try {
      const title = chatType === 'dm' 
        ? `New message from @${senderUsername}`
        : `New message in #${chatId}`;
      
      const { data, error } = await supabase
        .from('notification_logs')
        .insert({
          user_id: recipientUserId,
          title: title,
          message: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
          type: 'info',
          sent_at: new Date().toISOString(),
          metadata: {
            chat_type: chatType,
            chat_id: chatId,
            sender: senderUsername
          }
        })
        .select()
        .single();

      if (error) {
        console.error('[NotificationService] Error creating chat notification:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[NotificationService] Unexpected error creating chat notification:', err);
      return { success: false, error: err };
    }
  }
};
