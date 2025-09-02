import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { useState } from "react";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  // Helper functions for dynamic styling
  const getBorderColorClass = (color) => {
    const colorMap = {
      blue: "border-blue-500",
      green: "border-green-500",
      purple: "border-purple-500",
      orange: "border-orange-500",
    };
    return colorMap[color] || "border-gray-500";
  };

  const getTextColorClass = (color) => {
    const colorMap = {
      blue: "text-blue-500",
      green: "text-green-500",
      purple: "text-purple-500",
      orange: "text-orange-500",
    };
    return colorMap[color] || "text-gray-500";
  };

  // Dashboard data
  const stats = [
    {
      label: "Total Users",
      value: 12847,
      icon: Users,
      color: "blue",
    },
    {
      label: "Active Subscriptions",
      value: 8956,
      icon: CreditCard,
      color: "green",
    },
    {
      label: "Monthly Revenue",
      value: 89760,
      icon: DollarSign,
      color: "purple",
      isCurrency: true,
    },
    {
      label: "Workouts Completed",
      value: 45321,
      icon: Activity,
      color: "orange",
    },
  ];

  const users = [
    {
      id: 1,
      name: "John Smith",
      email: "john@email.com",
      subscription: "Premium",
      status: "Active",
      joinDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@email.com",
      subscription: "Basic",
      status: "Active",
      joinDate: "2024-02-20",
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike@email.com",
      subscription: "Premium",
      status: "Cancelled",
      joinDate: "2023-12-10",
    },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-left text-center font-bold text-gray-900">
        Dashboard Overview
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color, isCurrency }) => (
          <div
            key={label}
            className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${getBorderColorClass(
              color
            )}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isCurrency
                    ? `$${value.toLocaleString()}`
                    : value.toLocaleString()}
                </p>
              </div>
              <Icon className={`h-8 w-8 ${getTextColorClass(color)}`} />
            </div>
          </div>
        ))}
      </div>

      {/* User Activity & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Recent User Activity</h3>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">
                    Joined {user.joinDate}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    user.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="flex items-center justify-center h-32 bg-gray-50 rounded">
            <TrendingUp className="h-12 w-12 text-gray-400" />
            <span className="ml-2 text-gray-600">Chart placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
};

export default Dashboard;
