import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Users,
  Activity,
  ArrowLeft,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children, title, subtitle }) {
  const { currentUser } = useAuth();

  const navItems = [
    { name: 'Analytics Overview', path: '/admin', icon: BarChart3, exact: true },
    { name: 'Reports Monitor', path: '/admin/reports', icon: FileText },
    { name: 'User Directory', path: '/admin/users', icon: Users },
    { name: 'System Activity', path: '/admin/activity', icon: Activity }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-[fadeIn_0.2s_ease-out]">
      {/* Top Banner & Return Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              Admin Console
            </span>
            <span className="text-xs text-slate-400 font-medium truncate">
              {currentUser?.email}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            {title || 'Administrative Monitoring'}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-3xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Student View
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Main Admin Page Content */}
      <div>{children}</div>
    </div>
  );
}
