import React, { useState, useEffect, useContext, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Users, User, Lock, Mail, Phone, MapPin, Calendar, DollarSign, LogOut, Plus, Search, Filter,
  Trash2, Edit, Download, Eye, Activity, FileText, CheckCircle, Sun, Moon, Upload, Printer,
  Briefcase, TrendingUp, Folder, ArrowUpRight, Shield, RefreshCw, AlertTriangle
} from 'lucide-react';

import { AuthContext, AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import * as api from './api/employeeApi';

// ==========================================
// THEME COMPONENT / CUSTOM HOOK
// ==========================================
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div style={{ display: 'contents' }}>
      {children}
    </div>
  );
};

// ==========================================
// ROUTE GUARDS
// ==========================================
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="content-body text-center p-8">Loading application...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="content-body text-center p-8">Loading application...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    toast.error('Access denied. Administrator privileges required.');
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// ==========================================
// CORE LAYOUT
// ==========================================
const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (nextDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <Users size={28} className="text-white" />
            <span>EMS Portal</span>
          </div>
          <nav className="sidebar-menu">
            <div className="sidebar-item">
              <Link to="/dashboard">
                <TrendingUp size={20} />
                <span>Dashboard</span>
              </Link>
            </div>
            <div className="sidebar-item">
              <Link to="/employees">
                <Users size={20} />
                <span>Employees</span>
              </Link>
            </div>
            {isAdmin && (
              <>
                <div className="sidebar-item">
                  <Link to="/employees/new">
                    <Plus size={20} />
                    <span>Add Employee</span>
                  </Link>
                </div>
                <div className="sidebar-item">
                  <Link to="/activity-logs">
                    <Activity size={20} />
                    <span>Audit Logs</span>
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{user?.name}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary btn-sm" style={{ width: '100%', background: 'transparent', color: '#f8fafc', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="navbar">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Employee Management</h2>
          </div>
          <div className="navbar-right">
            <button onClick={toggleTheme} className="theme-switch" aria-label="Toggle Theme">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }}></div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{user?.email}</span>
          </div>
        </header>
        <div className="content-body">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/new" element={<AdminRoute><EmployeeForm /></AdminRoute>} />
            <Route path="employees/:id/edit" element={<AdminRoute><EmployeeForm isEdit /></AdminRoute>} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="activity-logs" element={<AdminRoute><ActivityLogPage /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// ==========================================
// PAGES
// ==========================================

// --- LOGIN PAGE ---
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // Toast shown in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)', backgroundColor: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '16px' }}>
            <Shield size={28} />
          </div>
          <h2>Enterprise login</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your credentials to access system dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="form-control"
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                className="form-control"
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Need an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- REGISTER PAGE ---
const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.api.post('/api/auth/register', { name, email, password, role });
      toast.success('Registration successful. You can log in now.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2>Register Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Create an enterprise user account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User (Standard Access)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [advStats, setAdvStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const overviewRes = await api.getDashboardStats();
        const advancedRes = await api.getAdvancedStats();
        setStats(overviewRes.data.data);
        setAdvStats(advancedRes.data.data);
      } catch (err) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard statistics...</div>;

  // Prepare chart data
  const deptData = advStats?.deptStats?.map((d: any) => ({
    name: d._id,
    employees: d.count,
    avgSalary: Math.round(d.avgSalary),
  })) || [];

  const hireData = advStats?.monthlyHires?.map((m: any) => ({
    month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
    count: m.count,
  })) || [];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px' }}>Corporate analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Operational and structural insights of the organization</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Workforce</h3>
            <p>{stats?.totalEmployees || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Personnel</h3>
            <p>{stats?.activeEmployees || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h3>Avg Tenure</h3>
            <p>{advStats?.avgTenureMonths || 0} Months</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Salary Tracking</h3>
            <p>Active</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="card">
          <h3 className="card-title">Hiring Growth Trend (Last 12 Months)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <LineChart data={hireData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Workforce distribution by Department</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip />
                <Bar dataKey="employees" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Salary Benchmark analytics</h3>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgSalary" name="Average Salary ($)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- EMPLOYEE DIRECTORY (LIST & ACTIONS) ---
const EmployeeList = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Advanced search parameters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [dept, setDept] = useState(searchParams.get('department') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [empType, setEmpType] = useState(searchParams.get('employmentType') || '');
  const [minSal, setMinSal] = useState(searchParams.get('minSalary') || '');
  const [maxSal, setMaxSal] = useState(searchParams.get('maxSalary') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  const [loading, setLoading] = useState(true);
  const [bulkStatus, setBulkStatus] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (dept) params.departments = dept;
      if (status) params.statuses = status;
      if (empType) params.employmentTypes = empType;
      if (minSal) params.minSalary = minSal;
      if (maxSal) params.maxSalary = maxSal;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.advancedSearch(params);
      setEmployees(data.data.docs || []);
    } catch (err) {
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = {};
    if (search) params.search = search;
    if (dept) params.department = dept;
    if (status) params.status = status;
    if (empType) params.employmentType = empType;
    if (minSal) params.minSalary = minSal;
    if (maxSal) params.maxSalary = maxSal;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    setSearchParams(params);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(employees.map(emp => emp._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected employees?`)) return;
    try {
      await api.bulkDeleteEmployees(selectedIds);
      toast.success('Selected employees deleted successfully');
      setSelectedIds([]);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to perform bulk deletion');
    }
  };

  const handleBulkStatus = async (val: string) => {
    if (!val) return;
    try {
      await api.bulkStatusUpdate(selectedIds, val);
      toast.success(`Updated status to ${val} for ${selectedIds.length} employees`);
      setSelectedIds([]);
      setBulkStatus('');
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to update employee status');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.exportCsv();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees_directory.csv');
      document.body.appendChild(link);
      link.click();
      toast.success('CSV Export downloaded');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await api.exportPdf();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees_directory.pdf');
      document.body.appendChild(link);
      link.click();
      toast.success('PDF Export downloaded');
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Workforce directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage, filter, and export employee profiles</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button onClick={handleExportPDF} className="btn btn-secondary">
            <Download size={16} />
            <span>Export PDF</span>
          </button>
          {isAdmin && (
            <button onClick={() => navigate('/employees/new')} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" style={{ paddingLeft: '32px' }} placeholder="Name, Email, designation..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-control" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Design">Design</option>
              <option value="Legal">Legal</option>
            </select>
          </div>
          <div>
            <label className="form-label">Employment Type</label>
            <select className="form-control" value={empType} onChange={(e) => setEmpType(e.target.value)}>
              <option value="">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
          <div>
            <label className="form-label">Min Salary</label>
            <input type="number" className="form-control" value={minSal} onChange={(e) => setMinSal(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Max Salary</label>
            <input type="number" className="form-control" value={maxSal} onChange={(e) => setMaxSal(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Joining After</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Joining Before</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '120px' }}>
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        </form>
      </div>

      <div className="table-responsive">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading employee list...
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertTriangle size={48} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--warning)' }} />
            <p>No employee records found matching current criteria.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                {isAdmin && (
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" className="checkbox-custom" checked={selectedIds.length === employees.length && employees.length > 0} onChange={handleSelectAll} />
                  </th>
                )}
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>designation</th>
                <th>Type</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  {isAdmin && (
                    <td>
                      <input type="checkbox" className="checkbox-custom" checked={selectedIds.includes(emp._id)} onChange={(e) => handleSelectOne(emp._id, e.target.checked)} />
                    </td>
                  )}
                  <td style={{ fontWeight: '600' }}>{emp.employeeId}</td>
                  <td>{emp.firstName} {emp.lastName}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td>{emp.employmentType}</td>
                  <td style={{ fontWeight: '500' }}>${emp.salary?.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => navigate(`/employees/${emp._id}`)} className="btn btn-secondary btn-sm" title="View details">
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => navigate(`/employees/${emp._id}/edit`)} className="btn btn-secondary btn-sm" title="Edit">
                            <Edit size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk actions toolbar */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="bulk-toolbar animate__animated animate__slideInUp">
          <span style={{ fontWeight: '600', fontSize: '15px' }}>{selectedIds.length} Selected</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select className="form-control" style={{ width: '160px', padding: '6px 12px' }} value={bulkStatus} onChange={(e) => handleBulkStatus(e.target.value)}>
              <option value="">Update Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
            <button onClick={handleBulkDelete} className="btn btn-danger btn-sm">
              <Trash2 size={14} />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CREATE / EDIT FORM ---
const EmployeeForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Form Fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    employmentType: 'Full-Time',
    salary: '',
    joiningDate: '',
    status: 'Active',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    }
  });

  useEffect(() => {
    if (isEdit && id) {
      const fetchEmployee = async () => {
        try {
          const { data } = await api.getEmployeeById(id);
          const emp = data.data;
          setFormData({
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            email: emp.email || '',
            phone: emp.phone || '',
            department: emp.department || 'Engineering',
            designation: emp.designation || '',
            employmentType: emp.employmentType || 'Full-Time',
            salary: emp.salary || '',
            joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
            status: emp.status || 'Active',
            address: {
              street: emp.address?.street || '',
              city: emp.address?.city || '',
              state: emp.address?.state || '',
              pincode: emp.address?.pincode || '',
            }
          });
          if (emp.profilePhoto) {
            setPhotoPreview(emp.profilePhoto);
          }
        } catch (err) {
          toast.error('Failed to load employee details for editing');
        }
      };
      fetchEmployee();
    }
  }, [isEdit, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let createdEmpId = id;
      if (isEdit && id) {
        await api.api.put(`/api/employees/${id}`, formData);
        if (photoFile) {
          await api.uploadProfilePhoto(id, photoFile);
        }
        toast.success('Employee updated successfully');
      } else {
        const { data } = await api.api.post('/api/employees', formData);
        createdEmpId = data.data._id;
        if (photoFile && createdEmpId) {
          await api.uploadProfilePhoto(createdEmpId, photoFile);
        }
        toast.success('Employee created successfully');
      }
      navigate('/employees');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save employee records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1>{isEdit ? 'Modify Profile' : 'Add New Profile'}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Fill out key information details to maintain records</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          
          {/* Photo upload section */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--bg-app)', border: '2px dashed var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {photoPreview ? (
                <img src={photoPreview.startsWith('http') || photoPreview.startsWith('/uploads') ? photoPreview : photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile preview" />
              ) : (
                <User size={36} style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
            <div>
              <label className="form-label">Profile Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: '14px' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Supports PNG, JPG, JPEG (Max 2MB)</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">First Name</label>
            <input type="text" name="firstName" required className="form-control" value={formData.firstName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input type="text" name="lastName" required className="form-control" value={formData.lastName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" required className="form-control" value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="text" name="phone" required className="form-control" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select name="department" className="form-control" value={formData.department} onChange={handleChange}>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Design">Design</option>
              <option value="Legal">Legal</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">designation</label>
            <input type="text" name="designation" required className="form-control" value={formData.designation} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Employment Type</label>
            <select name="employmentType" className="form-control" value={formData.employmentType} onChange={handleChange}>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Salary ($)</label>
            <input type="number" name="salary" required className="form-control" value={formData.salary} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Joining Date</label>
            <input type="date" name="joiningDate" required className="form-control" value={formData.joiningDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Address Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Street</label>
                <input type="text" name="address.street" className="form-control" value={formData.address.street} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" name="address.city" className="form-control" value={formData.address.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input type="text" name="address.state" className="form-control" value={formData.address.state} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input type="text" name="address.pincode" className="form-control" value={formData.address.pincode} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button type="button" onClick={() => navigate('/employees')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- EMPLOYEE DETAIL PAGE (TABS & AUDITING) ---
const EmployeeDetail = () => {
  const { isAdmin } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Salary change form
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [newSalary, setNewSalary] = useState('');
  const [salaryReason, setSalaryReason] = useState('');
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);

  // Documents upload
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docsLoading, setDocsLoading] = useState(false);

  const fetchEmployeeDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.getEmployeeById(id);
      setEmployee(data.data);
      if (isAdmin) {
        const historyRes = await api.getSalaryHistory(id);
        setSalaryHistory(historyRes.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load employee profile detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.updateSalary(id, Number(newSalary), salaryReason);
      toast.success('Salary updated and audit recorded');
      setShowSalaryModal(false);
      setNewSalary('');
      setSalaryReason('');
      fetchEmployeeDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update salary');
    }
  };

  const handleDocUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !docFile) {
      toast.error('Please choose a document first');
      return;
    }
    setDocsLoading(true);
    try {
      await api.uploadDocument(id, docName, docFile);
      toast.success('Document uploaded successfully');
      setDocFile(null);
      setDocName('');
      fetchEmployeeDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Document upload failed');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDocDelete = async (docId: string) => {
    if (!id || !window.confirm('Delete this document?')) return;
    try {
      await api.deleteDocument(id, docId);
      toast.success('Document removed');
      fetchEmployeeDetails();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleSoftDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      await api.softDeleteEmployee(id);
      toast.success('Employee deactivated successfully');
      navigate('/employees');
    } catch (err) {
      toast.error('Failed to deactivate employee');
    }
  };

  const handlePermanentDelete = async () => {
    if (!id || !window.confirm('WARNING: Are you sure you want to permanently delete this employee from the database? This cannot be undone.')) return;
    try {
      await api.permanentDeleteEmployee(id);
      toast.success('Employee permanently deleted');
      navigate('/employees');
    } catch (err) {
      toast.error('Failed to permanently delete employee');
    }
  };

  if (loading) return <div>Loading employee details...</div>;
  if (!employee) return <div>Employee not found.</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{employee.firstName} {employee.lastName}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{employee.designation} &bull; {employee.department}</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate(`/employees/${employee._id}/edit`)} className="btn btn-secondary">
              <Edit size={16} />
              <span>Edit Profile</span>
            </button>
            <button onClick={handleSoftDelete} className="btn btn-secondary" style={{ color: 'var(--warning)' }}>
              Deactivate
            </button>
            <button onClick={handlePermanentDelete} className="btn btn-danger">
              <Trash2 size={16} />
              <span>Delete Permanently</span>
            </button>
          </div>
        )}
      </div>

      <div className="tabs-container">
        <button onClick={() => setActiveTab('profile')} className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}>Profile Details</button>
        {isAdmin && (
          <button onClick={() => setActiveTab('salary')} className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`}>Salary History</button>
        )}
        <button onClick={() => setActiveTab('documents')} className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}>Documents</button>
        <button onClick={() => setActiveTab('idcard')} className={`tab-btn ${activeTab === 'idcard' ? 'active' : ''}`}>Corporate ID Card</button>
      </div>

      <div className="tab-content">
        {/* --- TAB: PROFILE --- */}
        {activeTab === 'profile' && (
          <div className="employee-profile-layout">
            <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ width: '130px', height: '130px', borderRadius: '50%', backgroundColor: 'var(--bg-app)', border: '4px solid var(--border)', overflow: 'hidden', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {employee.profilePhoto ? (
                  <img src={employee.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <User size={60} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600' }}>{employee.firstName} {employee.lastName}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>{employee.employeeId}</p>
              <span className={`badge badge-${employee.status === 'Active' ? 'success' : employee.status === 'On Leave' ? 'warning' : 'danger'}`} style={{ marginBottom: '24px' }}>
                {employee.status}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <Mail size={16} className="text-muted" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{employee.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <Phone size={16} className="text-muted" />
                  <span>{employee.phone}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Professional Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Department</p>
                  <p style={{ fontWeight: '600', fontSize: '16px', marginTop: '4px' }}>{employee.department}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Designation</p>
                  <p style={{ fontWeight: '600', fontSize: '16px', marginTop: '4px' }}>{employee.designation}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Employment Type</p>
                  <p style={{ fontWeight: '600', fontSize: '16px', marginTop: '4px' }}>{employee.employmentType}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Joining Date</p>
                  <p style={{ fontWeight: '600', fontSize: '16px', marginTop: '4px' }}>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Base Salary</p>
                  <p style={{ fontWeight: '600', fontSize: '16px', marginTop: '4px' }}>${employee.salary?.toLocaleString()}</p>
                </div>
              </div>

              <h3 className="card-title" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>Address & Location</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Street</p>
                  <p style={{ fontWeight: '500', fontSize: '16px', marginTop: '4px' }}>{employee.address?.street || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>City</p>
                  <p style={{ fontWeight: '500', fontSize: '16px', marginTop: '4px' }}>{employee.address?.city || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>State</p>
                  <p style={{ fontWeight: '500', fontSize: '16px', marginTop: '4px' }}>{employee.address?.state || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Pincode</p>
                  <p style={{ fontWeight: '500', fontSize: '16px', marginTop: '4px' }}>{employee.address?.pincode || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: SALARY HISTORY --- */}
        {activeTab === 'salary' && isAdmin && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Salary progression logs</h3>
              <button onClick={() => setShowSalaryModal(true)} className="btn btn-primary btn-sm">
                <DollarSign size={14} />
                <span>Adjust Salary</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Previous Salary</th>
                      <th>New Salary</th>
                      <th>Change</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryHistory.map((hist) => {
                      const diff = hist.newSalary - hist.previousSalary;
                      const percent = hist.previousSalary > 0 ? ((diff / hist.previousSalary) * 100).toFixed(1) : '100';
                      return (
                        <tr key={hist._id}>
                          <td>{new Date(hist.changedAt).toLocaleDateString()}</td>
                          <td>${hist.previousSalary.toLocaleString()}</td>
                          <td style={{ fontWeight: '600' }}>${hist.newSalary.toLocaleString()}</td>
                          <td style={{ color: diff >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                            {diff >= 0 ? '+' : ''}{percent}%
                          </td>
                          <td>{hist.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ marginBottom: '16px' }}>Progression Chart</h4>
                <div style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer>
                    <LineChart data={[...salaryHistory].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="changedAt" tickFormatter={(t) => new Date(t).toLocaleDateString()} stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip formatter={(value) => [`$${value}`, 'Salary']} />
                      <Line type="monotone" dataKey="newSalary" stroke="var(--primary)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: DOCUMENTS --- */}
        {activeTab === 'documents' && (
          <div className="card">
            <h3 className="card-title">Employee Document vaults</h3>
            {isAdmin && (
              <form onSubmit={handleDocUploadSubmit} className="card" style={{ backgroundColor: 'var(--bg-app)', borderStyle: 'dashed', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px' }}>Upload New Document</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Document Name</label>
                    <input type="text" className="form-control" required value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Contract, Certificate" />
                  </div>
                  <div>
                    <label className="form-label">Select File</label>
                    <input type="file" className="form-control" required onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
                  </div>
                  <button type="submit" disabled={docsLoading} className="btn btn-primary" style={{ height: '42px' }}>
                    <Upload size={16} />
                    <span>Upload</span>
                  </button>
                </div>
              </form>
            )}

            <div className="table-responsive">
              {employee.documents?.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Folder size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p>No documents uploaded yet.</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Uploaded At</th>
                      <th>File Size</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.documents?.map((doc: any) => (
                      <tr key={doc._id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: 'none' }}>
                          <FileText size={18} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontWeight: '500' }}>{doc.name}</span>
                        </td>
                        <td>{new Date(doc.uploadedAt).toLocaleString()}</td>
                        <td>N/A</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" title="Download">
                              <Download size={14} />
                            </a>
                            {isAdmin && (
                              <button onClick={() => handleDocDelete(doc._id)} className="btn btn-danger btn-sm" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: ID CARD --- */}
        {activeTab === 'idcard' && (
          <div className="card id-card-view">
            <div className="id-card-container">
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>ENTERPRISE CORP</span>
                <span style={{ fontSize: '12px', color: 'var(--accent)' }}>EMS PORTAL</span>
              </div>

              <div style={{ margin: '20px 0' }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', border: '4px solid #fff', overflow: 'hidden', margin: '0 auto 12px' }}>
                  {employee.profilePhoto ? (
                    <img src={employee.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  ) : (
                    <User size={50} style={{ color: '#fff', margin: '20px auto', display: 'block' }} />
                  )}
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{employee.firstName} {employee.lastName}</h4>
                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>{employee.designation}</p>
              </div>

              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 0' }}>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>EMPLOYEE ID</span>
                  <p style={{ fontWeight: 'bold', color: '#fff' }}>{employee.employeeId}</p>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>DEPARTMENT</span>
                  <p style={{ fontWeight: 'bold', color: '#fff' }}>{employee.department}</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#fff', padding: '4px', borderRadius: '4px' }}>
                  {/* Visual placeholder for QR code */}
                  <div style={{ width: '100%', height: '100%', border: '2px solid #000', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '2px', left: '2px', width: '10px', height: '10px', backgroundColor: '#000' }}></div>
                    <div style={{ position: 'absolute', top: '2px', right: '2px', width: '10px', height: '10px', backgroundColor: '#000' }}></div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '2px', width: '10px', height: '10px', backgroundColor: '#000' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handlePrintCard} className="btn btn-secondary" style={{ marginTop: '24px' }}>
              <Printer size={16} />
              <span>Print Badge</span>
            </button>
          </div>
        )}
      </div>

      {/* Salary history editing Modal */}
      {showSalaryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Adjust employee Salary</h3>
              <button onClick={() => setShowSalaryModal(false)} className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'none', fontSize: '20px' }}>&times;</button>
            </div>
            <form onSubmit={handleSalarySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Current Salary</label>
                  <input type="text" disabled className="form-control" value={`$${employee.salary?.toLocaleString()}`} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Salary ($)</label>
                  <input type="number" required className="form-control" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} placeholder="e.g. 85000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Modification</label>
                  <input type="text" required className="form-control" value={salaryReason} onChange={(e) => setSalaryReason(e.target.value)} placeholder="e.g. Performance promotion" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowSalaryModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Salary</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- AUDIT ACTIVITY LOGS PAGE ---
const ActivityLogPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.getActivityLogs({
        page,
        limit: 15,
        action: actionFilter || undefined
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load system activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  // Handle auto-refresh every 30 seconds
  useEffect(() => {
    let timer: any;
    if (autoRefresh) {
      timer = setInterval(() => {
        fetchLogs();
      }, 30000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRefresh, page, actionFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>System Audit trail</h1>
          <p style={{ color: 'var(--text-muted)' }}>Chronological record of activities performed in the application</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span>Auto Refresh (30s)</span>
          </label>
          <button onClick={fetchLogs} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Filter Action Type:</span>
        <select className="form-control" style={{ width: '200px' }} value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="CREATED">CREATED</option>
          <option value="UPDATED">UPDATED</option>
          <option value="DELETED">DELETED</option>
          <option value="VIEWED">VIEWED</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
        </select>
      </div>

      <div className="table-responsive">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No logs matched selection.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Employee Ref</th>
                <th>Description</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${
                      log.action === 'CREATED' ? 'success' :
                      log.action === 'DELETED' ? 'danger' :
                      log.action === 'UPDATED' ? 'info' : 'warning'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {log.performedBy ? `${log.performedBy.firstName || ''} ${log.performedBy.lastName || ''}` : 'System / Guest'}
                  </td>
                  <td>
                    {log.targetEmployee ? (
                      <Link to={`/employees/${log.targetEmployee._id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                        {log.targetEmployee.employeeId}
                      </Link>
                    ) : 'N/A'}
                  </td>
                  <td>{log.description}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Logs: {total}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">Prev</button>
          <button disabled={page * 15 >= total} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">Next</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CORE APP ENTRY COMPONENT
// ==========================================
const App = () => {
  return (
    <ThemeProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
