import React from "react";
import { Plus, Edit, Trash2 } from "lucide-react";

const badges = [
  {
    id: 1,
    name: "First Workout",
    description: "Complete your first workout",
    icon: "🏃",
    earned: 2340,
  },
  {
    id: 2,
    name: "7-Day Streak",
    description: "Workout for 7 consecutive days",
    icon: "🔥",
    earned: 1876,
  },
];

const Badges = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Leadership & Badges
        </h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700">
          <Plus className="h-4 w-4" />
          Create Badge
        </button>
      </div>

      {/* Leaderboard + Badge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-gray-600">1,247 points</p>
                </div>
              </div>
              <span className="text-sm font-medium text-yellow-700">#1</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥈</span>
                <div>
                  <p className="font-semibold">Mike Davis</p>
                  <p className="text-sm text-gray-600">1,156 points</p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">#2</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥉</span>
                <div>
                  <p className="font-semibold">John Smith</p>
                  <p className="text-sm text-gray-600">987 points</p>
                </div>
              </div>
              <span className="text-sm font-medium text-orange-700">#3</span>
            </div>
          </div>
        </div>

        {/* Badge Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Badge Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Total Badges</span>
              <span className="font-semibold">24</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Most Earned</span>
              <span className="font-semibold">First Workout (2,340)</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Rarest Badge</span>
              <span className="font-semibold">Marathon Master (12)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Badges */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Available Badges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-center mb-3">
                <span className="text-4xl mb-2 block">{badge.icon}</span>
                <h4 className="font-semibold text-lg">{badge.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3 text-center">
                {badge.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Earned by {badge.earned} users
                </span>
                <div className="flex gap-1">
                  <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
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

export default Badges;
