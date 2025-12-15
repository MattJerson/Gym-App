"use client";
import {
  Bell,
  Users,
  Award,
  Dumbbell,
  BarChart3,
  CreditCard,
  MessageCircle,
  UtensilsCrossed,
  Menu,
  X,
  Star,
  Home,
  LogOut,
  Settings,
} from "lucide-react";
import logo from "../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from '../lib/supabase';
import { RoleBadge } from './common/PermissionGate';
import { useUserRole } from '../middleware/adminAuth';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { role, isAdmin, isManager } = useUserRole();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate to login even if there's an error
      navigate('/login');
    }
  };
  
  // Define which items can be edited by Community Managers
  const editableByManager = ['meals', 'workouts', 'featured', 'chat'];
  
  const sidebarItems = [
    { label: "Dashboard", icon: Home, path: "/", viewOnly: !isAdmin },
    { label: "Meal Plans", icon: UtensilsCrossed, path: "/meals", viewOnly: false },
    { label: "Workout Plans", icon: Dumbbell, path: "/workouts", viewOnly: false },
    { label: "Featured Content", icon: Star, path: "/featured", viewOnly: false },
    { label: "Notifications", icon: Bell, path: "/notifications", viewOnly: !isAdmin },
    { label: "Community Chat", icon: MessageCircle, path: "/chat", viewOnly: false },
    { label: "Subscriptions", icon: CreditCard, path: "/subscriptions", viewOnly: !isAdmin },
    { label: "User Management", icon: Users, path: "/users", viewOnly: !isAdmin },
    { label: "Reports & Analytics", icon: BarChart3, path: "/analytics", viewOnly: !isAdmin },
    { label: "Leadership & Badges", icon: Award, path: "/badges", viewOnly: !isAdmin },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-2xl transform transition-transform duration-300 z-40 flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center p-4 border-b border-gray-100 flex-shrink-0">
          <img
            src={logo}
            alt="Brick After Brick Logo"
            className="h-32 object-contain mb-2"
          />
          <RoleBadge />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col overflow-y-auto">
          {sidebarItems.map(({ label, icon: Icon, path, viewOnly }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-6 py-3 mb-1 text-left transition-all relative ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border-r-4 border-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{label}</span>
              {viewOnly && !isAdmin && (
                <span className="ml-auto text-xs text-gray-400 italic">View Only</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer - Fixed at bottom */}
        <div className="border-t border-gray-100 p-4 flex-shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </div>

      {/* Spacer for main content */}
      <div className="hidden md:block w-64 flex-shrink-0"></div>
    </>
  );
};

export default Sidebar;