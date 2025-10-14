// Reusable Stats Card Component - Redesigned for clarity and impact
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon,
  color = 'blue', // blue, green, purple, orange, red
  subtitle,
  // Deprecated props for backward compatibility
  change, 
  changeType
}) => {
  // Icon colors - pure color without gradients for better visibility
  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    red: 'text-red-500'
  };

  return (
    <div className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 
                    hover:shadow-xl hover:scale-105 hover:-translate-y-1 
                    transition-all duration-300 ease-out cursor-pointer
                    hover:border-gray-200">
      
      {/* Header with Icon and Title */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">
            {title}
          </p>
        </div>
        {Icon && (
          <div className="ml-3">
            <Icon className={`h-8 w-8 ${iconColors[color]} 
                            group-hover:scale-110 transition-transform duration-300`} 
                  strokeWidth={2} />
          </div>
        )}
      </div>
      
      {/* Main Value - Large and Bold */}
      <div className="mb-3">
        <p className="text-5xl font-extrabold text-gray-900 leading-none 
                      group-hover:text-gray-800 transition-colors duration-300"
           style={{ lineHeight: '1.1' }}>
          {value}
        </p>
      </div>

      {/* Subtitle - Supporting Information */}
      {subtitle && (
        <p className="text-sm font-medium text-gray-500 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatsCard;
