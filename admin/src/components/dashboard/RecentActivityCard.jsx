import { Users, Dumbbell, Apple, Trophy } from 'lucide-react';

const RecentActivityCard = ({ activities, loading }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'workout':
        return <Dumbbell className="h-5 w-5 text-orange-600" />;
      case 'meal':
        return <Apple className="h-5 w-5 text-green-600" />;
      case 'badge':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      default:
        return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'user':
        return 'border-blue-500';
      case 'workout':
        return 'border-orange-500';
      case 'meal':
        return 'border-green-500';
      case 'badge':
        return 'border-yellow-500';
      default:
        return 'border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
      <div className="space-y-3">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start gap-4 p-4 rounded-xl border-l-4 ${getBorderColor(activity.type)} bg-gray-50 hover:bg-gray-100 transition-colors`}
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
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
