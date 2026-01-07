import React, { useState, useEffect } from 'react';

const App = () => {
  const [page, setPage] = useState('welcome');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Load data from localStorage
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('laundry_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('laundry_members');
    return saved ? JSON.parse(saved) : [];
  });

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // Shared filter states (for Riwayat)
  const [filterType, setFilterType] = useState('all'); // all | date-range | month
  const [filterStartDate, setFilterStartDate] = useState(''); // YYYY-MM-DD
  const [filterEndDate, setFilterEndDate] = useState(''); // YYYY-MM-DD
  const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM

  // Dashboard-specific filter states (independent)
  const [dashFilterType, setDashFilterType] = useState('all'); // all | date-range | month
  const [dashStartDate, setDashStartDate] = useState('');
  const [dashEndDate, setDashEndDate] = useState('');
  const [dashMonth, setDashMonth] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    weight: '',
    pricePerKg: '',
    laundryType: 'biasa',
    isMember: false
  });

  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // State to keep print-only struk in DOM
  const [showPrintStruk, setShowPrintStruk] = useState(false);

  // Inject CSS for print-only and UI tweaks
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'app-print-styles';
    style.innerHTML = `
      .print-only { display: none; }

      .struk-container {
        font-family: Arial, sans-serif;
        width: 320px;
        padding: 10px;
        margin: 0;
        background: white;
        color: black;
        box-sizing: border-box;
      }
      .struk-header { text-align: center; margin-bottom: 8px; }
      .struk-title { font-weight: bold; font-size: 18px; }
      .struk-subtitle { font-size: 12px; color: #333; }
      .struk-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
      .struk-total { border-top: 1px dashed #333; margin-top: 8px; padding-top: 8px; font-weight: bold; }

      @media print {
        body * { visibility: hidden !important; }
        .print-only, .print-only * { visibility: visible !important; }
        .print-only { display: block !important; position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
      }

      .chart-card { box-sizing: border-box; padding: 12px; border-radius: 8px; background: #fff; margin-bottom: 16px; }
      .chart-title { margin: 0 0 8px 0; font-size: 16px; }
      .dashboard-stats { display:flex; gap:12px; flex-wrap:wrap; }
      .stat-card { flex: 1 1 200px; padding:12px; border-radius:8px; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
      .combo-chart-container { display:flex; gap:12px; align-items:flex-end; min-height:120px; overflow:auto; }
      .bar-group { display:flex; flex-direction:column; align-items:center; margin:0 6px; width:70px; }
      .combo-bar { width:100%; background:#3b82f6; border-radius:6px 6px 0 0; display:flex; align-items:flex-end; justify-content:center; color:#fff; font-size:12px; }
      .chart-bars-area { display:flex; align-items:flex-end; gap:8px; }
      .chart-label { font-size:13px; margin-bottom:8px; }

      .table-container { overflow:auto; max-width:100%; }
      table.data-table { width:100%; border-collapse:collapse; }
      table.data-table th, table.data-table td { padding:8px 10px; border-bottom:1px solid #eee; text-align:left; white-space:nowrap; }
      .filter-box input, .filter-box select { padding:6px; }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('app-print-styles');
      if (el) el.remove();
    };
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('laundry_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('laundry_members', JSON.stringify(members));
  }, [members]);

  // Utilities
  const parseIndoDate = (dateStr) => {
    if (!dateStr) return new Date(NaN);
    const m = String(dateStr).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      const yyyy = m[3];
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    }
    const d = new Date(dateStr);
    return d;
  };

  const formatTransactionDate = (dateStr) => {
    const d = parseIndoDate(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeMatch = String(dateStr).match(/(\d{1,2}[:.]\d{2}[:.]?\d{0,2})/);
    let timePart = '';
    if (timeMatch) {
      timePart = timeMatch[1].replace(/\./g, ':');
    } else {
      const hhmm = new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (hhmm && hhmm !== 'Invalid Date') timePart = hhmm;
    }
    return timePart ? `${datePart}, ${timePart}` : datePart;
  };

  const generateCustomerId = () => {
    const lastId = transactions.length > 0
      ? parseInt(String(transactions[transactions.length - 1].customerId || '').replace(/\D/g, '') || '0')
      : 0;
    return `cust${String(lastId + 1).padStart(3, '0')}`;
  };

  const generateMemberId = () => {
    const lastId = members.length > 0
      ? parseInt(String(members[members.length - 1].memberId || '').replace(/\D/g, '') || '0')
      : 0;
    return `MBR${String(lastId + 1).padStart(3, '0')}`;
  };

  const calculateTotal = () => {
    const weight = parseFloat(formData.weight) || 0;
    const price = parseFloat(formData.pricePerKg) || 0;
    const extraCharge = formData.laundryType === 'setrika' ? (2000 * weight) : 0;
    return (weight * price) + extraCharge;
  };

  const calculateTotalRevenue = (list = transactions) => {
    return (list || []).reduce((sum, t) => sum + (t.total || 0), 0);
  };

  // ---------------------------
  // FIXED getFilteredTransactions
  // ---------------------------
  const getFilteredTransactions = () => {
    if (!transactions || transactions.length === 0) return [];

    return transactions.filter(t => {
      if (!t.date) return true;

      const txDate = parseIndoDate(t.date);
      if (isNaN(txDate.getTime())) return false;

      // If filtering by month
      if (filterType === 'month') {
        if (!filterMonth) return true; // no month selected => don't filter out
        const [y, m] = filterMonth.split('-'); // YYYY-MM
        const txY = txDate.getFullYear();
        const txM = String(txDate.getMonth() + 1).padStart(2, '0');
        return String(txY) === y && txM === m;
      }

      // If filtering by date-range
      if (filterType === 'date-range') {
        // If both empty -> do not filter
        if (!filterStartDate && !filterEndDate) return true;

        const start = filterStartDate ? new Date(filterStartDate + 'T00:00:00') : null;
        const end = filterEndDate ? new Date(filterEndDate + 'T23:59:59.999') : null;

        if (start && end) return txDate >= start && txDate <= end;
        if (start && !end) return txDate >= start;
        if (!start && end) return txDate <= end;
        return true;
      }

      // default (all)
      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Filtering for Dashboard (independent)
  const getDashboardFilteredTransactions = () => {
    if (!transactions || transactions.length === 0) return [];

    return transactions.filter(t => {
      if (!t.date) return true;

      const txDate = parseIndoDate(t.date);
      if (isNaN(txDate.getTime())) return false;

      if (dashFilterType === 'month') {
        if (!dashMonth) return true;
        const [y, m] = dashMonth.split('-');
        const txY = txDate.getFullYear();
        const txM = String(txDate.getMonth() + 1).padStart(2, '0');
        return String(txY) === y && txM === m;
      }

      if (dashFilterType === 'date-range') {
        if (!dashStartDate && !dashEndDate) return true;
        const start = dashStartDate ? new Date(dashStartDate + 'T00:00:00') : null;
        const end = dashEndDate ? new Date(dashEndDate + 'T23:59:59.999') : null;
        if (start && end) return txDate >= start && txDate <= end;
        if (start && !end) return txDate >= start;
        if (!start && end) return txDate <= end;
        return true;
      }

      return true;
    });
  };

  const dashboardFilteredTransactions = getDashboardFilteredTransactions();

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMemberFormChange = (e) => {
    const { name, value } = e.target;
    setMemberForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMember = () => {
    if (!memberForm.name || !memberForm.phone) {
      alert('Mohon lengkapi nama dan nomor telepon!');
      return;
    }
    const newMember = {
      id: Date.now(),
      memberId: generateMemberId(),
      name: memberForm.name,
      phone: memberForm.phone,
      address: memberForm.address,
      joinDate: new Date().toLocaleDateString('id-ID')
    };
    setMembers(prev => [...prev, newMember]);
    setMemberForm({ name: '', phone: '', address: '' });
    setShowMemberModal(false);
    alert('Member berhasil didaftarkan!');
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setFormData(prev => ({ ...prev, name: member.name, isMember: true }));
    setShowMemberModal(false);
  };

  const handleCreateTransaction = () => {
    if (!formData.name || !formData.weight || !formData.pricePerKg) {
      alert('Mohon lengkapi semua data!');
      return;
    }
    const newTransaction = {
      id: Date.now(),
      customerId: generateCustomerId(),
      name: formData.name,
      memberId: selectedMember ? selectedMember.memberId : null,
      weight: parseFloat(formData.weight),
      pricePerKg: parseFloat(formData.pricePerKg),
      laundryType: formData.laundryType,
      total: calculateTotal(),
      isMember: formData.isMember,
      date: new Date().toLocaleString('id-ID')
    };
    setCurrentTransaction(newTransaction);
    setShowPayment(true);
  };

  const handlePayment = (method) => {
    setPaymentMethod(method);
    const tx = { ...currentTransaction, paymentMethod: method, id: currentTransaction?.id || Date.now() };
    setTransactions(prev => [...prev, tx]);
    setCurrentTransaction(tx);
    setShowPayment(false);
    setShowSuccess(true);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      name: '',
      weight: '',
      pricePerKg: '',
      laundryType: 'biasa',
      isMember: false
    });
    setCurrentTransaction(null);
    setShowPayment(false);
    setShowSuccess(false);
    setPaymentMethod('');
    setSelectedMember(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormData({
      customerId: transaction.customerId,
      name: transaction.name,
      weight: transaction.weight,
      pricePerKg: transaction.pricePerKg,
      laundryType: transaction.laundryType,
      isMember: transaction.isMember
    });
    setPage('transaction');
  };

  const handleUpdateTransaction = () => {
    if (!formData.name || !formData.weight || !formData.pricePerKg) {
      alert('Mohon lengkapi semua data!');
      return;
    }
    const updatedTransaction = {
      ...transactions.find(t => t.id === editingId),
      name: formData.name,
      weight: parseFloat(formData.weight),
      pricePerKg: parseFloat(formData.pricePerKg),
      laundryType: formData.laundryType,
      total: calculateTotal(),
      date: new Date().toLocaleDateString('id-ID')
    };
    setTransactions(prev => prev.map(t => t.id === editingId ? updatedTransaction : t));
    setEditingId(null);
    resetForm();
    setPage('history');
  };

  // Print Struk
  const handlePrint = () => {
    setShowPrintStruk(true);
    setTimeout(() => {
      window.print();
      setShowPrintStruk(false);
    }, 250);
  };

  // Chart helpers
  const getChartData = (data) => {
    const paymentData = {};
    const serviceData = { 'Cuci Biasa': 0, 'Cuci + Setrika': 0 };
    const monthlyData = {};
    (data || []).forEach(t => {
      if (!t) return;
      paymentData[t.paymentMethod] = (paymentData[t.paymentMethod] || 0) + (t.total || 0);
      if (t.laundryType === 'setrika') {
        serviceData['Cuci + Setrika'] += (t.total || 0);
      } else {
        serviceData['Cuci Biasa'] += (t.total || 0);
      }
      const d = parseIndoDate(t.date);
      if (isNaN(d.getTime())) return;
      const monthYear = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      if (!monthlyData[monthYear]) monthlyData[monthYear] = { revenue: 0, count: 0 };
      monthlyData[monthYear].revenue += (t.total || 0);
      monthlyData[monthYear].count += 1;
    });
    return { paymentData, serviceData, monthlyData };
  };

  const getMaxValue = (data) => {
    const values = Object.values(data || {});
    return values.length > 0 ? Math.max(...values) : 0;
  };

  const handleClearAllData = () => {
    if (window.confirm('⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data (transaksi dan member)? Tindakan ini tidak dapat dibatalkan!')) {
      if (window.confirm('Konfirmasi sekali lagi: Semua data akan hilang permanen!')) {
        setTransactions([]);
        setMembers([]);
        localStorage.removeItem('laundry_transactions');
        localStorage.removeItem('laundry_members');
        alert('✅ Semua data berhasil dihapus!');
        setPage('menu');
      }
    }
  };

  const getPeriodLabel = (list) => {
    if (!list || list.length === 0) return 'Semua waktu';
    const dates = list.map(t => parseIndoDate(t.date)).filter(d => !isNaN(d.getTime()));
    if (dates.length === 0) return 'Semua waktu';
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const minLabel = min.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const maxLabel = max.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return minLabel === maxLabel ? minLabel : `${minLabel} — ${maxLabel}`;
  };

  // Sorting displayed transactions for history
  const displayedTransactions = [...filteredTransactions].sort((a, b) => {
    const da = parseIndoDate(a.date);
    const db = parseIndoDate(b.date);
    if (isNaN(da.getTime()) && isNaN(db.getTime())) return 0;
    if (isNaN(da.getTime())) return 1;
    if (isNaN(db.getTime())) return -1;
    return db - da;
  });

  const dashboardTransactionsSorted = [...dashboardFilteredTransactions].sort((a, b) => {
    const da = parseIndoDate(a.date);
    const db = parseIndoDate(b.date);
    if (isNaN(da.getTime()) && isNaN(db.getTime())) return 0;
    if (isNaN(da.getTime())) return 1;
    if (isNaN(db.getTime())) return -1;
    return db - da;
  });

  // ---------- JSX ----------
  return (
    <>
      {/* Print-only struk */}
      {showPrintStruk && currentTransaction && (
        <div className="print-only" aria-hidden={!showPrintStruk}>
          <div className="struk-container">
            <div className="struk-header">
              <div className="struk-title">SnowFresh Laundry</div>
              <div className="struk-subtitle">Jl. Laundry No. 123</div>
            </div>

            <div className="struk-row">
              <span>Customer ID:</span>
              <span>{currentTransaction.customerId}</span>
            </div>
            <div className="struk-row">
              <span>Nama:</span>
              <span>{currentTransaction.name}</span>
            </div>
            {currentTransaction.memberId && (
              <div className="struk-row">
                <span>Member ID:</span>
                <span>{currentTransaction.memberId}</span>
              </div>
            )}
            <div className="struk-row">
              <span>Berat:</span>
              <span>{currentTransaction.weight} kg</span>
            </div>
            <div className="struk-row">
              <span>Harga/kg:</span>
              <span>Rp {currentTransaction.pricePerKg?.toLocaleString('id-ID')}</span>
            </div>
            <div className="struk-row">
              <span>Layanan:</span>
              <span>{currentTransaction.laundryType === 'setrika' ? 'Cuci + Setrika' : 'Cuci Biasa'}</span>
            </div>
            {currentTransaction.laundryType === 'setrika' && (
              <div className="struk-row">
                <span>Biaya Setrika:</span>
                <span>Rp {(2000 * currentTransaction.weight).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="struk-row">
              <span>Tanggal:</span>
              <span>{formatTransactionDate(currentTransaction.date)}</span>
            </div>
            <div className="struk-row">
              <span>Pembayaran:</span>
              <span>{currentTransaction.paymentMethod || paymentMethod}</span>
            </div>

            <div className="struk-total">
              <div className="struk-row">
                <span>TOTAL:</span>
                <span>Rp {currentTransaction.total?.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- WELCOME & MENU --- */}
      {page === 'welcome' && (
        <div className="welcome-page">
          <div className="welcome-content">
            <div className="welcome-logo">
              <img
                src="https://i.imgur.com/HQaVrMU.png"
                alt="SnowFresh Laundry Logo"
                onError={(e) => {
                  if (e.target.src.endsWith('.png')) {
                    e.target.src = 'https://i.imgur.com/HQaVrMU.jpg';
                  } else {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }
                }}
              />
              <div className="welcome-icon-fallback" style={{display: 'none'}}>👕</div>
            </div>
            <h1 className="welcome-title">SnowFresh Laundry</h1>
            <p className="welcome-subtitle">Pure freshness in every moment</p>
            <button className="btn-start" onClick={() => setPage('menu')}>Login</button>
          </div>
        </div>
      )}

      {page === 'menu' && (
        <div className="menu-page">
          <div className="app-header">
            <div className="header-content">
              <div className="header-left">
                <span className="header-icon">👕</span>
                <div className="header-text">
                  <h1>SnowFresh Laundry</h1>
                  <p>Sistem Kasir</p>
                </div>
              </div>
              <button className="btn-exit" onClick={() => { if (window.confirm('Yakin ingin keluar?')) { setPage('welcome'); resetForm(); } }}>↪ Exit</button>
            </div>
          </div>

          <div className="menu-container">
            <div className="menu-buttons">
              <button className="menu-btn" onClick={() => { setPage('transaction'); resetForm(); setEditingId(null); }}>
                <span className="menu-icon">👕</span><span>Transaksi</span>
              </button>
              <button className="menu-btn" onClick={() => setPage('members')}>
                <span className="menu-icon">👤</span><span>Member</span>
              </button>
              <button className="menu-btn" onClick={() => setPage('history')}>
                <span className="menu-icon">🕒</span><span>Riwayat</span>
              </button>
              <button className="menu-btn" onClick={() => setPage('dashboard')}>
                <span className="menu-icon">📊</span><span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TRANSACTION (kept similar) --- */}
      {page === 'transaction' && (
        <div className="menu-page">
          <div className="app-header">
            <div className="header-content">
              <div className="header-left">
                <span className="header-icon">👕</span>
                <div className="header-text"><h1>SnowFresh Laundry</h1><p>Sistem Kasir</p></div>
              </div>
              <button className="btn-exit" onClick={() => setPage('menu')}>← Kembali</button>
            </div>
          </div>

          <div className="main-content">
            <div className="transaction-card">
              <h2 className="card-title">{editingId ? 'Edit Transaksi' : 'Transaksi Baru'}</h2>

              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input type="text" className="form-input" value={editingId ? formData.customerId : generateCustomerId()} disabled />
              </div>

              <div className="form-group">
                <label className="form-label">Status Member</label>
                <div className="member-section">
                  {selectedMember ? (
                    <div className="selected-member">
                      <span>✓ {selectedMember.name} ({selectedMember.memberId})</span>
                      <button className="btn-change-member" onClick={() => setSelectedMember(null)}>Ubah</button>
                    </div>
                  ) : (
                    <button className="btn-select-member" onClick={() => setShowMemberModal(true)}>Pilih Member</button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Customer</label>
                <input type="text" className="form-input" name="name" value={formData.name} onChange={handleInputChange} placeholder="Masukkan nama customer" disabled={!!selectedMember} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Berat (kg)</label>
                  <input type="number" className="form-input" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="0" />
                </div>

                <div className="form-group">
                  <label className="form-label">Harga per kg (Rp)</label>
                  <input type="number" className="form-input" name="pricePerKg" value={formData.pricePerKg} onChange={handleInputChange} placeholder="0" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Opsi Laundry</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input type="radio" name="laundryType" value="biasa" checked={formData.laundryType === 'biasa'} onChange={handleInputChange} />
                    <span className="radio-label">Cuci Biasa</span>
                  </label>
                  <label className="radio-option">
                    <input type="radio" name="laundryType" value="setrika" checked={formData.laundryType === 'setrika'} onChange={handleInputChange} />
                    <span className="radio-label">Cuci + Setrika (+Rp 2.000/kg)</span>
                  </label>
                </div>
              </div>

              <div className="total-section">
                <div className="total-label">Total yang harus dibayar:</div>
                <div className="total-amount">Rp {calculateTotal().toLocaleString('id-ID')}</div>
                {formData.laundryType === 'setrika' && formData.weight && (
                  <div className="total-detail">(Termasuk biaya setrika: Rp {(2000 * parseFloat(formData.weight)).toLocaleString('id-ID')})</div>
                )}
              </div>

              <button className="btn btn-primary" onClick={editingId ? handleUpdateTransaction : handleCreateTransaction}>
                {editingId ? 'Update Transaksi' : 'Buat Transaksi'}
              </button>
            </div>
          </div>

          {/* Member selection modal */}
          {showMemberModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Pilih Member</h3>
                  <button className="modal-close" onClick={() => setShowMemberModal(false)}>×</button>
                </div>

                {members.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">👤</div><div className="empty-text">Belum ada member terdaftar</div></div>
                ) : (
                  <div className="member-list">
                    {members.map(member => (
                      <div key={member.id} className="member-item" onClick={() => handleSelectMember(member)}>
                        <div className="member-info">
                          <div className="member-name">{member.name}</div>
                          <div className="member-id">{member.memberId}</div>
                        </div>
                        <div className="member-arrow">→</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={() => { setShowMemberModal(false); setPage('members'); }}>+ Daftar Member Baru</button>
                </div>
              </div>
            </div>
          )}

          {/* Payment modal */}
          {showPayment && currentTransaction && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="struk-container">
                  <div className="struk-header">
                    <div className="struk-title">SnowFresh Laundry</div>
                    <div className="struk-subtitle">Jl. Laundry No. 123</div>
                  </div>

                  <div className="struk-row"><span>Customer ID:</span><span>{currentTransaction.customerId}</span></div>
                  <div className="struk-row"><span>Nama:</span><span>{currentTransaction.name}</span></div>
                  {currentTransaction.memberId && (<div className="struk-row"><span>Member ID:</span><span>{currentTransaction.memberId}</span></div>)}
                  <div className="struk-row"><span>Berat:</span><span>{currentTransaction.weight} kg</span></div>
                  <div className="struk-row"><span>Harga/kg:</span><span>Rp {currentTransaction.pricePerKg.toLocaleString('id-ID')}</span></div>
                  <div className="struk-row"><span>Layanan:</span><span>{currentTransaction.laundryType === 'setrika' ? 'Cuci + Setrika' : 'Cuci Biasa'}</span></div>
                  {currentTransaction.laundryType === 'setrika' && (<div className="struk-row"><span>Biaya Setrika:</span><span>Rp {(2000 * currentTransaction.weight).toLocaleString('id-ID')}</span></div>)}
                  <div className="struk-row"><span>Tanggal:</span><span>{formatTransactionDate(currentTransaction.date)}</span></div>

                  <div className="struk-total"><div className="struk-row"><span>TOTAL:</span><span>Rp {currentTransaction.total.toLocaleString('id-ID')}</span></div></div>
                </div>

                <div className="payment-section">
                  <div className="payment-title">Pilih Metode Pembayaran:</div>
                  <div className="payment-options">
                    <button className="payment-btn cash" onClick={() => handlePayment('Cash')}>Cash</button>
                    <button className="payment-btn transfer" onClick={() => handlePayment('Transfer')}>Transfer</button>
                    <button className="payment-btn qris" onClick={() => handlePayment('QRIS')}>QRIS</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showSuccess && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="success-modal">
                  <div className="success-icon">✓</div>
                  <div className="success-title">Pembayaran Berhasil!</div>
                  <div className="success-subtitle">Metode: {paymentMethod}</div>
                  <div className="success-actions">
                    <button className="btn btn-print" onClick={handlePrint}>🖨 Print Struk</button>
                    <button className="btn btn-close" onClick={() => { resetForm(); setPage('menu'); }}>Selesai</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MEMBERS --- */}
      {page === 'members' && (
        <div className="menu-page">
          <div className="app-header"><div className="header-content"><div className="header-left"><span className="header-icon">👕</span><div className="header-text"><h1>SnowFresh Laundry</h1><p>Sistem Kasir</p></div></div><button className="btn-exit" onClick={() => setPage('menu')}>← Kembali</button></div></div>
          <div className="main-content">
            <div className="transaction-card">
              <h2 className="card-title">Daftar Member Baru</h2>
              <div className="form-group"><label className="form-label">Nama Lengkap *</label><input type="text" className="form-input" name="name" value={memberForm.name} onChange={handleMemberFormChange} placeholder="Masukkan nama lengkap" /></div>
              <div className="form-group"><label className="form-label">Nomor Telepon *</label><input type="tel" className="form-input" name="phone" value={memberForm.phone} onChange={handleMemberFormChange} placeholder="08xxxxxxxxxx" /></div>
              <div className="form-group"><label className="form-label">Alamat</label><textarea className="form-input" name="address" value={memberForm.address} onChange={handleMemberFormChange} placeholder="Masukkan alamat lengkap" rows="3" /></div>
              <button className="btn btn-primary" onClick={handleAddMember}>Daftar Member</button>
            </div>

            <div className="transaction-card" style={{marginTop:20}}>
              <h2 className="card-title">Daftar Member</h2>
              {members.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">👤</div><div className="empty-text">Belum ada member terdaftar</div></div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr><th>Member ID</th><th>Nama</th><th>Telepon</th><th>Alamat</th><th>Tanggal Daftar</th></tr></thead>
                    <tbody>
                      {members.map(member => (
                        <tr key={member.id}><td>{member.memberId}</td><td>{member.name}</td><td>{member.phone}</td><td>{member.address || '-'}</td><td>{member.joinDate}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY / RIWAYAT --- */}
      {page === 'history' && (
        <div className="menu-page">
          <div className="app-header"><div className="header-content"><div className="header-left"><span className="header-icon">👕</span><div className="header-text"><h1>SnowFresh Laundry</h1><p>Sistem Kasir</p></div></div><button className="btn-exit" onClick={() => setPage('menu')}>← Kembali</button></div></div>

          <div className="history-page">
            <div className="history-container">
              <h2 className="history-title">Riwayat Transaksi</h2>

              <div className="filter-box" style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:12}}>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterStartDate(''); setFilterEndDate(''); setFilterMonth(''); }}>
                  <option value="all">Semua Data</option>
                  <option value="date-range">Filter Rentang Tanggal</option>
                  <option value="month">Filter Bulan</option>
                </select>

                {filterType === 'date-range' && (
                  <>
                    <label style={{fontSize:13}}>Dari</label>
                    <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                    <label style={{fontSize:13}}>Sampai</label>
                    <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                    <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}>Reset</button>
                  </>
                )}

                {filterType === 'month' && (
                  <>
                    <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
                    <button onClick={() => setFilterMonth('')}>Reset</button>
                  </>
                )}
              </div>

              <div className="revenue-card" style={{marginBottom:12}}>
                <div className="revenue-label">Total Pendapatan:</div>
                <div className="revenue-amount">Rp {calculateTotalRevenue(filteredTransactions).toLocaleString('id-ID')}</div>
                <div className="revenue-detail">Dari {filteredTransactions.length} transaksi</div>
                <div style={{marginTop:6, fontSize:13, color:'#555'}}>Periode: {getPeriodLabel(filteredTransactions)}</div>
              </div>

              {transactions.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">Belum ada transaksi</div></div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Nama</th>
                        <th>Member</th>
                        <th>Berat (kg)</th>
                        <th>Harga/kg</th>
                        <th>Layanan</th>
                        <th>Total</th>
                        <th>Pembayaran</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign:'center', padding:'18px 10px' }}>
                            Tidak ada transaksi pada periode ini
                          </td>
                        </tr>
                      ) : (
                        displayedTransactions.map(transaction => (
                          <tr key={transaction.id}>
                            <td>{transaction.customerId}</td>
                            <td>{transaction.name}</td>
                            <td>{transaction.memberId ? '✓' : '-'}</td>
                            <td>{transaction.weight}</td>
                            <td>Rp {transaction.pricePerKg?.toLocaleString('id-ID')}</td>
                            <td>{transaction.laundryType === 'setrika' ? 'Cuci + Setrika' : 'Cuci Biasa'}</td>
                            <td>Rp {transaction.total?.toLocaleString('id-ID')}</td>
                            <td>{transaction.paymentMethod}</td>
                            <td>{formatTransactionDate(transaction.date)}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn btn-small btn-edit" onClick={() => handleEdit(transaction)}>Edit</button>
                                <button className="btn btn-small btn-delete" onClick={() => handleDelete(transaction.id)}>Hapus</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- DASHBOARD --- */}
      {page === 'dashboard' && (
        <div className="menu-page">
          <div className="app-header"><div className="header-content"><div className="header-left"><span className="header-icon">👕</span><div className="header-text"><h1>SnowFresh Laundry</h1><p>Sistem Kasir</p></div></div><button className="btn-exit" onClick={() => setPage('menu')}>← Kembali</button></div></div>

          <div className="history-page">
            <div className="history-container">
              <h2 className="history-title">Dashboard Laporan</h2>

              <div className="filter-box" style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:12}}>
                <select value={dashFilterType} onChange={(e) => { setDashFilterType(e.target.value); setDashStartDate(''); setDashEndDate(''); setDashMonth(''); }}>
                  <option value="all">Semua Periode</option>
                  <option value="date-range">Rentang Tanggal</option>
                  <option value="month">Bulan</option>
                </select>

                {dashFilterType === 'date-range' && (
                  <>
                    <label style={{fontSize:13}}>Dari</label>
                    <input type="date" value={dashStartDate} onChange={(e) => setDashStartDate(e.target.value)} />
                    <label style={{fontSize:13}}>Sampai</label>
                    <input type="date" value={dashEndDate} onChange={(e) => setDashEndDate(e.target.value)} />
                    <button onClick={() => { setDashStartDate(''); setDashEndDate(''); }}>Reset</button>
                  </>
                )}

                {dashFilterType === 'month' && (
                  <>
                    <input type="month" value={dashMonth} onChange={(e) => setDashMonth(e.target.value)} />
                    <button onClick={() => setDashMonth('')}>Reset</button>
                  </>
                )}

                <div style={{marginLeft:'auto', fontSize:13, color:'#333'}}><strong>Periode Aktif:</strong> {getPeriodLabel(dashboardFilteredTransactions)}</div>
              </div>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:12}}>
                <div className="dashboard-stats" style={{flex:1}}>
                  <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-label">Total Pendapatan</div><div className="stat-value">Rp {calculateTotalRevenue(dashboardFilteredTransactions).toLocaleString('id-ID')}</div></div>
                  <div className="stat-card"><div className="stat-icon">📝</div><div className="stat-label">Total Transaksi</div><div className="stat-value">{dashboardFilteredTransactions.length}</div></div>
                  <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-label">Total Member</div><div className="stat-value">{members.length}</div></div>
                </div>

                <div style={{minWidth:200, textAlign:'right', fontSize:13, color:'#333'}}>
                  <div><strong>Periode:</strong></div>
                  <div>{getPeriodLabel(dashboardFilteredTransactions)}</div>
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div className="chart-card">
                  <h3 className="chart-title">Pendapatan & Jumlah Transaksi Bulanan</h3>
                  {Object.keys(getChartData(dashboardFilteredTransactions).monthlyData).length === 0 ? (
                    <div className="empty-chart">Belum ada data untuk periode ini</div>
                  ) : (
                    (() => {
                      const { monthlyData } = getChartData(dashboardFilteredTransactions);
                      const monthlyEntries = Object.entries(monthlyData);
                      const maxRevenue = Math.max(...monthlyEntries.map(([_, d]) => d.revenue), 0);
                      const maxCount = Math.max(...monthlyEntries.map(([_, d]) => d.count), 0) || 1;
                      return (
                        <div>
                          <div className="combo-chart-container">
                            <div className="chart-bars-area" style={{alignItems:'flex-end', height:140}}>
                              {monthlyEntries.map(([month, data]) => {
                                const h = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                                return (
                                  <div key={month} className="bar-group">
                                    <div className="combo-bar" style={{height:`${Math.max(h,2)}%`}}>
                                      <div style={{fontSize:11, padding:4}}>{(data.revenue).toLocaleString('id-ID')}</div>
                                    </div>
                                    <div style={{fontSize:12, marginTop:6}}>{month}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div style={{marginTop:8, fontSize:12}}>Jumlah transaksi tertinggi: {maxCount}</div>
                        </div>
                      );
                    })()
                  )}
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Pendapatan per Metode Pembayaran</h3>
                  {(() => {
                    const { paymentData } = getChartData(dashboardFilteredTransactions);
                    const maxPayment = getMaxValue(paymentData);
                    if (Object.keys(paymentData).length === 0) return <div className="empty-chart">Belum ada data pembayaran</div>;
                    return Object.entries(paymentData).map(([method, value]) => {
                      const percentage = maxPayment > 0 ? (value / maxPayment) * 100 : 0;
                      const colors = { 'Cash': '#10b981', 'Transfer': '#3b82f6', 'QRIS': '#8b5cf6' };
                      return (
                        <div key={method} style={{marginBottom:8}}>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:13}}><div>{method}</div><div>Rp {value.toLocaleString('id-ID')}</div></div>
                          <div style={{background:'#eee', borderRadius:6, overflow:'hidden', marginTop:6}}>
                            <div style={{width:`${Math.max(percentage,2)}%`, height:14, background:colors[method] || '#6b7280'}}></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div style={{marginTop:16}}><button className="btn btn-danger" onClick={handleClearAllData}>🗑️ Hapus Semua Data</button></div>

              <div style={{marginTop:20}}>
                <h3 style={{margin:0}}>Transaksi Terbaru (Periode)</h3>
                <div className="table-container" style={{marginTop:8}}>
                  <table className="data-table">
                    <thead><tr><th>Customer</th><th>Total</th><th>Metode</th><th>Tanggal</th></tr></thead>
                    <tbody>
                      {dashboardTransactionsSorted.slice(0,10).map(tx => (
                        <tr key={tx.id}><td>{tx.name}</td><td>Rp {tx.total?.toLocaleString('id-ID')}</td><td>{tx.paymentMethod}</td><td>{formatTransactionDate(tx.date)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* fallback default */}
      {page !== 'welcome' && page !== 'menu' && page !== 'transaction' && page !== 'members' && page !== 'history' && page !== 'dashboard' && (
        <div className="menu-page">
          <div className="app-header"><div className="header-content"><div className="header-left"><span className="header-icon">👕</span><div className="header-text"><h1>SnowFresh Laundry</h1><p>Sistem Kasir</p></div></div><button className="btn-exit" onClick={() => setPage('menu')}>← Kembali ke Menu</button></div></div>
        </div>
      )}
    </>
  );
};

export default App;
