import { useState, useEffect } from 'react';
import { Plus, Star, Youtube, ExternalLink, Calendar, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

const FeaturedContent = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
    is_active: false,
    display_order: 0
  });

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

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
      is_active: false,
      display_order: 0
    });
  };

  const columns = [
    {
      header: 'Content',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.thumbnail_url ? (
            <img 
              src={row.thumbnail_url} 
              alt={row.title}
              className="h-16 w-24 object-cover rounded-lg"
            />
          ) : (
            <div className="h-16 w-24 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Star className="h-8 w-8 text-white" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{row.title}</p>
            <p className="text-sm text-gray-500">{row.subtitle}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'content_type',
      render: (row) => (
        <Badge variant={row.content_type === 'video' ? 'error' : 'info'}>
          {row.content_type}
        </Badge>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <Badge variant="purple">{row.category}</Badge>
      )
    },
    {
      header: 'Author',
      accessor: 'author',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.author || 'Unknown'}</span>
      )
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (row) => (
        row.duration ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{row.duration}</span>
          </div>
        ) : <span className="text-gray-400">-</span>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'default'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  ];

  const filteredContents = contents.filter(content =>
    content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalContent = contents.length;
  const activeContent = contents.filter(c => c.is_active).length;
  const videoContent = contents.filter(c => c.content_type === 'video').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Star}
          title="Featured Content"
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            value={totalContent - videoContent}
            icon={ExternalLink}
            color="blue"
            subtitle="Article content"
          />
        </div>

        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search featured content..."
        />

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredContents}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={['edit', 'delete']}
          customActions={(row) => (
            row.youtube_url || row.article_url ? (
              <a
                href={row.youtube_url || row.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Content"
              >
                <Eye className="h-4 w-4" />
              </a>
            ) : null
          )}
          emptyMessage="No featured content found"
        />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingContent(null);
            resetForm();
          }}
          title={editingContent ? 'Edit Featured Content' : 'Add Featured Content'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingContent ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Content Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            
            <Input
              label="Subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Content Type"
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                options={[
                  { value: 'video', label: 'Video' },
                  { value: 'article', label: 'Article' }
                ]}
                required
              />
              
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'Education', label: 'Education' },
                  { value: 'Workout Tips', label: 'Workout Tips' },
                  { value: 'Nutrition', label: 'Nutrition' },
                  { value: 'Motivation', label: 'Motivation' },
                  { value: 'Success Stories', label: 'Success Stories' }
                ]}
                required
              />
            </div>

            <Input
              label="Thumbnail URL"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              helperText="Enter image URL for thumbnail"
            />

            {formData.content_type === 'video' ? (
              <Input
                label="YouTube URL"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                icon={Youtube}
              />
            ) : (
              <Input
                label="Article URL"
                value={formData.article_url}
                onChange={(e) => setFormData({ ...formData, article_url: e.target.value })}
                icon={ExternalLink}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
              
              <Input
                label="Duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                helperText="e.g., '10 min' or '5:30'"
              />
            </div>

            <Input
              label="Display Order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              helperText="Lower numbers appear first"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Set as Active (visible to users)
              </label>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default FeaturedContent;
