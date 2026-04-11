import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col, Card, Badge, Button, Nav } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkedAlt,
  faFileAlt,
  faFolderOpen,
  faUserFriends,
  faChartLine,
  faChartBar,
  faChartPie,
  faWallet,
  faCalendarAlt,
  faMoneyCheckAlt,
  faClock,
  faCheckCircle,
  faArrowRight,
  faExclamationTriangle,
  faTasks,
  faBell
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

// Animation Variants
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } } };
const barVariants = { hidden: { height: 0 }, visible: (custom) => ({ height: custom, transition: { duration: 0.8, type: "spring", bounce: 0.3 } }) };

const Dashboard = () => {
  const [activityTab, setActivityTab] = useState("all");
  const [dashboardSummary, setDashboardSummary] = useState([
    { title: "Today Collection", value: 0, increase: "Live", icon: faCheckCircle, accent: "#10b981", prefix: "₹" },
    { title: "This Month Collection", value: 0, increase: "Live", icon: faWallet, accent: "#3b82f6", prefix: "₹" },
    { title: "Total Pending Amount", value: 0, increase: "Live", icon: faExclamationTriangle, accent: "#ef4444", prefix: "₹" }
  ]);
  const [recentActionsData, setRecentActionsData] = useState({ all: [], payments: [], documents: [] });
  const [pendingTasksState, setPendingTasksState] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [distributionData, setDistributionData] = useState([
    { label: "Sale Deeds", value: 0, color: "#f59e0b" },
    { label: "EC Records", value: 0, color: "#10b981" },
    { label: "Agreements", value: 0, color: "#0ea5e9" },
    { label: "Nagal/Adangal", value: 0, color: "#6366f1" }
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientsRes, docsRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/documents')
        ]);
        const clients = await clientsRes.json();
        const docs = await docsRes.json();
        
        const now = new Date();
        const currentMonthIdx = now.getMonth();
        const currentYear = now.getFullYear();
        const todayStr = now.toISOString().split('T')[0];

        let todaySum = 0;
        let monthSum = 0;
        let pendingSum = 0;

        docs.forEach(d => {
          pendingSum += (d.totalFee || 0) - (d.received || 0);
          if (d.date) {
            const docDateStr = d.date.split('T')[0];
            const dDateObj = new Date(d.date);
            if (docDateStr === todayStr) {
               todaySum += (d.received || 0);
            }
            if (dDateObj.getMonth() === currentMonthIdx && dDateObj.getFullYear() === currentYear) {
               monthSum += (d.received || 0);
            }
          }
        });

        setDashboardSummary([
          { title: "Today Collection", value: todaySum, increase: "Real-time", icon: faCheckCircle, accent: "#10b981", prefix: "₹" },
          { title: "This Month Collection", value: monthSum, increase: "Real-time", icon: faWallet, accent: "#3b82f6", prefix: "₹" },
          { title: "Total Pending Amount", value: pendingSum, increase: "Real-time", icon: faExclamationTriangle, accent: "#ef4444", prefix: "₹" }
        ]);

        // Computing Action Logs
        const sortedDocs = [...docs].sort((a,b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        
        const mapDocToAction = (d, isPayment) => {
           let actionText = isPayment ? `Payment of ₹${(d.received||0).toLocaleString()} received for ${d.recordNo||d.documentType}` : `New ${d.documentType} record ${d.recordNo||''} registered`;
           let iconType = isPayment ? 'success' : (d.documentType==='Agreement'?'primary':(d.status==='Pending'?'warning':'info'));
           return {
             time: new Date(d.createdAt || d.date).toLocaleDateString(),
             action: actionText,
             user: d.customerName || d.vendor || "Unknown",
             type: iconType
           };
        };

        const allActions = sortedDocs.slice(0, 10).map(d => mapDocToAction(d, false));
        const paymentActions = sortedDocs.filter(d => d.received > 0).slice(0, 10).map(d => mapDocToAction(d, true));
        const docActions = sortedDocs.slice(0, 10).map(d => mapDocToAction(d, false)); // We can reuse general updates

        setRecentActionsData({ all: allActions, payments: paymentActions, documents: docActions });

        // Computing Pending Tasks
        const pendingArray = sortedDocs.filter(d => d.status === 'Pending').slice(0, 6).map((d, i) => ({
          id: d._id || i,
          doc: d.recordNo || d.documentType,
          desc: `Client: ${d.customerName || d.vendor || 'Unknown'}`,
          priority: (d.totalFee - (d.received||0)) > 5000 ? "High" : "Medium"
        }));
        setPendingTasksState(pendingArray);

        const typeCounts = docs.reduce((acc, doc) => {
           acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
           return acc;
        }, {});
        const totalDocs = docs.length || 1;
        
        setDistributionData([
          { label: "Sale Deeds", value: Math.round(((typeCounts['Deed'] || 0) / totalDocs) * 100) || 0, color: "#f59e0b" },
          { label: "EC Records", value: Math.round(((typeCounts['EC'] || 0) / totalDocs) * 100) || 0, color: "#10b981" },
          { label: "Agreements", value: Math.round(((typeCounts['Agreement'] || 0) / totalDocs) * 100) || 0, color: "#0ea5e9" },
          { label: "Nagal/Adangal", value: Math.round(((typeCounts['Nagal'] || 0) / totalDocs) * 100) || 0, color: "#6366f1" }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyRev = {};
        docs.forEach(d => {
           if (d.date) {
             const m = new Date(d.date).getMonth();
             monthlyRev[m] = (monthlyRev[m] || 0) + (d.received || 0);
           }
        });
        
        const revData = [];
        const currentMonth = new Date().getMonth();
        for (let i = 5; i >= 0; i--) {
           let m = currentMonth - i;
           if (m < 0) m += 12;
           const val = monthlyRev[m] || 0;
           // Display logic relative to Max, or simple division
           const displayVal = val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val;
           revData.push({
             month: monthNames[m],
             rev: val > 0 ? Math.max((val / 100000) * 10, 5) : 2, // arbitrary scaling for chart height
             label: `₹${val.toLocaleString()}`
           });
        }
        setRevenueData(revData);
        
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboardData();
  }, []);

  const getThemeVars = () => {
    return `
      --bg-main: #f4f7f6;
      --bg-card: #ffffff;
      --bg-card-hover: #f8fafc;
      --bg-input: #f8fafc;
      --border-input: #e2e8f0;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --border-glass: #e2e8f0;
      --highlight: #d97706;
      --highlight-grad: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
      --shadow-main: rgba(0,0,0,0.08);
      --icon-bg: #f1f5f9;
    `;
  };

  const getStatusBadge = (priority) => {
    const config = priority === "High" ? { bg: "#ef4444", text: "HIGH" } 
                 : priority === "Medium" ? { bg: "#f59e0b", text: "MED" } 
                 : { bg: "#3b82f6", text: "LOW" };
    return (
      <Badge style={{ background: config.bg, padding: "4px 8px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "700" }}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="layout-page main-content dashboard-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .dashboard-shell {
          ${getThemeVars()}
          font-family: 'Inter', sans-serif;
          background: var(--bg-main);
          min-height: 100vh;
          margin-left: 280px;
          padding: 40px;
          position: relative;
          color: var(--text-primary);
          overflow-x: hidden;
        }

        /* Ambient floating shapes */
        .ambient-shape {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }
        .shape-1 { top: -100px; right: -50px; width: 400px; height: 400px; background: rgba(251, 191, 36, 0.08); animation: float 10s ease-in-out infinite; }
        .shape-2 { bottom: -150px; left: -100px; width: 500px; height: 500px; background: rgba(14, 165, 233, 0.05); animation: float 14s ease-in-out infinite reverse; }

        @keyframes float { 0% { transform: translate(0, 0); } 50% { transform: translate(20px, 30px); } 100% { transform: translate(0, 0); } }

        .page-header { margin-bottom: 24px; position:relative; z-index:1; }
        .page-title { font-family: 'Playfair Display', serif; font-size: 2.6rem; font-weight: 700; color: var(--highlight); margin-bottom: 8px; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }

        .glass-card {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          border-radius: 24px;
          border: 1px solid var(--border-glass);
          box-shadow: 0 15px 40px var(--shadow-main);
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .glass-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.12); }

        .overview-card { padding: 32px; }
        .overview-card::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 6px; background: var(--highlight-grad); }

        .stat-card {
          background: linear-gradient(145deg, #0f172a, #1e293b);
          border-radius: 20px; padding: 24px 20px; textAlign: left; position: relative; overflow: hidden;
          box-shadow: 0 15px 35px rgba(15,23,42,0.25); color: white; border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.4s ease;
        }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--highlight-grad); transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease; }
        .stat-card:hover { transform: translateY(-6px); box-shadow: 0 25px 45px rgba(15,23,42,0.4); }
        .stat-card:hover::before { transform: scaleX(1); }

        .stat-icon-wrapper { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease; }
        .stat-card:hover .stat-icon-wrapper { background: rgba(251,191,36,0.2); transform: scale(1.1) rotate(5deg); border-color: rgba(251,191,36,0.3); }
        
        .stat-number { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: #ffffff; margin-bottom: 4px; line-height: 1; }
        .stat-label { font-size: 0.9rem; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .stat-increase { font-size: 0.8rem; color: #10b981; font-weight: 600; margin-top: 8px; display: inline-flex; align-items: center; gap: 4px; background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 6px; }

        .card-header-styled { padding: 24px 24px 16px; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; }
        .card-header-styled h4 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); }
        .card-header-styled small { color: var(--text-secondary); font-weight: 500; font-size: 0.85rem;}

        /* Custom Bar Chart CSS */
        .bar-chart-container { display: flex; align-items: flex-end; justify-content: space-between; height: 260px; padding: 30px; gap: 12px; }
        .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; height: 100%; justify-content: flex-end; }
        .bar-track { width: 100%; max-width: 40px; height: 100%; background: var(--bg-input); border-radius: 12px; position: relative; overflow: hidden; }
        .bar-fill { position: absolute; bottom: 0; left: 0; width: 100%; background: var(--highlight-grad); border-radius: 12px; transition: filter 0.3s; cursor: pointer;}
        .bar-fill:hover { filter: brightness(1.15); }
        .bar-label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
        .bar-tooltip { position: absolute; top: -35px; background: #0f172a; color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.9rem; font-weight: 700; opacity: 0; transform: translateY(10px); transition: 0.2s ease; pointer-events: none; z-index: 100; white-space: nowrap;}
        .bar-wrapper:hover .bar-tooltip { opacity: 1; transform: translateY(0); }

        /* Distribution Bars */
        .dist-item { margin-bottom: 20px; }
        .dist-item-header { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
        .dist-track { height: 10px; background: var(--bg-input); border-radius: 999px; overflow: hidden; }
        .dist-fill { height: 100%; border-radius: 999px; }

        /* Activity List */
        .activity-nav { display: flex; gap: 10px; margin-bottom: 20px; padding: 0 24px;}
        .activity-tab { padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); background: transparent; border: 1px solid var(--border-glass); cursor: pointer; transition: 0.3s; }
        .activity-tab.active { background: #0f172a; color: white; border-color: #0f172a; }
        .activity-tab:hover:not(.active) { background: var(--bg-input); }

        .activity-list { padding: 0 24px 24px; max-height: 380px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--highlight) transparent; }
        .activity-item { display: flex; align-items: flex-start; gap: 16px; padding: 18px 0; border-bottom: 1px dashed var(--border-glass); transition: 0.2s ease; }
        .activity-item:hover { transform: translateX(4px); background: rgba(0,0,0,0.01); border-radius: 12px; padding: 18px 12px; margin: 0 -12px; border-bottom-color: transparent;}
        .activity-item:last-child { border-bottom: none; }
        
        .activity-icon-wrapper { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);}
        .icon-success { background: linear-gradient(135deg, #d1fae5, #a7f3d0); color: #059669; }
        .icon-primary { background: linear-gradient(135deg, #e0e7ff, #c7d2fe); color: #4338ca; }
        .icon-warning { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #d97706; }
        .icon-info { background: linear-gradient(135deg, #e0f2fe, #bae6fd); color: #0284c7; }

        .activity-title { font-weight: 600; color: var(--text-primary); margin-bottom: 4px; font-size: 0.95rem; line-height: 1.4; }
        .activity-time { color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; display: flex; align-items: center; gap: 6px; }

        /* Tasks List */
        .task-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 12px; border-radius: 14px; border: 1px solid var(--border-glass); background: #ffffff; transition: 0.2s ease; cursor: pointer; }
        .task-item:hover { border-color: var(--highlight); box-shadow: 0 4px 15px rgba(217,119,6,0.1); transform: translateY(-2px); }
        
        @media (max-width: 991px) {
          .dashboard-shell { margin-left: 0; padding: 20px; }
        }
      `}</style>
      
      {/* Background Ambience */}
      <div className="ambient-shape shape-1"></div>
      <div className="ambient-shape shape-2"></div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{position: 'relative', zIndex: 1}}>
        <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h2 className="page-title">Workspace Dashboard</h2>
            <p style={{color:'var(--text-secondary)', fontSize: '1.05rem'}} className="mb-0">Unified law operations, billing analytics, and performance tracking.</p>
          </div>
          <div className="d-flex gap-3">
            <Button variant="light" style={{borderRadius: '12px', padding: '12px 20px', fontWeight: 600, border: '1px solid var(--border-glass)', background: 'white', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.05)'}}>
              <FontAwesomeIcon icon={faBell} style={{color: '#d97706'}} /> Notifications <Badge bg="danger" style={{borderRadius: '50%'}}>3</Badge>
            </Button>
            <Button style={{background: 'var(--highlight-grad)', borderRadius: '12px', padding: '12px 24px', fontWeight: 600, border: 'none', boxShadow: '0 8px 20px rgba(217,119,6,0.2)'}}>
              <FontAwesomeIcon icon={faMoneyCheckAlt} className="me-2" /> Generate Invoices
            </Button>
          </div>
        </div>

        {/* Global Stats Array */}
        <Row className="g-4 mb-5 mt-2">
          {dashboardSummary.map((metric) => (
            <Col xl={4} lg={4} md={12} key={metric.title}>
              <motion.div variants={itemVariants}>
                <div className="stat-card">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                      <div className="stat-number">{metric.prefix || ''}{metric.value?.toLocaleString('en-IN') || 0}</div>
                      <div className="stat-label">{metric.title}</div>
                    </div>
                    <div className="stat-icon-wrapper">
                      <FontAwesomeIcon icon={metric.icon} style={{color: metric.accent, fontSize: '1.2rem'}} />
                    </div>
                  </div>
                  <div className="stat-increase">{metric.increase}</div>
                </div>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* Advanced Charts Section */}
        <Row className="g-4 mb-5">
          <Col xl={8} lg={12}>
            <motion.div variants={itemVariants} className="h-100">
              <div className="glass-card h-100 d-flex flex-column">
                <div className="card-header-styled">
                  <div>
                    <h4>Revenue Intake Trend</h4>
                    <small>Monthly payment realizations across all module types.</small>
                  </div>
                  <Badge bg="light" text="dark" style={{fontWeight: 700, padding: "8px 12px", border: "1px solid var(--border-glass)", borderRadius: "10px"}}>Last 6 Months</Badge>
                </div>
                {/* Custom Framer Motion Bar Chart */}
                <div className="bar-chart-container">
                  {revenueData.map((data, index) => (
                    <div className="bar-wrapper" key={index}>
                      <div className="bar-tooltip">{data.label}</div>
                      <div className="bar-track">
                        <motion.div 
                          className="bar-fill"
                          variants={barVariants}
                          custom={`${(data.rev / 30) * 100}%`}
                        />
                      </div>
                      <div className="bar-label">{data.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </Col>

          <Col xl={4} lg={12}>
            <motion.div variants={itemVariants} className="h-100">
              <div className="glass-card h-100 d-flex flex-column">
                <div className="card-header-styled">
                  <div>
                    <h4>Record Distribution</h4>
                    <small>Volume by document type</small>
                  </div>
                  <FontAwesomeIcon icon={faChartPie} style={{color: '#d97706', fontSize: '1.2rem'}} />
                </div>
                
                <div style={{padding: '30px 24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  {distributionData.map((item, index) => (
                    <div className="dist-item" key={index}>
                      <div className="dist-item-header">
                        <span style={{display: 'flex', alignItems: 'center', gap: 8}}>
                          <span style={{width: 10, height: 10, borderRadius: '50%', background: item.color}}></span>
                          {item.label}
                        </span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="dist-track">
                        <motion.div 
                          className="dist-fill" 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, delay: 0.3 + (index * 0.1), ease: "easeOut" }}
                          style={{ background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </Col>
        </Row>

        {/* Action Log and Tasks */}
        <Row className="g-4 mb-5">
          <Col xl={7} lg={12}>
            <motion.div variants={itemVariants} className="h-100">
              <div className="glass-card h-100">
                 <div className="card-header-styled" style={{borderBottom: 'none'}}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Live Action Log</h4>
                    <small style={{ color: '#64748b', fontWeight: 500 }}>Real-time updates from your team</small>
                  </div>
                  <FontAwesomeIcon icon={faClock} style={{color: '#94a3b8'}} />
                </div>
                
                <div className="activity-nav">
                  <button className={`activity-tab ${activityTab === 'all' ? 'active' : ''}`} onClick={() => setActivityTab('all')}>All Updates</button>
                  <button className={`activity-tab ${activityTab === 'payments' ? 'active' : ''}`} onClick={() => setActivityTab('payments')}>Payments</button>
                  <button className={`activity-tab ${activityTab === 'documents' ? 'active' : ''}`} onClick={() => setActivityTab('documents')}>Documents</button>
                </div>

                <div className="activity-list">
                  <AnimatePresence mode="popLayout">
                    {recentActionsData[activityTab].map((item, index) => {
                      let icon, iconClass;
                      if (item.type === 'success') { icon = faCheckCircle; iconClass = 'icon-success'; }
                      else if (item.type === 'primary') { icon = faUserFriends; iconClass = 'icon-primary'; }
                      else if (item.type === 'warning') { icon = faExclamationTriangle; iconClass = 'icon-warning'; }
                      else { icon = faFileAlt; iconClass = 'icon-info'; }

                      return (
                        <motion.div 
                          className="activity-item" 
                          key={item.action + index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={`activity-icon-wrapper ${iconClass}`}>
                            <FontAwesomeIcon icon={icon} />
                          </div>
                          <div className="activity-content">
                            <div className="activity-title">{item.action}</div>
                            <div className="activity-time">
                              <span style={{color: '#0f172a', fontWeight: 700}}>{item.user}</span> • {item.time}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </Col>

          <Col xl={5} lg={12}>
            <motion.div variants={itemVariants} className="h-100">
              <div className="glass-card h-100" style={{background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'}}>
                 <div className="card-header-styled">
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Pending Actions</h4>
                    <small style={{ color: '#64748b', fontWeight: 500 }}>Tasks requiring administrator approval</small>
                  </div>
                  <div style={{background: '#fee2e2', color: '#dc2626', padding: '8px', borderRadius: '10px'}}><FontAwesomeIcon icon={faTasks} /></div>
                </div>
                
                <div style={{padding: '24px'}}>
                  {pendingTasksState.length === 0 ? (
                    <div className="text-center py-5 text-muted border rounded-4 bg-light" style={{borderStyle:'dashed'}}>No pending tasks! Current workflow is clear.</div>
                  ) : (
                    pendingTasksState.map((task, idx) => (
                      <motion.div 
                        key={task.id} 
                        className="task-item"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                          <div style={{background: 'rgba(217,119,6,0.1)', color: '#d97706', width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem'}}>
                            {task.doc.split('-')[0].substring(0,3).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontWeight: 700, color: '#0f172a', fontSize: '0.95rem'}}>{task.doc}</div>
                            <div style={{color: '#475569', fontSize: '0.85rem'}}>{task.desc}</div>
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(task.priority)}
                        </div>
                      </motion.div>
                    ))
                  )}
                  <Button variant="outline-primary" style={{width: '100%', marginTop: '10px', borderRadius: '12px', fontWeight: 600, color: '#0f172a', borderColor: 'var(--border-glass)'}}>
                    View All Tasks →
                  </Button>
                </div>

              </div>
            </motion.div>
          </Col>
        </Row>
      </motion.div>
    </div>
  );
};

export default Dashboard;
