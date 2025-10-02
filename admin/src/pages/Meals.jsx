import {
  X,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Activity,
  UtensilsCrossed,
} from "lucide-react";
import { useState, useEffect } from "react";

const Meals = () => {
  const [mealPlans, setMealPlans] = useState(() => {
    const saved = localStorage.getItem("mealPlans");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("mealPlans", JSON.stringify(mealPlans));
  }, [mealPlans]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    calories: "",
    type: "Balanced",
    active: true,
  });

  const mealTypes = [
    "Balanced",
    "High Protein",
    "Low Carb",
    "Keto",
    "Vegan",
    "Vegetarian",
    "Mediterranean",
    "Paleo",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setMealPlans((prev) =>
        prev.map((plan) =>
          plan.id === editingId ? { ...plan, ...formData } : plan
        )
      );
    } else {
      const newPlan = { id: Date.now(), ...formData };
      setMealPlans((prev) => [...prev, newPlan]);
    }
    handleCancel();
  };

  const handleDelete = (id) => {
    setMealPlans((prev) => prev.filter((plan) => plan.id !== id));
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setFormData(plan);
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      duration: "",
      calories: "",
      type: "Balanced",
      active: true,
    });
  };

  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl md:text-left text-center font-bold text-gray-900">
          Meal Planning
        </h2>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Create Meal Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Plans</h3>
          <p className="text-3xl font-bold text-green-600">
            {mealPlans.length}
          </p>
          <p className="text-sm text-gray-600">+1 when you add new plan</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Most Popular</h3>
          <p className="text-xl font-bold text-blue-600">Weight Loss</p>
          <p className="text-sm text-gray-600">1,897 followers</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Adherence Rate</h3>
          <p className="text-3xl font-bold text-purple-600">84.2%</p>
          <p className="text-sm text-gray-600">+5.1% vs last month</p>
        </div>
      </div>

      {/* Meal Plans */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Meal Plans</h3>
        {mealPlans.length === 0 ? (
          <p className="text-gray-500">No meal plans yet. Create one!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealPlans.map((plan) => (
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
                    <UtensilsCrossed className="inline h-4 w-4 mr-1" />
                    Calories: {plan.calories}/day
                  </p>
                  <p className="text-sm text-gray-600">
                    <Activity className="inline h-4 w-4 mr-1" />
                    Type: {plan.type}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  {/* ✅ View Details button */}
                  <button
                    onClick={() => handleViewDetails(plan)}
                    className="w-full sm:w-auto px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                  >
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

      {/* ✅ View Details Modal */}
      {isDetailsOpen && selectedPlan && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Meal Plan Details
              </h3>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p>
                <strong>Name:</strong> {selectedPlan.name}
              </p>
              <p>
                <strong>Duration:</strong> {selectedPlan.duration}
              </p>
              <p>
                <strong>Calories:</strong> {selectedPlan.calories} / day
              </p>
              <p>
                <strong>Type:</strong> {selectedPlan.type}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedPlan.active ? (
                  <span className="text-green-600">Active ✅</span>
                ) : (
                  <span className="text-red-600">Inactive ❌</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Meal Plan" : "Create Meal Plan"}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Muscle Building"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration *
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 4 weeks"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Calories *
                </label>
                <input
                  type="number"
                  name="calories"
                  value={formData.calories}
                  onChange={handleInputChange}
                  placeholder="e.g., 2000"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {mealTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Set as active plan
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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

export default Meals;
