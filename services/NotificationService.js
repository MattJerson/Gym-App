// services/NotificationService.js
// Service for fetching and managing user notifications

import { supabase } from './supabase';

export const NotificationService = {
  /**
   * Fetch user notifications (both read and unread)
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

      // Get all sent notifications (broadcast to all users)
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (notifError) {
        console.error('Error fetching notifications:', notifError.message || 'Unknown error');
        throw notifError;
      }

      if (!notifications || notifications.length === 0) {
        if (__DEV__) {
          console.log('NotificationService: No sent notifications found');
        }
        return [];
      }

      // Get read status for this user
      const notificationIds = notifications.map(n => n.id);
      const { data: reads, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id, is_read, read_at')
        .eq('user_id', userId)
        .in('notification_id', notificationIds);

      if (readsError) {
        console.error('Error fetching read status:', readsError.message || 'Unknown error');
        // Continue without read status rather than failing
      }

      if (__DEV__) {
        console.log('NotificationService: Fetched', notifications.length, 'notifications');
      }

      // Merge notifications with read status
      const readsMap = new Map(reads?.map(r => [r.notification_id, r]) || []);
      
      return notifications.map(notification => {
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
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      if (!userId) {
        if (__DEV__) {
          console.log('NotificationService: No userId for unread count');
        }
        return 0;
      }

      // Get all sent notifications
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
      const unreadCount = notifications.length - readCount;

      if (__DEV__) {
        console.log('NotificationService: Unread count:', unreadCount);
      }
      return unreadCount;

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
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      // Get all unread notifications
      const notifications = await this.fetchUserNotifications(userId);
      
      // Mark each as read
      const promises = notifications.map(notif => 
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
   * Subscribe to real-time notifications
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

    const channel = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'status=eq.sent'
      }, payload => {
        if (__DEV__) {
          console.log('🔔 NotificationService: New notification INSERT:', payload.new.title);
        }
        if (onNewNotification && payload.new.status === 'sent') {
          onNewNotification({
            ...payload.new,
            is_read: false,
            read_at: null
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, payload => {
        // Only notify if status changed to 'sent' (draft -> sent)
        const wasNotSent = payload.old?.status !== 'sent';
        const isNowSent = payload.new?.status === 'sent';
        
        if (wasNotSent && isNowSent) {
          if (__DEV__) {
            console.log('🔔 NotificationService: Notification status changed to SENT:', payload.new.title);
          }
          if (onNewNotification) {
            onNewNotification({
              ...payload.new,
              is_read: false,
              read_at: null
            });
          }
        }
      })
      .subscribe((status) => {
        if (__DEV__) {
          console.log('NotificationService: Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ NotificationService: Successfully subscribed to real-time notifications');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ NotificationService: Real-time subscription error');
          }
        }
      });

    return {
      unsubscribe: () => {
        try {
          if (__DEV__) {
            console.log('NotificationService: Unsubscribing from notifications');
          }
          supabase.removeChannel(channel);
        } catch (e) {
          console.error('Error unsubscribing from notifications:', e.message || 'Unknown error');
        }
      }
    };
  }
};
