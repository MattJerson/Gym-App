import { useState, useEffect } from "react";
import { 
  Plus, 
  CreditCard, 
  DollarSign, 
  Users, 
  Crown, 
  Calendar, 
  Check,
  Search,
  TrendingUp,
  Pencil,
  Trash2,
  Package,
  UserCheck,
  Clock,
  Zap,
  Star,
  AlertCircle,
  X
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Subscriptions = () => {
  const [packages, setPackages] = useState([]);
  const [subscribedUsers, setSubscribedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [currentView, setCurrentView] = useState('packages'); // 'packages' or 'users'

  // Filters and sorting
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPackage, setFilterPackage] = useState("all");
  const [filterBilling, setFilterBilling] = useState("all");

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: 0,
    billing_interval: 'month',
    features: [],
    badge: '',
    emoji: '💎',
    accent_color: '#4A9EFF',
    is_popular: false,
    sort_order: 0
  });

  useEffect(() => {
    fetchPackages();
    fetchSubscribedUsers();
  }, []);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscribedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_packages (
            id,
            name,
            emoji,
            badge,
            accent_color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enrich with user data from profiles table
      if (data && data.length > 0) {
        const userIds = data.map(sub => sub.user_id);
        
        // Fetch profiles for all users
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nickname, full_name')
          .in('id', userIds);
        
        // Create a map of user_id to profile
        const profilesMap = {};
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap[profile.id] = profile;
          });
        }
        
        // Enrich subscription data with profile info
        const enrichedData = data.map(sub => ({
          ...sub,
          user_name: profilesMap[sub.user_id]?.full_name || profilesMap[sub.user_id]?.nickname || 'Unknown User',
          user_nickname: profilesMap[sub.user_id]?.nickname || ''
        }));
        
        console.log('Subscribed users:', enrichedData);
        setSubscribedUsers(enrichedData);
      } else {
        console.log('No subscribed users found');
        setSubscribedUsers([]);
      }
    } catch (err) {
      console.error('Error fetching subscribed users:', err);
      setSubscribedUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const packageData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(formData.price),
        billing_interval: formData.billing_interval,
        features: formData.features,
        badge: formData.badge,
        emoji: formData.emoji,
        accent_color: formData.accent_color,
        is_popular: formData.is_popular,
        sort_order: parseInt(formData.sort_order) || 0,
        metadata: {}
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('subscription_packages')
          .update(packageData)
          .eq('id', editingPackage.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription_packages')
          .insert([packageData]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingPackage(null);
      resetForm();
      await fetchPackages();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (pkg) => {
    if (!confirm(`Delete package "${pkg.name}"? This will affect user subscriptions.`)) return;
    
    try {
      const { error } = await supabase
        .from('subscription_packages')
        .delete()
        .eq('id', pkg.id);
      
      if (error) throw error;
      await fetchPackages();
    } catch (err) {
      alert('Error deleting package: ' + err.message);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      slug: pkg.slug,
      price: pkg.price || 0,
      billing_interval: pkg.billing_interval || 'month',
      features: Array.isArray(pkg.features) ? pkg.features : [],
      badge: pkg.badge || '',
      emoji: pkg.emoji || '💎',
      accent_color: pkg.accent_color || '#4A9EFF',
      is_popular: pkg.is_popular || false,
      sort_order: pkg.sort_order || 0
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      price: 0,
      billing_interval: 'month',
      features: [],
      badge: '',
      emoji: '💎',
      accent_color: '#4A9EFF',
      is_popular: false,
      sort_order: 0
    });
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  // Filtering and sorting
  const getFilteredAndSortedData = () => {
    let filtered = currentView === 'packages' ? [...packages] : [...subscribedUsers];

    // Search filter
    if (searchTerm) {
      if (currentView === 'packages') {
        filtered = filtered.filter(pkg =>
          pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pkg.slug?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        filtered = filtered.filter(user =>
          user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.subscription_packages?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    }

    if (currentView === 'users') {
      // Status filter
      if (filterStatus !== 'all') {
        filtered = filtered.filter(user => user.status === filterStatus);
      }

      // Package filter
      if (filterPackage !== 'all') {
        filtered = filtered.filter(user => user.package_id === filterPackage);
      }
    }

    if (currentView === 'packages' && filterBilling !== 'all') {
      filtered = filtered.filter(pkg => pkg.billing_interval === filterBilling);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      if (currentView === 'packages') {
        switch (sortBy) {
          case 'name':
            aVal = a.name?.toLowerCase() || '';
            bVal = b.name?.toLowerCase() || '';
            break;
          case 'price':
            aVal = a.price || 0;
            bVal = b.price || 0;
            break;
          case 'sort_order':
            aVal = a.sort_order || 0;
            bVal = b.sort_order || 0;
            break;
          case 'created_at':
          default:
            aVal = new Date(a.created_at || 0).getTime();
            bVal = new Date(b.created_at || 0).getTime();
            break;
        }
      } else {
        switch (sortBy) {
          case 'user':
            aVal = a.user_name?.toLowerCase() || '';
            bVal = b.user_name?.toLowerCase() || '';
            break;
          case 'package':
            aVal = a.subscription_packages?.name?.toLowerCase() || '';
            bVal = b.subscription_packages?.name?.toLowerCase() || '';
            break;
          case 'expires_at':
            aVal = new Date(a.expires_at || 0).getTime();
            bVal = new Date(b.expires_at || 0).getTime();
            break;
          case 'created_at':
          default:
            aVal = new Date(a.created_at || 0).getTime();
            bVal = new Date(b.created_at || 0).getTime();
            break;
        }
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
  const activeFilterCount = [filterStatus, filterPackage, filterBilling].filter(f => f !== 'all').length;

  // Stats
  const totalPackages = packages.length;
  const activeSubscribers = subscribedUsers.filter(s => s.status === 'active').length;
  const totalRevenue = subscribedUsers
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      const pkg = packages.find(p => p.id === s.package_id);
      return sum + (pkg?.price || 0);
    }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={CreditCard}
          title="Subscription Management"
          subtitle="Manage subscription packages and user subscriptions"
          breadcrumbs={['Admin', 'Subscriptions']}
          actions={
            currentView === 'packages' && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingPackage(null);
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                Add Package
              </Button>
            )
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <StatsCard
            title="Total Packages"
            value={totalPackages}
            icon={Package}
            color="blue"
            subtitle={`${packages.filter(p => p.is_popular).length} popular`}
          />
          <StatsCard
            title="Active Subscribers"
            value={activeSubscribers}
            icon={Users}
            color="green"
            subtitle={`${subscribedUsers.filter(s => s.status === 'cancelled').length} cancelled`}
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            color="purple"
            subtitle="From active subs"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
          {/* Search and View Toggle */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${currentView}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentView('packages');
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterPackage('all');
                  setFilterBilling('all');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  currentView === 'packages'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="h-4 w-4" />
                Packages
              </button>
              <button
                onClick={() => {
                  setCurrentView('users');
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterPackage('all');
                  setFilterBilling('all');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  currentView === 'users'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                Subscribed Users
              </button>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {currentView === 'packages' ? (
                  <>
                    <option value="created_at">Date Created</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="sort_order">Display Order</option>
                  </>
                ) : (
                  <>
                    <option value="created_at">Date Subscribed</option>
                    <option value="user">User Name</option>
                    <option value="package">Package</option>
                    <option value="expires_at">Expiry Date</option>
                  </>
                )}
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

          {/* Filters */}
          {currentView === 'users' && (
            <div className="flex flex-wrap items-center gap-4">
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
                  onClick={() => setFilterStatus('cancelled')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === 'cancelled'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancelled
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === 'pending'
                      ? 'bg-yellow-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
              </div>

              {/* Package Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 mr-1">Package:</span>
                <button
                  onClick={() => setFilterPackage('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterPackage === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {packages.slice(0, 4).map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setFilterPackage(pkg.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterPackage === pkg.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pkg.emoji} {pkg.name}
                  </button>
                ))}
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterPackage('all');
                    setFilterBilling('all');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                >
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>
          )}

          {/* Billing Filter for Packages */}
          {currentView === 'packages' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">Billing:</span>
              <button
                onClick={() => setFilterBilling('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterBilling === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterBilling('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterBilling === 'month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setFilterBilling('year')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterBilling === 'year'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              {currentView === 'packages' ? <Package className="h-16 w-16 text-gray-300 mb-4" /> : <Users className="h-16 w-16 text-gray-300 mb-4" />}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No {currentView} found</h3>
              <p className="text-gray-500 text-center">
                {searchTerm || activeFilterCount > 0 
                  ? 'Try adjusting your search or filters'
                  : currentView === 'packages' 
                    ? 'Get started by creating your first subscription package'
                    : 'No users have subscribed yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {currentView === 'packages' ? (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-80">
                          Package
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Billing
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Features
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Subscribers
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-64">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Package
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Started
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Expires
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentView === 'packages' && filteredData.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div 
                            className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"
                            style={{ backgroundColor: pkg.accent_color || '#4A9EFF' }}
                          >
                            <span className="text-2xl">{pkg.emoji || '💎'}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm text-gray-900">{pkg.name}</p>
                              {pkg.is_popular && (
                                <Badge variant="purple" className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  Popular
                                </Badge>
                              )}
                              {pkg.badge && (
                                <Badge variant="info">{pkg.badge}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{pkg.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 rounded-lg border border-green-100 w-fit">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-bold text-green-700">${pkg.price}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={pkg.billing_interval === 'month' ? 'info' : 'purple'}>
                          {pkg.billing_interval === 'month' ? 'Monthly' : pkg.billing_interval === 'year' ? 'Yearly' : 'One-time'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{Array.isArray(pkg.features) ? pkg.features.length : 0} features</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">
                          {subscribedUsers.filter(s => s.package_id === pkg.id && s.status === 'active').length} active
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(pkg)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit package"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete package"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentView === 'users' && filteredData.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {user.user_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              {user.user_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.user_nickname ? `@${user.user_nickname}` : `ID: ${user.user_id?.substring(0, 8)}...`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{user.subscription_packages?.emoji || '💎'}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {user.subscription_packages?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : user.status === 'cancelled'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-green-500' : user.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          {user.status}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.started_at ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(user.started_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.expires_at ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(user.expires_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No expiry</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!isLoading && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredData.length}</span> of{' '}
              <span className="font-semibold text-gray-900">
                {currentView === 'packages' ? totalPackages : subscribedUsers.length}
              </span> {currentView}
            </p>
          </div>
        )}

        {/* Create/Edit Package Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPackage(null);
            resetForm();
          }}
          title={editingPackage ? 'Edit Package' : 'Create Subscription Package'}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPackage(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingPackage ? 'Update Package' : 'Create Package'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Package Information
              </h3>
              <div className="space-y-3">
                <Input
                  label="Package Name"
                  placeholder="e.g., Premium Plan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Input
                  label="Slug"
                  placeholder="premium-plan (auto-generated from name)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  helperText="URL-friendly identifier"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Price"
                    type="number"
                    step="0.01"
                    placeholder="9.99"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    icon={DollarSign}
                    required
                  />

                  <Select
                    label="Billing Interval"
                    value={formData.billing_interval}
                    onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value })}
                    options={[
                      { value: 'month', label: 'Monthly' },
                      { value: 'year', label: 'Yearly' },
                      { value: 'one_time', label: 'One-time' }
                    ]}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emoji
                    </label>
                    <input
                      type="text"
                      placeholder="💎"
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-2xl text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accent Color
                    </label>
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>

                  <Input
                    label="Sort Order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    helperText="Lower = first"
                  />
                </div>

                <Input
                  label="Badge Text (optional)"
                  placeholder="e.g., BEST VALUE"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                />

                {/* Features List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Features
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={addFeature}
                      type="button"
                    >
                      Add Feature
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Enter feature"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {formData.features.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No features added yet</p>
                    )}
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-3 border-t space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.is_popular}
                        onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-purple-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-purple-600" />
                        Mark as Popular
                      </span>
                      <p className="text-xs text-gray-500">Highlight this package to users</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Subscriptions;
