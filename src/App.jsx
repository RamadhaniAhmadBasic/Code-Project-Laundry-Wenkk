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
  const [filterType, setFilterType] = useState('all'); // all | date | month
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

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

  // Inject CSS for print-only and basic struk style
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'app-print-styles';
    style.innerHTML = `
      /* print-only container hidden on screen */
      .print-only { display: none; }

      /* basic struk styles for print */
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

      /* print rules */
      @media print {
        body * { visibility: hidden !important; }
        .print-only, .print-only * { visibility: visible !important; }
        .print-only { display: block !important; position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('app-print-styles');
      if (el) el.remove();
    };
  }, []);

  // Save transactions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('laundry_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Save members to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('laundry_members', JSON.stringify(members));
  }, [members]);

  // Generate Customer ID
  const generateCustomerId = () => {
    const lastId = transactions.length > 0
        ? parseInt(transactions[transactions.length - 1].customerId.replace('cust', ''))
        : 0;
    return `cust${String(lastId + 1).padStart(3, '0')}`;
  };

  // Generate Member ID
  const generateMemberId = () => {
    const lastId = members.length > 0
        ? parseInt(members[members.length - 1].memberId.replace('MBR', ''))
        : 0;
    return `MBR${String(lastId + 1).padStart(3, '0')}`;
  };

  // Calculate Total
  const calculateTotal = () => {
    const weight = parseFloat(formData.weight) || 0;
    const price = parseFloat(formData.pricePerKg) || 0;
    const extraCharge = formData.laundryType === 'setrika' ? (2000 * weight) : 0;
    return (weight * price) + extraCharge;
  };

  // Calculate Total Revenue
  const calculateTotalRevenue = () => {
    return transactions.reduce((sum, t) => sum + t.total, 0);
  };


  const parseIndoDate = (dateStr) => {
    // "21/12/2025, 18.36.52" or "21/12/2025"
    if (!dateStr) return new Date(NaN);
    const [datePart] = dateStr.split(',');
    const parts = datePart.split('/');
    if (parts.length !== 3) return new Date(dateStr); // fallback
    const [dd, mm, yyyy] = parts;
    return new Date(`${yyyy}-${mm}-${dd}`);
  };

  const getFilteredTransactions = () => {
    if (!transactions || transactions.length === 0) return [];

    return transactions.filter(t => {
      if (!t.date) return true;

      const d = parseIndoDate(t.date);
      if (isNaN(d.getTime())) return false;

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (filterType === 'date') {
        return !filterDate || dateStr === filterDate;
      }

      if (filterType === 'month') {
        return !filterMonth || dateStr.startsWith(filterMonth);
      }

      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Member Form Change
  const handleMemberFormChange = (e) => {
    const { name, value } = e.target;
    setMemberForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add New Member
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

  // Select Member
  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setFormData(prev => ({
      ...prev,
      name: member.name,
      isMember: true
    }));
    setShowMemberModal(false);
  };

  // Create Transaction
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

  // Handle Payment
  const handlePayment = (method) => {
    setPaymentMethod(method);
    const tx = { ...currentTransaction, paymentMethod: method, id: currentTransaction?.id || Date.now() };
    setTransactions(prev => [...prev, tx]);
    setCurrentTransaction(tx); // keep the transaction with paymentMethod available for printing
    setShowPayment(false);
    setShowSuccess(true);
  };

  // Reset Form
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

  // Delete Transaction
  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Edit Transaction
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

  // Update Transaction
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

  // Print Struk (kept in DOM while printing)
  const handlePrint = () => {
    // show print-only element in DOM, then trigger print
    setShowPrintStruk(true);

    // small timeout to allow React to render the print element
    setTimeout(() => {
      window.print();
      // hide it after print dialog closed or after print triggered
      setShowPrintStruk(false);
    }, 250);
  };

  // Prepare Chart Data
  const getChartData = (data) => {
    const paymentData = {};
    const serviceData = { 'Cuci Biasa': 0, 'Cuci + Setrika': 0 };
    const monthlyData = {};

    data.forEach(t => {
      if (!t) return;
      // Payment method data
      paymentData[t.paymentMethod] = (paymentData[t.paymentMethod] || 0) + t.total;

      // Service type data
      if (t.laundryType === 'setrika') {
        serviceData['Cuci + Setrika'] += t.total;
      } else {
        serviceData['Cuci Biasa'] += t.total;
      }

      // Monthly data
      const date = new Date(t.date);
      const monthYear = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { revenue: 0, count: 0 };
      }
      monthlyData[monthYear].revenue += t.total;
      monthlyData[monthYear].count += 1;
    });

    return { paymentData, serviceData, monthlyData };
  };

  const getMaxValue = (data) => {
    const values = Object.values(data);
    return values.length > 0 ? Math.max(...values) : 0;
  };

  // Clear all data
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

  // Build page content into single return
  let pageContent = null;

  // Welcome Page
  if (page === 'welcome') {
    pageContent = (
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
          <button className="btn-start" onClick={() => setPage('menu')}>
            Login
          </button>
        </div>
      </div>
    );
  } else if (page === 'menu') {
    pageContent = (
      <div className="menu-page">
        {/* Animated Background Elements */}
        <div className="bg-elements">
          <div className="cloud cloud-1" style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}></div>
          <div className="cloud cloud-2" style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.015}px)`
          }}></div>
          <div className="snowflake snowflake-1" style={{
            transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px) rotate(${mousePosition.x * 0.1}deg)`
          }}>❄</div>
          <div className="snowflake snowflake-2" style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * 0.025}px) rotate(${mousePosition.x * -0.1}deg)`
          }}>❄</div>
          <div className="snowflake snowflake-3" style={{
            transform: `translate(${mousePosition.x * 0.025}px, ${mousePosition.y * -0.02}px) rotate(${mousePosition.x * 0.15}deg)`
          }}>❄</div>
          <div className="laundry-line" style={{
            transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.025}px)`
          }}>
            <div className="hanging-item">👕</div>
            <div className="hanging-item">🧦</div>
            <div className="hanging-item">👔</div>
            <div className="hanging-item">🩳</div>
          </div>
        </div>

        <div className="app-header">
          <div className="header-content">
            <div className="header-left">
              <span className="header-icon">👕</span>
              <div className="header-text">
                <h1>SnowFresh Laundry</h1>
                <p>Sistem Kasir</p>
              </div>
            </div>
            <button className="btn-exit" onClick={() => {
              if (window.confirm('Yakin ingin keluar?')) {
                setPage('welcome');
                resetForm();
              }
            }}>
              ↪ Exit
            </button>
          </div>
        </div>

        <div className="menu-container">
          <div className="menu-buttons">
            <button
              className="menu-btn"
              onClick={() => {
                setPage('transaction');
                resetForm();
                setEditingId(null);
              }}
            >
              <span className="menu-icon">👕</span>
              <span>Transaksi</span>
            </button>
            <button
              className="menu-btn"
              onClick={() => setPage('members')}
            >
              <span className="menu-icon">👤</span>
              <span>Member</span>
            </button>
            <button
              className="menu-btn"
              onClick={() => setPage('history')}
            >
              <span className="menu-icon">🕒</span>
              <span>Riwayat</span>
            </button>
            <button
              className="menu-btn"
              onClick={() => setPage('dashboard')}
            >
              <span className="menu-icon">📊</span>
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  } else if (page === 'transaction') {
    pageContent = (
      <div className="menu-page">
        {/* Animated Background Elements */}
        <div className="bg-elements">
          <div className="cloud cloud-1" style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}></div>
          <div className="snowflake snowflake-1" style={{
            transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px) rotate(${mousePosition.x * 0.1}deg)`
          }}>❄</div>
          <div className="snowflake snowflake-2" style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * 0.025}px) rotate(${mousePosition.x * -0.1}deg)`
          }}>❄</div>
          <div className="laundry-item item-1" style={{
            transform: `translate(${mousePosition.x * 0.04}px, ${mousePosition.y * 0.03}px) rotate(${mousePosition.x * 0.05}deg)`
          }}>👕</div>
        </div>

        <div className="app-header">
          <div className="header-content">
            <div className="header-left">
              <span className="header-icon">👕</span>
              <div className="header-text">
                <h1>SnowFresh Laundry</h1>
                <p>Sistem Kasir</p>
              </div>
            </div>
            <button className="btn-exit" onClick={() => setPage('menu')}>
              ← Kembali
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="transaction-card">
            <h2 className="card-title">
              {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
            </h2>

            <div className="form-group">
              <label className="form-label">Customer ID</label>
              <input
                type="text"
                className="form-input"
                value={editingId ? formData.customerId : generateCustomerId()}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status Member</label>
              <div className="member-section">
                {selectedMember ? (
                  <div className="selected-member">
                    <span>✓ {selectedMember.name} ({selectedMember.memberId})</span>
                    <button
                      className="btn-change-member"
                      onClick={() => setSelectedMember(null)}
                    >
                      Ubah
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-select-member"
                    onClick={() => setShowMemberModal(true)}
                  >
                    Pilih Member
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Customer</label>
              <input
                type="text"
                className="form-input"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Masukkan nama customer"
                disabled={!!selectedMember}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Berat (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Harga per kg (Rp)</label>
                <input
                  type="number"
                  className="form-input"
                  name="pricePerKg"
                  value={formData.pricePerKg}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Opsi Laundry</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="laundryType"
                    value="biasa"
                    checked={formData.laundryType === 'biasa'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-label">Cuci Biasa</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="laundryType"
                    value="setrika"
                    checked={formData.laundryType === 'setrika'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-label">Cuci + Setrika (+Rp 2.000/kg)</span>
                </label>
              </div>
            </div>

            <div className="total-section">
              <div className="total-label">Total yang harus dibayar:</div>
              <div className="total-amount">Rp {calculateTotal().toLocaleString('id-ID')}</div>
              {formData.laundryType === 'setrika' && formData.weight && (
                <div className="total-detail">
                  (Termasuk biaya setrika: Rp {(2000 * parseFloat(formData.weight)).toLocaleString('id-ID')})
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={editingId ? handleUpdateTransaction : handleCreateTransaction}
            >
              {editingId ? 'Update Transaksi' : 'Buat Transaksi'}
            </button>
          </div>
        </div>

        {/* Member Selection Modal */}
        {showMemberModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Pilih Member</h3>
                <button className="modal-close" onClick={() => setShowMemberModal(false)}>×</button>
              </div>

              {members.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👤</div>
                  <div className="empty-text">Belum ada member terdaftar</div>
                </div>
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
                <button className="btn btn-primary" onClick={() => {
                  setShowMemberModal(false);
                  setPage('members');
                }}>
                  + Daftar Member Baru
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && currentTransaction && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="struk-container">
                <div className="struk-header">
                  <div className="struk-title">SnowFresh Laundry</div>
                  <div className="struk-subtitle">Jl. Laundry No. 123</div>
                </div>

                <div className="struk-row">
                  <span className="struk-label">Customer ID:</span>
                  <span className="struk-value">{currentTransaction.customerId}</span>
                </div>
                <div className="struk-row">
                  <span className="struk-label">Nama:</span>
                  <span className="struk-value">{currentTransaction.name}</span>
                </div>
                {currentTransaction.memberId && (
                  <div className="struk-row">
                    <span className="struk-label">Member ID:</span>
                    <span className="struk-value">{currentTransaction.memberId}</span>
                  </div>
                )}
                <div className="struk-row">
                  <span className="struk-label">Berat:</span>
                  <span className="struk-value">{currentTransaction.weight} kg</span>
                </div>
                <div className="struk-row">
                  <span className="struk-label">Harga/kg:</span>
                  <span className="struk-value">Rp {currentTransaction.pricePerKg.toLocaleString('id-ID')}</span>
                </div>
                <div className="struk-row">
                  <span className="struk-label">Layanan:</span>
                  <span className="struk-value">
                    {currentTransaction.laundryType === 'setrika' ? 'Cuci + Setrika' : 'Cuci Biasa'}
                  </span>
                </div>
                {currentTransaction.laundryType === 'setrika' && (
                  <div className="struk-row">
                    <span className="struk-label">Biaya Setrika:</span>
                    <span className="struk-value">Rp {(2000 * currentTransaction.weight).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="struk-row">
                  <span className="struk-label">Tanggal:</span>
                  <span className="struk-value">{currentTransaction.date}</span>
                </div>

                <div className="struk-total">
                  <div className="struk-row">
                    <span className="struk-label">TOTAL:</span>
                    <span className="struk-value">Rp {currentTransaction.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="payment-section">
                <div className="payment-title">Pilih Metode Pembayaran:</div>
                <div className="payment-options">
                  <button className="payment-btn cash" onClick={() => handlePayment('Cash')}>
                    Cash
                  </button>
                  <button className="payment-btn transfer" onClick={() => handlePayment('Transfer')}>
                    Transfer
                  </button>
                  <button className="payment-btn qris" onClick={() => handlePayment('QRIS')}>
                    QRIS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="success-modal">
                <div className="success-icon">✓</div>
                <div className="success-title">Pembayaran Berhasil!</div>
                <div className="success-subtitle">Metode: {paymentMethod}</div>

                <div className="success-actions">
                  <button className="btn btn-print" onClick={handlePrint}>
                    🖨 Print Struk
                  </button>
                  <button className="btn btn-close" onClick={() => {
                    resetForm();
                    setPage('menu');
                  }}>
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else if (page === 'members') {
    pageContent = (
      <div className="menu-page">
        {/* Animated Background Elements */}
        <div className="bg-elements">
          <div className="cloud cloud-2" style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.015}px)`
          }}></div>
          <div className="snowflake snowflake-1" style={{
            transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px) rotate(${mousePosition.x * 0.1}deg)`
          }}>❄</div>
          <div className="laundry-item item-2" style={{
            transform: `translate(${mousePosition.x * -0.035}px, ${mousePosition.y * 0.035}px) rotate(${mousePosition.x * -0.05}deg)`
          }}>🧦</div>
        </div>

        <div className="app-header">
          <div className="header-content">
            <div className="header-left">
              <span className="header-icon">👕</span>
              <div className="header-text">
                <h1>SnowFresh Laundry</h1>
                <p>Sistem Kasir</p>
              </div>
            </div>
            <button className="btn-exit" onClick={() => setPage('menu')}>
              ← Kembali
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="transaction-card">
            <h2 className="card-title">Daftar Member Baru</h2>

            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input
                type="text"
                className="form-input"
                name="name"
                value={memberForm.name}
                onChange={handleMemberFormChange}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor Telepon *</label>
              <input
                type="tel"
                className="form-input"
                name="phone"
                value={memberForm.phone}
                onChange={handleMemberFormChange}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alamat</label>
              <textarea
                className="form-input"
                name="address"
                value={memberForm.address}
                onChange={handleMemberFormChange}
                placeholder="Masukkan alamat lengkap"
                rows="3"
              />
            </div>

            <button className="btn btn-primary" onClick={handleAddMember}>
              Daftar Member
            </button>
          </div>

          <div className="transaction-card" style={{marginTop: '20px'}}>
            <h2 className="card-title">Daftar Member</h2>

            {members.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <div className="empty-text">Belum ada member terdaftar</div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member ID</th>
                      <th>Nama</th>
                      <th>Telepon</th>
                      <th>Alamat</th>
                      <th>Tanggal Daftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id}>
                        <td>{member.memberId}</td>
                        <td>{member.name}</td>
                        <td>{member.phone}</td>
                        <td>{member.address || '-'}</td>
                        <td>{member.joinDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else if (page === 'history') {
    pageContent = (
      <div className="menu-page">
        {/* Animated Background Elements */}
        <div className="bg-elements">
          <div className="cloud cloud-1" style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}></div>
          <div className="snowflake snowflake-2" style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * 0.025}px) rotate(${mousePosition.x * -0.1}deg)`
          }}>❄</div>
          <div className="snowflake snowflake-3" style={{
            transform: `translate(${mousePosition.x * 0.025}px, ${mousePosition.y * -0.02}px) rotate(${mousePosition.x * 0.15}deg)`
          }}>❄</div>
          <div className="star star-1" style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.04}px)`
          }}>✨</div>
        </div>

        <div className="app-header">
          <div className="header-content">
            <div className="header-left">
              <span className="header-icon">👕</span>
              <div className="header-text">
                <h1>SnowFresh Laundry</h1>
                <p>Sistem Kasir</p>
              </div>
            </div>
            <button className="btn-exit" onClick={() => setPage('menu')}>
              ← Kembali
            </button>
          </div>
        </div>

        <div className="history-page">
          <div className="history-container">
            <h2 className="history-title">Riwayat Transaksi</h2>

            <div className="filter-box">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterDate('');
                  setFilterMonth('');
                }}
              >
                <option value="all">Semua Data</option>
                <option value="date">Filter Tanggal</option>
                <option value="month">Filter Bulan</option>
              </select>

              {filterType === 'date' && (
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              )}

              {filterType === 'month' && (
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />
              )}
            </div>

            <div className="revenue-card">
              <div className="revenue-label">Total Pendapatan:</div>
              <div className="revenue-amount">Rp {calculateTotalRevenue().toLocaleString('id-ID')}</div>
              <div className="revenue-detail">Dari {transactions.length} transaksi</div>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-text">Belum ada transaksi</div>
              </div>
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
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.customerId}</td>
                        <td>{transaction.name}</td>
                        <td>{transaction.memberId ? '✓' : '-'}</td>
                        <td>{transaction.weight}</td>
                        <td>Rp {transaction.pricePerKg.toLocaleString('id-ID')}</td>
                        <td>{transaction.laundryType === 'setrika' ? 'Cuci + Setrika' : 'Cuci Biasa'}</td>
                        <td>Rp {transaction.total.toLocaleString('id-ID')}</td>
                        <td>{transaction.paymentMethod}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-small btn-edit"
                              onClick={() => handleEdit(transaction)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-small btn-delete"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else if (page === 'dashboard') {
    const { paymentData, serviceData, monthlyData } = getChartData(filteredTransactions);
    const maxPayment = getMaxValue(paymentData);
    const maxService = getMaxValue(serviceData);
    const hasTransactions = filteredTransactions.length > 0;

    // Prepare monthly chart data
    const monthlyEntries = Object.entries(monthlyData);
    const maxRevenue = Math.max(...monthlyEntries.map(([_, data]) => data.revenue), 0);
    const maxCount = Math.max(...monthlyEntries.map(([_, data]) => data.count), 0);

    pageContent = (
      <div className="menu-page">
        {/* Animated Background Elements */}
        <div className="bg-elements">
          <div className="cloud cloud-1" style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}></div>
          <div className="cloud cloud-2" style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.015}px)`
          }}></div>
          <div className="snowflake snowflake-1" style={{
            transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px) rotate(${mousePosition.x * 0.1}deg)`
          }}>❄</div>
          <div className="snowflake snowflake-2" style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * 0.025}px) rotate(${mousePosition.x * -0.1}deg)`
          }}>❄</div>
          <div className="laundry-item item-1" style={{
            transform: `translate(${mousePosition.x * 0.04}px, ${mousePosition.y * 0.03}px) rotate(${mousePosition.x * 0.05}deg)`
          }}>👕</div>
          <div className="star star-1" style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.04}px)`
          }}>✨</div>
        </div>

        <div className="app-header">
          <div className="header-content">
            <div className="header-left">
              <span className="header-icon">👕</span>
              <div className="header-text">
                <h1>SnowFresh Laundry</h1>
                <p>Sistem Kasir</p>
              </div>
            </div>
            <button className="btn-exit" onClick={() => setPage('menu')}>
              ← Kembali
            </button>
          </div>
        </div>

        <div className="history-page">
          <div className="history-container">
            <h2 className="history-title">Dashboard Laporan</h2>

            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-label">Total Pendapatan</div>
                <div className="stat-value">Rp {calculateTotalRevenue().toLocaleString('id-ID')}</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-label">Total Transaksi</div>
                <div className="stat-value">{transactions.length}</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-label">Total Member</div>
                <div className="stat-value">{members.length}</div>
              </div>
            </div>

            {hasTransactions ? (
              <>
                {/* Monthly Revenue & Transaction Chart */}
                {monthlyEntries.length > 0 && (
                  <div className="chart-card">
                    <h3 className="chart-title">Pendapatan & Jumlah Transaksi Bulanan</h3>
                    <div className="combo-chart">
                      <div className="chart-legend">
                        <div className="legend-item">
                          <span className="legend-color" style={{backgroundColor: '#3b82f6'}}></span>
                          <span>Pendapatan</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color line" style={{backgroundColor: '#f59e0b'}}></span>
                          <span>Jumlah Transaksi</span>
                        </div>
                      </div>
                      <div className="combo-chart-container">
                        <div className="chart-y-axis">
                          <div className="y-axis-label">Rp {(maxRevenue).toLocaleString('id-ID', { notation: 'compact' })}</div>
                          <div className="y-axis-label">Rp {(maxRevenue * 0.75).toLocaleString('id-ID', { notation: 'compact' })}</div>
                          <div className="y-axis-label">Rp {(maxRevenue * 0.5).toLocaleString('id-ID', { notation: 'compact' })}</div>
                          <div className="y-axis-label">Rp {(maxRevenue * 0.25).toLocaleString('id-ID', { notation: 'compact' })}</div>
                          <div className="y-axis-label">Rp 0</div>
                        </div>
                        <div className="chart-content">
                          <div className="chart-grid">
                            {[0, 1, 2, 3, 4].map(i => (
                              <div key={i} className="grid-line"></div>
                            ))}
                          </div>
                          <div className="chart-bars-area">
                            {monthlyEntries.map(([month, data], index) => {
                              const barHeight = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                              const lineY = maxCount > 0 ? 100 - (data.count / maxCount) * 100 : 100;
                              return (
                                <div key={month} className="bar-group">
                                  <div
                                    className="combo-bar"
                                    style={{ height: `${barHeight}%` }}
                                    title={`${month}: Rp ${data.revenue.toLocaleString('id-ID')}`}
                                  >
                                    <div className="bar-tooltip">
                                      Rp {data.revenue.toLocaleString('id-ID')}
                                    </div>
                                  </div>
                                  <div className="bar-label">{month}</div>
                                </div>
                              );
                            })}
                            <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <polyline
                                points={monthlyEntries.map(([_, data], index) => {
                                  const x = (index / (monthlyEntries.length - 1 || 1)) * 100;
                                  const y = maxCount > 0 ? 100 - (data.count / maxCount) * 100 : 100;
                                  return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="2"
                              />
                              {monthlyEntries.map(([_, data], index) => {
                                const x = (index / (monthlyEntries.length - 1 || 1)) * 100;
                                const y = maxCount > 0 ? 100 - (data.count / maxCount) * 100 : 100;
                                return (
                                  <circle
                                    key={index}
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill="#f59e0b"
                                    stroke="white"
                                    strokeWidth="1"
                                  />
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                        <div className="chart-y-axis chart-y-axis-right">
                          <div className="y-axis-label">{maxCount}</div>
                          <div className="y-axis-label">{Math.round(maxCount * 0.75)}</div>
                          <div className="y-axis-label">{Math.round(maxCount * 0.5)}</div>
                          <div className="y-axis-label">{Math.round(maxCount * 0.25)}</div>
                          <div className="y-axis-label">0</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="chart-card">
                  <h3 className="chart-title">Pendapatan per Metode Pembayaran</h3>
                  <div className="custom-chart">
                    {Object.entries(paymentData).length > 0 ? (
                      Object.entries(paymentData).map(([method, value]) => {
                        const percentage = maxPayment > 0 ? (value / maxPayment) * 100 : 0;
                        const colors = {
                          'Cash': '#10b981',
                          'Transfer': '#3b82f6',
                          'QRIS': '#8b5cf6'
                        };
                        return (
                          <div key={method} className="chart-bar-container">
                            <div className="chart-label">{method}</div>
                            <div className="chart-bar-wrapper">
                              <div
                                className="chart-bar"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: colors[method] || '#6b7280'
                                }}
                              >
                                <span className="chart-bar-value">
                                  Rp {value.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-chart">Belum ada data pembayaran</div>
                    )}
                  </div>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Pendapatan per Jenis Layanan</h3>
                  <div className="custom-chart">
                    {Object.entries(serviceData).length > 0 ? (
                      Object.entries(serviceData).map(([service, value]) => {
                        if (value === 0) return null;
                        const percentage = maxService > 0 ? (value / maxService) * 100 : 0;
                        const colors = {
                          'Cuci Biasa': '#3b82f6',
                          'Cuci + Setrika': '#f59e0b'
                        };
                        return (
                          <div key={service} className="chart-bar-container">
                            <div className="chart-label">{service}</div>
                            <div className="chart-bar-wrapper">
                              <div
                                className="chart-bar"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: colors[service] || '#6b7280'
                                }}
                              >
                                <span className="chart-bar-value">
                                  Rp {value.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-chart">Belum ada data layanan</div>
                    )}
                  </div>
                </div>

                <div className="danger-zone">
                  <h3 className="danger-title">⚠️ Danger Zone</h3>
                  <p className="danger-description">
                    Menghapus semua data transaksi dan member secara permanen. Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <button className="btn btn-danger" onClick={handleClearAllData}>
                    🗑️ Hapus Semua Data
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <div className="empty-text">Belum ada data untuk ditampilkan</div>
                <div className="empty-subtext">Mulai buat transaksi untuk melihat grafik dan statistik</div>
                <div className="danger-zone" style={{marginTop: '30px'}}>
                  <h3 className="danger-title">⚠️ Danger Zone</h3>
                  <p className="danger-description">
                    Menghapus semua data transaksi dan member secara permanen.
                  </p>
                  <button className="btn btn-danger" onClick={handleClearAllData}>
                    🗑️ Hapus Semua Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    pageContent = (
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
            <button className="btn-exit" onClick={() => setPage('menu')}>
              ← Kembali ke Menu
            </button>
          </div>
        </div>
        <div className="main-content">
          <div className="transaction-card">
            <h2 className="card-title">Halaman Tidak Ditemukan</h2>
            <p>Halaman yang Anda cari tidak tersedia.</p>
            <button className="btn btn-primary" onClick={() => setPage('menu')}>
              Kembali ke Menu Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Print-only element — always rendered when showPrintStruk = true
  const printOnlyElement = (showPrintStruk && currentTransaction) ? (
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
          <span>Rp {currentTransaction.pricePerKg.toLocaleString('id-ID')}</span>
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
          <span>{currentTransaction.date}</span>
        </div>
        <div className="struk-row">
          <span>Pembayaran:</span>
          <span>{currentTransaction.paymentMethod || paymentMethod}</span>
        </div>

        <div className="struk-total">
          <div className="struk-row">
            <span>TOTAL:</span>
            <span>Rp {currentTransaction.total.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {printOnlyElement}
      {pageContent}
    </>
  );
};

export default App;
