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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Subscription Management
        </h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Active Subscriptions</h3>
          <p className="text-3xl font-bold text-green-600">8,956</p>
          <p className="text-sm text-gray-600">+12% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-blue-600">$89,760</p>
          <p className="text-sm text-gray-600">+8% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Churn Rate</h3>
          <p className="text-3xl font-bold text-red-600">3.2%</p>
          <p className="text-sm text-gray-600">-1% from last month</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Plan</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Next Billing</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{sub.user}</td>
                  <td className="py-3 px-4">{sub.plan}</td>
                  <td className="py-3 px-4 font-semibold">{sub.amount}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{sub.nextBilling}</td>
                  <td className="py-3 px-4">
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
