import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, Table, Card, Row, Col, Badge, Container, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye, faSearch, faTimes, faArrowUp, faArrowDown,
  faHistory, faFileAlt, faMoneyCheckAlt, faCheckCircle,
  faClock, faUser, faBuilding, faMapMarkerAlt, faIdCard, faWallet, faMoneyBillWave
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";

const dummyPaymentData = [
  { id: 1, date: "2024-10-01", recordType: "EC", recordNo: "EC001", vendor: "Vendor A", customerName: "John Doe", office: "Office 1", nagar: "Nagar 1", tpNo: "TP001", plotNo: "A1", reference: "REF001", deed: "Sale Deed", docNo: "DOC001", fieldVisit: "Yes", returnDocument: "No", amount: 50000, commission: 5000, others: 1000, total: 56000, status: "Paid" },
  { id: 2, date: "2024-10-05", recordType: "Nagal", recordNo: "NAG001", vendor: "Vendor B", customerName: "Jane Smith", office: "Office 2", nagar: "Nagar 2", tpNo: "TP002", plotNo: "B2", reference: "REF002", deed: "Nagal/Adangal", docNo: "DOC002", fieldVisit: "No", returnDocument: "Yes", amount: 75000, commission: 7500, others: 2000, total: 84500, status: "Pending" },
  { id: 3, date: "2024-10-10", recordType: "Agreement", recordNo: "AGR001", vendor: "Vendor C", customerName: "Bob Johnson", office: "Office 1", nagar: "Nagar 3", tpNo: "TP003", plotNo: "C3", reference: "REF003", deed: "Agreement", docNo: "DOC003", fieldVisit: "Yes", returnDocument: "Yes", amount: 65000, commission: 6500, others: 1500, total: 73000, status: "Paid" },
  { id: 4, date: "2024-10-15", recordType: "Deed", recordNo: "DEED001", vendor: "Vendor D", customerName: "Alice Williams", office: "Office 3", nagar: "Nagar 4", tpNo: "TP004", plotNo: "D4", reference: "REF004", deed: "Release", docNo: "DOC004", fieldVisit: "No", returnDocument: "No", amount: 60000, commission: 6000, others: 1800, total: 67800, status: "Pending" }
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } } };
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

