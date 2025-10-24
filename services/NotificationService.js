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
        if (__DEV__) {
          console.log('NotificationService: No userId provided');
        }
        return [];
      }

      if (__DEV__) {
        console.log('NotificationService: Fetching notifications for user:', userId);
      }

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
        console.log('NotificationService: Dismissed notifications:', {
          manual: dismissedManual.size,
          automated: dismissedAutomated.size
        });
      }

      // Fetch both manual broadcasts AND automated notifications in parallel
      const [manualResult, automatedResult] = await Promise.all([
        // Manual broadcasts (sent to all users)
        supabase
          .from('notifications')
          .select('*')
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(limit * 2), // Fetch more to account for dismissed ones
        
        // Automated notifications (personalized, user-specific)
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
        if (__DEV__) {
          console.log('NotificationService: No notifications found');
        }
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
        console.log('NotificationService: Fetched', allNotifications.length, 'notifications (manual + automated)');
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
        if (__DEV__) {
          console.log('NotificationService: No userId for unread count');
        }
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

      // Get all sent manual notifications (broadcast to all)
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id')
        .eq('status', 'sent');

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
          console.log('NotificationService: Unread count:', {
            manual: 0,
            automated: unDismissedAutomated.length,
            total: unDismissedAutomated.length
          });
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
          console.log('NotificationService: Unread count:', {
            manual: manualUnreadCount,
            automated: 0,
            total: manualUnreadCount
          });
        }
        
        return manualUnreadCount;
      }

      // Filter out dismissed automated
      const unDismissedAutomated = (automatedNotifs || []).filter(n => !dismissedAutomated.has(n.id));

      const totalUnread = manualUnreadCount + unDismissedAutomated.length;

      if (__DEV__) {
        console.log('NotificationService: Unread count:', {
          manual: manualUnreadCount,
          automated: unDismissedAutomated.length,
          total: totalUnread,
          dismissedManual: dismissedManual.size,
          dismissedAutomated: dismissedAutomated.size
        });
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
        console.log('NotificationService: Marked all as read:', data);
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
        console.log('NotificationService: Dismissed all notifications:', data);
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
        console.log('NotificationService: No userId for subscription');
      }
      return { unsubscribe: () => {} };
    }

    if (__DEV__) {
      console.log('NotificationService: Setting up real-time subscription for user:', userId);
    }

    // Create unique channel name to avoid conflicts
    const channelName = `notifications-${userId}-${Date.now()}`;
    
    // Track connection attempts and errors
    let errorCount = 0;
    let errorTimeout = null;
    const MAX_RETRY_WAIT = 10000; // 10 seconds
    
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
          console.log('🔔 NotificationService: New manual notification:', payload.new.title);
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
          console.log('📡 NotificationService: Received UPDATE event:', {
            old_status: payload.old?.status,
            new_status: payload.new?.status,
            title: payload.new?.title
          });
        }
        
        const wasNotSent = payload.old?.status !== 'sent';
        const isNowSent = payload.new?.status === 'sent';
        
        if (wasNotSent && isNowSent) {
          if (__DEV__) {
            console.log('🔔 NotificationService: Manual notification sent:', payload.new.title);
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
            console.log('⏭️ NotificationService: UPDATE event ignored (not a draft->sent transition)');
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
          console.log('🤖 NotificationService: New automated notification:', payload.new.title);
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
          console.log('NotificationService: Subscription status:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          if (__DEV__) {
            console.log('✅ NotificationService: Successfully subscribed to real-time notifications');
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
              console.log(`⚠️ NotificationService: Connection issue (attempt ${errorCount}), waiting ${MAX_RETRY_WAIT/1000}s...`);
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
            console.log('NotificationService: Unsubscribing from channel:', channelName);
          }
          supabase.removeChannel(channel);
        } catch (e) {
          console.error('Error unsubscribing:', e.message || 'Unknown error');
        }
      }
    };
  }
};
