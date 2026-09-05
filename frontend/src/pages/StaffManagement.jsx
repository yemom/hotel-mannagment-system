import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_STAFF = [
  {
    id: 1,
    name: 'Yemom Admin',
    email: '12yemom@gmail.com',
    phone: '+251 934 046 279',
    role: 'Super Admin / General Manager',
    department: 'Management',
    shift: 'All Shifts',
    accessLevel: 'Super Admin',
    status: 'ACTIVE',
    createdAt: '2026-09-01',
  },
  {
    id: 2,
    name: 'Elena Vance',
    email: 'receptionist@hotel.com',
    phone: '+251 911 234 567',
    role: 'Front Desk Lead',
    department: 'Front Desk',
    shift: 'Morning (07:00 - 15:00)',
    accessLevel: 'Staff',
    status: 'ACTIVE',
    createdAt: '2026-09-02',
  },
  {
    id: 3,
    name: 'Marcus Chen',
    email: 'night.auditor@hotel.com',
    phone: '+251 922 345 678',
    role: 'Night Auditor',
    department: 'Front Desk',
    shift: 'Night (23:00 - 07:00)',
    accessLevel: 'Staff',
    status: 'ACTIVE',
    createdAt: '2026-09-02',
  },
  {
    id: 4,
    name: 'Sarah Jenkins',
    email: 'sarah.j@hotel.com',
    phone: '+251 933 456 789',
    role: 'Guest Relations & F&B Manager',
    department: 'Food & Beverage',
    shift: 'Evening (15:00 - 23:00)',
    accessLevel: 'Admin',
    status: 'ACTIVE',
    createdAt: '2026-09-03',
  },
];

const DEPARTMENTS = [
  'Front Desk',
  'Management',
  'Food & Beverage',
  'Housekeeping',
  'Concierge & Guest Relations',
  'Maintenance & Security',
];

const SHIFTS = [
  'Morning (07:00 - 15:00)',
  'Evening (15:00 - 23:00)',
  'Night (23:00 - 07:00)',
  'All Shifts / Rotating',
];

