import { Users, Dumbbell, Apple, Trophy, Shuffle, Bell, MessageCircle, UserPlus, Trash2, Megaphone, Shield, Activity } from 'lucide-react';

const RecentActivityCard = ({ activities, loading }) => {
  const getActivityIcon = (type, activityType) => {
    // Check specific activity type first for more granular icons
    if (activityType) {
      switch (activityType) {
        case 'content_shuffle':
        case 'content_shuffled':
          return <Shuffle className="h-5 w-5 text-purple-600" />;
        case 'notification_sent':
        case 'notification_launched':
          return <Bell className="h-5 w-5 text-blue-600" />;
        case 'user_registered':
          return <UserPlus className="h-5 w-5 text-green-600" />;
        case 'message_deleted':
          return <Trash2 className="h-5 w-5 text-red-600" />;
        case 'announcement_posted':
          return <Megaphone className="h-5 w-5 text-orange-600" />;
        case 'user_banned':
        case 'user_moderation':
          return <Shield className="h-5 w-5 text-red-600" />;
        case 'workout_completed':
          return <Dumbbell className="h-5 w-5 text-orange-600" />;
        default:
          break;
      }
    }
    
    // Fallback to category-based icons
    switch (type) {
      case 'user':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'workout':
        return <Dumbbell className="h-5 w-5 text-orange-600" />;
      case 'meal':
        return <Apple className="h-5 w-5 text-green-600" />;
      case 'badge':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'content':
        return <Shuffle className="h-5 w-5 text-purple-600" />;
      case 'admin':
        return <Activity className="h-5 w-5 text-indigo-600" />;
      case 'moderation':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBorderColor = (type, activityType) => {
    // Check specific activity type first
    if (activityType) {
      switch (activityType) {
        case 'content_shuffle':
        case 'content_shuffled':
          return 'border-purple-500';
        case 'notification_sent':
        case 'notification_launched':
          return 'border-blue-500';
        case 'user_registered':
          return 'border-green-500';
        case 'message_deleted':
          return 'border-red-500';
        case 'announcement_posted':
          return 'border-orange-500';
        case 'user_banned':
        case 'user_moderation':
          return 'border-red-500';
        case 'workout_completed':
          return 'border-orange-500';
        default:
          break;
      }
    }
    
    // Fallback to category-based colors
    switch (type) {
      case 'user':
        return 'border-blue-500';
      case 'workout':
        return 'border-orange-500';
      case 'meal':
        return 'border-green-500';
      case 'badge':
        return 'border-yellow-500';
      case 'content':
        return 'border-purple-500';
      case 'admin':
        return 'border-indigo-500';
      case 'moderation':
        return 'border-red-500';
      case 'system':
        return 'border-gray-400';
      default:
        return 'border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
              <div className="h-5 w-5 bg-gray-200 rounded mt-1"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-40 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start gap-4 p-4 rounded-xl border-l-4 ${getBorderColor(activity.type, activity.activityType)} bg-gray-50 hover:bg-gray-100 transition-colors`}
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type, activity.activityType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {activity.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.action}
                </p>
                {activity.email && activity.type === 'user' && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {activity.email}
                  </p>
                )}
                {activity.metadata && (
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.metadata}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs text-gray-500 font-medium">{activity.time}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivityCard;
