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
} from "lucide-react";
import logo from "../assets/logo.png";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const sidebarItems = [
    { label: "Dashboard", icon: BarChart3, path: "/" },
    { label: "Subscriptions", icon: CreditCard, path: "/subscriptions" },
    { label: "User Management", icon: Users, path: "/users" },
    { label: "Reports & Analytics", icon: BarChart3, path: "/analytics" },
    { label: "User Chat", icon: MessageCircle, path: "/chat" },
    { label: "Notifications", icon: Bell, path: "/notifications" },
    { label: "Leadership & Badges", icon: Award, path: "/badges" },
    { label: "Workout Plans", icon: Dumbbell, path: "/workouts" },
    { label: "Meal Plans", icon: UtensilsCrossed, path: "/meals" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0">
      <div className="flex justify-center items-center">
        <img
          src={logo}
          alt="Brick After Brick Logo"
          className="h-50 object-contain"
        />
      </div>
      <nav className="">
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
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
