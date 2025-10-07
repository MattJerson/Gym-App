import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Eye, EyeOff, Youtube, ExternalLink, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FeaturedContent = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content_type: 'video',
    thumbnail_url: '',
    youtube_url: '',
    article_url: '',
    author: '',
    category: 'Education',
    duration: '',
    views_count: 0,
    is_active: true,
    display_order: 0,
    active_from: '',
    active_until: '',
  });

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  const fetchFeaturedContent = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('featured_content')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setContents(data || []);
    } catch (err) {
      console.error('Error fetching featured content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (name === 'views_count' || name === 'display_order') ? parseInt(value) || 0 : 
              value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Auto-generate thumbnail from YouTube URL if not provided
      let thumbnailUrl = formData.thumbnail_url;
      if (!thumbnailUrl && formData.youtube_url && formData.content_type === 'video') {
        const videoId = extractYouTubeVideoId(formData.youtube_url);
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      const dataToSave = {
        ...formData,
        thumbnail_url: thumbnailUrl,
        active_from: formData.active_from || null,
        active_until: formData.active_until || null,
      };

      if (editingContent) {
        const { error: updateError } = await supabase
          .from('featured_content')
          .update(dataToSave)
          .eq('id', editingContent.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('featured_content')
          .insert([dataToSave]);

        if (insertError) throw insertError;
      }

      await fetchFeaturedContent();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving featured content:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this featured content?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('featured_content')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchFeaturedContent();
    } catch (err) {
      console.error('Error deleting content:', err);
      setError(err.message);
    }
  };

  const handleToggleActive = async (content) => {
    try {
      const { error: updateError } = await supabase
        .from('featured_content')
        .update({ is_active: !content.is_active })
        .eq('id', content.id);

      if (updateError) throw updateError;
      await fetchFeaturedContent();
    } catch (err) {
      console.error('Error toggling active status:', err);
      setError(err.message);
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      subtitle: content.subtitle || '',
      content_type: content.content_type,
      thumbnail_url: content.thumbnail_url || '',
      youtube_url: content.youtube_url || '',
      article_url: content.article_url || '',
      author: content.author || '',
      category: content.category || 'Education',
      duration: content.duration || '',
      views_count: content.views_count || 0,
      is_active: content.is_active,
      display_order: content.display_order || 0,
      active_from: content.active_from ? content.active_from.split('T')[0] : '',
      active_until: content.active_until ? content.active_until.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContent(null);
    setFormData({
      title: '',
      subtitle: '',
      content_type: 'video',
      thumbnail_url: '',
      youtube_url: '',
      article_url: '',
      author: '',
      category: 'Education',
      duration: '',
      views_count: 0,
      is_active: true,
      display_order: 0,
      active_from: '',
      active_until: '',
    });
  };

  const extractYouTubeVideoId = (url) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getContentTypeColor = (type) => {
    const colors = {
      video: 'bg-red-100 text-red-700',
      article: 'bg-blue-100 text-blue-700',
      workout: 'bg-green-100 text-green-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading featured content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Featured Content</h2>
          <p className="text-sm text-gray-600 mt-1">Manage home page featured videos and articles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Featured Content
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">{contents.length}</p>
            </div>
            <Youtube className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {contents.filter(c => c.is_active).length}
              </p>
            </div>
            <Eye className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Videos</p>
              <p className="text-2xl font-bold text-red-600">
                {contents.filter(c => c.content_type === 'video').length}
              </p>
            </div>
            <Youtube className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Articles</p>
              <p className="text-2xl font-bold text-blue-600">
                {contents.filter(c => c.content_type === 'article').length}
              </p>
            </div>
            <ExternalLink className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {contents.map((content) => (
            <div
              key={content.id}
              className={`border rounded-lg overflow-hidden ${
                content.is_active ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}
            >
              {/* Thumbnail */}
              {content.thumbnail_url && (
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={content.thumbnail_url}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x225?text=No+Thumbnail';
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getContentTypeColor(content.content_type)}`}>
                      {content.content_type}
                    </span>
                    {content.is_active && (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Content Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{content.title}</h3>
                {content.subtitle && (
                  <p className="text-sm text-gray-600 mb-2">{content.subtitle}</p>
                )}
                
                <div className="space-y-1 text-xs text-gray-500 mb-3">
                  {content.author && <p>👤 {content.author}</p>}
                  {content.category && <p>📁 {content.category}</p>}
                  {content.duration && <p>⏱️ {content.duration}</p>}
                  <p>👁️ {content.views_count?.toLocaleString()} views</p>
                  <p>🔢 Order: {content.display_order}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleToggleActive(content)}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                      content.is_active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={content.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {content.is_active ? <EyeOff className="h-4 w-4 mx-auto" /> : <Eye className="h-4 w-4 mx-auto" />}
                  </button>
                  <button
                    onClick={() => handleEdit(content)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200"
                  >
                    <Edit className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                  >
                    <Trash2 className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {contents.length === 0 && (
          <div className="text-center py-12">
            <Youtube className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No featured content yet</p>
            <p className="text-sm text-gray-400">Click "Add Featured Content" to get started</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingContent ? 'Edit Featured Content' : 'Add Featured Content'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type *
                  </label>
                  <select
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="workout">Workout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Education">Education</option>
                    <option value="Motivation">Motivation</option>
                    <option value="Technique">Technique</option>
                    <option value="Workout">Workout</option>
                    <option value="Nutrition">Nutrition</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube URL {formData.content_type === 'video' && '*'}
                  </label>
                  <input
                    type="url"
                    name="youtube_url"
                    value={formData.youtube_url}
                    onChange={handleInputChange}
                    required={formData.content_type === 'video'}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Thumbnail will be auto-generated from YouTube if not provided
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 12 min video"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Views Count
                  </label>
                  <input
                    type="number"
                    name="views_count"
                    value={formData.views_count}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active From (Optional)
                  </label>
                  <input
                    type="date"
                    name="active_from"
                    value={formData.active_from}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Until (Optional)
                  </label>
                  <input
                    type="date"
                    name="active_until"
                    value={formData.active_until}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingContent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedContent;
