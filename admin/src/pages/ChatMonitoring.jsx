import { useState, useEffect } from 'react';
import { 
  fetchFlaggedMessages, 
  fetchChatStatistics,
  fetchAllChannelMessagesAdmin,
  deleteMessage,
  unflagMessage,
  flagMessage,
  subscribeToFlaggedMessages
} from '../../../services/ChatServices';
import { supabase } from '../../../services/supabase';

export default function ChatMonitoring() {
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flagged'); // 'flagged' | 'all' | 'stats'
  const [adminId, setAdminId] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    isFlagged: undefined,
    isDeleted: undefined,
    startDate: null,
    endDate: null
  });
  
  // Manual flagging modal
  const [flagModal, setFlagModal] = useState({ open: false, messageId: null, messageType: null });
  const [flagReason, setFlagReason] = useState('');

  useEffect(() => {
    initializeData();
    
    // Subscribe to new flagged messages
    const subscription = subscribeToFlaggedMessages((payload) => {
      console.log('New flagged message:', payload);
      loadFlaggedMessages();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const initializeData = async () => {
    setLoading(true);
    
    // Get admin user ID
    const { data: { user } } = await supabase.auth.getUser();
    setAdminId(user?.id);
    
    await Promise.all([
      loadFlaggedMessages(),
      loadStatistics()
    ]);
    
    setLoading(false);
  };

  const loadFlaggedMessages = async () => {
    const { data, error } = await fetchFlaggedMessages();
    if (!error && data) {
      setFlaggedMessages(data);
    } else {
      console.error('Error loading flagged messages:', error);
    }
  };

  const loadStatistics = async () => {
    const { data, error } = await fetchChatStatistics();
    if (!error && data) {
      setStatistics(data);
    } else {
      console.error('Error loading statistics:', error);
    }
  };

  const loadAllMessages = async () => {
    const { data, error } = await fetchAllChannelMessagesAdmin(filters);
    if (!error && data) {
      setAllMessages(data);
    } else {
      console.error('Error loading all messages:', error);
    }
  };

  const handleDeleteMessage = async (messageId, messageType) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    const { error } = await deleteMessage(messageId, messageType, adminId);
    if (!error) {
      alert('Message deleted successfully');
      loadFlaggedMessages();
      if (activeTab === 'all') loadAllMessages();
    } else {
      alert('Error deleting message: ' + error.message);
    }
  };

  const handleUnflagMessage = async (messageId, messageType) => {
    const { error } = await unflagMessage(messageId, messageType, adminId);
    if (!error) {
      alert('Message unflagged successfully');
      loadFlaggedMessages();
      if (activeTab === 'all') loadAllMessages();
    } else {
      alert('Error unflagging message: ' + error.message);
    }
  };

  const handleFlagMessage = async () => {
    if (!flagReason.trim()) {
      alert('Please provide a reason for flagging');
      return;
    }
    
    const { error } = await flagMessage(
      flagModal.messageId, 
      flagModal.messageType, 
      adminId, 
      flagReason
    );
    
    if (!error) {
      alert('Message flagged successfully');
      setFlagModal({ open: false, messageId: null, messageType: null });
      setFlagReason('');
      loadFlaggedMessages();
      if (activeTab === 'all') loadAllMessages();
    } else {
      alert('Error flagging message: ' + error.message);
    }
  };

  const openFlagModal = (messageId, messageType) => {
    setFlagModal({ open: true, messageId, messageType });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading chat monitoring...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Community Chat Monitoring</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'flagged'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Flagged Messages ({flaggedMessages.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('all');
            loadAllMessages();
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'stats'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Statistics
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'stats' && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Messages</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.total_messages || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Flagged Messages</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.total_flagged || 0}</p>
            <p className="text-sm text-gray-500">
              {statistics.total_messages > 0 
                ? ((statistics.total_flagged / statistics.total_messages) * 100).toFixed(1) 
                : 0}% of all messages
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Deleted Messages</h3>
            <p className="text-3xl font-bold text-gray-600">{statistics.total_deleted || 0}</p>
            <p className="text-sm text-gray-500">
              {statistics.total_messages > 0 
                ? ((statistics.total_deleted / statistics.total_messages) * 100).toFixed(1) 
                : 0}% of all messages
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-green-600">{statistics.total_users || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Channels</h3>
            <p className="text-3xl font-bold text-purple-600">{statistics.total_channels || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Messages Today</h3>
            <p className="text-3xl font-bold text-indigo-600">{statistics.messages_today || 0}</p>
          </div>
        </div>
      )}

      {/* Flagged Messages Tab */}
      {activeTab === 'flagged' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flag Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flaggedMessages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No flagged messages
                    </td>
                  </tr>
                ) : (
                  flaggedMessages.map((msg) => (
                    <tr key={msg.message_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{msg.username || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm text-gray-900 line-clamp-2">{msg.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {msg.character_count} characters
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{msg.channel_name || 'DM'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {msg.flag_reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleUnflagMessage(msg.message_id, msg.message_type)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.message_id, msg.message_type)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Messages Tab */}
      {activeTab === 'all' && (
        <div>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h3 className="font-semibold mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  value={filters.isFlagged === undefined ? 'all' : (filters.isFlagged ? 'flagged' : 'clean')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({
                      ...filters,
                      isFlagged: val === 'all' ? undefined : val === 'flagged'
                    });
                  }}
                >
                  <option value="all">All Messages</option>
                  <option value="flagged">Flagged Only</option>
                  <option value="clean">Clean Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deleted</label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  value={filters.isDeleted === undefined ? 'all' : (filters.isDeleted ? 'deleted' : 'active')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({
                      ...filters,
                      isDeleted: val === 'all' ? undefined : val === 'deleted'
                    });
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Active Only</option>
                  <option value="deleted">Deleted Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value || null })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value || null })}
                />
              </div>
            </div>
            <button
              onClick={loadAllMessages}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>

          {/* Messages Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allMessages.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No messages found. Click "Apply Filters" to load.
                      </td>
                    </tr>
                  ) : (
                    allMessages.map((msg) => (
                      <tr key={msg.message_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{msg.username || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            <p className={`text-sm ${msg.is_deleted ? 'line-through text-gray-400' : 'text-gray-900'} line-clamp-2`}>
                              {msg.content}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {msg.character_count} characters
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{msg.channel_name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {msg.is_flagged && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Flagged
                              </span>
                            )}
                            {msg.is_deleted && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Deleted
                              </span>
                            )}
                            {!msg.is_flagged && !msg.is_deleted && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Clean
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {!msg.is_flagged && !msg.is_deleted && (
                            <button
                              onClick={() => openFlagModal(msg.message_id, 'channel')}
                              className="text-yellow-600 hover:text-yellow-900 mr-3"
                            >
                              Flag
                            </button>
                          )}
                          {msg.is_flagged && !msg.is_deleted && (
                            <button
                              onClick={() => handleUnflagMessage(msg.message_id, 'channel')}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Clear
                            </button>
                          )}
                          {!msg.is_deleted && (
                            <button
                              onClick={() => handleDeleteMessage(msg.message_id, 'channel')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Flag Message Modal */}
      {flagModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Flag Message</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for flagging:
              </label>
              <textarea
                className="w-full border-gray-300 rounded-md shadow-sm"
                rows="4"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Enter reason for flagging this message..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setFlagModal({ open: false, messageId: null, messageType: null });
                  setFlagReason('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagMessage}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Flag Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
