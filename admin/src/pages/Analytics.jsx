import React from "react";
import { Download } from "lucide-react";

const Analytics = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h2>
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-2">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm text-gray-600 mb-2">User Engagement</h3>
          <p className="text-2xl font-bold text-blue-600">87.3%</p>
          <p className="text-sm text-green-600">+5.2% vs last period</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm text-gray-600 mb-2">Workout Completion</h3>
          <p className="text-2xl font-bold text-green-600">76.8%</p>
          <p className="text-sm text-green-600">+3.1% vs last period</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm text-gray-600 mb-2">Average Session</h3>
          <p className="text-2xl font-bold text-purple-600">23m</p>
          <p className="text-sm text-red-600">-2m vs last period</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm text-gray-600 mb-2">Retention Rate</h3>
          <p className="text-2xl font-bold text-orange-600">82.1%</p>
          <p className="text-sm text-green-600">+1.8% vs last period</p>
        </div>
      </div>

      {/* Popular Workouts + Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Popular Workouts</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Full Body HIIT</span>
              <span className="font-semibold">2,341 completions</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Yoga Flow</span>
              <span className="font-semibold">1,897 completions</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Strength Training</span>
              <span className="font-semibold">1,654 completions</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">User Demographics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Age 18-25</span>
              <span className="font-semibold">28%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Age 26-35</span>
              <span className="font-semibold">42%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Age 36-45</span>
              <span className="font-semibold">23%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Age 46+</span>
              <span className="font-semibold">7%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
