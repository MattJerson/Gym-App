# Component Library Quick Reference

## 🚀 Quick Start Guide

This guide provides quick examples for using the reusable component library.

---

## 📦 Import Statements

```javascript
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import StatsCard from '../components/common/StatsCard';
```

---

## 🎯 Common Patterns

### Page Layout Pattern

```jsx
import { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const MyPage = () => {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader
          icon={Users}
          title="Page Title"
          subtitle="Page description"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Current Page' }
          ]}
        >
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add New
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard icon={Users} label="Total" value="100" trend={5.2} color="blue" />
        </div>

        {/* Search & Table */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
        />

        <DataTable
          columns={[
            { header: 'Name', accessor: 'name' },
            { 
              header: 'Status', 
              accessor: 'status',
              render: (row) => <Badge variant="success">{row.status}</Badge>
            }
          ]}
          data={data}
          actions={[
            { type: 'edit', onClick: (row) => handleEdit(row) },
            { type: 'delete', onClick: (row) => handleDelete(row) }
          ]}
        />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save
              </Button>
            </>
          }
        >
          {/* Form content */}
        </Modal>
      </div>
    </div>
  );
};

export default MyPage;
```

---

## 🎨 Component Examples

### PageHeader

```jsx
// Basic
<PageHeader
  icon={Users}
  title="User Management"
  subtitle="Manage all users"
/>

// With breadcrumbs
<PageHeader
  icon={Users}
  title="User Management"
  subtitle="Manage all users"
  breadcrumbs={[
    { label: 'Dashboard', href: '/' },
    { label: 'Users' }
  ]}
/>

// With action buttons
<PageHeader
  icon={Users}
  title="User Management"
  subtitle="Manage all users"
  breadcrumbs={[
    { label: 'Dashboard', href: '/' },
    { label: 'Users' }
  ]}
>
  <div className="flex gap-3">
    <Button variant="secondary" icon={Download}>Export</Button>
    <Button variant="primary" icon={Plus}>Add User</Button>
  </div>
</PageHeader>
```

### StatsCard

```jsx
// All color variants
<StatsCard icon={Users} label="Users" value="1,234" trend={12.5} color="blue" />
<StatsCard icon={Activity} label="Active" value="892" trend={5.2} color="green" />
<StatsCard icon={Dumbbell} label="Workouts" value="456" trend={-2.1} color="orange" />
<StatsCard icon={Award} label="Premium" value="234" trend={8.3} color="purple" />

// No trend
<StatsCard icon={Users} label="Total" value="5,000" color="blue" />
```

### Badge

```jsx
// All variants
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Inactive</Badge>
<Badge variant="info">New</Badge>
<Badge variant="purple">Premium</Badge>
<Badge variant="orange">Featured</Badge>
<Badge variant="gray">Draft</Badge>
```

### Button

```jsx
// Variants
<Button variant="primary">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="danger">Delete</Button>

// With icons
<Button variant="primary" icon={Plus}>Add New</Button>
<Button variant="secondary" icon={Download}>Export</Button>

// Loading state
<Button variant="primary" loading={isLoading}>
  Save Changes
</Button>

// Disabled
<Button variant="primary" disabled>
  Disabled Button
</Button>
```

### Input

```jsx
// Basic
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter email"
/>

// With icon
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  icon={Mail}
/>

// With error
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error="Email is required"
/>

// With helper text
<Input
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  helperText="Must be at least 8 characters"
/>

// Textarea
<Input
  label="Description"
  type="textarea"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={4}
/>
```

### Select

```jsx
// Basic
<Select
  label="Role"
  value={role}
  onChange={(e) => setRole(e.target.value)}
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' }
  ]}
/>

// With icon
<Select
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  icon={Shield}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
/>
```

### Modal

```jsx
// Basic
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  <p>Modal content goes here</p>
</Modal>

// With footer
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create New User"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Save
      </Button>
    </>
  }
>
  <div className="space-y-4">
    <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
    <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
  </div>
</Modal>

// Large size
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Large Modal"
  size="xl"
>
  <p>Content</p>
</Modal>

// Sizes: 'sm', 'md', 'lg', 'xl'
```

### DataTable

```jsx
// Basic
<DataTable
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' }
  ]}
  data={users}
/>

// With custom render
<DataTable
  columns={[
    { header: 'Name', accessor: 'name' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'error'}>
          {row.status}
        </Badge>
      )
    }
  ]}
  data={users}
/>

// With actions
<DataTable
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' }
  ]}
  data={users}
  actions={[
    { type: 'view', onClick: (row) => handleView(row) },
    { type: 'edit', onClick: (row) => handleEdit(row) },
    { type: 'delete', onClick: (row) => handleDelete(row) }
  ]}
/>

// With custom actions
<DataTable
  columns={[
    { header: 'Name', accessor: 'name' }
  ]}
  data={users}
  actions={[
    { type: 'edit', onClick: (row) => handleEdit(row) },
    { 
      type: 'custom', 
      icon: Send, 
      label: 'Send Email',
      onClick: (row) => handleSendEmail(row) 
    }
  ]}
/>
```

### SearchBar

