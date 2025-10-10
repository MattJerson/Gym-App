import React from 'react';

/**
 * AdminPageLayout - Consistent wrapper for all admin pages
 * Provides compact, professional styling
 */
export default function AdminPageLayout({ 
  children, 
  maxWidth = '1400px',
  className = '' 
}) {
  return (
    <div className={`admin-page-compact ${className}`}>
      <div className="admin-page-container" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

/**
 * PageHeader - Streamlined header component
 */
export function PageHeader({ icon: Icon, title, subtitle, actions, breadcrumbs }) {
  return (
    <div className="page-header">
      <div className="page-header-title">
        {Icon && <Icon className="h-8 w-8 text-blue-600" />}
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
          {breadcrumbs && (
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  <span>{crumb}</span>
                  {i < breadcrumbs.length - 1 && <span>/</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
