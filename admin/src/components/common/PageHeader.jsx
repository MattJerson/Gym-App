// Reusable Page Header Component
import { ChevronRight } from 'lucide-react';

const PageHeader = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  breadcrumbs = [],
  actions 
}) => {
  return (
    <div className="mb-5">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <span className={index === breadcrumbs.length - 1 ? 'text-blue-600 font-medium' : ''}>
                {crumb}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Header Content */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Icon className="h-8 w-8 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
        
        {/* Action Buttons */}
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
