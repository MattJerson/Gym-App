import {
  Eye,
  Plus,
  Edit,
  Search,
  Trash2,
  Filter,
  Download,
} from "lucide-react";
import { useState } from "react";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    {
      id: 1,
      name: "John Smith",
      email: "john@email.com",
      subscription: "Premium",
      status: "Active",
      joinDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@email.com",
      subscription: "Basic",
      status: "Active",
      joinDate: "2024-02-20",
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike@email.com",
      subscription: "Premium",
      status: "Cancelled",
      joinDate: "2023-12-10",
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-0 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl md:text-left text-center sm:text-2xl font-bold text-gray-900">
          User Management
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Search & Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-400 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span className="text-sm">Filter</span>
            </button>
            <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-400 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 border border-gray-200 rounded-lg mb-3 last:mb-0"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {user.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.subscription === "Premium"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.subscription}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Joined: {user.joinDate}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500 italic">
              No users found
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Subscription</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Join Date</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.subscription === "Premium"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.subscription}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{user.joinDate}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
