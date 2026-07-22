import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FeesAPI } from '../api/client';

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentDate] = useState(new Date().toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));
  const [currentPlan, setCurrentPlan] = useState({
    name: 'Standard Plan',
    price: '₹3,999/month',
    priceNumeric: 3999,
    purchaseDate: new Date('2026-01-15').toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    nextBillingDate: new Date('2026-02-15').toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  });
  const [fees, setFees] = useState([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [showAllFees, setShowAllFees] = useState(false);
  const [showPaidFees, setShowPaidFees] = useState(false);
  const [showPendingFees, setShowPendingFees] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);

  const feeStructure = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '₹1,999/month',
      priceNumeric: 1999,
      features: [
        'Access to 5 courses',
        'Basic assignments',
        'Email support',
        'Certificate of completion'
      ],
      popular: false,
      color: '#64748b'
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      price: '₹3,999/month',
      priceNumeric: 3999,
      features: [
        'Access to 15 courses',
        'Advanced assignments',
        'Priority support',
        'Verified certificates',
        'Live sessions (2/month)',
        'Downloadable resources'
      ],
      popular: true,
      color: '#3b82f6'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '₹6,999/month',
      priceNumeric: 6999,
      features: [
        'Unlimited course access',
        'All premium features',
        '24/7 support',
        'Premium certificates',
        'Unlimited live sessions',
        '1-on-1 mentoring',
        'Career guidance',
        'Job placement assistance'
      ],
      popular: false,
      color: '#10b981'
    }
  ];

  // Sample payment history (in real app, this would come from API)
  const paymentHistory = [
    {
      id: 1,
      date: '2024-01-15',
      description: 'Standard Plan - Monthly',
      amount: 3999,
      status: 'Paid',
      method: 'Credit Card',
      transactionId: 'TXN001234567'
    },
    {
      id: 2,
      date: '2023-12-15',
      description: 'Standard Plan - Monthly',
      amount: 3999,
      status: 'Paid',
      method: 'UPI',
      transactionId: 'TXN001234566'
    },
    {
      id: 3,
      date: '2023-11-15',
      description: 'Basic Plan - Monthly',
      amount: 1999,
      status: 'Paid',
      method: 'Net Banking',
      transactionId: 'TXN001234565'
    },
    {
      id: 4,
      date: '2023-10-20',
      description: 'Library Fee - Annual',
      amount: 500,
      status: 'Paid',
      method: 'Cash',
      transactionId: 'TXN001234564'
    }
  ];

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    setFeesLoading(true);
    try {
      const { data } = await FeesAPI.list();
      setFees(Array.isArray(data?.fees) ? data.fees : []);
    } catch (error) {
      console.error('Failed to load fees:', error);
      // Keep using sample data if API fails
    } finally {
      setFeesLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFees = fees.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
    const pendingFees = fees.filter(fee => fee.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
    
    return {
      total: totalFees,
      paid: paidFees,
      pending: pendingFees
    };
  };

  const totals = calculateTotals();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handlePayment = (feeId) => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      alert('Payment processed successfully!');
      
      // Add transaction to history
      const fee = fees.find(f => f._id === feeId);
      if (fee) {
        const newTransaction = {
          id: Date.now(),
          date: new Date().toLocaleDateString('en-IN'),
          description: `Fee Payment - ${fee.name}`,
          amount: fee.amount,
          status: 'Paid',
          method: 'UPI',
          transactionId: `TXN${Date.now()}`
        };
        setTransactionHistory(prev => [newTransaction, ...prev]);
      }
      
      // Update fee status locally
      setFees(prev => prev.map(fee => 
        fee._id === feeId ? { ...fee, status: 'paid', paidAt: new Date() } : fee
      ));
    }, 2000);
  };

  const handlePlanPurchase = (planId) => {
    setLoading(true);
    const plan = feeStructure.find(p => p.id === planId);
    // Simulate plan purchase
    setTimeout(() => {
      setLoading(false);
      alert(`${plan.name} purchased successfully!`);
      
      // Add transaction to history
      const newTransaction = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-IN'),
        description: `${plan.name} - Monthly`,
        amount: plan.priceNumeric,
        status: 'Paid',
        method: 'Credit Card',
        transactionId: `TXN${Date.now()}`
      };
      setTransactionHistory(prev => [newTransaction, ...prev]);
      
      // Update current plan
      setCurrentPlan({
        name: plan.name,
        price: plan.price,
        priceNumeric: plan.priceNumeric,
        purchaseDate: new Date().toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });
      setSelectedPlan(null);
    }, 2000);
  };

  const getStatusColor = (status) => {
    const colors = {
      'paid': '#10b981',
      'pending': '#f59e0b',
      'overdue': '#dc2626'
    };
    return colors[status] || '#64748b';
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      
      {/* Current Date and Summary */}
      <div className="card" style={{maxWidth:900, margin:'24px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
          <h2 style={{marginTop:0, marginBottom:0}}>💳 My Billing</h2>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:14, color:'var(--muted)'}}>Current Date</div>
            <div style={{fontSize:16, fontWeight:600, color:'var(--text)'}}>{currentDate}</div>
          </div>
        </div>

        {/* Fee Summary Cards */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:20}}>
          <div style={{
            background:'linear-gradient(135deg, #10b981, #059669)',
            color:'white',
            padding:20,
            borderRadius:12,
            textAlign:'center',
            cursor:'pointer',
            transition:'all 0.2s ease'
          }}
          onClick={() => setShowAllFees(true)}>
            <div style={{fontSize:14, marginBottom:8, opacity:0.9}}>Total Fees</div>
            <div style={{fontSize:24, fontWeight:700}}>{formatCurrency(totals.total)}</div>
          </div>
          <div style={{
            background:'linear-gradient(135deg, #3b82f6, #2563eb)',
            color:'white',
            padding:20,
            borderRadius:12,
            textAlign:'center',
            cursor:'pointer',
            transition:'all 0.2s ease'
          }}
          onClick={() => setShowPaidFees(true)}>
            <div style={{fontSize:14, marginBottom:8, opacity:0.9}}>Paid Amount</div>
            <div style={{fontSize:24, fontWeight:700}}>{formatCurrency(totals.paid)}</div>
          </div>
          <div style={{
            background:'linear-gradient(135deg, #f59e0b, #d97706)',
            color:'white',
            padding:20,
            borderRadius:12,
            textAlign:'center',
            cursor:'pointer',
            transition:'all 0.2s ease',
            animation: totals.pending > 0 ? 'pulse 2s infinite' : 'none'
          }}
          onClick={() => setShowPendingFees(true)}>
            <div style={{fontSize:14, marginBottom:8, opacity:0.9}}>Pending Fees</div>
            <div style={{fontSize:24, fontWeight:700}}>{formatCurrency(totals.pending)}</div>
            {totals.pending > 0 && (
              <div style={{fontSize:12, marginTop:4}}>Click to view</div>
            )}
          </div>
        </div>

        {/* Current Plan Status */}
        <div style={{
          background:'linear-gradient(135deg, var(--primary), var(--secondary))',
          color:'white',
          padding:20,
          borderRadius:12,
          marginBottom:20
        }}>
          <div style={{fontSize:18, fontWeight:600, marginBottom:8}}>Current Plan: {currentPlan.name}</div>
          <div style={{fontSize:24, fontWeight:700, marginBottom:4}}>{currentPlan.price}</div>
          <div style={{fontSize:14, opacity:0.9, marginBottom:2}}>Purchased on: {currentPlan.purchaseDate}</div>
          <div style={{fontSize:14, opacity:0.9}}>Next billing date: {currentPlan.nextBillingDate}</div>
        </div>
      </div>

      {/* Teacher-Created Fees */}
      <div className="card" style={{maxWidth:900, margin:'0 auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <h3 style={{marginTop:0, marginBottom:20}}>📋 Teacher-Created Fees</h3>
        {feesLoading ? (
          <div style={{textAlign:'center', padding:40}}>
            <div className="muted">Loading fees...</div>
          </div>
        ) : fees.length === 0 ? (
          <div style={{textAlign:'center', padding:40, background:'var(--color-bg)', borderRadius:12}}>
            <div style={{fontSize:48, marginBottom:16}}>💰</div>
            <div className="muted" style={{fontSize:16}}>No fees assigned yet</div>
            <div className="muted" style={{fontSize:14, marginTop:8}}>Teachers will assign fees here</div>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border)'}}>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Fee Name</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Amount</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Type</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Due Date</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Status</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Description</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => (
                  <tr key={fee._id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:12, color:'var(--text)', fontWeight:600}}>{fee.name}</td>
                    <td style={{padding:12, fontWeight:600, color:'var(--text)'}}>{formatCurrency(fee.amount)}</td>
                    <td style={{padding:12}}>
                      <span style={{
                        background:'var(--color-bg)',
                        padding:'4px 8px',
                        borderRadius:6,
                        fontSize:12,
                        textTransform:'capitalize'
                      }}>
                        {fee.type}
                      </span>
                    </td>
                    <td style={{padding:12, color:'var(--text)'}}>{fee.dueDate}</td>
                    <td style={{padding:12}}>
                      <span style={{
                        background:getStatusColor(fee.status),
                        color:'white',
                        padding:'4px 8px',
                        borderRadius:6,
                        fontSize:12,
                        fontWeight:600,
                        textTransform:'capitalize'
                      }}>
                        {fee.status}
                      </span>
                    </td>
                    <td style={{padding:12, color:'var(--text)', fontSize:14}}>{fee.description || '-'}</td>
                    <td style={{padding:12}}>
                      {fee.status === 'pending' && (
                        <button 
                          className="btn primary"
                          onClick={() => handlePayment(fee._id)}
                          disabled={loading}
                          style={{padding:'4px 12px', fontSize:12}}
                        >
                          {loading ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
                      {fee.status === 'paid' && (
                        <span style={{color: '#10b981', fontSize:12, fontWeight:600}}>✓ Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{borderTop:'2px solid var(--border)'}}>
                  <td style={{padding:12, fontWeight:700, color:'var(--text)'}}>Total</td>
                  <td style={{padding:12, fontWeight:700, color:'var(--text)'}}>{formatCurrency(totals.total)}</td>
                  <td colSpan="5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Fee Structure */}
      <div className="card" style={{maxWidth:900, margin:'24px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <h3 style={{marginTop:0, marginBottom:24}}>📋 Available Plans</h3>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20}}>
          {feeStructure.map(plan => (
            <div key={plan.id} style={{
              border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
              borderRadius:12,
              padding:20,
              background: plan.popular ? 'var(--panel)' : 'var(--color-bg)',
              position:'relative',
              transition:'all 0.2s ease',
              cursor:'pointer'
            }} 
            className="billing-card"
            onClick={() => handlePlanSelect(plan.id)}>
              {plan.popular && (
                <div style={{
                  position:'absolute',
                  top:-12,
                  left:'50%',
                  transform:'translateX(-50%)',
                  background:plan.color,
                  color:'white',
                  padding:'4px 12px',
                  borderRadius:20,
                  fontSize:12,
                  fontWeight:600
                }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{textAlign:'center', marginBottom:20}}>
                <div style={{fontSize:20, fontWeight:600, marginBottom:8, color:plan.color}}>
                  {plan.name}
                </div>
                <div style={{fontSize:28, fontWeight:700, color:'var(--text)'}}>
                  {plan.price}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                {plan.features.map((feature, index) => (
                  <div key={index} style={{display:'flex', alignItems:'center', marginBottom:8}}>
                    <span style={{color:plan.color, marginRight:8}}>✓</span>
                    <span style={{fontSize:14, color:'var(--text)'}}>{feature}</span>
                  </div>
                ))}
              </div>
              <button 
                className={`btn ${selectedPlan === plan.id ? 'primary' : ''}`}
                style={{width:'100%', padding:12, borderRadius:8}}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanSelect(plan.id);
                }}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
        
        {selectedPlan && (
          <div style={{marginTop:24, textAlign:'center'}}>
            <button 
              className="btn primary"
              onClick={() => handlePlanPurchase(selectedPlan)}
              disabled={loading}
              style={{padding:'12px 32px', borderRadius:8, fontSize:16}}
            >
              {loading ? 'Processing...' : `Purchase ${feeStructure.find(p => p.id === selectedPlan).name}`}
            </button>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card" style={{maxWidth:900, margin:'24px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <h3 style={{marginTop:0, marginBottom:20}}>💳 Payment History</h3>
        {transactionHistory.length === 0 ? (
          <div style={{textAlign:'center', padding:40, background:'var(--color-bg)', borderRadius:12}}>
            <div style={{fontSize:48, marginBottom:16}}>💳</div>
            <div className="muted" style={{fontSize:16}}>No transactions yet</div>
            <div className="muted" style={{fontSize:14, marginTop:8}}>Your payment history will appear here</div>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border)'}}>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Date</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Description</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Amount</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Status</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Method</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map(transaction => (
                  <tr key={transaction.id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:12, color:'var(--text)'}}>{transaction.date}</td>
                    <td style={{padding:12, color:'var(--text)'}}>{transaction.description}</td>
                    <td style={{padding:12, fontWeight:600, color:'var(--text)'}}>{formatCurrency(transaction.amount)}</td>
                    <td style={{padding:12}}>
                      <span style={{
                        background:transaction.status === 'Paid' ? '#dcfce7' : '#fef2f2',
                        color:transaction.status === 'Paid' ? '#166534' : '#dc2626',
                        padding:'4px 8px',
                        borderRadius:6,
                        fontSize:12,
                        fontWeight:600
                      }}>
                        {transaction.status}
                      </span>
                    </td>
                    <td style={{padding:12, color:'var(--text)'}}>{transaction.method}</td>
                    <td style={{padding:12, color:'var(--text)', fontSize:12}}>{transaction.transactionId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .billing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* Fee Detail Modals */}
      {showPendingFees && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          zIndex:1000,
          padding:16
        }}>
          <div style={{
            background:'var(--panel)',
            borderRadius:16,
            padding:24,
            maxWidth:600,
            width:'100%',
            maxHeight:'80vh',
            overflowY:'auto'
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <h3 style={{margin:0, color:'var(--text'}}>⏰ Pending Fees</h3>
              <button 
                className="btn"
                onClick={() => setShowPendingFees(false)}
                style={{padding:8, borderRadius:8}}
              >
                ✕
              </button>
            </div>
            
            {fees.filter(f => f.status === 'pending').length === 0 ? (
              <div style={{textAlign:'center', padding:40}}>
                <div style={{fontSize:48, marginBottom:16}}>✅</div>
                <div className="muted" style={{fontSize:16}}>No pending fees!</div>
              </div>
            ) : (
              <div style={{display:'grid', gap:16}}>
                {fees.filter(f => f.status === 'pending').map(fee => (
                  <div key={fee._id} style={{
                    border:'1px solid var(--border)',
                    borderRadius:12,
                    padding:16,
                    background:'var(--color-bg)'
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:12}}>
                      <div>
                        <div style={{fontWeight:600, fontSize:16, marginBottom:4, color:'var(--text'}}>
                          {fee.name}
                        </div>
                        <div className="muted" style={{fontSize:14, marginBottom:2}}>
                          {fee.description || 'No description'}
                        </div>
                        <div style={{fontSize:12, color:'var(--muted)'}}>
                          Due: {fee.dueDate} | Type: {fee.type}
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:8}}>
                          {formatCurrency(fee.amount)}
                        </div>
                        <button 
                          className="btn primary"
                          onClick={() => handlePayment(fee._id)}
                          disabled={loading}
                          style={{padding:'6px 12px', fontSize:12}}
                        >
                          {loading ? 'Processing...' : 'Pay Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showPaidFees && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          zIndex:1000,
          padding:16
        }}>
          <div style={{
            background:'var(--panel)',
            borderRadius:16,
            padding:24,
            maxWidth:600,
            width:'100%',
            maxHeight:'80vh',
            overflowY:'auto'
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <h3 style={{margin:0, color:'var(--text'}}>✅ Paid Fees</h3>
              <button 
                className="btn"
                onClick={() => setShowPaidFees(false)}
                style={{padding:8, borderRadius:8}}
              >
                ✕
              </button>
            </div>
            
            {fees.filter(f => f.status === 'paid').length === 0 ? (
              <div style={{textAlign:'center', padding:40}}>
                <div style={{fontSize:48, marginBottom:16}}>💰</div>
                <div className="muted" style={{fontSize:16}}>No paid fees yet</div>
              </div>
            ) : (
              <div style={{display:'grid', gap:16}}>
                {fees.filter(f => f.status === 'paid').map(fee => (
                  <div key={fee._id} style={{
                    border:'1px solid var(--border)',
                    borderRadius:12,
                    padding:16,
                    background:'var(--color-bg)',
                    opacity:0.8
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:600, fontSize:16, marginBottom:4, color:'var(--text)'}}>
                          {fee.name}
                        </div>
                        <div className="muted" style={{fontSize:12}}>
                          Paid on: {fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                      <div style={{fontSize:18, fontWeight:700, color:'#10b981'}}>
                        {formatCurrency(fee.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAllFees && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          zIndex:1000,
          padding:16
        }}>
          <div style={{
            background:'var(--panel)',
            borderRadius:16,
            padding:24,
            maxWidth:600,
            width:'100%',
            maxHeight:'80vh',
            overflowY:'auto'
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <h3 style={{margin:0, color:'var(--text'}}>📊 All Fees</h3>
              <button 
                className="btn"
                onClick={() => setShowAllFees(false)}
                style={{padding:8, borderRadius:8}}
              >
                ✕
              </button>
            </div>
            
            <div style={{display:'grid', gap:16}}>
              {fees.map(fee => (
                <div key={fee._id} style={{
                  border:'1px solid var(--border)',
                  borderRadius:12,
                  padding:16,
                  background:'var(--color-bg)'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600, fontSize:16, marginBottom:4, color: 'var(--text)'}}>
                        {fee.name}
                      </div>
                      <div style={{fontSize:12, color: 'var(--muted)'}}>
                          Due: {fee.dueDate} | Type: {fee.type}
                        </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:18, fontWeight:700, color: 'var(--text)', marginBottom:4}}>
                        {formatCurrency(fee.amount)}
                      </div>
                      <span style={{
                        background:getStatusColor(fee.status),
                        color:'white',
                        padding:'2px 6px',
                        borderRadius:4,
                        fontSize:10,
                        fontWeight:600,
                        textTransform:'capitalize'
                      }}>
                        {fee.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