const StaffManagement = () => {
  const { currentUser } = useAuth();

  const [staffList, setStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('hotel_staff_members');
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
    } catch {
      return INITIAL_STAFF;
    }
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [alertNotice, setAlertNotice] = useState(null);

  // New staff form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Front Desk Receptionist',
    department: 'Front Desk',
    shift: 'Morning (07:00 - 15:00)',
    accessLevel: 'Staff',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hotel_staff_members', JSON.stringify(staffList));
    } catch (e) {
      console.error('Failed to sync staff list', e);
    }
  }, [staffList]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: res }));
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.name.trim() || !formData.email.trim()) {
      setAlertNotice({ type: 'error', message: 'Name and email are required.' });
      setSubmitting(false);
      return;
    }

    // Check duplicate email
    if (staffList.some((s) => s.email.toLowerCase() === formData.email.trim().toLowerCase())) {
      setAlertNotice({ type: 'error', message: 'A staff member with this email already exists.' });
      setSubmitting(false);
      return;
    }

    const newStaff = {
      id: Date.now(),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || '+251 900 000 000',
      role: formData.role,
      department: formData.department,
      shift: formData.shift,
      accessLevel: formData.accessLevel,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      initialPassword: formData.password || '12345678',
    };

    setStaffList((prev) => [newStaff, ...prev]);
    setShowCreateModal(false);
    setSubmitting(false);

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Front Desk Receptionist',
      department: 'Front Desk',
      shift: 'Morning (07:00 - 15:00)',
      accessLevel: 'Staff',
      password: '',
    });

    setAlertNotice({
      type: 'success',
      message: `Staff member ${newStaff.name} created successfully with email ${newStaff.email}!`,
    });
    setTimeout(() => setAlertNotice(null), 5000);
  };

  const toggleStatus = (id) => {
    const staff = staffList.find((s) => s.id === id);
    if (staff && staff.email === '12yemom@gmail.com') {
      alert('Cannot suspend the primary Super Admin account.');
      return;
    }

    setStaffList((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : s
      )
    );
  };

  const removeStaff = (id) => {
    const staff = staffList.find((s) => s.id === id);
    if (staff && staff.email === '12yemom@gmail.com') {
      alert('Cannot delete the primary Super Admin account.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove staff member ${staff?.name}?`)) {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setAlertNotice({ type: 'info', message: `${staff?.name} has been removed from staff.` });
      setTimeout(() => setAlertNotice(null), 4000);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || s.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="staff-management-page">
      {/* ─── Page Header ─── */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ color: '#065f46' }}>Staff Administration</span>
          <h1>Staff Team &amp; Account Provisioning</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Create and manage hotel staff accounts, shifts, roles, and front-desk access credentials.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Create New Staff</span>
        </button>
      </div>

      {/* Notice Toast */}
      {alertNotice && (
        <div
          className={`auth-alert auth-alert-${alertNotice.type === 'error' ? 'error' : 'success'}`}
          style={{ marginBottom: '20px' }}
        >
          <span className="material-symbols-outlined">
            {alertNotice.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{alertNotice.message}</span>
        </div>
      )}

      {/* ─── Main Content Grid: Vertical Stats on Left, Roster on Right ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Vertical Metric Cards Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #065f46',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#ecfdf5',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>badge</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Staff
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {staffList.length}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Provisioned Accounts</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #10b981',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>verified_user</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active on Duty
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', lineHeight: 1.2 }}>
                {staffList.filter((s) => s.status === 'ACTIVE').length}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Authorized &amp; Active</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #d97706',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>admin_panel_settings</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Administrators
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', lineHeight: 1.2 }}>
                {staffList.filter((s) => s.accessLevel?.includes('Admin')).length}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Super Admin &amp; Managers</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #7c3aed',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#f3e8ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>schedule</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Morning Shift
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed', lineHeight: 1.2 }}>
                {staffList.filter((s) => s.shift?.includes('Morning')).length}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>07:00 – 15:00 Shift</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #0284c7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>dark_mode</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Evening / Night
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', lineHeight: 1.2 }}>
                {staffList.filter((s) => s.shift?.includes('Evening') || s.shift?.includes('Night')).length}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Later Rotations</span>
            </div>
          </div>
        </div>

        {/* Right Area: Search, Filters, and Staff Table */}
        <div>
          {/* ─── Search and Filters Bar ─── */}
          <div className="table-controls-card" style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-with-icon" style={{ flex: 1, minWidth: '240px' }}>
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Department:</label>
              <select
                className="field"
                style={{ padding: '8px 12px', minWidth: '180px' }}
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── Staff Roster Table ─── */}
          <div className="table-wrap" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table className="table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Department &amp; Role</th>
              <th>Shift Schedule</th>
              <th>Access Level</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  No staff members match the selected filter.
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => (
                <tr key={staff.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: staff.accessLevel.includes('Admin') ? '#065f46' : '#1e293b',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        {staff.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: '#0f172a' }}>{staff.name}</strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{staff.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong style={{ display: 'block', color: '#334155' }}>{staff.role}</strong>
                      <span className="tag-badge" style={{ marginTop: '3px' }}>{staff.department}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                      {staff.shift}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: staff.accessLevel.includes('Admin') ? '#ecfdf5' : '#f1f5f9',
                        color: staff.accessLevel.includes('Admin') ? '#065f46' : '#475569',
                      }}
                    >
                      {staff.accessLevel}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        staff.status === 'ACTIVE' ? 'status-green' : 'status-gray'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{staff.createdAt}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="action-btn action-btn-warning"
                        onClick={() => toggleStatus(staff.id)}
                        title={staff.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                      >
                        {staff.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                      {staff.email !== '12yemom@gmail.com' && (
                        <button
                          type="button"
                          className="action-btn action-btn-danger"
                          onClick={() => removeStaff(staff.id)}
                          title="Remove Staff Member"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

      {/* ─── Create Staff Modal ─── */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <span className="eyebrow" style={{ color: '#065f46' }}>Internal Provisioning</span>
                <h3>Create New Staff Member</h3>
                <p className="modal-subtitle">Provision front-desk, management, or dining staff accounts</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined">person</span>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Samuel Bekele"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Staff Email</label>
                  <div className="input-with-icon">
                    <span className="material-symbols-outlined">mail</span>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="samuel.b@hotel.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <div className="input-with-icon">
                    <span className="material-symbols-outlined">phone</span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+251 911 000 000"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Department</label>
                  <select
                    className="field"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Specific Role / Title</label>
                  <input
                    type="text"
                    className="field"
                    name="role"
                    required
                    placeholder="e.g. Senior Receptionist"
                    value={formData.role}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Shift Schedule</label>
                  <select
                    className="field"
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Access Permissions</label>
                  <select
                    className="field"
                    name="accessLevel"
                    value={formData.accessLevel}
                    onChange={handleInputChange}
                  >
                    <option value="Staff">Staff (Terminal &amp; Bookings)</option>
                    <option value="Admin">Admin (Full Operational Control)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>Initial Temporary Password</label>
                  <button
                    type="button"
                    className="link-button"
                    onClick={generateRandomPassword}
                    style={{ fontSize: '12px' }}
                  >
                    Auto-Generate Password
                  </button>
                </div>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">check</span>
                      <span>Create Staff Member</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
