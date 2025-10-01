import {
  X,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Dumbbell,
  Activity,
  Upload,
} from "lucide-react";
import { useState, useEffect } from "react";

const Workouts = () => {
  // ✅ Load saved plans from localStorage
  const [workoutPlans, setWorkoutPlans] = useState(() => {
    const saved = localStorage.getItem("workoutPlans");
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ Save to localStorage whenever plans update
  useEffect(() => {
    localStorage.setItem("workoutPlans", JSON.stringify(workoutPlans));
  }, [workoutPlans]);

  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    exercises: "",
    difficulty: "Beginner",
    active: true,
    video: null,
  });

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  // ✅ Handle inputs, including video upload & thumbnail extraction
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files[0]) {
      const file = files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        const videoURL = reader.result;
        const videoElement = document.createElement("video");
        videoElement.src = videoURL;

        videoElement.onloadedmetadata = () => {
          videoElement.currentTime = 1; // seek to 1s
        };

        videoElement.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = videoElement.videoWidth / 2;
          canvas.height = videoElement.videoHeight / 2;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          const thumbnail = canvas.toDataURL("image/png");

          // ✅ store safe object for localStorage
          setFormData((prev) => ({
            ...prev,
            [name]: {
              name: file.name,
              data: videoURL,
              thumbnail,
            },
          }));
        };
      };

      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // ✅ Create or update workout plan
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

  // ✅ Open details modal
  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setIsDetailsOpen(true);
  };

  // ✅ Reset modal
  const handleCancel = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      duration: "",
      exercises: "",
      difficulty: "Beginner",
      active: true,
      video: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Workout Planning</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Create Workout Plan
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-sm font-medium text-gray-500">Total Plans</h4>
          <p className="text-2xl font-bold text-orange-600">
            {workoutPlans.length}
          </p>
          <p className="text-xs text-gray-500">+1 when you add a new plan</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-sm font-medium text-gray-500">Most Popular</h4>
          <p className="text-blue-600 font-semibold cursor-pointer">
            Full Body HIIT
          </p>
          <p className="text-xs text-gray-500">2,341 completions</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h4 className="text-sm font-medium text-gray-500">Completion Rate</h4>
          <p className="text-2xl font-bold text-green-600">76.8%</p>
          <p className="text-xs text-gray-500">+3.2% vs last month</p>
        </div>
      </div>

      {/* Workout Plans List */}
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
                  {plan.video?.thumbnail && (
                    <img
                      src={plan.video.thumbnail}
                      alt="Video thumbnail"
                      className="mt-2 w-full h-40 object-cover rounded-lg border"
                    />
                  )}
                  {plan.video?.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.video.name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(plan)}
                    className="w-full sm:w-auto px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
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

      {/* Create/Edit Workout Plan Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                  required
                  placeholder="e.g., Full Body Strength"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
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
                  required
                  placeholder="e.g., 4 weeks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Dumbbell className="inline h-4 w-4 mr-1" />
                  Exercises *
                </label>
                <input
                  type="number"
                  name="exercises"
                  value={formData.exercises}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {difficulties.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="inline h-4 w-4 mr-1" />
                  Upload Workout Video
                </label>
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleInputChange}
                  className="w-full text-sm text-gray-700"
                />
                {formData.video && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {formData.video.name}
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded"
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
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  {editingId ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ View Details Modal */}
      {isDetailsOpen && selectedPlan && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Workout Plan Details
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
                <strong>Exercises:</strong> {selectedPlan.exercises}
              </p>
              <p>
                <strong>Difficulty:</strong> {selectedPlan.difficulty}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedPlan.active ? "Active ✅" : "Inactive ❌"}
              </p>

              {/* 🎥 Video Thumbnail */}
              {selectedPlan.video && (
                <div className="mt-4">
                  <strong>Video:</strong>
                  {selectedPlan.video.thumbnail ? (
                    <img
                      src={selectedPlan.video.thumbnail}
                      alt="Video thumbnail"
                      className="mt-2 w-full rounded-lg border border-gray-300"
                    />
                  ) : (
                    <video
                      src={selectedPlan.video.data}
                      className="mt-2 w-full rounded-lg border border-gray-300"
                      controls={false}
                      preload="metadata"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedPlan.video.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
