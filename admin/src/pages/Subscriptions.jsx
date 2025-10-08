import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Check, Sparkles, AlertCircle } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load subscriptions from database
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSubscriptions(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Stats (dynamic) ---
  const totalPackages = subscriptions.length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.price || 0), 0);
  const avgPrice = subscriptions.length > 0 
    ? (totalRevenue / subscriptions.length).toFixed(2)
    : 0;

  // --- Modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    price: 0,
    billing_interval: "month",
    badge: "",
    emoji: "",
    accent_color: "#4A9EFF",
    is_popular: false,
    sort_order: 0,
    features: [],
  });

  const [newFeature, setNewFeature] = useState({ text: "", included: true });

  // Input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value 
    }));
  };

  // Feature management
  const addFeature = () => {
    if (newFeature.text.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature]
      }));
      setNewFeature({ text: "", included: true });
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const toggleFeatureIncluded = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => 
        i === index ? { ...f, included: !f.included } : f
      )
    }));
  };

  // Open modal for create
  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({
      slug: "",
      name: "",
      price: 0,
      billing_interval: "month",
      badge: "",
      emoji: "",
      accent_color: "#4A9EFF",
      is_popular: false,
      sort_order: subscriptions.length,
      features: [],
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (sub) => {
    setIsEditMode(true);
    setEditId(sub.id);
    setFormData({
      slug: sub.slug || "",
      name: sub.name || "",
      price: sub.price || 0,
      billing_interval: sub.billing_interval || "month",
      badge: sub.badge || "",
      emoji: sub.emoji || "",
      accent_color: sub.accent_color || "#4A9EFF",
      is_popular: sub.is_popular || false,
      sort_order: sub.sort_order || 0,
      features: sub.features || [],
    });
    setIsModalOpen(true);
  };

  // Save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (isEditMode) {
        const { error } = await supabase
          .from('subscription_packages')
          .update(formData)
          .eq('id', editId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription_packages')
          .insert([formData]);
        
        if (error) throw error;
      }

      await fetchSubscriptions();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving subscription:', err);
      alert('Failed to save subscription: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subscription package?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscription_packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchSubscriptions();
    } catch (err) {
      console.error('Error deleting subscription:', err);
      alert('Failed to delete subscription: ' + err.message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-0 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-left text-center sm:text-2xl font-bold text-gray-900">
            Subscription Packages
          </h2>
          <p className="text-sm text-gray-600 mt-1">Manage pricing plans and features</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:from-green-700 hover:to-green-600 shadow-md w-full sm:w-auto transition-all"
        >
          <Plus className="h-4 w-4" />
          Add New Package
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wide">
            Total Packages
          </h3>
          <p className="text-3xl font-bold text-blue-700">{totalPackages}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200">
          <h3 className="text-sm font-semibold text-green-900 mb-2 uppercase tracking-wide">
            Avg Price
          </h3>
          <p className="text-3xl font-bold text-green-700">${avgPrice}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-900 mb-2 uppercase tracking-wide">
            Total Value
          </h3>
          <p className="text-3xl font-bold text-purple-700">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading subscription packages...</p>
        </div>
      )}

      {/* Package Cards */}
      {!isLoading && subscriptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border-2 hover:shadow-xl transition-all duration-300"
              style={{ borderColor: sub.accent_color || '#4A9EFF' }}
            >
              {/* Card Header */}
              <div 
                className="p-6 text-white relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${sub.accent_color || '#4A9EFF'} 0%, ${sub.accent_color || '#4A9EFF'}dd 100%)`
                }}
              >
                {sub.emoji && (
                  <div className="absolute top-2 right-2 text-6xl opacity-20">
                    {sub.emoji}
                  </div>
                )}
                {sub.badge && (
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3">
                    {sub.badge}
                  </div>
                )}
                {sub.is_popular && (
                  <div className="inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold mb-3 ml-2">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{sub.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">
                    {sub.price === 0 ? 'Free' : `$${sub.price.toFixed(2)}`}
                  </span>
                  {sub.price > 0 && sub.billing_interval && (
                    <span className="text-sm opacity-90">
                      /{sub.billing_interval === 'month' ? 'mo' : sub.billing_interval === 'year' ? 'yr' : 'once'}
                    </span>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="p-6">
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {sub.features && sub.features.length > 0 ? (
                    sub.features.slice(0, 6).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}>
                          {feature.text}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No features listed</p>
                  )}
                  {sub.features && sub.features.length > 6 && (
                    <p className="text-xs text-gray-500 italic">+{sub.features.length - 6} more features</p>
                  )}
                </div>

                {/* Meta Info */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Slug:</span>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{sub.slug}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Sort Order:</span>
                    <span className="font-semibold">{sub.sort_order}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEditModal(sub)}
                    className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && subscriptions.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subscription Packages Yet</h3>
          <p className="text-gray-600 mb-6">Create your first subscription package to get started</p>
          <button
            onClick={openCreateModal}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add First Package
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-2xl font-bold">
                {isEditMode ? "Edit Subscription Package" : "Create New Package"}
              </h3>
              <p className="text-green-100 text-sm mt-1">
                Configure pricing, features, and appearance
              </p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g., Monthly Premium"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Slug (URL-friendly) *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      placeholder="e.g., monthly-premium"
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        step="0.01"
                        min="0"
                        placeholder="9.99"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Billing Interval *
                      </label>
                      <select
                        name="billing_interval"
                        value={formData.billing_interval}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                      >
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                        <option value="one_time">One-Time</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      name="sort_order"
                      min="0"
                      value={formData.sort_order}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      name="badge"
                      placeholder="e.g., BEST VALUE"
                      value={formData.badge}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Emoji
                    </label>
                    <input
                      type="text"
                      name="emoji"
                      placeholder="e.g., 🏆"
                      maxLength="2"
                      value={formData.emoji}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-3xl text-center focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="accent_color"
                        value={formData.accent_color}
                        onChange={handleInputChange}
                        className="h-12 w-20 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        name="accent_color"
                        value={formData.accent_color}
                        onChange={handleInputChange}
                        className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <input
                      type="checkbox"
                      id="is_popular"
                      name="is_popular"
                      checked={formData.is_popular}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <label htmlFor="is_popular" className="text-sm font-semibold text-gray-700 cursor-pointer">
                      <Sparkles className="h-4 w-4 inline mr-1 text-yellow-600" />
                      Mark as Popular
                    </label>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="mt-6 border-t-2 border-gray-200 pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Package Features
                </h4>

                {/* Add Feature Input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Enter feature description"
                    value={newFeature.text}
                    onChange={(e) => setNewFeature(prev => ({ ...prev, text: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                  />
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={newFeature.included}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, included: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">Included</span>
                  </label>
                  <button
                    onClick={addFeature}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {/* Features List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {formData.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => toggleFeatureIncluded(index)}
                        className={`flex-shrink-0 ${feature.included ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {feature.included ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${feature.included ? 'text-gray-700' : 'text-gray-500 line-through'}`}>
                        {feature.text}
                      </span>
                      <button
                        onClick={() => removeFeature(index)}
                        className="flex-shrink-0 text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {formData.features.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No features added yet. Add features above.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-lg border-2 border-gray-300 hover:bg-gray-100 font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-600 font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditMode ? "Update Package" : "Create Package"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
