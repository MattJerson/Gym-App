import { Send } from "lucide-react";

const Chat = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-left text-center font-bold text-gray-900">
        User Chat Support
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Conversations */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Active Conversations</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">John Smith</span>
                <span className="text-xs text-gray-500">2m ago</span>
              </div>
              <p className="text-sm text-gray-600">
                Having trouble with workout tracking...
              </p>
              <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                Urgent
              </span>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">Sarah Johnson</span>
                <span className="text-xs text-gray-500">15m ago</span>
              </div>
              <p className="text-sm text-gray-600">
                Question about meal plans...
              </p>
              <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                Normal
              </span>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Chat with John Smith</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                Mark Resolved
              </button>
              <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                Escalate
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="border border-gray-200 rounded-lg">
            <div className="h-64 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                <div className="flex">
                  <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                    Hi! I'm having trouble with the workout tracking feature.
                    It's not recording my reps correctly.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-gray-200 p-3 rounded-lg max-w-xs">
                    Hi John! I understand you're having issues with workout
                    tracking. Let me help you troubleshoot this.
                  </div>
                </div>
              </div>
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
