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

      // Fetch both manual broadcasts AND automated notifications in parallel
      const [manualResult, automatedResult] = await Promise.all([
        // Manual broadcasts (sent to all users)
        supabase
          .from('notifications')
          .select('*')
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(limit),
        
        // Automated notifications (personalized, user-specific)
        supabase
          .from('notification_logs')
          .select('*')
          .eq('user_id', userId)
          .order('sent_at', { ascending: false })
          .limit(limit)
      ]);

      const manualNotifications = manualResult.data || [];
      const automatedNotifications = automatedResult.data || [];

      if (manualResult.error) {
        console.error('Error fetching manual notifications:', manualResult.error.message);
      }
      
      if (automatedResult.error) {
        console.error('Error fetching automated notifications:', automatedResult.error.message);
      }

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
   * Get unread notification count (manual broadcasts only, automated are always "read")
   */
  async getUnreadCount(userId) {
    try {
      if (!userId) {
        if (__DEV__) {
          console.log('NotificationService: No userId for unread count');
        }
        return 0;
      }

      // Get all sent manual notifications (broadcast to all)
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id')
        .eq('status', 'sent');

      if (notifError) {
        console.error('Error fetching notifications for count:', notifError.message || 'Unknown error');
        return 0;
      }

      if (!notifications || notifications.length === 0) {
        return 0;
      }

      const notificationIds = notifications.map(n => n.id);

      // Get read notifications for this user
      const { data: reads, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', userId)
        .eq('is_read', true)
        .in('notification_id', notificationIds);

      if (readsError) {
        console.error('Error fetching read count:', readsError.message || 'Unknown error');
        return notifications.length; // Assume all unread if we can't check
      }

      const readCount = reads?.length || 0;
      const manualUnreadCount = notifications.length - readCount;

      // Get count of automated notifications from last 24 hours only
      // (older ones are "seen" and don't need badge attention)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { count: automatedCount, error: automatedError } = await supabase
        .from('notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('sent_at', twentyFourHoursAgo.toISOString());

      const automatedTotal = automatedError ? 0 : (automatedCount || 0);

      const totalUnread = manualUnreadCount + automatedTotal;

      if (__DEV__) {
        console.log('NotificationService: Unread count:', {
          manual: manualUnreadCount,
          automatedLast24h: automatedTotal,
          total: totalUnread
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
   * Mark all notifications as read (only manual notifications, automated don't have read tracking)
   */
  async markAllAsRead(userId) {
    try {
      // Get all notifications
      const notifications = await this.fetchUserNotifications(userId);
      
      // Filter only manual notifications (automated can't be marked as read due to FK constraint)
      const manualNotifications = notifications.filter(notif => notif.source === 'manual');
      
      // Mark each manual notification as read
      const promises = manualNotifications.map(notif => 
        this.markAsRead(userId, notif.id)
      );
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error.message || 'Unknown error');
      return false;
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
