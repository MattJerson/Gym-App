import { useState, useEffect } from "react";
import { Plus, CreditCard, DollarSign, Users, Crown, Calendar, Check } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
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
  const [subscriptions, setSubscriptions] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [currentView, setCurrentView] = useState('packages'); // 'packages' or 'users'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    billing_cycle: 'monthly',
    features: '',
    is_popular: false,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchUserSubscriptions();
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
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_packages(name),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserSubscriptions(data || []);
    } catch (err) {
      console.error('Error fetching user subscriptions:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const packageData = {
        ...formData,
        features: formData.features ? formData.features.split(',').map(f => f.trim()) : []
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
      await fetchSubscriptions();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (pkg) => {
    if (!confirm(`Delete package "${pkg.name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('subscription_packages')
        .delete()
        .eq('id', pkg.id);
      
      if (error) throw error;
      await fetchSubscriptions();
    } catch (err) {
      alert('Error deleting package: ' + err.message);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price_monthly: pkg.price_monthly || 0,
      price_yearly: pkg.price_yearly || 0,
      billing_cycle: pkg.billing_cycle || 'monthly',
      features: Array.isArray(pkg.features) ? pkg.features.join(', ') : '',
      is_popular: pkg.is_popular || false,
      is_active: pkg.is_active !== false,
      sort_order: pkg.sort_order || 0
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      billing_cycle: 'monthly',
      features: '',
      is_popular: false,
      is_active: true,
      sort_order: 0
    });
  };

  const packageColumns = [
    {
      header: 'Package',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${row.is_popular ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600'} flex items-center justify-center`}>
            {row.is_popular ? <Crown className="h-6 w-6 text-white" /> : <CreditCard className="h-6 w-6 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{row.name}</p>
              {row.is_popular && <Badge variant="purple">Popular</Badge>}
            </div>
            <p className="text-sm text-gray-500">{row.description}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Pricing',
      accessor: 'price',
      render: (row) => (
        <div className="space-y-1">
          {row.price_monthly > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold">${row.price_monthly}/mo</span>
            </div>
          )}
          {row.price_yearly > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>${row.price_yearly}/yr</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Billing Cycle',
      accessor: 'billing_cycle',
      render: (row) => (
        <Badge variant={row.billing_cycle === 'monthly' ? 'info' : 'success'}>
          {row.billing_cycle}
        </Badge>
      )
    },
    {
      header: 'Features',
      accessor: 'features',
      render: (row) => {
        const features = Array.isArray(row.features) ? row.features : [];
        return (
          <div className="text-sm text-gray-600">
            {features.length > 0 ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>{features.length} features</span>
              </div>
            ) : (
              <span className="text-gray-400">No features</span>
            )}
          </div>
        );
      }
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

  const userSubColumns = [
    {
      header: 'User',
      accessor: 'user',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.profiles?.full_name || 'Unknown'}</p>
          <p className="text-sm text-gray-500">ID: {row.user_id?.substring(0, 8)}...</p>
        </div>
      )
    },
    {
      header: 'Package',
      accessor: 'package',
      render: (row) => (
        <Badge variant="info">{row.subscription_packages?.name || 'N/A'}</Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const variants = {
          'active': 'success',
          'expired': 'error',
          'cancelled': 'default'
        };
        return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
      }
    },
    {
      header: 'Start Date',
      accessor: 'start_date',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{new Date(row.start_date).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: 'End Date',
      accessor: 'end_date',
      render: (row) => row.end_date ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{new Date(row.end_date).toLocaleDateString()}</span>
        </div>
      ) : <span className="text-gray-400">-</span>
    }
  ];

  const filteredPackages = subscriptions.filter(pkg =>
    pkg.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUserSubs = userSubscriptions.filter(sub =>
    sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.subscription_packages?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.price_monthly || 0), 0);
  const activeSubscribers = userSubscriptions.filter(s => s.status === 'active').length;
  const totalPackages = subscriptions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={CreditCard}
          title="Subscription Management"
          subtitle="Manage subscription packages and user subscriptions"
          breadcrumbs={['Admin', 'Subscriptions']}
          actions={
            <div className="flex gap-3">
              <Button
                variant={currentView === 'packages' ? 'primary' : 'outline'}
                onClick={() => setCurrentView('packages')}
              >
                Packages
              </Button>
              <Button
                variant={currentView === 'users' ? 'primary' : 'outline'}
                onClick={() => setCurrentView('users')}
                icon={Users}
              >
                User Subscriptions
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Packages"
            value={totalPackages}
            icon={CreditCard}
            color="blue"
            subtitle={`${subscriptions.filter(s => s.is_active).length} active`}
          />
          <StatsCard
            title="Active Subscribers"
            value={activeSubscribers}
            icon={Users}
            color="green"
            subtitle="Current subscribers"
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${totalRevenue}`}
            icon={DollarSign}
            color="purple"
            subtitle="Potential MRR"
          />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={`Search ${currentView}...`}
          />
          {currentView === 'packages' && (
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
          )}
        </div>

        {/* Data Tables */}
        {currentView === 'packages' ? (
          <DataTable
            columns={packageColumns}
            data={filteredPackages}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            actions={['edit', 'delete']}
            emptyMessage="No subscription packages found"
          />
        ) : (
          <DataTable
            columns={userSubColumns}
            data={filteredUserSubs}
            loading={isLoading}
            actions={[]}
            emptyMessage="No user subscriptions found"
          />
        )}

        {/* Create/Edit Modal */}
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
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingPackage ? 'Update Package' : 'Create Package'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Package Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Select
              label="Billing Cycle"
              value={formData.billing_cycle}
              onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' }
              ]}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Monthly Price ($)"
                type="number"
                value={formData.price_monthly}
                onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                icon={DollarSign}
              />
              
              <Input
                label="Yearly Price ($)"
                type="number"
                value={formData.price_yearly}
                onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
                icon={DollarSign}
              />
            </div>

            <Input
              label="Features (comma separated)"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              helperText="Enter features separated by commas"
            />

            <Input
              label="Sort Order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
              helperText="Lower numbers appear first"
            />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_popular"
                  checked={formData.is_popular}
                  onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="is_popular" className="text-sm font-medium text-gray-700">
                  Mark as Popular
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (visible to users)
                </label>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Subscriptions;
