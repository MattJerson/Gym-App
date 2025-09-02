import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

const Analytics = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Last 7 days");

  const options = ["Last 7 days", "Last 30 days", "Last 90 days"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl md:text-left text-center font-bold text-gray-900">
          Reports & Analytics
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Custom Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="border border-gray-400 rounded-lg px-3 py-2 w-full flex justify-between items-center"
            >
              {selected}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {isOpen && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelected(option);
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-sm text-gray-600 mb-2">User Engagement</h3>
          <p className="text-2xl font-bold text-blue-600">87.3%</p>
          <p className="text-sm text-green-600">+5.2% vs last period</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-sm text-gray-600 mb-2">Workout Completion</h3>
          <p className="text-2xl font-bold text-green-600">76.8%</p>
          <p className="text-sm text-green-600">+3.1% vs last period</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-sm text-gray-600 mb-2">Average Session</h3>
          <p className="text-2xl font-bold text-purple-600">23m</p>
          <p className="text-sm text-red-600">-2m vs last period</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-sm text-gray-600 mb-2">Retention Rate</h3>
          <p className="text-2xl font-bold text-orange-600">82.1%</p>
          <p className="text-sm text-green-600">+1.8% vs last period</p>
        </div>
      </div>

      {/* Popular Workouts + Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
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

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
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
