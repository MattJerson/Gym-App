import React from "react";
import { Plus, Eye, Edit } from "lucide-react";

const notifications = [
  {
    id: 1,
    title: "Welcome Message",
    content: "Welcome to FitApp!",
    type: "Welcome",
    sent: 1250,
    opened: 987,
  },
  {
    id: 2,
    title: "Workout Reminder",
    content: "Time for your daily workout!",
    type: "Reminder",
    sent: 5400,
    opened: 3210,
  },
];

const Notifications = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Notifications & Alerts
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Create Notification
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Sent</h3>
          <p className="text-3xl font-bold text-blue-600">34,567</p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Open Rate</h3>
          <p className="text-3xl font-bold text-green-600">68.4%</p>
          <p className="text-sm text-gray-600">Above industry average</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Click Rate</h3>
          <p className="text-3xl font-bold text-purple-600">12.8%</p>
          <p className="text-sm text-gray-600">+2.1% vs last month</p>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Notification Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Title</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Sent</th>
                <th className="text-left py-3 px-4">Opened</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">
                    {notification.title}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {notification.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {notification.sent.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {notification.opened.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      Sent
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
