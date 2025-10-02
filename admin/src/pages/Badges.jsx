import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";

const Badges = () => {
  // ✅ LocalStorage state
  const [badges, setBadges] = useState(() => {
    const saved = localStorage.getItem("badges");
    return saved
      ? JSON.parse(saved)
      : [
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
  });

  useEffect(() => {
    localStorage.setItem("badges", JSON.stringify(badges));
  }, [badges]);

  // ✅ Leaderboard sample data (dynamic later if needed)
  const [leaderboard] = useState([
    { id: 1, name: "Sarah Johnson", points: 1247, rank: 1, icon: "🏆" },
    { id: 2, name: "Mike Davis", points: 1156, rank: 2, icon: "🥈" },
    { id: 3, name: "John Smith", points: 987, rank: 3, icon: "🥉" },
  ]);

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🏅",
    earned: 0,
  });

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setBadges((prev) =>
        prev.map((badge) =>
          badge.id === editingId ? { ...badge, ...formData } : badge
        )
      );
    } else {
      const newBadge = { id: Date.now(), ...formData };
      setBadges((prev) => [...prev, newBadge]);
    }
    handleCancel();
  };

  const handleDelete = (id) => {
    setBadges((prev) => prev.filter((badge) => badge.id !== id));
  };

  const handleEdit = (badge) => {
    setEditingId(badge.id);
    setFormData(badge);
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      icon: "🏅",
      earned: 0,
    });
  };

  const handleViewDetails = (badge) => {
    setSelectedBadge(badge);
    setIsDetailsOpen(true);
  };

  // ✅ Dynamic Stats
  const totalBadges = badges.length;
  const mostEarned = badges.reduce(
    (max, b) => (b.earned > max.earned ? b : max),
    badges[0]
  );
  const rarestBadge = badges.reduce(
    (min, b) => (b.earned < min.earned ? b : min),
    badges[0]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl md:text-left text-center font-bold text-gray-900">
          Leadership & Badges
        </h2>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Create Badge
        </button>
      </div>

      {/* Leaderboard + Badge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{user.icon}</span>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.points} points</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  #{user.rank}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badge Statistics */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Badge Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Total Badges</span>
              <span className="font-semibold">{totalBadges}</span>
            </div>
            {mostEarned && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Most Earned</span>
                <span className="font-semibold">
                  {mostEarned.name} ({mostEarned.earned})
                </span>
              </div>
            )}
            {rarestBadge && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Rarest Badge</span>
                <span className="font-semibold">
                  {rarestBadge.name} ({rarestBadge.earned})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Badges */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Available Badges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-center mb-3">
                <span className="text-4xl mb-2 block">{badge.icon}</span>
                <h4 className="font-semibold text-lg">{badge.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3 text-center">
                {badge.description}
              </p>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <span className="text-sm text-gray-500">
                  Earned by {badge.earned} users
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleViewDetails(badge)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(badge)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(badge.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ View Details Modal */}
      {isDetailsOpen && selectedBadge && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Badge Details
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
                <strong>Name:</strong> {selectedBadge.name}
              </p>
              <p>
                <strong>Description:</strong> {selectedBadge.description}
              </p>
              <p>
                <strong>Icon:</strong> {selectedBadge.icon}
              </p>
              <p>
                <strong>Earned:</strong> {selectedBadge.earned} users
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Create/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Badge" : "Create Badge"}
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
                  Badge Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (emoji) *
                </label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Earned by users *
                </label>
                <input
                  type="number"
                  name="earned"
                  value={formData.earned}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingId ? "Update Badge" : "Create Badge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Badges;
