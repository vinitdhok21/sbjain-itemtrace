import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-start space-y-3">
            <Logo size="sm" />
            <p className="text-sm italic text-slate-500 font-medium">
              "Lost it? Trace it. Found it? Return it."
            </p>
            <p className="text-xs text-slate-400">
              A student-run initiative to reunite lost possessions with their rightful owners at SB Jain College.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link to="/" className="text-slate-600 hover:text-primary-600 transition-colors duration-200">
                Home
              </Link>
              <Link to="/login" className="text-slate-600 hover:text-primary-600 transition-colors duration-200">
                Login
              </Link>
              <Link to="/register" className="text-slate-600 hover:text-primary-600 transition-colors duration-200">
                Register
              </Link>
              <Link to="/forgot-password" className="text-slate-600 hover:text-primary-600 transition-colors duration-200">
                Reset Password
              </Link>
            </div>
          </div>

          {/* College Info */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">College Information</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>S. B. Jain Institute of Technology, Management & Research</strong><br />
              Nagpur, Maharashtra, India<br />
              For support or feedback, contact the campus administrator office or student council representation.
            </p>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 text-xs text-slate-400">
          <div className="flex flex-col space-y-1 text-center sm:text-left">
            <div>
              &copy; {currentYear} SBJain ItemTrace. All rights reserved.
            </div>
            <div className="text-slate-500 font-medium">
              Developed by the Department of Computer Science and Engineering
            </div>
            <div className="text-slate-400 text-[11px]">
              S. B. Jain Institute of Technology, Management & Research
            </div>
          </div>
          <div className="flex gap-4 pt-1 sm:pt-0">
            <span className="cursor-not-allowed hover:text-slate-600">Privacy Policy</span>
            <span className="cursor-not-allowed hover:text-slate-600">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
