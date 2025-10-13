// Reusable Stats Card Component
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', // positive, negative, neutral
  icon: Icon,
  color = 'blue', // blue, green, purple, orange, red
  subtitle
}) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2">
          {changeType === 'positive' && <TrendingUp className="h-4 w-4 text-green-600" />}
          {changeType === 'negative' && <TrendingDown className="h-4 w-4 text-red-600" />}
          <span className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {change}
          </span>
        </div>
      )}

      {subtitle && (
        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
};

export default StatsCard;
