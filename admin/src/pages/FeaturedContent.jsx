import { useState, useEffect } from 'react';
import { 
  Plus, 
  Star, 
  Youtube, 
  ExternalLink, 
  Calendar, 
  Eye,
  Search,
  TrendingUp,
  Filter,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Video,
  FileText,
  ListOrdered,
  Play,
  BookOpen,
  Award,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

const FeaturedContent = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  
  // Filters and sorting
  const [sortBy, setSortBy] = useState("display_order");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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
    is_active: true,
    display_order: 0
  });

  // Auto-shuffle state
  const [shuffleSettings, setShuffleSettings] = useState(null);
  const [shuffling, setShuffling] = useState(false);

  useEffect(() => {
    fetchFeaturedContent();
    fetchShuffleSettings();
  }, []);

  const fetchShuffleSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_content_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching shuffle settings:', error);
        return;
      }
      setShuffleSettings(data);
    } catch (err) {
      console.error('Error fetching shuffle settings:', err);
    }
  };

  const toggleAutoShuffle = async () => {
    try {
      const newValue = !shuffleSettings?.auto_shuffle_enabled;
      
      const { error } = await supabase
        .from('featured_content_settings')
        .update({ 
          auto_shuffle_enabled: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', shuffleSettings.id);

      if (error) throw error;
      
      setShuffleSettings(prev => ({ ...prev, auto_shuffle_enabled: newValue }));
    } catch (err) {
      alert('Error updating shuffle settings: ' + err.message);
    }
  };

  const handleManualShuffle = async () => {
    if (!confirm('Shuffle all active featured content now?')) return;
    
    try {
      setShuffling(true);
      
      // Call the shuffle function
      const { data, error } = await supabase
        .rpc('shuffle_featured_content');

      if (error) throw error;
      
      alert('Content shuffled successfully!');
      await fetchFeaturedContent();
      await fetchShuffleSettings();
    } catch (err) {
      alert('Error shuffling content: ' + err.message);
    } finally {
      setShuffling(false);
    }
  };

  const fetchFeaturedContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('featured_content')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContent) {
        const { error } = await supabase
          .from('featured_content')
          .update(formData)
          .eq('id', editingContent.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('featured_content')
          .insert([formData]);
        
        if (error) throw error;
      }
      
      setShowModal(false);
      setEditingContent(null);
      resetForm();
      await fetchFeaturedContent();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (content) => {
    if (!confirm(`Delete content "${content.title}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('featured_content')
        .delete()
        .eq('id', content.id);
      
      if (error) throw error;
      await fetchFeaturedContent();
    } catch (err) {
      alert('Error deleting content: ' + err.message);
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    setFormData({
      title: content.title || '',
      subtitle: content.subtitle || '',
      content_type: content.content_type || 'video',
      thumbnail_url: content.thumbnail_url || '',
      youtube_url: content.youtube_url || '',
      article_url: content.article_url || '',
      author: content.author || '',
      category: content.category || 'Education',
      duration: content.duration || '',
      is_active: content.is_active || false,
      display_order: content.display_order || 0
    });
    setShowModal(true);
  };

  const resetForm = () => {
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
      is_active: true,
      display_order: 0
    });
  };

  const contentTypes = [
    { value: 'video', label: 'Video', icon: Youtube, color: 'red' },
    { value: 'article', label: 'Article', icon: FileText, color: 'blue' }
  ];

  const categories = [
    { value: 'Education', label: 'Education', icon: BookOpen, color: 'blue' },
    { value: 'Workout Tips', label: 'Workout Tips', icon: Star, color: 'orange' },
    { value: 'Nutrition', label: 'Nutrition', icon: Sparkles, color: 'green' },
    { value: 'Motivation', label: 'Motivation', icon: Award, color: 'purple' },
    { value: 'Success Stories', label: 'Success Stories', icon: Award, color: 'pink' }
  ];

  // Filtering and sorting logic
  const getFilteredAndSortedData = () => {
    let filtered = [...contents];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(content =>
        content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(content => content.content_type === filterType);
    }
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(content => content.category === filterCategory);
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(content => content.is_active === isActive);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'title':
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
          break;
        case 'author':
          aVal = a.author?.toLowerCase() || '';
          bVal = b.author?.toLowerCase() || '';
          break;
        case 'display_order':
          aVal = a.display_order || 0;
          bVal = b.display_order || 0;
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const filteredData = getFilteredAndSortedData();
  const activeFilterCount = [filterType, filterCategory, filterStatus].filter(f => f !== 'all').length;

  const totalContent = contents.length;
  const activeContent = contents.filter(c => c.is_active).length;
  const videoContent = contents.filter(c => c.content_type === 'video').length;
  const articleContent = contents.filter(c => c.content_type === 'article').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Star}
          title="Featured Content Management"
          subtitle="Manage featured videos, articles, and educational content"
          breadcrumbs={['Admin', 'Featured Content']}
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingContent(null);
                resetForm();
                setShowModal(true);
              }}
            >
              Add Content
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <StatsCard
            title="Total Content"
            value={totalContent}
            icon={Star}
            color="purple"
            subtitle={`${activeContent} active`}
          />
          <StatsCard
            title="Videos"
            value={videoContent}
            icon={Youtube}
            color="red"
            subtitle="Video content"
          />
          <StatsCard
            title="Articles"
            value={articleContent}
            icon={FileText}
            color="blue"
            subtitle="Article content"
          />
          <StatsCard
            title="Categories"
            value={categories.length}
            icon={BookOpen}
            color="green"
            subtitle="Content types"
          />
        </div>

        {/* Auto-Shuffle Control Panel */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5 mb-5 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  Auto-Shuffle Content
                  {shuffleSettings?.auto_shuffle_enabled && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {shuffleSettings?.auto_shuffle_enabled 
                    ? `Automatically shuffles active content daily. Last shuffle: ${
                        shuffleSettings?.last_shuffle_date 
                          ? new Date(shuffleSettings.last_shuffle_date).toLocaleDateString()
                          : 'Never'
                      }`
                    : 'Enable to automatically randomize content order every day'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Toggle Switch */}
              <button
                onClick={toggleAutoShuffle}
                disabled={!shuffleSettings}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  shuffleSettings?.auto_shuffle_enabled 
                    ? 'bg-purple-600' 
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    shuffleSettings?.auto_shuffle_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* Manual Shuffle Button */}
              <button
                onClick={handleManualShuffle}
                disabled={shuffling}
                className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className={`h-4 w-4 ${shuffling ? 'animate-spin' : ''}`} />
                {shuffling ? 'Shuffling...' : 'Shuffle Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
          {/* Top Row: Search and Sort */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Sort Section */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="display_order">Display Order</option>
                <option value="created_at">Date Created</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <TrendingUp className={`h-4 w-4 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="space-y-3">
            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">Type:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {contentTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    filterType === type.value
                      ? type.color === 'red' 
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <type.icon className="h-3.5 w-3.5" />
                  {type.label}
                </button>
              ))}
            </div>

            {/* Category & Status Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 mr-1">Category:</span>
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setFilterCategory(cat.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterCategory === cat.value
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 mr-1">Status:</span>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === 'active'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('inactive')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === 'inactive'
                      ? 'bg-gray-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Inactive
                </button>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterCategory('all');
                    setFilterStatus('all');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                >
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Star className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-500 text-center">
                {searchTerm || activeFilterCount > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first featured content'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-80">
                      Content
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((content) => {
                    const typeInfo = contentTypes.find(t => t.value === content.content_type);
                    const categoryInfo = categories.find(c => c.value === content.category);
                    
                    return (
                      <tr key={content.id} className="hover:bg-gray-50 transition-colors">
                        {/* Content Title with Thumbnail */}
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            {content.thumbnail_url ? (
                              <img 
                                src={content.thumbnail_url} 
                                alt={content.title}
                                className="h-14 w-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`h-14 w-20 rounded-lg bg-gradient-to-br ${
                                content.content_type === 'video' 
                                  ? 'from-red-500 to-red-600' 
                                  : 'from-blue-500 to-blue-600'
                              } flex items-center justify-center flex-shrink-0 ${content.thumbnail_url ? 'hidden' : 'flex'}`}
                            >
                              {typeInfo && <typeInfo.icon className="h-6 w-6 text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-gray-900 truncate">{content.title}</p>
                              <p className="text-xs text-gray-500 leading-snug line-clamp-2">{content.subtitle || 'No subtitle'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                            content.content_type === 'video'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {typeInfo && <typeInfo.icon className="h-3.5 w-3.5" />}
                            <span className="capitalize">{content.content_type}</span>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs bg-purple-100 text-purple-700 border border-purple-200">
                            {categoryInfo && <categoryInfo.icon className="h-3.5 w-3.5" />}
                            <span>{content.category}</span>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{content.author || 'Unknown'}</span>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3">
                          {content.duration ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100 w-fit">
                              <Calendar className="h-3.5 w-3.5 text-gray-600" />
                              <span className="text-xs font-semibold text-gray-700">{content.duration}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>

                        {/* Display Order */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 rounded-lg border border-purple-100 w-fit">
                            <ListOrdered className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-700">#{content.display_order}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                            content.is_active 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${content.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            {content.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(content.youtube_url || content.article_url) && (
                              <a
                                href={content.youtube_url || content.article_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                title="View Content"
                              >
                                <Play className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleEdit(content)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit content"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(content)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete content"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredData.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalContent}</span> featured content
            </p>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingContent(null);
            resetForm();
          }}
          title={`${editingContent ? 'Edit' : 'Create'} Featured Content`}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowModal(false);
                  setEditingContent(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingContent ? 'Update' : 'Create'} Content
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-4">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  Content Information
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Content Title"
                    placeholder="e.g., 10-Minute Morning Workout Routine"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle / Description
                    </label>
                    <textarea
                      placeholder="Brief description of the content..."
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content Type
                      </label>
                      <select
                        value={formData.content_type}
                        onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="video">📹 Video</option>
                        <option value="article">📄 Article</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                      Thumbnail URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/thumbnail.jpg"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter an image URL for the content thumbnail</p>
                    {formData.thumbnail_url && (
                      <div className="mt-2">
                        <img 
                          src={formData.thumbnail_url} 
                          alt="Preview"
                          className="h-20 w-32 rounded-lg object-cover border border-gray-200"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Links */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-600" />
                  Content Links
                </h3>
                <div className="space-y-3">
                  {formData.content_type === 'video' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Youtube className="h-3.5 w-3.5 text-red-600" />
                        YouTube URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.youtube_url}
                        onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">YouTube, Vimeo, or direct video URL</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                        Article URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/article"
                        value={formData.article_url}
                        onChange={(e) => setFormData({ ...formData, article_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Link to the full article</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  Additional Details
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author / Creator
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., John Doe"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 10 min or 5:30"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <ListOrdered className="h-3.5 w-3.5 text-gray-500" />
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the app</p>
                  </div>
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="pt-3 border-t">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Active Status</span>
                    <p className="text-xs text-gray-500">Make this content visible to users</p>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default FeaturedContent;
