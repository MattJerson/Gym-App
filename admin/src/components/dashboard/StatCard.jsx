import { TrendingUp, TrendingDown } from "lucide-react";

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue",
  change,
  changeLabel,
  subMetric,
  loading 
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 border-blue-500",
    purple: "from-purple-500 to-purple-600 border-purple-500",
    orange: "from-orange-500 to-orange-600 border-orange-500",
    green: "from-green-500 to-green-600 border-green-500",
  };

  const iconBgClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600",
    orange: "bg-gradient-to-br from-orange-500 to-orange-600",
    green: "bg-gradient-to-br from-green-500 to-green-600",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border-l-8 border-gray-300 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="mb-3">
          <div className="h-12 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-8 ${colorClasses[color].split(" ")[2]} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBgClasses[color]} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-4xl font-bold text-gray-900">{value}</p>
      </div>

      {change !== undefined && changeLabel && (
        <div className="flex items-center gap-2 mb-2">
          {change >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {changeLabel}
          </span>
        </div>
      )}

      {subMetric && (
        <p className="text-sm text-gray-500 font-medium">{subMetric}</p>
      )}
    </div>
  );
};

export default StatCard;