const Payment = () => {
  const [activeTab, setActiveTab] = useState("payment");
  const [paymentData, setPaymentData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ recordType: "", status: "", vendor: "", date: "" });
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      
      const formatted = data.map(d => ({
        ...d,
        id: d._id,
        date: d.date ? d.date.split('T')[0] : "",
        recordType: d.documentType || "",
        recordNo: d.recordNo || d.ecNo || d.tpNo || "",
        vendor: d.vendor || "",
        customerName: d.customerName || "",
        office: d.office || "",
        nagar: d.nagar || "",
        tpNo: d.tpNo || "",
        plotNo: d.plotNo || "",
        reference: d.reference || d.vendor || "",
        deed: d.deed || d.agreementType || "",
        docNo: d.docNo || "",
        fieldVisit: d.fieldVisit || "No",
        returnDocument: d.returnDocument || "No",
        amount: d.amount || d.editFee || 0,
        commission: d.commission || d.stamp || 0,
        others: d.others || 0,
        total: d.totalFee || 0,
        received: d.received || 0,
        balance: d.balance || 0,
        status: d.status || "Pending"
      }));
      setPaymentData(formatted);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let data = [...paymentData].filter(item => item.received > 0);

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      data = data.filter(item =>
        item.recordNo.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.nagar.toLowerCase().includes(q)
      );
    }

    if (filters.recordType) data = data.filter(item => item.recordType === filters.recordType);
    if (filters.status) data = data.filter(item => item.status === filters.status);
    if (filters.vendor) data = data.filter(item => item.vendor === filters.vendor);
    if (filters.date) data = data.filter(item => item.date === filters.date);

    if (sortConfig.key) {
      data.sort((a, b) => {
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];

        if (sortConfig.key === "date") {
          return sortConfig.direction === "asc" ?
            new Date(valueA) - new Date(valueB) :
            new Date(valueB) - new Date(valueA);
        }

        if (typeof valueA === "number" && typeof valueB === "number") {
          return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
        }

        return sortConfig.direction === "asc" ?
          String(valueA).localeCompare(String(valueB)) :
          String(valueB).localeCompare(String(valueA));
      });
    }

    setFilteredData(data);
  }, [paymentData, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleView = (item) => {
    setCurrentPayment(item);
    setShowViewModal(true);
  };

  const clearFilters = () => {
    setFilters({ recordType: "", status: "", vendor: "", date: "" });
    setSearchTerm("");
    setSortConfig({ key: "date", direction: "desc" });
  };

  const getThemeVars = () => {
    return `
      --bg-main: #f4f7f6;
      --bg-card: #ffffff;
      --bg-card-hover: #f8fafc;
      --bg-input: #ffffff;
      --border-input: #e2e8f0;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --border-glass: #e2e8f0;
      --modal-bg: #ffffff;
      --modal-header-bg: #f8fafc;
      --icon-bg: #f1f5f9;
      --action-bar: rgba(255, 255, 255, 0.95);
      --highlight: #d97706;
      --highlight-grad: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
      --btn-text: #0f172a;
      --shadow-main: rgba(0,0,0,0.08);
    `;
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const getStatusBadge = (status) => {
    const config = status === "Paid" ? { bg: "#10b981", icon: faCheckCircle } : { bg: "#f59e0b", icon: faClock };
    return (
      <Badge style={{ background: `linear-gradient(135deg, ${config.bg} 0%, ${config.bg}dd 100%)`, color: "white", border: "none", padding: "6px 14px", borderRadius: "12px", fontWeight: "600", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: `0 4px 10px rgba(0,0,0,0.3)` }}>
        <FontAwesomeIcon icon={config.icon} size="sm" /> {status}
      </Badge>
    );
  };

  const totalCount = filteredData.length;
  const pendingCount = filteredData.filter(item => item.status === "Pending").length;
  const totalPaid = filteredData.filter(item => item.status === "Paid").reduce((sum, item) => sum + item.total, 0);
  const totalPending = filteredData.filter(item => item.status === "Pending").reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="layout-page">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
          
          .layout-page { ${getThemeVars()} background: var(--bg-main); min-height: 100vh; font-family: 'Inter', sans-serif; position: relative; overflow-x: hidden; color: var(--text-primary); transition: background 0.3s ease; }
          .layout-page::before { content: "💸"; position: fixed; font-size: 280px; opacity: 0.02; bottom: 100px; right: -50px; z-index: 0; transform: rotate(-25deg); pointer-events: none; }
          .main-content { margin-left: 280px; padding: 40px; position: relative; z-index: 1; }
          @media (max-width: 991px) { .main-content { margin-left: 0; padding: 20px; } }

          .page-header { margin-bottom: 24px; }
          .page-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: var(--highlight); margin-bottom: 8px; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          
          .stat-card { background: #0f172a; border-radius: 20px; padding: 24px 16px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 15px 35px rgba(15,23,42,0.2); transition: all 0.4s ease; color: white; border: 1px solid rgba(255,255,255,0.05); }
          .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%); transform: scaleX(0); transition: 0.4s ease; }
          .stat-card:hover { transform: translateY(-5px); box-shadow: 0 25px 45px rgba(15,23,42,0.3); }
          .stat-card:hover::before { transform: scaleX(1); }

          .stat-icon-wrapper { width: 54px; height: 54px; border-radius: 16px; background: linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(217,119,6,0.2) 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 1px solid rgba(251,191,36,0.3); transition: all 0.3s ease; }
          .stat-card:hover .stat-icon-wrapper { transform: scale(1.1) rotate(5deg); background: rgba(251,191,36,0.2); }
          .stat-icon { font-size: 1.5rem; color: #fbbf24; }
          .stat-number { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
          .stat-label { font-size: 0.85rem; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
          
          .controls-bar { background: var(--action-bar); backdrop-filter: blur(24px); border-radius: 20px; padding: 24px; margin-bottom: 30px; box-shadow: 0 10px 40px var(--shadow-main); border: 1px solid var(--border-glass); }
          .search-container { position: relative; }
          .search-bar, .filter-select { background: var(--bg-input); border: 2px solid var(--border-input); border-radius: 14px; padding: 14px 18px; color: var(--text-primary); font-size: 0.95rem; font-weight: 500; width: 100%; transition: all 0.3s ease; }
          .search-bar { padding-left: 48px; }
          .search-bar:focus, .filter-select:focus { outline: none; border-color: var(--highlight); box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.15); color: var(--text-primary);}
          .search-bar::placeholder { color: var(--text-secondary); }
          .filter-select option { background: var(--bg-input); color: var(--text-primary); }
          .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 1.1rem; }
          
          .btn-gold { background: var(--highlight-grad); border: none; border-radius: 14px; padding: 14px 28px; font-weight: 600; color: var(--btn-text); font-size: 0.95rem; box-shadow: 0 8px 20px rgba(217,119,6,0.15); transition: all 0.3s ease; display: inline-flex; align-items: center; justify-content: center; width: 100%; text-transform: uppercase; letter-spacing: 0.5px; }
          .btn-gold:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(217,119,6,0.35); color: var(--btn-text);}
          .filter-toggle { background: var(--icon-bg); border: 1px solid var(--border-input); border-radius: 14px; padding: 14px 18px; color: var(--text-primary); font-weight: 600; cursor: pointer; transition: all 0.3s ease; width: 100%; text-align: center; }
          .filter-toggle:hover { filter: brightness(1.2); }
          
          /* Table Styles */
          .table-wrapper { background: var(--bg-card); backdrop-filter: blur(10px); border-radius: 20px; overflow: hidden; border: 1px solid var(--border-glass); box-shadow: 0 10px 30px var(--shadow-main); padding: 10px 24px;}
          .table-modern { margin-bottom: 0; color: var(--text-primary); border-collapse: separate; border-spacing: 0 8px; }
          .table-modern thead th { background: transparent; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.85rem; padding: 18px 16px; border: none; border-bottom: 2px solid rgba(0,0,0,0.05); letter-spacing: 0.5px; cursor: pointer; transition: color 0.2s; white-space: nowrap; }
          .table-modern thead th:hover { color: var(--highlight); }
          .table-modern tbody tr { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border-radius: 12px; }
          .table-modern tbody tr:hover { transform: translateY(-4px) scale(1.005); box-shadow: 0 10px 25px rgba(217,119,6,0.1); position: relative; z-index: 10; cursor: pointer; }
          .table-modern tbody td { padding: 18px 16px; vertical-align: middle; border: none; font-weight: 500; font-size: 0.95rem; }
          .table-modern tbody td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
          .table-modern tbody td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
          
          .sort-icon { margin-left: 8px; display: inline-block; }

          .circle-btn { width: 38px; height: 38px; border-radius: 50%; border: none; display: inline-flex; align-items: center; justify-content: center; background: var(--icon-bg); color: var(--text-secondary); font-size: 0.9rem; transition: all 0.2s ease; box-shadow: 0 2px 5px var(--shadow-main); }
          .circle-btn.view:hover { background: var(--highlight); color: #0f172a; }

          /* Modals */
          .details-modal .modal-content {
            background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px);
            border-radius: 28px; border: none; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); overflow: hidden;
          }
          .details-modal .modal-header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: none; padding: 24px 32px; color: white; display: flex; align-items: center; }
          .details-modal .modal-title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.6rem; letter-spacing: -0.5px; }
          .details-modal .btn-close { filter: invert(1) grayscale(100%) brightness(200%); opacity: 0.8; }
          .details-modal .modal-body { padding: 32px; }

          .form-label-modern { font-weight: 600; color: #475569; margin-bottom: 8px; font-size: 0.9rem; }
          .form-control-modern {
            border-radius: 14px; border: 2px solid #e2e8f0; background: #f8fafc;
            padding: 14px 18px; font-size: 0.95rem; font-weight: 500; color: #1e293b;
          }
          .form-control-modern:disabled { opacity: 0.85; background: #f1f5f9; border-color: transparent; }

          .total-alert { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: none; border-radius: 16px; padding: 20px; font-weight: 700; color: #92400e; font-size: 1.2rem; text-align: center; }
          .modal-content, .modal-body { scrollbar-color: var(--highlight) transparent; scrollbar-width: thin; background: #ffffff !important; }
        `}</style>

        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Payment History</h2>
            <p style={{color:'var(--text-secondary)'}} className="mb-0">Elegant cross-record payment tracking and billing overview</p>
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Stats Cards */}
          <Row className="mb-4 g-4">
            <Col lg={3} md={6}><motion.div variants={itemVariants}><div className="stat-card"><div className="stat-icon-wrapper"><FontAwesomeIcon icon={faFileAlt} className="stat-icon" /></div><div className="stat-number">{totalCount}</div><div className="stat-label">Total Records</div></div></motion.div></Col>
            <Col lg={3} md={6}><motion.div variants={itemVariants}><div className="stat-card"><div className="stat-icon-wrapper"><FontAwesomeIcon icon={faClock} className="stat-icon" /></div><div className="stat-number">{pendingCount}</div><div className="stat-label">Pending Payments</div></div></motion.div></Col>
            <Col lg={3} md={6}><motion.div variants={itemVariants}><div className="stat-card"><div className="stat-icon-wrapper"><FontAwesomeIcon icon={faMoneyCheckAlt} className="stat-icon" /></div><div className="stat-number">{formatCurrency(totalPaid)}</div><div className="stat-label">Paid Amount</div></div></motion.div></Col>
            <Col lg={3} md={6}><motion.div variants={itemVariants}><div className="stat-card"><div className="stat-icon-wrapper"><FontAwesomeIcon icon={faMoneyBillWave} className="stat-icon" /></div><div className="stat-number">{formatCurrency(totalPending)}</div><div className="stat-label">Pending Amount</div></div></motion.div></Col>
          </Row>

          {/* Filter Controls */}
          <motion.div variants={itemVariants}>
            <div className="controls-bar">
              <Row className="g-3 align-items-center">
                <Col lg={3} md={12}><div className="search-container"><FontAwesomeIcon icon={faSearch} className="search-icon" /><input className="search-bar" placeholder="Customer, Vendor, Ref..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></Col>
                <Col lg={2} md={4}>
                  <select className="filter-select" value={filters.recordType} onChange={(e) => setFilters({...filters, recordType: e.target.value})}>
                    <option value="">All Types</option>
                    <option value="EC">EC</option>
                    <option value="Nagal">Nagal</option>
                    <option value="Agreement">Agreement</option>
                    <option value="Deed">Deed</option>
                  </select>
                </Col>
                <Col lg={2} md={4}>
                  <select className="filter-select" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                    <option value="">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </Col>
                <Col lg={2} md={4}>
                  <select className="filter-select" value={filters.vendor} onChange={(e) => setFilters({...filters, vendor: e.target.value})}>
                    <option value="">All Vendors</option>
                    {[...new Set(paymentData.map(d => d.vendor))].map(vendor => (<option key={vendor} value={vendor}>{vendor}</option>))}
                  </select>
                </Col>
                <Col lg={2} md={4}>
                  <input type="date" className="filter-select" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
                </Col>
                <Col lg={1} md={4}><button className="filter-toggle" onClick={clearFilters}><FontAwesomeIcon icon={faTimes}/></button></Col>
              </Row>
            </div>
          </motion.div>

          {/* Payment Table View */}
          <motion.div variants={itemVariants}>
            <div className="table-wrapper pb-2 mb-5">
              {filteredData.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                  <h5 style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No payments found</h5>
                  <p className="text-muted">Adjust your search or filter inputs</p>
                </div>
              ) : (
                <Table responsive hover className="table-modern">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('date')}>Date {sortConfig.key === 'date' && <motion.span initial={{scale:0}} animate={{scale:1}} className="sort-icon"><FontAwesomeIcon icon={sortConfig.direction === 'asc'?faArrowUp:faArrowDown}/></motion.span>}</th>
                      <th onClick={() => handleSort('recordType')}>Type {sortConfig.key === 'recordType' && <motion.span initial={{scale:0}} animate={{scale:1}} className="sort-icon"><FontAwesomeIcon icon={sortConfig.direction === 'asc'?faArrowUp:faArrowDown}/></motion.span>}</th>
                      <th onClick={() => handleSort('recordNo')}>Record {sortConfig.key === 'recordNo' && <motion.span initial={{scale:0}} animate={{scale:1}} className="sort-icon"><FontAwesomeIcon icon={sortConfig.direction === 'asc'?faArrowUp:faArrowDown}/></motion.span>}</th>
                      <th>Customer</th>
                      <th>Vendor</th>
                      <th onClick={() => handleSort('received')}>Received {sortConfig.key === 'received' && <motion.span initial={{scale:0}} animate={{scale:1}} className="sort-icon"><FontAwesomeIcon icon={sortConfig.direction === 'asc'?faArrowUp:faArrowDown}/></motion.span>}</th>
                      <th onClick={() => handleSort('balance')}>Remaining {sortConfig.key === 'balance' && <motion.span initial={{scale:0}} animate={{scale:1}} className="sort-icon"><FontAwesomeIcon icon={sortConfig.direction === 'asc'?faArrowUp:faArrowDown}/></motion.span>}</th>
                      <th onClick={() => handleSort('status')}>Status {sortConfig.key === 'status' && <motion.span initial={{scale:0}} animate={{scale:1}} className="sort-icon"><FontAwesomeIcon icon={sortConfig.direction === 'asc'?faArrowUp:faArrowDown}/></motion.span>}</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredData.map((item, idx) => (
                        <motion.tr key={item.id} initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.95}} transition={{delay: idx * 0.03}} onClick={() => handleView(item)}>
                          <td>{new Date(item.date).toLocaleDateString('en-GB')}</td>
                          <td><Badge bg="light" text="dark" style={{fontWeight: 700, padding:'6px 10px', border:'1px solid #e2e8f0'}}>{item.recordType}</Badge></td>
                          <td style={{fontWeight: 700}}>{item.recordNo}</td>
                          <td>{item.customerName}</td>
                          <td style={{color:'var(--text-secondary)'}}>{item.vendor}</td>
                          <td style={{fontWeight: 800, color:'#10b981'}}>₹{item.received.toLocaleString()}</td>
                          <td style={{fontWeight: 800, color:'#ef4444'}}>₹{item.balance.toLocaleString()}</td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td className="text-center">
                            <button className="circle-btn view" onClick={(e) => { e.stopPropagation(); handleView(item); }} title="View Details">
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </Table>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Unified View Details Modal */}
        <AnimatePresence>
          {showViewModal && currentPayment && (
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="xl" className="details-modal">
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
                <Modal.Header closeButton>
                  <Modal.Title><FontAwesomeIcon icon={faEye} className="me-2 text-warning"/> View Payment Details: {currentPayment.recordNo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="text-center mb-4">{getStatusBadge(currentPayment.status)}</div>
                  
                  <Row className="g-3">
                    <h5 className="mb-2 fw-bold w-100" style={{color: '#475569'}}><FontAwesomeIcon icon={faFileAlt} className="me-2"/> General Info</h5>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Date</Form.Label><Form.Control type="text" className="form-control-modern" value={new Date(currentPayment.date).toLocaleDateString('en-GB')} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Record Type</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.recordType} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Record No</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.recordNo} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Reference</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.reference} disabled /></Form.Group></Col>

                    <h5 className="mt-4 mb-2 fw-bold w-100" style={{color: '#475569'}}><FontAwesomeIcon icon={faUser} className="me-2"/> Participants & Location</h5>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Customer Name</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.customerName} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Vendor Name</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.vendor} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Office</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.office} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Nagar</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.nagar} disabled /></Form.Group></Col>

                    <h5 className="mt-4 mb-2 fw-bold w-100" style={{color: '#475569'}}><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2"/> Property & Legal Details</h5>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">TP No</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.tpNo} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Plot No</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.plotNo} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Deed Type</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.deed} disabled /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="form-label-modern">Document No</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.docNo} disabled /></Form.Group></Col>

                    <Col md={3} className="mt-4"><Form.Group><Form.Label className="form-label-modern">Field Visit</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.fieldVisit} disabled /></Form.Group></Col>
                    <Col md={3} className="mt-4"><Form.Group><Form.Label className="form-label-modern">Return Document</Form.Label><Form.Control type="text" className="form-control-modern" value={currentPayment.returnDocument} disabled /></Form.Group></Col>

                    <h5 className="mt-5 mb-3 fw-bold w-100" style={{color: '#475569'}}><FontAwesomeIcon icon={faWallet} className="me-2"/> Invoice Breakdown</h5>
                    <Col md={4}><Form.Group><Form.Label className="form-label-modern">Base Amount (₹)</Form.Label><Form.Control type="text" className="form-control-modern" value={formatCurrency(currentPayment.amount)} disabled /></Form.Group></Col>
                    <Col md={4}><Form.Group><Form.Label className="form-label-modern">Commission (₹)</Form.Label><Form.Control type="text" className="form-control-modern" value={formatCurrency(currentPayment.commission)} disabled /></Form.Group></Col>
                    <Col md={4}><Form.Group><Form.Label className="form-label-modern">Others (₹)</Form.Label><Form.Control type="text" className="form-control-modern" value={formatCurrency(currentPayment.others)} disabled /></Form.Group></Col>
                  </Row>
                  
                  <Row className="mt-4">
                    <Col md={12}><Alert className="total-alert border-0 p-4"><span style={{fontSize: '1rem', display: 'block', color:'#b45309'}}>Grand Total Amount</span> <span style={{fontSize: '1.8rem', fontWeight: 800}}>₹{currentPayment.total.toLocaleString()}</span></Alert></Col>
                  </Row>
                  
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4">
                  <Button variant="light" className="px-5 py-2" onClick={() => setShowViewModal(false)} style={{borderRadius:'12px', fontWeight:600}}>Close</Button>
                </Modal.Footer>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Payment;
