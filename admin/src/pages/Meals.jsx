import React from "react";
import {
  Plus,
  Calendar,
  UtensilsCrossed,
  Activity,
  Edit,
  Trash2,
} from "lucide-react";

const mealPlans = [
  {
    id: 1,
    name: "Muscle Building",
    duration: "4 weeks",
    calories: 2800,
    type: "High Protein",
    active: true,
  },
  {
    id: 2,
    name: "Weight Loss",
    duration: "8 weeks",
    calories: 1800,
    type: "Balanced",
    active: true,
  },
];

const Meals = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Meal Plans Management
        </h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Create Meal Plan
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Plans</h3>
          <p className="text-3xl font-bold text-green-600">23</p>
          <p className="text-sm text-gray-600">5 new this month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Most Popular</h3>
          <p className="text-xl font-bold text-blue-600">Weight Loss</p>
          <p className="text-sm text-gray-600">1,897 followers</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Adherence Rate</h3>
          <p className="text-3xl font-bold text-purple-600">84.2%</p>
          <p className="text-sm text-gray-600">+5.1% vs last month</p>
        </div>
      </div>

      {/* Meal Plans */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Meal Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mealPlans.map((plan) => (
            <div
              key={plan.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">{plan.name}</h4>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    plan.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {plan.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Duration: {plan.duration}
                </p>
                <p className="text-sm text-gray-600">
                  <UtensilsCrossed className="inline h-4 w-4 mr-1" />
                  Calories: {plan.calories}/day
                </p>
                <p className="text-sm text-gray-600">
                  <Activity className="inline h-4 w-4 mr-1" />
                  Type: {plan.type}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200">
                  View Details
                </button>
                <div className="flex gap-1">
                  <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Meals;
