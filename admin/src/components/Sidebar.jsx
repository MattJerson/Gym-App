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
import { NavLink } from "react-router-dom";
import { useState } from "react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const sidebarItems = [
    { label: "Dashboard", icon: Home, path: "/" },
    { label: "Meal Plans", icon: UtensilsCrossed, path: "/meals" },
    { label: "Workout Plans", icon: Dumbbell, path: "/workouts" },
    { label: "Featured Content", icon: Star, path: "/featured" },
    { label: "Notifications", icon: Bell, path: "/notifications" },
    { label: "Subscriptions", icon: CreditCard, path: "/subscriptions" },
    { label: "User Management", icon: Users, path: "/users" },
    { label: "Reports & Analytics", icon: BarChart3, path: "/analytics" },
    { label: "Leadership & Badges", icon: Award, path: "/badges" },
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
        <div className="flex justify-center items-center p-6 border-b border-gray-100">
          <img
            src={logo}
            alt="Brick After Brick Logo"
            className="h-24 object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {sidebarItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-6 py-3 mb-1 text-left transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border-r-4 border-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
            <Settings className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-all mt-2">
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Spacer for main content */}
      <div className="hidden md:block w-64 flex-shrink-0"></div>
    </>
  );
};

export default Sidebar;
