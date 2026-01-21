import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Wallet,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Clock,
  DollarSign,
  User,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLoans, requestLoan, getStats } from './api';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from './contract';

const Sidebar = ({ activeTab, setActiveTab, account }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'buyer', icon: PlusCircle, label: 'Buyer Portal' },
    { id: 'vendor', icon: Wallet, label: 'Vendor Funding' },
    { id: 'lender', icon: BarChart3, label: 'Lender Analytics' },
    { id: 'history', icon: FileText, label: 'History' },
  ];

  return (
    <div className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', color: 'var(--primary-orange)' }}>
        <Zap size={32} fill="currentColor" />
        <h2 style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>FinFlow</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === item.id ? 'var(--accent-amber-light)' : 'transparent',
              color: activeTab === item.id ? 'var(--primary-orange)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </div>

      {account && (
        <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-light)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>
            <Activity size={12} /> Connected
          </div>
          <p style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{account}</p>
        </div>
      )}
    </div >
  );
};

const DashboardData = ({ stats }) => {
  const displayStats = [
    { label: 'Active Capital', value: `$${stats.total_capital?.toLocaleString() || '0'}`, icon: Wallet, color: '#F97316' },
    { label: 'Financed POs', value: stats.financed_pos || '0', icon: FileText, color: '#F59E0B' },
    { label: 'Average Risk', value: `${(stats.average_risk * 100).toFixed(1)}%`, icon: ShieldCheck, color: '#EA580C' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
      {displayStats.map((stat, idx) => (
        <motion.div
          key={idx}
          className="premium-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
              <h3 style={{ fontSize: '28px', color: 'var(--text-main)' }}>{stat.value}</h3>
            </div>
            <div style={{ background: `${stat.color}15`, padding: '10px', borderRadius: '12px', color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const LoanList = ({ loans }) => {
  return (
    <div className="po-list">
      {loans.length === 0 ? (
        <div className="glass-morphism" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
          <p style={{ color: 'var(--text-muted)' }}>No active loans found in the system.</p>
        </div>
      ) : loans.map((loan, idx) => (
        <motion.div
          key={loan.id}
          className="premium-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div className={`status-badge status-${loan.status.toLowerCase().replace(' ', '-')}`}>
              {loan.status}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>#{loan.po_id}</p>
          </div>

          <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>PO Funding Request</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>{loan.vendor_address.slice(0, 10)}...</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <DollarSign size={24} color="var(--primary-orange)" />
            <h3 style={{ fontSize: '24px' }}>{loan.amount.toLocaleString()}</h3>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Risk Probability</p>
              <p style={{ fontWeight: 600, color: loan.risk_score < 0.3 ? '#10B981' : loan.risk_score < 0.6 ? '#F59E0B' : '#EF4444' }}>
                {(loan.risk_score * 100).toFixed(1)}%
              </p>
            </div>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
              Details
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const BuyerPortal = ({ account }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    deliveryDate: '',
    category: 'Electronics'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.ethereum) return alert('Please install MetaMask');
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const deliveryTimestamp = Math.floor(new Date(formData.deliveryDate).getTime() / 1000);
      const tx = await contract.createPurchaseOrder(
        formData.vendor,
        ethers.parseUnits(formData.amount, 18), // assuming 18 decimals for PO amount representation
        deliveryTimestamp,
        formData.category
      );
      await tx.wait();
      alert('PO Created successfully on Blockchain!');
    } catch (err) {
      console.error(err);
      alert('Error creating PO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="premium-card"
      style={{ maxWidth: '600px', margin: '0 auto' }}
    >
      <h2 style={{ marginBottom: '32px' }}>Create Purchase Order</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Vendor Wallet Address</label>
          <input
            type="text"
            required
            placeholder="0x..."
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Amount (USD)</label>
            <input
              type="number"
              required
              placeholder="50,000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Delivery Date</label>
            <input
              type="date"
              required
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Goods Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}
          >
            <option>Electronics</option>
            <option>Textiles</option>
            <option>Construction</option>
            <option>Food</option>
          </select>
        </div>
        <button disabled={loading || !account} type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
          {loading ? 'Processing...' : account ? 'Initialize Secure PO' : 'Connect Wallet to Start'}
        </button>
      </form>
    </motion.div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({ total_capital: 0, financed_pos: 0, average_risk: 0 });
  const [account, setAccount] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [loansRes, statsRes] = await Promise.all([getLoans(), getStats()]);
      setLoans(loansRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Setup WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NEW_LOAN' || message.type === 'LOAN_REPAID') {
        fetchData();
      }
    };

    return () => ws.close();
  }, [fetchData]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) {
        console.error(err);
      }
    } else {
      alert('MetaMask not detected');
    }
  };

  return (
    <div className="App">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} account={account} />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>
              {activeTab === 'dashboard' ? 'Market Overview' :
                activeTab === 'buyer' ? 'Strategic Procurement' :
                  activeTab === 'vendor' ? 'Liquidity Dashboard' : 'Capital Allocation'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Welcome back, Regional Director</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {!account ? (
              <button onClick={connectWallet} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} /> Connect Wallet
              </button>
            ) : (
              <div className="glass-morphism" style={{ padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Hardhat Local Active</span>
              </div>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DashboardData stats={stats} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
                <h3>Recent Funding Operations</h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--primary-orange)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View All <ArrowRight size={16} />
                </button>
              </div>
              <LoanList loans={loans} />
            </motion.div>
          )}
          {activeTab === 'buyer' && <BuyerPortal account={account} key="buyer" />}
          {activeTab === 'vendor' && <VendorPortal account={account} key="vendor" onAction={fetchData} />}
          {activeTab === 'lender' && (
            <motion.div key="lender">
              <DashboardData stats={stats} />
              <div style={{ marginTop: '40px' }}>
                <h3>Credit Risk Distribution</h3>
                <div style={{ height: '300px', background: 'var(--bg-light)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <BarChart3 size={48} opacity={0.5} />
                  <p>Advanced Risk Analytics Module Active</p>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history">
              <h3>Transaction History</h3>
              <LoanList loans={loans.filter(l => l.status === 'Repaid')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const VendorPortal = ({ account, onAction }) => {
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPOs = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const count = await contract.poCount();
        const items = [];
        for (let i = 1; i <= count; i++) {
          const po = await contract.purchaseOrders(i);
          if (po.vendor.toLowerCase() === account?.toLowerCase() || !account) {
            items.push({
              id: Number(po.id),
              buyer: po.buyer,
              vendor: po.vendor,
              amount: ethers.formatUnits(po.amount, 18),
              deliveryDate: new Date(Number(po.deliveryDate) * 1000).toLocaleDateString(),
              category: po.goodsCategory,
              status: po.status
            });
          }
        }
        setPOs(items);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPOs();
  }, [account]);

  const handleRequestLoan = async (poId) => {
    setLoading(true);
    try {
      await requestLoan(poId);
      alert('Loan request submitted! AI model is processing risk score...');
      onAction();
    } catch (err) {
      console.error(err);
      alert('Error requesting loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
      {pos.length === 0 ? (
        <div className="glass-morphism" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
          <p style={{ color: 'var(--text-muted)' }}>No Purchase Orders found for your address.</p>
        </div>
      ) : pos.map((po) => (
        <motion.div key={po.id} className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="status-badge status-pending">PO #{po.id}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{po.deliveryDate}</span>
          </div>
          <h4 style={{ marginBottom: '8px' }}>{po.category} Supply</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>From: {po.buyer.slice(0, 10)}...</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <DollarSign size={24} color="var(--primary-orange)" />
            <h3 style={{ fontSize: '24px' }}>{Number(po.amount).toLocaleString()}</h3>
          </div>
          <button
            disabled={loading}
            onClick={() => handleRequestLoan(po.id)}
            className="btn-primary"
            style={{ width: '100%', background: 'var(--primary-indigo)' }}
          >
            {loading ? 'Analyzing...' : 'Request Instant Funding'}
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default App;
