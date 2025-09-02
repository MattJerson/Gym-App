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
} from "lucide-react";
import logo from "../assets/logo.png";
import { NavLink } from "react-router-dom";
import { useState } from "react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const sidebarItems = [
    { label: "Dashboard", icon: BarChart3, path: "/" },
    { label: "User Chat", icon: MessageCircle, path: "/chat" },
    { label: "Meal Plans", icon: UtensilsCrossed, path: "/meals" },
    { label: "Workout Plans", icon: Dumbbell, path: "/workouts" },
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
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transform transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex justify-center items-center p-4">
          <img
            src={logo}
            alt="Brick After Brick Logo"
            className="h-50 object-contain"
          />
        </div>

        {/* Navigation */}
        <nav>
          {sidebarItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700"
                }`
              }
              onClick={() => setIsOpen(false)} // Close sidebar on mobile nav
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