```jsx
// Basic
<SearchBar
  searchQuery={searchQuery}
  onSearchChange={(e) => setSearchQuery(e.target.value)}
/>

// With filter
<SearchBar
  searchQuery={searchQuery}
  onSearchChange={(e) => setSearchQuery(e.target.value)}
  filterValue={filter}
  onFilterChange={(e) => setFilter(e.target.value)}
  filterOptions={[
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' }
  ]}
/>

// With export
<SearchBar
  searchQuery={searchQuery}
  onSearchChange={(e) => setSearchQuery(e.target.value)}
  onExport={handleExport}
/>

// Full example
<SearchBar
  searchQuery={searchQuery}
  onSearchChange={(e) => setSearchQuery(e.target.value)}
  filterValue={filter}
  onFilterChange={(e) => setFilter(e.target.value)}
  filterOptions={[
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' }
  ]}
  onExport={handleExport}
/>
```

---

## 🔄 Supabase Integration

### Setup

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);
```

### CRUD Operations

```javascript
// Fetch all
const fetchData = async () => {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  setData(data);
};

// Create
const createItem = async (item) => {
  const { data, error } = await supabase
    .from('table_name')
    .insert([item])
    .select();
  
  if (!error) {
    fetchData(); // Refresh list
  }
};

// Update
const updateItem = async (id, updates) => {
  const { data, error } = await supabase
    .from('table_name')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (!error) {
    fetchData(); // Refresh list
  }
};

// Delete
const deleteItem = async (id) => {
  const { error } = await supabase
    .from('table_name')
    .delete()
    .eq('id', id);
  
  if (!error) {
    fetchData(); // Refresh list
  }
};

// Fetch with filter
const fetchFiltered = async (status) => {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });
  
  setData(data);
};
```

---

## 🎨 Color System

### Gradient Backgrounds
```jsx
// Icons
className="bg-gradient-to-br from-blue-500 to-blue-600"
className="bg-gradient-to-br from-green-500 to-green-600"
className="bg-gradient-to-br from-orange-500 to-orange-600"
className="bg-gradient-to-br from-purple-500 to-purple-600"
className="bg-gradient-to-br from-yellow-500 to-yellow-600"

// Text
className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent"
```

### Page Backgrounds
```jsx
className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
```

### Card Styles
```jsx
className="bg-white rounded-2xl shadow-sm p-8"
```

---

## 📱 Responsive Grid Layouts

```jsx
// 4 columns on desktop, 2 on tablet, 1 on mobile
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// 3 columns max
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 2 columns max
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

---

## 🔍 Search & Filter Example

```javascript
const [searchQuery, setSearchQuery] = useState('');
const [filter, setFilter] = useState('all');

const filteredData = data.filter(item => {
  // Search filter
  const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.email.toLowerCase().includes(searchQuery.toLowerCase());
  
  // Status filter
  const matchesFilter = filter === 'all' || item.status === filter;
  
  return matchesSearch && matchesFilter;
});

return (
  <>
    <SearchBar
      searchQuery={searchQuery}
      onSearchChange={(e) => setSearchQuery(e.target.value)}
      filterValue={filter}
      onFilterChange={(e) => setFilter(e.target.value)}
      filterOptions={[
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]}
    />
    <DataTable
      columns={columns}
      data={filteredData}
      actions={actions}
    />
  </>
);
```

---

## 💡 Form Validation Example

```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  role: 'user'
});

const [errors, setErrors] = useState({});

const validate = () => {
  const newErrors = {};
  
  if (!formData.name) {
    newErrors.name = 'Name is required';
  }
  
  if (!formData.email) {
    newErrors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Email is invalid';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  // Submit data
  await createItem(formData);
  setIsModalOpen(false);
};

return (
  <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create User">
    <div className="space-y-4">
      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        error={errors.name}
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        error={errors.email}
        icon={Mail}
      />
      <Select
        label="Role"
        value={formData.role}
        onChange={(e) => setFormData({...formData, role: e.target.value})}
        options={[
          { value: 'user', label: 'User' },
          { value: 'admin', label: 'Admin' }
        ]}
        icon={Shield}
      />
    </div>
  </Modal>
);
```

---

## 🚀 Export Functionality Example

```javascript
const handleExport = () => {
  // Convert data to CSV
  const headers = ['Name', 'Email', 'Status'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [row.name, row.email, row.status].join(','))
  ].join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
};

// Or export as JSON
const handleExportJSON = () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
```

---

## 📊 Stats Calculation Example

```javascript
const calculateStats = (data) => {
  const total = data.length;
  const active = data.filter(item => item.status === 'active').length;
  const activePercentage = total > 0 ? ((active / total) * 100).toFixed(1) : 0;
  
  return {
    total,
    active,
    activePercentage
  };
};

const stats = calculateStats(users);

return (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatsCard icon={Users} label="Total Users" value={stats.total} color="blue" />
    <StatsCard icon={Activity} label="Active Users" value={stats.active} color="green" />
    <StatsCard icon={Target} label="Active Rate" value={`${stats.activePercentage}%`} color="purple" />
  </div>
);
```

---

## 🎯 Best Practices

1. **Always use try/catch** for async operations
2. **Validate user input** before submitting
3. **Show loading states** during async operations
4. **Display error messages** when operations fail
5. **Refresh data** after create/update/delete
6. **Use consistent colors** across the app
7. **Keep components focused** on one responsibility
8. **Add proper accessibility** labels and ARIA attributes
9. **Test responsive** layouts on different screen sizes
10. **Follow naming conventions** for consistency

---

## 📚 Additional Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons)
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)

---

**Quick Reference Version:** 1.0
**Last Updated:** December 2024
