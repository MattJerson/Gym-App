import { useState, useEffect } from "react";
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
  Sparkles,
  Download,
  Clock,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Book,
  Newspaper,
  FileVideo,
  Edit2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from "../components/common/PageHeader";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import StatsCard from "../components/common/StatsCard";

// YouTube API Key - Add this to your .env file
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "YOUR_API_KEY";

// Debug: Log API key status (remove in production)
console.log(
  "YouTube API Key loaded:",
  YOUTUBE_API_KEY !== "YOUR_API_KEY" ? "✅ Yes" : "❌ No"
);
console.log("API Key value:", YOUTUBE_API_KEY?.substring(0, 10) + "...");

const FeaturedContent = () => {
  const { hasPermission } = usePermissions();
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
    title: "",
    subtitle: "",
    content_type: "video",
    thumbnail_url: "",
    youtube_url: "",
    article_url: "",
    author: "",
    category: "Education",
    duration: "",
    is_active: true,
    display_order: 0,
    // New fields
    video_id: "",
    channel_name: "",
    view_count: 0,
    published_at: null,
    tags: [],
    description: "",
    article_excerpt: "",
    read_time_minutes: 0,
    ebook_file_url: "",
    ebook_page_count: 0,
    ebook_file_size_mb: 0,
    ebook_isbn: "",
    auto_fetched: false,
  });

  // Auto-fetch state
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [manualMode, setManualMode] = useState(false); // NEW: Manual entry mode

  // Auto-shuffle state
  const [shuffleSettings, setShuffleSettings] = useState(null);
  const [shuffling, setShuffling] = useState(false);

  useEffect(() => {
    fetchFeaturedContent();
    fetchShuffleSettings();
  }, []);

  // Extract YouTube video ID from URL
  const extractYouTubeVideoId = (url) => {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  // Fetch YouTube video metadata
  const fetchYouTubeMetadata = async (videoId) => {
    try {
      setIsFetching(true);
      setFetchError(null);

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch YouTube data");
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("Video not found");
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const statistics = video.statistics;
      const contentDetails = video.contentDetails;

      // Parse ISO 8601 duration (PT#M#S) to readable format
      const durationMatch = contentDetails.duration.match(
        /PT(\d+H)?(\d+M)?(\d+S)?/
      );
      const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
      const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
      const seconds = durationMatch[3] ? parseInt(durationMatch[3]) : 0;
      const totalMinutes = hours * 60 + minutes + (seconds > 30 ? 1 : 0);
      const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Update form data with fetched metadata
      setFormData((prev) => ({
        ...prev,
        title: snippet.title,
        subtitle: snippet.description.substring(0, 150) || "",
        thumbnail_url:
          snippet.thumbnails.maxres?.url ||
          snippet.thumbnails.high?.url ||
          snippet.thumbnails.medium?.url,
        author: snippet.channelTitle,
        channel_name: snippet.channelTitle,
        video_id: videoId,
        view_count: parseInt(statistics.viewCount) || 0,
        published_at: snippet.publishedAt,
        tags: snippet.tags || [],
        description: snippet.description,
        duration: durationStr,
        auto_fetched: true,
      }));

      setFetchError(null);
    } catch (err) {
      console.error("Error fetching YouTube metadata:", err);
      setFetchError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch Article/eBook metadata using Link Preview (Open Graph tags)
  // This works because we're only fetching publicly available metadata
  // (same data Google uses for search results previews)
  const fetchArticleMetadata = async (url) => {
    try {
      setIsFetching(true);
      setFetchError(null);

      // Use Microlink API - free service with good CORS support
      // Extracts Open Graph metadata that sites expose for link previews
      const response = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch link preview");
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error("No metadata found");
      }

      const data = result.data;

      // Extract metadata
      const title = data.title || "";
      const description = data.description || "";
      const image = data.image?.url || data.logo?.url || "";
      const siteName = data.publisher || new URL(url).hostname;

      // Calculate estimated read time from description
      const wordCount = description.split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 50)); // Conservative estimate

      setFormData((prev) => ({
        ...prev,
        title: title || prev.title,
        subtitle: description || prev.subtitle,
        thumbnail_url: image || prev.thumbnail_url,
        author: siteName || prev.author,
        article_excerpt: description.substring(0, 200) || prev.article_excerpt,
        read_time_minutes: readTime,
        auto_fetched: true,
      }));

      setFetchError(null);
      setManualMode(false);
    } catch (err) {
      console.error("Error fetching link preview:", err);
      setFetchError("Could not auto-fetch link preview. Please fill manually.");
      setManualMode(true);
    } finally {
      setIsFetching(false);
    }
  };

  // Handle YouTube URL input
  const handleYouTubeUrlChange = async (url) => {
    setFormData((prev) => ({ ...prev, youtube_url: url }));

    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      await fetchYouTubeMetadata(videoId);
    }
  };

  // Handle Article URL input
  const handleArticleUrlChange = async (url) => {
    setFormData((prev) => ({ ...prev, article_url: url }));

    if (url && url.startsWith("http")) {
      await fetchArticleMetadata(url);
    }
  };

  // Handle eBook URL input (works same as article - just fetching link preview)
  const handleEbookUrlChange = async (url) => {
    setFormData((prev) => ({ ...prev, ebook_file_url: url }));

    if (url && url.startsWith("http")) {
      await fetchArticleMetadata(url); // Same function - just fetching Open Graph data
    }
  };

  const fetchShuffleSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("featured_content_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching shuffle settings:", error);
        return;
      }
      setShuffleSettings(data);
    } catch (err) {
      console.error("Error fetching shuffle settings:", err);
    }
  };

  const toggleAutoShuffle = async () => {
    try {
      const newValue = !shuffleSettings?.auto_shuffle_enabled;

      const { error } = await supabase
        .from("featured_content_settings")
        .update({
          auto_shuffle_enabled: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", shuffleSettings.id);

      if (error) throw error;

      setShuffleSettings((prev) => ({
        ...prev,
        auto_shuffle_enabled: newValue,
      }));
    } catch (err) {
      alert("Error updating shuffle settings: " + err.message);
    }
  };

  const handleManualShuffle = async () => {
    if (!confirm("Shuffle all active featured content now?")) return;

    try {
      setShuffling(true);

      // Call the shuffle function
      const { data, error } = await supabase.rpc("shuffle_featured_content");

      if (error) throw error;

      // Log the shuffle activity
      await supabase.rpc('log_admin_activity', {
        p_activity_type: 'content_shuffled',
        p_activity_category: 'content',
        p_title: 'Featured Content Shuffled',
        p_description: 'Admin manually shuffled featured content display order',
        p_metadata: {
          shuffle_count: data?.length || 0,
          timestamp: new Date().toISOString()
        }
      });

      alert("Content shuffled successfully!");
      await fetchFeaturedContent();
      await fetchShuffleSettings();
    } catch (err) {
      alert("Error shuffling content: " + err.message);
    } finally {
      setShuffling(false);
    }
  };

  const fetchFeaturedContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContent) {
        const { error } = await supabase
          .from("featured_content")
          .update(formData)
          .eq("id", editingContent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("featured_content")
          .insert([formData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingContent(null);
      resetForm();
      await fetchFeaturedContent();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (content) => {
    if (!confirm(`Delete content "${content.title}"?`)) return;

    try {
      const { error } = await supabase
        .from("featured_content")
        .delete()
        .eq("id", content.id);

      if (error) throw error;
      await fetchFeaturedContent();
    } catch (err) {
      alert("Error deleting content: " + err.message);
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    setFormData({
      title: content.title || "",
      subtitle: content.subtitle || "",
      content_type: content.content_type || "video",
      thumbnail_url: content.thumbnail_url || "",
      youtube_url: content.youtube_url || "",
      article_url: content.article_url || "",
      author: content.author || "",
      category: content.category || "Education",
      duration: content.duration || "",
      is_active: content.is_active || false,
      display_order: content.display_order || 0,
      // New fields
      video_id: content.video_id || "",
      channel_name: content.channel_name || "",
      view_count: content.view_count || 0,
      published_at: content.published_at || null,
      tags: content.tags || [],
      description: content.description || "",
      article_excerpt: content.article_excerpt || "",
      read_time_minutes: content.read_time_minutes || 0,
      ebook_file_url: content.ebook_file_url || "",
      ebook_page_count: content.ebook_page_count || 0,
      ebook_file_size_mb: content.ebook_file_size_mb || 0,
      ebook_isbn: content.ebook_isbn || "",
      auto_fetched: content.auto_fetched || false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      content_type: "video",
      thumbnail_url: "",
      youtube_url: "",
      article_url: "",
      author: "",
      category: "Education",
      duration: "",
      is_active: true,
      display_order: 0,
      video_id: "",
      channel_name: "",
      view_count: 0,
      published_at: null,
      tags: [],
      description: "",
      article_excerpt: "",
      read_time_minutes: 0,
      ebook_file_url: "",
      ebook_page_count: 0,
      ebook_file_size_mb: 0,
      ebook_isbn: "",
      auto_fetched: false,
    });
    setFetchError(null);
    setManualMode(false); // Reset manual mode
  };

  const contentTypes = [
    { value: "video", label: "Video", icon: Youtube, color: "red" },
    { value: "article", label: "Article", icon: FileText, color: "blue" },
    { value: "ebook", label: "eBook", icon: Book, color: "purple" },
  ];

  const categories = [
    { value: "Education", label: "Education", icon: BookOpen, color: "blue" },
    {
      value: "Workout Tips",
      label: "Workout Tips",
      icon: Star,
      color: "orange",
    },
    { value: "Nutrition", label: "Nutrition", icon: Sparkles, color: "green" },
    { value: "Motivation", label: "Motivation", icon: Award, color: "purple" },
    { value: "Lifestyle", label: "Lifestyle", icon: Star, color: "pink" },
    { value: "Tips", label: "Tips", icon: Sparkles, color: "yellow" },
    {
      value: "Success Stories",
      label: "Success Stories",
      icon: Award,
      color: "teal",
    },
  ];

  // Calculate stats
  const stats = {
    total: contents.length,
    videos: contents.filter((c) => c.content_type === "video").length,
    articles: contents.filter((c) => c.content_type === "article").length,
    ebooks: contents.filter((c) => c.content_type === "ebook").length,
    active: contents.filter((c) => c.is_active).length,
  };

  // Filtering and sorting logic
  const getFilteredAndSortedData = () => {
    let filtered = [...contents];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (content) =>
          content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(
        (content) => content.content_type === filterType
      );
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(
        (content) => content.category === filterCategory
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      filtered = filtered.filter((content) => content.is_active === isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "author":
          aVal = a.author?.toLowerCase() || "";
          bVal = b.author?.toLowerCase() || "";
          break;
        case "display_order":
          aVal = a.display_order || 0;
          bVal = b.display_order || 0;
          break;
        case "created_at":
        default:
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredData = getFilteredAndSortedData();
  const activeFilterCount = [filterType, filterCategory, filterStatus].filter(
    (f) => f !== "all"
  ).length;

  const totalContent = contents.length;
  const activeContent = contents.filter((c) => c.is_active).length;
  const videoContent = contents.filter(
    (c) => c.content_type === "video"
  ).length;
  const articleContent = contents.filter(
    (c) => c.content_type === "article"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Star}
          title="Featured Content Management"
          subtitle="Manage featured videos, articles, and educational content"
          breadcrumbs={["Admin", "Featured Content"]}
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
            value={stats.total}
            icon={Star}
            color="purple"
            subtitle={`${stats.active} active`}
          />
          <StatsCard
            title="Videos"
            value={stats.videos}
            icon={Youtube}
            color="red"
            subtitle="Video content"
          />
          <StatsCard
            title="Articles"
            value={stats.articles}
            icon={Newspaper}
            color="blue"
            subtitle="Article content"
          />
          <StatsCard
            title="eBooks"
            value={stats.ebooks}
            icon={Book}
            color="green"
            subtitle="eBook library"
          />
        </div>

        {/* Info Banner for Auto-Fetch */}
        {!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "YOUR_API_KEY" ? (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-5 mb-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  🎬 YouTube Auto-Fetch Not Configured
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                  To enable automatic metadata fetching for YouTube videos, add
                  your YouTube API key to{" "}
                  <code className="px-1 py-0.5 bg-white rounded text-orange-600 font-mono text-xs">
                    .env
                  </code>{" "}
                  file. Get your free API key from{" "}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Google Cloud Console
                  </a>
                  .
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Quick Start:</strong> Check{" "}
                  <code className="px-1 py-0.5 bg-white rounded font-mono">
                    FEATURED_CONTENT_QUICK_START.md
                  </code>{" "}
                  for setup instructions.
                </p>
              </div>
            </div>
          </div>
        ) : null}

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
                          ? new Date(
                              shuffleSettings.last_shuffle_date
                            ).toLocaleDateString()
                          : "Never"
                      }`
                    : "Enable to automatically randomize content order every day"}
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
                    ? "bg-purple-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    shuffleSettings?.auto_shuffle_enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>

              {/* Manual Shuffle Button */}
              <button
                onClick={handleManualShuffle}
                disabled={shuffling}
                className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles
                  className={`h-4 w-4 ${shuffling ? "animate-spin" : ""}`}
                />
                {shuffling ? "Shuffling..." : "Shuffle Now"}
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
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                <TrendingUp
                  className={`h-4 w-4 text-gray-600 transition-transform ${
                    sortOrder === "desc" ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="space-y-3">
            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">
                Type:
              </span>
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterType === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {contentTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    filterType === type.value
                      ? type.color === "red"
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                <span className="text-xs font-semibold text-gray-600 mr-1">
                  Category:
                </span>
                <button
                  onClick={() => setFilterCategory("all")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterCategory === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFilterCategory(cat.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterCategory === cat.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 mr-1">
                  Status:
                </span>
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "active"
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus("inactive")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "inactive"
                      ? "bg-gray-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Inactive
                </button>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterType("all");
                    setFilterCategory("all");
                    setFilterStatus("all");
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No content found
              </h3>
              <p className="text-gray-500 text-center">
                {searchTerm || activeFilterCount > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first featured content"}
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
                    const typeInfo = contentTypes.find(
                      (t) => t.value === content.content_type
                    );
                    const categoryInfo = categories.find(
                      (c) => c.value === content.category
                    );

                    return (
                      <tr
                        key={content.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Content Title with Thumbnail */}
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            {content.thumbnail_url ? (
                              <img
                                src={content.thumbnail_url}
                                alt={content.title}
                                className="h-14 w-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`h-14 w-20 rounded-lg bg-gradient-to-br ${
                                content.content_type === "video"
                                  ? "from-red-500 to-red-600"
                                  : content.content_type === "ebook"
                                  ? "from-purple-500 to-purple-600"
                                  : "from-blue-500 to-blue-600"
                              } flex items-center justify-center flex-shrink-0 ${
                                content.thumbnail_url ? "hidden" : "flex"
                              }`}
                            >
                              {typeInfo && (
                                <typeInfo.icon className="h-6 w-6 text-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {content.title}
                              </p>
                              <p className="text-xs text-gray-500 leading-snug line-clamp-2">
                                {content.subtitle || "No subtitle"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="px-4 py-3">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                              content.content_type === "video"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : content.content_type === "ebook"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {typeInfo && (
                              <typeInfo.icon className="h-3.5 w-3.5" />
                            )}
                            <span className="capitalize">
                              {content.content_type}
                            </span>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium text-xs bg-purple-100 text-purple-700 border border-purple-200">
                            {categoryInfo && (
                              <categoryInfo.icon className="h-3.5 w-3.5" />
                            )}
                            <span className="whitespace-nowrap">
                              {content.category}
                            </span>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {content.author || "Unknown"}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3">
                          {content.duration ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100 w-fit">
                              <Calendar className="h-3.5 w-3.5 text-gray-600" />
                              <span className="text-xs font-semibold text-gray-700">
                                {content.duration}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>

                        {/* Display Order */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 rounded-lg border border-purple-100 w-fit">
                            <ListOrdered className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-700">
                              #{content.display_order}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                              content.is_active
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${
                                content.is_active
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            ></div>
                            {content.is_active ? "Active" : "Inactive"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(content.youtube_url ||
                              content.article_url ||
                              content.ebook_file_url) && (
                              <a
                                href={
                                  content.youtube_url ||
                                  content.article_url ||
                                  content.ebook_file_url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                title={
                                  content.content_type === "ebook"
                                    ? "Download eBook"
                                    : "View Content"
                                }
                              >
                                {content.content_type === "ebook" ? (
                                  <Download className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </a>
                            )}
                            <button
                              onClick={() => handleEdit(content)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit content"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {hasPermission('featured_content', 'delete') && (
                              <button
                                onClick={() => handleDelete(content)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete content"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
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
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredData.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {totalContent}
              </span>{" "}
              featured content
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
          title={`${editingContent ? "Edit" : "Create"} Featured Content`}
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
                {editingContent ? "Update" : "Create"} Content
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-4">
            {/* STEP 1: Content Type Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Content Type
                  </label>
                  <select
                    value={formData.content_type}
                    onChange={(e) =>
                      setFormData({ ...formData, content_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                    required
                  >
                    <option value="video">📹 YouTube Video</option>
                    <option value="article">📄 Article</option>
                    <option value="ebook">📚 eBook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 2: Content Type Specific Sections */}

            {/* VIDEO SECTION */}
            {formData.content_type === "video" && (
              <div className="border-2 border-red-200 bg-red-50/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Youtube className="h-5 w-5 text-red-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    YouTube Video
                  </h3>
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    YouTube URL
                    {isFetching && (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    )}
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.youtube_url}
                    onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-medium"
                    disabled={isFetching}
                  />
                  {fetchError && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {fetchError}
                    </div>
                  )}
                  {formData.auto_fetched && !fetchError && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-md">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Video details fetched automatically
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-1.5">
                    Paste a YouTube URL - title, thumbnail, duration & channel
                    will be fetched automatically
                  </p>
                </div>

                {/* Auto-fetched fields (grayed out) */}
                {formData.youtube_url && (
                  <>
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {formData.auto_fetched
                          ? "✨ Auto-Fetched Details"
                          : "Video Details"}
                      </p>
                      {formData.auto_fetched && !manualMode && (
                        <button
                          type="button"
                          onClick={() => setManualMode(true)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit Manually
                        </button>
                      )}
                      {manualMode && (
                        <button
                          type="button"
                          onClick={() => setManualMode(false)}
                          className="text-xs font-medium text-gray-600 hover:text-gray-700 flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Video Title
                        </label>
                        <Input
                          placeholder="e.g., 10-Minute Morning Workout"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                          disabled={formData.auto_fetched && !manualMode}
                          className={
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          placeholder="Brief description..."
                          value={formData.subtitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subtitle: e.target.value,
                            })
                          }
                          rows={2}
                          disabled={formData.auto_fetched && !manualMode}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm ${
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Channel / Creator
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., FitnessBlender"
                            value={formData.author}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                author: e.target.value,
                              })
                            }
                            disabled={formData.auto_fetched && !manualMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm ${
                              formData.auto_fetched && !manualMode
                                ? "bg-gray-100 text-gray-600"
                                : ""
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., 10:30"
                            value={formData.duration}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                duration: e.target.value,
                              })
                            }
                            disabled={formData.auto_fetched && !manualMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm ${
                              formData.auto_fetched && !manualMode
                                ? "bg-gray-100 text-gray-600"
                                : ""
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                          Thumbnail URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://i.ytimg.com/vi/..."
                          value={formData.thumbnail_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              thumbnail_url: e.target.value,
                            })
                          }
                          disabled={formData.auto_fetched && !manualMode}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm ${
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }`}
                        />
                        {formData.thumbnail_url && (
                          <div className="mt-2">
                            <img
                              src={formData.thumbnail_url}
                              alt="Preview"
                              className="h-20 w-32 rounded-lg object-cover border border-gray-200"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ARTICLE SECTION */}
            {formData.content_type === "article" && (
              <div className="border-2 border-blue-200 bg-blue-50/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-bold text-gray-900">Article</h3>
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    Article URL
                    {isFetching && (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    )}
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={formData.article_url}
                    onChange={(e) => handleArticleUrlChange(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                    required
                    disabled={isFetching}
                  />
                  {fetchError && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-2 rounded-md">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{fetchError}</p>
                      </div>
                    </div>
                  )}
                  {formData.auto_fetched && !fetchError && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-md">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Article metadata fetched automatically
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-1.5">
                    Paste an article URL - title, description & thumbnail will
                    be fetched automatically
                  </p>
                </div>

                {/* Auto-fetched/Manual fields */}
                {formData.article_url && (
                  <>
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {formData.auto_fetched
                          ? "✨ Auto-Fetched Details"
                          : "Article Details"}
                      </p>
                      {formData.auto_fetched && !manualMode && (
                        <button
                          type="button"
                          onClick={() => setManualMode(true)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit Manually
                        </button>
                      )}
                      {manualMode && (
                        <button
                          type="button"
                          onClick={() => setManualMode(false)}
                          className="text-xs font-medium text-gray-600 hover:text-gray-700 flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Article Title
                        </label>
                        <Input
                          placeholder="e.g., The Ultimate Guide to Home Workouts"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                          disabled={formData.auto_fetched && !manualMode}
                          className={
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brief Description
                        </label>
                        <textarea
                          placeholder="Brief description..."
                          value={formData.subtitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subtitle: e.target.value,
                            })
                          }
                          rows={2}
                          disabled={formData.auto_fetched && !manualMode}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm ${
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Article Excerpt
                        </label>
                        <textarea
                          placeholder="Full excerpt or summary..."
                          value={formData.article_excerpt}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              article_excerpt: e.target.value,
                            })
                          }
                          rows={3}
                          disabled={formData.auto_fetched && !manualMode}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm ${
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Author
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Jane Smith"
                            value={formData.author}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                author: e.target.value,
                              })
                            }
                            disabled={formData.auto_fetched && !manualMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                              formData.auto_fetched && !manualMode
                                ? "bg-gray-100 text-gray-600"
                                : ""
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-600" />
                            Read Time (min)
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g., 5"
                            value={formData.read_time_minutes}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                read_time_minutes:
                                  parseInt(e.target.value) || 0,
                              })
                            }
                            disabled={formData.auto_fetched && !manualMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                              formData.auto_fetched && !manualMode
                                ? "bg-gray-100 text-gray-600"
                                : ""
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                          Thumbnail URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={formData.thumbnail_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              thumbnail_url: e.target.value,
                            })
                          }
                          disabled={formData.auto_fetched && !manualMode}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }`}
                        />
                        {formData.thumbnail_url && (
                          <div className="mt-2">
                            <img
                              src={formData.thumbnail_url}
                              alt="Preview"
                              className="h-20 w-32 rounded-lg object-cover border border-gray-200"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* EBOOK SECTION */}
            {formData.content_type === "ebook" && (
              <div className="border-2 border-purple-200 bg-purple-50/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <h3 className="text-base font-bold text-gray-900">eBook</h3>
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4 text-purple-600" />
                    eBook URL or Landing Page
                    {isFetching && (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-600" />
                    )}
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/ebook-page or direct PDF link"
                    value={formData.ebook_file_url}
                    onChange={(e) => handleEbookUrlChange(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium"
                    required
                    disabled={isFetching}
                  />
                  {fetchError && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-2 rounded-md">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{fetchError}</p>
                      </div>
                    </div>
                  )}
                  {formData.auto_fetched && !fetchError && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-md">
                      <CheckCircle className="h-3.5 w-3.5" />
                      eBook preview metadata fetched automatically
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-1.5">
                    Paste eBook landing page or direct download link - preview
                    details will be fetched
                  </p>
                </div>

                {/* Auto-fetched/Manual fields */}
                {formData.ebook_file_url && (
                  <>
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {formData.auto_fetched
                          ? "✨ Auto-Fetched Details"
                          : "eBook Details"}
                      </p>
                      {formData.auto_fetched && !manualMode && (
                        <button
                          type="button"
                          onClick={() => setManualMode(true)}
                          className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 px-2 py-1 hover:bg-purple-50 rounded transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit Manually
                        </button>
                      )}
                      {manualMode && (
                        <button
                          type="button"
                          onClick={() => setManualMode(false)}
                          className="text-xs font-medium text-gray-600 hover:text-gray-700 flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          eBook Title
                        </label>
                        <Input
                          placeholder="e.g., Complete Fitness Guide"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                          disabled={formData.auto_fetched && !manualMode}
                          className={
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          placeholder="Brief description of the eBook..."
                          value={formData.subtitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subtitle: e.target.value,
                            })
                          }
                          rows={2}
                          disabled={formData.auto_fetched && !manualMode}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm ${
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Author / Publisher
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Dr. Fitness"
                            value={formData.author}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                author: e.target.value,
                              })
                            }
                            disabled={formData.auto_fetched && !manualMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                              formData.auto_fetched && !manualMode
                                ? "bg-gray-100 text-gray-600"
                                : ""
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ISBN (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="978-3-16-148410-0"
                            value={formData.ebook_isbn}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ebook_isbn: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Page Count (Optional)
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g., 150"
                            value={formData.ebook_page_count}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ebook_page_count: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            File Size (Optional)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="e.g., 2.5 MB"
                            value={formData.ebook_file_size_mb}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ebook_file_size_mb:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                          Cover Image / Thumbnail
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/cover.jpg"
                          value={formData.thumbnail_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              thumbnail_url: e.target.value,
                            })
                          }
                          disabled={formData.auto_fetched && !manualMode}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                            formData.auto_fetched && !manualMode
                              ? "bg-gray-100 text-gray-600"
                              : ""
                          }`}
                        />
                        {formData.thumbnail_url && (
                          <div className="mt-2">
                            <img
                              src={formData.thumbnail_url}
                              alt="Preview"
                              className="h-20 w-32 rounded-lg object-cover border border-gray-200"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 3: Common Settings */}
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <ListOrdered className="h-3.5 w-3.5 text-gray-500" />
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first in the app
                </p>
              </div>

              {/* Active Status Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">
                      Active Status
                    </span>
                    <p className="text-xs text-gray-500">
                      Make this content visible to users
                    </p>
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
