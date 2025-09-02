import { Plus, Calendar, Dumbbell, Activity, Edit, Trash2 } from "lucide-react";

const workoutPlans = [
  {
    id: 1,
    name: "Beginner Full Body",
    duration: "4 weeks",
    exercises: 12,
    difficulty: "Beginner",
    active: true,
  },
  {
    id: 2,
    name: "HIIT Cardio Blast",
    duration: "6 weeks",
    exercises: 8,
    difficulty: "Advanced",
    active: true,
  },
];

const Workouts = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl md:text-left text-center font-bold text-gray-900">
          Workout Planning
        </h2>
        <button className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700">
          <Plus className="h-4 w-4" />
          Create Workout Plan
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Plans</h3>
          <p className="text-3xl font-bold text-orange-600">47</p>
          <p className="text-sm text-gray-600">12 new this month</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Most Popular</h3>
          <p className="text-xl font-bold text-blue-600">Full Body HIIT</p>
          <p className="text-sm text-gray-600">2,341 completions</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Completion Rate</h3>
          <p className="text-3xl font-bold text-green-600">76.8%</p>
          <p className="text-sm text-gray-600">+3.2% vs last month</p>
        </div>
      </div>

      {/* Workout Plans */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Workout Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workoutPlans.map((plan) => (
            <div
              key={plan.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                  <Dumbbell className="inline h-4 w-4 mr-1" />
                  Exercises: {plan.exercises}
                </p>
                <p className="text-sm text-gray-600">
                  <Activity className="inline h-4 w-4 mr-1" />
                  Difficulty: {plan.difficulty}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <button className="w-full sm:w-auto px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200">
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

export default Workouts;
