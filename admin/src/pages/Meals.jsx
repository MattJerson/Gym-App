import {
  X,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Activity,
  Dumbbell,
} from "lucide-react";
import { useState, useEffect } from "react";

const Workouts = () => {
  // ✅ Load workout plans from localStorage
  const [workoutPlans, setWorkoutPlans] = useState(() => {
    const saved = localStorage.getItem("workoutPlans");
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ Persist to localStorage when workoutPlans changes
  useEffect(() => {
    localStorage.setItem("workoutPlans", JSON.stringify(workoutPlans));
  }, [workoutPlans]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    exercises: "",
    difficulty: "Beginner",
    active: true,
  });

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Add or Update workout plan
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      setWorkoutPlans((prev) =>
        prev.map((plan) =>
          plan.id === editingId ? { ...plan, ...formData } : plan
        )
      );
    } else {
      const newPlan = {
        id: Date.now(),
        ...formData,
        exercises: Number(formData.exercises),
      };
      setWorkoutPlans((prev) => [...prev, newPlan]);
    }

    handleCancel();
  };

  // ✅ Delete workout plan
  const handleDelete = (id) => {
    setWorkoutPlans((prev) => prev.filter((plan) => plan.id !== id));
  };

  // ✅ Edit workout plan
  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setFormData(plan);
    setIsOpen(true);
  };

  // ✅ Cancel modal
  const handleCancel = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      duration: "",
      exercises: "",
      difficulty: "Beginner",
      active: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl md:text-left text-center font-bold text-gray-900">
          Workout Planning
        </h2>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Create Workout Plan
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Plans</h3>
          <p className="text-3xl font-bold text-orange-600">
            {workoutPlans.length}
          </p>
          <p className="text-sm text-gray-600">+1 when you add new plan</p>
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
        {workoutPlans.length === 0 ? (
          <p className="text-gray-500">No workout plans yet. Create one!</p>
        ) : (
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
                  <button className="w-full sm:w-auto px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200">
                    View Details
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Workout Plan Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Workout Plan" : "Create Workout Plan"}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Plan Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Beginner Full Body"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Duration *
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 4 weeks, 6 weeks"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Exercises */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Dumbbell className="inline h-4 w-4 mr-1" />
                  Number of Exercises *
                </label>
                <input
                  type="number"
                  name="exercises"
                  value={formData.exercises}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Activity className="inline h-4 w-4 mr-1" />
                  Difficulty *
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Set as active plan
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {editingId ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
