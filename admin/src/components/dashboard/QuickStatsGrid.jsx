import { TrendingUp, TrendingDown } from 'lucide-react';

const QuickStatsGrid = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Key Metrics</h3>
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-5 border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Executive KPIs</h3>
      <div className="space-y-4">
        {stats && stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {stat.label}
              </p>
              {stat.trend !== undefined && stat.trend !== 0 && (
                <div className="flex items-center gap-1">
                  {stat.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-bold ${stat.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend > 0 ? '+' : ''}{stat.trend.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
            {stat.subtitle && (
              <p className="text-sm text-gray-600">{stat.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStatsGrid;
