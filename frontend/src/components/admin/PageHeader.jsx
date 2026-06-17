import React from "react";

export default function PageHeader({ icon, title, subtitle, children }) {
  return (
    <div className="page-header-container mb-8">
      <div className="page-header-content">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="page-header-icon-wrapper">
              <span className="page-header-icon">
                {icon}
              </span>
            </div>
          )}
          <div>
            <h1 className="page-header-title">{title}</h1>
            {subtitle && (
              <p className="page-header-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
