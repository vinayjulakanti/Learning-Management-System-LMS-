import React, { useEffect, useState } from 'react';
import { FeesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';


export default function FeeManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [fees, setFees] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalFees: 0,
    totalAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    pendingCount: 0,
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'one-time',
    dueDate: '',
    description: '',
    applicableTo: 'all'
  });

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading fees...');
      const { data } = await FeesAPI.list();
      console.log('Fees API response:', data);
      
      const feesList = Array.isArray(data?.fees) ? data.fees : [];
      console.log('Processed fees list:', feesList);
      
      setFees(feesList);
      
      // Calculate payment statistics
      const stats = {
        totalFees: feesList.length,
        totalAmount: feesList.reduce((sum, fee) => sum + (fee.amount || 0), 0),
        paidCount: feesList.filter(fee => fee.status === 'paid').length,
        paidAmount: feesList.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + (fee.amount || 0), 0),
        pendingCount: feesList.filter(fee => fee.status === 'pending').length,
        pendingAmount: feesList.filter(fee => fee.status === 'pending').reduce((sum, fee) => sum + (fee.amount || 0), 0)
      };
      setPaymentStats(stats);
      console.log('Payment stats calculated:', stats);
    } catch (e) {
      console.error('Error loading fees:', e);
      setError(e?.response?.data?.message || 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
   
    // Enhanced validation
    if (!formData.name || !formData.amount || !formData.dueDate || !formData.type) {
      const missingFields = [];
      if (!formData.name) missingFields.push('Fee Name');
      if (!formData.amount) missingFields.push('Amount');
      if (!formData.type) missingFields.push('Fee Type');
      if (!formData.dueDate) missingFields.push('Due Date');
      
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate amount
    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Submitting fee data:', { ...formData, amount: Number(formData.amount) });
      
      if (editingFee) {
        console.log('Updating fee:', editingFee._id);
        const response = await FeesAPI.update(editingFee._id, { ...formData, amount: Number(formData.amount) });
        console.log('Fee updated successfully:', response);
      } else {
        console.log('Creating new fee...');
        const response = await FeesAPI.create({ ...formData, amount: Number(formData.amount) });
        console.log('Fee created successfully:', response);
      }
      
      await loadFees();
      setShowCreateForm(false);
      setEditingFee(null);
      setFormData({
        name: '',
        amount: '',
        type: 'one-time',
        dueDate: '',
        description: '',
        applicableTo: 'all'
      });
      
      // Show success message
      alert(editingFee ? 'Fee updated successfully!' : 'Fee created successfully!');
    } catch (e) {
      console.error('Fee submission error:', e);
      console.error('Error response:', e?.response);
      
      let errorMessage = 'Failed to save fee';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.status === 400) {
        errorMessage = 'Invalid fee data. Please check all required fields and ensure amount is a positive number.';
      } else if (e?.response?.status === 403) {
        errorMessage = 'You do not have permission to create fees.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error. Please check the console for details and try again.';
      } else if (e?.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fee) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      amount: fee.amount,
      type: fee.type,
      dueDate: fee.dueDate,
      description: fee.description,
      applicableTo: fee.applicableTo
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (feeId) => {
    if (!window.confirm('Are you sure you want to delete this fee?')) return;
    
    setLoading(true);
    try {
      await FeesAPI.delete(feeId);
      await loadFees();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete fee');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'paid': '#10b981',
      'overdue': '#dc2626'
    };
    return colors[status] || '#64748b';
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      
      <div className="card" style={{maxWidth:1200, margin:'24px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
          <h2 style={{marginTop:0, marginBottom:0}}>💰 Fee Management</h2>
          <button 
            className="btn primary"
            onClick={() => {
              setShowCreateForm(true);
              setEditingFee(null);
              setFormData({
                name: '',
                amount: '',
                type: 'one-time',
                dueDate: '',
                description: '',
                applicableTo: 'all'
              });
            }}
          >
            ➕ Add New Fee
          </button>
        </div>

        {error && <div className="alert danger" style={{marginBottom:16}}>{error}</div>}

        {/* Payment Statistics Dashboard */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16, marginBottom:24}}>
          <div className="card" style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color:'white', padding:20, borderRadius:12}}>
            <div
style={{
fontSize:38,
fontWeight:"bold",
marginBottom:8,
animation:"pulse 2s infinite"
}}
>{paymentStats.totalFees}</div>
            <div style={{fontSize:14, opacity:0.9}}>Total Fees Created</div>
            <div style={{fontSize:18, fontWeight:600, marginTop:8}}>{formatCurrency(paymentStats.totalAmount)}</div>
          </div>
          
          <div className="card" style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)', color:'white', padding:20, borderRadius:12}}>
            <div style={{fontSize:32, fontWeight:'bold', marginBottom:8}}>{paymentStats.paidCount}</div>
            <div style={{fontSize:14, opacity:0.9}}>Students Paid</div>
            <div style={{fontSize:18, fontWeight:600, marginTop:8}}>{formatCurrency(paymentStats.paidAmount)}</div>
          </div>
          
          <div className="card" style={{background:'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color:'white', padding:20, borderRadius:12}}>
            <div style={{fontSize:32, fontWeight:'bold', marginBottom:8}}>{paymentStats.pendingCount}</div>
            <div style={{fontSize:14, opacity:0.9}}>Students Pending</div>
            <div style={{fontSize:18, fontWeight:600, marginTop:8}}>{formatCurrency(paymentStats.pendingAmount)}</div>
          </div>
          
          <div className="card" style={{background:'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color:'white', padding:20, borderRadius:12}}>
            <div style={{fontSize:32, fontWeight:'bold', marginBottom:8}}>
              {paymentStats.totalFees > 0 ? Math.round((paymentStats.paidAmount / paymentStats.totalAmount) * 100) : 0}%
            </div>
            <div style={{fontSize:14, opacity:0.9}}>Collection Rate</div>
            <div style={{fontSize:18, fontWeight:600, marginTop:8}}>
              {paymentStats.paidCount} of {paymentStats.totalFees} fees
            </div>
          </div>
        </div>
{/* Collection Progress */}
<div
  style={{
    background: "#fff",
    padding: 25,
    borderRadius: 15,
    marginBottom: 25,
    boxShadow: "0 5px 20px rgba(0,0,0,.08)"
  }}
>
  <h3 style={{ marginBottom: 15 }}>
    📈 Collection Progress
  </h3>

  <div
    style={{
      height: 18,
      background: "#eee",
      borderRadius: 20,
      overflow: "hidden"
    }}
  >
    <div
      style={{
        height: "100%",
        width: `${
          paymentStats.totalAmount
            ? (paymentStats.paidAmount / paymentStats.totalAmount) * 100
            : 0
        }%`,
        background: "linear-gradient(90deg,#22c55e,#16a34a)"
      }}
    />
  </div>

  <div
    style={{
      marginTop: 10,
      fontWeight: "bold",
      color: "#16a34a"
    }}
  >
    {paymentStats.totalAmount
      ? Math.round(
          (paymentStats.paidAmount / paymentStats.totalAmount) * 100
        )
      : 0}
    % Collected
  </div>
</div>
        {/* Create/Edit Fee Form */}
        {showCreateForm && (
          <div style={{
            background:'var(--color-bg)',
            padding:20,
            borderRadius:12,
            marginBottom:24
          }}>
            <h3 style={{marginTop:0, marginBottom:16}}>
              {editingFee ? 'Edit Fee' : 'Create New Fee'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16, marginBottom:16}}>
                <div>
                  <label>Fee Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Examination Fee"
                    required
                  />
                </div>
                <div>
                  <label>Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label>Fee Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="one-time">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="semester">Semester</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div style={{marginBottom:16}}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Fee description (optional)"
                  rows={3}
                />
              </div>

              <div style={{marginBottom:16}}>
                <label>Applicable To</label>
                <select
                  value={formData.applicableTo}
                  onChange={(e) => setFormData({...formData, applicableTo: e.target.value})}
                >
                  <option value="all">All Students</option>
                  <option value="specific-students">Specific Students</option>
                  <option value="specific-courses">Specific Courses</option>
                </select>
              </div>

              <div style={{display:'flex', gap:8}}>
                <button 
                  type="submit" 
                  className="btn primary" 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingFee ? 'Update Fee' : 'Create Fee')}
                </button>
                <button 
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingFee(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
<div style={{ marginBottom:20 }}>
  <input
    type="text"
    placeholder="🔍 Search fee..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: "100%",
      padding: "14px 18px",
      borderRadius: 12,
      border: "1px solid #ddd",
      fontSize: 15,
      outline: "none"
    }}
  />
</div>
        {/* Fees List */}
        <div className="card" style={{background:'var(--color-bg)', padding:20, borderRadius:12, marginBottom:24}}>
          <h3 style={{marginTop:0, marginBottom:16}}>📋 Created Fees</h3>
          {loading ? (
            <div style={{textAlign:'center', padding:40}}>
              <div className="muted">Loading fees...</div>
            </div>
          ) : fees.length === 0 ? (
            <div style={{textAlign:'center', padding:40}}>
              <div style={{fontSize:48, marginBottom:16}}>💰</div>
              <div className="muted" style={{fontSize:16}}>No fees created yet</div>
              <div className="muted" style={{fontSize:14, marginTop:8}}>Click "Add New Fee" to create your first fee</div>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'2px solid var(--border)'}}>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Student</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Fee Name</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Paid</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Remaining</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Due Date</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Applicable To</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Status</th>
                    <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees
.filter(fee =>
    fee.name.toLowerCase().includes(search.toLowerCase())
)
.map(fee => (
                    <tr key={fee._id} style={{ borderBottom: "1px solid var(--border)" }}>

  {/* Student */}
  <td style={{ padding: 12 }}>
    {fee.student?.name || "Unknown"}
  </td>

  {/* Fee Name */}
  <td style={{ padding: 12 }}>
    <b>{fee.name}</b>
  </td>

  {/* Paid */}
  <td style={{ padding: 12 }}>
    {formatCurrency(fee.paidAmount || 0)}
  </td>

  {/* Remaining */}
  <td style={{ padding: 12 }}>
    {formatCurrency(fee.remainingAmount || fee.amount)}
  </td>

  {/* Due Date */}
  <td style={{ padding: 12 }}>
    {fee.dueDate}
  </td>

  {/* Applicable */}
  <td style={{ padding: 12 }}>
    {fee.applicableTo}
  </td>

  {/* Status */}
  <td style={{ padding: 12 }}>
    <span
      style={{
        background: getStatusColor(fee.status),
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 6
      }}
    >
      {fee.status}
    </span>
  </td>

  {/* Actions */}
  <td style={{ padding: 12 }}>
    <button
      className="btn"
      onClick={() => handleEdit(fee)}
    >
      ✏ Edit
    </button>

    <button
      className="btn"
      onClick={() => handleDelete(fee._id)}
      style={{
        marginLeft: 8,
        background: "#fee2e2",
        color: "#dc2626"
      }}
    >
      🗑 Delete
    </button>
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
}
