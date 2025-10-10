# 🚀 Admin Dashboard Quick Reference

**One-page cheat sheet for common tasks**

---

## 🎯 Quick Start

```bash
cd admin
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🔧 Environment Setup

Create `.env` in admin folder:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 📦 Import Essentials

```jsx
// Page structure
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

// Icons (pick what you need)
import { 
  Plus, Edit, Trash2, Search, Download,
  Users, Activity, Bell, Award, Star,
  Settings, LogOut, Menu, X
} from 'lucide-react';
```

---

## 🧩 Component Quick Use

### PageHeader
```jsx
<PageHeader
  icon={Users}
  title="Page Title"
  subtitle="Description"
  breadcrumbs={['Admin', 'Page']}
  actions={<Button variant="primary">Action</Button>}
/>
```

### StatsCard
```jsx
<StatsCard
  title="Total Users"
  value={1234}
  icon={Users}
  color="blue"
  trend={12.5}
  subtitle="vs last month"
/>
```

### SearchBar
```jsx
<SearchBar
  searchTerm={term}
  onSearchChange={setTerm}
  placeholder="Search..."
/>
```

### DataTable
```jsx
<DataTable
  columns={columns}
  data={data}
  loading={loading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  actions={['edit', 'delete']}
/>
```

### Modal
```jsx
<Modal
  isOpen={show}
  onClose={() => setShow(false)}
  title="Modal Title"
  size="lg"
  footer={
    <>
      <Button variant="outline" onClick={close}>Cancel</Button>
      <Button variant="primary" onClick={save}>Save</Button>
    </>
  }
>
  {children}
</Modal>
```

### Button Variants
```jsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Badge Variants
```jsx
<Badge variant="success">Active</Badge>
<Badge variant="error">Inactive</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="purple">Premium</Badge>
```

### Input
```jsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  icon={Mail}
  required
  error={error}
  helperText="Enter valid email"
/>
```

### Select
```jsx
<Select
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
/>
```

---

## 💾 Supabase CRUD

### Fetch All
```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .order('created_at', { ascending: false });
```

### Fetch with Filter
```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .neq('column', value)
  .gt('column', value)
  .lt('column', value)
  .ilike('column', '%search%');
```

### Insert
```javascript
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column1: value1, column2: value2 }]);
```

### Update
```javascript
const { error } = await supabase
  .from('table_name')
  .update({ column: newValue })
  .eq('id', itemId);
```

### Delete
```javascript
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', itemId);
```

### Count
```javascript
const { count, error } = await supabase
  .from('table_name')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true);
```

### Join Tables
```javascript
const { data, error } = await supabase
  .from('user_subscriptions')
  .select(`
    *,
    users(email, display_name),
    subscription_packages(name, price_monthly)
  `);
```

---

## 🎨 Tailwind Quick Classes

### Layout
```css
min-h-screen         /* Full screen height */
max-w-7xl mx-auto    /* Max width centered */
p-8                  /* Padding */
gap-6                /* Grid gap */
grid grid-cols-3     /* 3 column grid */
flex items-center    /* Flex center */
```

### Cards
```css
bg-white rounded-2xl shadow-md p-6
bg-gradient-to-br from-blue-500 to-blue-600
border-l-8 border-blue-500
```

### Text
```css
text-3xl font-bold          /* Headers */
text-lg font-semibold       /* Subheaders */
text-base text-gray-700     /* Body */
text-sm text-gray-500       /* Small */
uppercase tracking-wider    /* Labels */
```

### Colors
```css
text-blue-600    bg-blue-100    /* Blue */
text-green-600   bg-green-100   /* Green */
text-red-600     bg-red-100     /* Red */
text-yellow-600  bg-yellow-100  /* Yellow */
text-purple-600  bg-purple-100  /* Purple */
text-gray-600    bg-gray-100    /* Gray */
```

### Hover & Transitions
```css
hover:bg-blue-50
hover:scale-105
transition-all duration-200
cursor-pointer
```

---

## 🔄 Common Patterns

### Page State Setup
```javascript
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [showModal, setShowModal] = useState(false);
const [editingItem, setEditingItem] = useState(null);
const [formData, setFormData] = useState({
  name: '',
  description: '',
  is_active: true
});
```

### Fetch Data Pattern
```javascript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('table')
      .select('*');
    if (error) throw error;
    setItems(data || []);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    setLoading(false);
  }
};
```

### Form Submit Pattern
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (editingItem) {
      // Update
      const { error } = await supabase
        .from('table')
        .update(formData)
        .eq('id', editingItem.id);
      if (error) throw error;
    } else {
      // Create
      const { error } = await supabase
        .from('table')
        .insert([formData]);
      if (error) throw error;
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
    await fetchData();
  } catch (err) {
    alert('Error: ' + err.message);
  }
};
```

### Delete Pattern
```javascript
const handleDelete = async (item) => {
  if (!confirm(`Delete "${item.name}"?`)) return;
  
  try {
    const { error } = await supabase
      .from('table')
      .delete()
      .eq('id', item.id);
    if (error) throw error;
    await fetchData();
  } catch (err) {
    alert('Error: ' + err.message);
  }
};
```

### Edit Pattern
```javascript
const handleEdit = (item) => {
  setEditingItem(item);
  setFormData({
    name: item.name,
    description: item.description,
    is_active: item.is_active
  });
  setShowModal(true);
};
```

### Search Filter Pattern
```javascript
const filteredItems = items.filter(item =>
  item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.description?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### DataTable Columns Pattern
```javascript
const columns = [
  {
    header: 'Name',
    accessor: 'name',
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold">{row.name}</p>
          <p className="text-sm text-gray-500">{row.description}</p>
        </div>
      </div>
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
```

---

## 🎨 Color Reference

```javascript
Primary Blue:   #3B82F6  // Users, primary actions
Purple:         #9333EA  // Subscriptions, premium
Orange:         #EA580C  // Workouts, activity
Green:          #16A34A  // Success states
Red:            #EF4444  // Errors, deletes
Yellow:         #EAB308  // Badges, warnings
```

---

## 🐛 Debug Checklist

```javascript
// 1. Console log data
console.log('Data:', data);
console.log('Error:', error);

// 2. Check Supabase response
const { data, error } = await supabase.from('table').select('*');
console.log({ data, error });

// 3. Verify state
console.log('State:', { items, loading, searchTerm });

// 4. Check environment
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

---

## ⚡ Performance Tips

```javascript
// Memoize filtered data
const filtered = useMemo(() => 
  items.filter(i => i.name.includes(search)),
  [items, search]
);

// Debounce search
const debouncedSearch = useDebounce(searchTerm, 300);

// Prevent unnecessary renders
const MemoizedComponent = React.memo(Component);
```

---

## 📁 File Locations

```
Components:  src/components/common/
Pages:       src/pages/
Supabase:    src/lib/supabase.js
Styles:      src/index.css
Config:      tailwind.config.js
```

---

## 🚨 Common Errors

**Error:** Cannot read property of undefined
```javascript
// Fix: Add optional chaining
item.name        → item?.name
item.user.email  → item?.user?.email
```

**Error:** Network request failed
```javascript
// Fix: Check .env variables and Supabase connection
```

**Error:** RLS policy violation
```javascript
// Fix: Check Supabase RLS policies for the table
```

---

## 📞 Quick Help

- **Documentation:** Check REDESIGN_COMPLETE.md
- **Components:** Check COMPONENT_GUIDE.md
- **Testing:** Check TESTING_CHECKLIST.md
- **Setup:** Check DEVELOPER_GUIDE.md

---

**Print this page and keep it handy!** 📋

**Version 1.0 | Last Updated: Oct 9, 2025**
