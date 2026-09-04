import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, Bell, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { currentUser, profile, signOut, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const publicLinks = [
    { name: 'Home', path: '/' },
    { name: 'Browse Items', path: '/items' },
  ];

  const privateLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Messages', path: '/conversations' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'My Reports', path: '/my-reports' },
    { name: 'My Profile', path: '/profile' },
    { name: 'Browse Items', path: '/items' },
  ];

  const navLinks = currentUser ? privateLinks : publicLinks;

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-3xs"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex-shrink-0 flex items-center focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
              aria-label="SBJain ItemTrace Home"
            >
              <Logo size="sm" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6" role="menubar">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                role="menuitem"
                className={`font-medium relative py-1 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md ${
                  isActive(link.path) ? 'text-primary-600 font-bold' : 'text-slate-600 hover:text-primary-500'
                }`}
              >
                {link.name}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-primary-500 transition-all duration-200 ${
                    isActive(link.path) ? 'w-full' : 'w-0'
                  }`}
                  aria-hidden="true"
                />
              </Link>
            ))}

            {/* Admin Console Shortcut (Admin Only) */}
            {isAdmin && (
              <Link
                to="/admin"
                role="menuitem"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                }`}
                aria-label="Open Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Admin Console
              </Link>
            )}
          </div>

          {/* Desktop User Controls */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-primary-500"
                  title="Notifications"
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />

                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full border-2 border-white animate-scaleIn"
                      aria-hidden="true"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="View My Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center overflow-hidden">
                    {profile?.profile_image ? (
                      <img
                        src={profile.profile_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </div>

                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-bold text-slate-700">
                      {profile?.full_name?.split(' ')[0] || 'Student'}
                    </span>

                    <span className="text-[9px] font-medium text-slate-400">
                      @{profile?.username || 'user'}
                    </span>
                  </div>
                </Link>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors shadow-3xs focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <LogIn className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-slate-50 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
        role="region"
        aria-label="Mobile Navigation Menu"
      >
        <div className="px-4 pt-2 pb-4 space-y-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive(link.path) ? 'bg-primary-50 text-primary-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100"
            >
              🛡️ Admin Console
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sign Out
              </button>
            ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors shadow-3xs"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  Sign In
                </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}