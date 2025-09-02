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
    <div className="space-y-4 sm:space-y-6 p-0 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl md:text-left text-center sm:text-2xl font-bold text-gray-900">
          Notifications & Alerts
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Create Notification
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Total Sent
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">34,567</p>
          <p className="text-xs sm:text-sm text-gray-600">This month</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Open Rate</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">68.4%</p>
          <p className="text-xs sm:text-sm text-gray-600">
            Above industry average
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md sm:col-span-2 lg:col-span-1">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Click Rate
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600">
            12.8%
          </p>
          <p className="text-xs sm:text-sm text-gray-600">
            +2.1% vs last month
          </p>
        </div>
      </div>

      {/* Notifications Table/Cards */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="p-1 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold">
            Notification Campaigns
          </h3>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {notification.title}
                  </h4>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {notification.type}
                  </span>
                </div>
                <div className="flex gap-2 ml-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Sent:</span>
                  <div className="font-medium">
                    {notification.sent.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Opened:</span>
                  <div className="font-medium">
                    {notification.opened.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                  Sent
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 sm:px-6">Title</th>
                <th className="text-left py-3 px-4 sm:px-6">Type</th>
                <th className="text-left py-3 px-4 sm:px-6">Sent</th>
                <th className="text-left py-3 px-4 sm:px-6">Opened</th>
                <th className="text-left py-3 px-4 sm:px-6">Status</th>
                <th className="text-left py-3 px-4 sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr
                  key={notification.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 sm:px-6 font-medium">
                    {notification.title}
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {notification.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    {notification.sent.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    {notification.opened.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      Sent
                    </span>
                  </td>
                  <td className="py-3 px-4 sm:px-6">
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
