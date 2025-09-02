import { useState } from "react";
import { Plus, Eye, Edit } from "lucide-react";

const Subscriptions = () => {
  const [subscriptions] = useState([
    {
      id: 1,
      user: "John Smith",
      plan: "Premium",
      amount: "$29.99",
      status: "Active",
      nextBilling: "2024-10-15",
    },
    {
      id: 2,
      user: "Sarah Johnson",
      plan: "Basic",
      amount: "$9.99",
      status: "Active",
      nextBilling: "2024-10-22",
    },
  ]);

  return (
    <div className="space-y-4 sm:space-y-6 p-0 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl md:text-left text-center sm:text-2xl font-bold text-gray-900">
          Subscription Management
        </h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Active Subscriptions
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">8,956</p>
          <p className="text-xs sm:text-sm text-gray-600">
            +12% from last month
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Monthly Revenue
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">
            $89,760
          </p>
          <p className="text-xs sm:text-sm text-gray-600">
            +8% from last month
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md sm:col-span-2 lg:col-span-1">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Churn Rate
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">3.2%</p>
          <p className="text-xs sm:text-sm text-gray-600">
            -1% from last month
          </p>
        </div>
      </div>

      {/* Subscription Details */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold">
            Subscription Details
          </h3>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="p-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{sub.user}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">{sub.plan}</span>
                    <span className="text-sm font-semibold text-green-600">
                      {sub.amount}
                    </span>
                  </div>
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
                  <span className="text-gray-600">Status:</span>
                  <div className="mt-1">
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      {sub.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Next Billing:</span>
                  <div className="font-medium mt-1">{sub.nextBilling}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 sm:px-6">User</th>
                <th className="text-left py-3 px-4 sm:px-6">Plan</th>
                <th className="text-left py-3 px-4 sm:px-6">Amount</th>
                <th className="text-left py-3 px-4 sm:px-6">Status</th>
                <th className="text-left py-3 px-4 sm:px-6">Next Billing</th>
                <th className="text-left py-3 px-4 sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 sm:px-6 font-medium">{sub.user}</td>
                  <td className="py-3 px-4 sm:px-6">{sub.plan}</td>
                  <td className="py-3 px-4 sm:px-6 font-semibold">
                    {sub.amount}
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-gray-600">
                    {sub.nextBilling}
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

export default Subscriptions;
