import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import "./Dashboard.css";
import BASE_URL from "../../assets/assests";

const Dashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("students"); // "students" or "tests"
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTests: 0,
    averageScore: 0,
    recentTests: 0
  });

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter tests based on search term
  const filteredTests = tests.filter(test =>
    test.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.chapter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show toast notification
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1001;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      max-width: 350px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/students/`);
      setStudents(response.data);
      return response.data.length;
    } catch (error) {
      console.error("Error fetching students:", error);
      showToast('Failed to load students', 'error');
      return 0;
    }
  };

  // Fetch tests
  const fetchTests = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tests/`);
      setTests(response.data);
      return response.data.length;
    } catch (error) {
      console.error("Error fetching tests:", error);
      showToast('Failed to load tests', 'error');
      return 0;
    }
  };

  // Calculate statistics
  const calculateStats = (studentsCount, testsCount, testsData) => {
    const recentTests = testsData.filter(test => {
      const testDate = new Date(test.test_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return testDate >= thirtyDaysAgo;
    }).length;

    setStats({
      totalStudents: studentsCount,
      totalTests: testsCount,
      averageScore: 0, // You can calculate this based on marks data
      recentTests: recentTests
    });
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [studentsCount, testsCount] = await Promise.all([
          fetchStudents(),
          fetchTests()
        ]);
        
        // Calculate stats after fetching data
        calculateStats(studentsCount, testsCount, tests);
        
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Update stats when tests data changes
  useEffect(() => {
    if (tests.length > 0) {
      calculateStats(students.length, tests.length, tests);
    }
  }, [tests, students]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const navigateToTestManagement = () => {
    navigate('/student'); // Assuming your test management route
  };

  if (loading) {
    return (
      <div className="dashboard-page-container">
        <Sidebar />
        <div className="dashboard-main-content">
          <div className="dashboard-loading-container">
            <div className="dashboard-loading-spinner"></div>
            <p className="dashboard-loading-text">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      <Sidebar />
      <div className="dashboard-main-content">
        {/* Page Header */}
        <div className="dashboard-page-header">
          <h1 className="dashboard-page-title">Dashboard</h1>
          <p className="dashboard-page-subtitle">
            Overview of your student management system
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon students">👥</div>
            <div className="dashboard-stat-content">
              <h3 className="dashboard-stat-number">{stats.totalStudents}</h3>
              <p className="dashboard-stat-label">Total Students</p>
            </div>
          </div>
          
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon tests">📝</div>
            <div className="dashboard-stat-content">
              <h3 className="dashboard-stat-number">{stats.totalTests}</h3>
              <p className="dashboard-stat-label">Total Tests</p>
            </div>
          </div>
          
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon recent">📊</div>
            <div className="dashboard-stat-content">
              <h3 className="dashboard-stat-number">{stats.recentTests}</h3>
              <p className="dashboard-stat-label">Recent Tests (30 days)</p>
            </div>
          </div>
          
          
        </div>

        {/* Action Buttons */}
        <div className="dashboard-actions">
          <button 
            className="dashboard-action-btn primary"
            onClick={navigateToTestManagement}
          >
            Create New Test
          </button>
          <button className="dashboard-action-btn secondary" onClick={() => navigate("/report")}>
            Generate Report
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="dashboard-tabs">
          <button 
            className={`dashboard-tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            All Students ({students.length})
          </button>
          <button 
            className={`dashboard-tab ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            All Tests ({tests.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="dashboard-search-container">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={handleSearchChange}
            className="dashboard-search-input"
          />
          <span className="dashboard-search-icon">🔍</span>
        </div>

        {/* Students Table */}
        {activeTab === 'students' && (
          <div className="dashboard-table-section">
            <div className="dashboard-table-header">
              <h3 className="dashboard-table-title">Students</h3>
              <p className="dashboard-table-description">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>
            
            <div className="dashboard-table-wrapper">
              <table className="dashboard-data-table">
                <thead className="dashboard-table-head">
                  <tr>
                    <th className="dashboard-table-head-cell">ID</th>
                    <th className="dashboard-table-head-cell">Name</th>
                    <th className="dashboard-table-head-cell">Email</th>
                    <th className="dashboard-table-head-cell">Status</th>
                    <th className="dashboard-table-head-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="dashboard-table-body">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="dashboard-table-cell dashboard-empty-row">
                        {searchTerm ? `No students found matching "${searchTerm}"` : 'No students available'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="dashboard-table-row">
                        <td className="dashboard-table-cell">
                          <span className="dashboard-table-id">{student.id}</span>
                        </td>
                        <td className="dashboard-table-cell">
                          <div className="dashboard-table-name">{student.name}</div>
                        </td>
                        <td className="dashboard-table-cell">
                          <div className="dashboard-table-email">{student.email}</div>
                        </td>
                        <td className="dashboard-table-cell">
                          <span className="dashboard-status-badge active">Active</span>
                        </td>
                        <td className="dashboard-table-cell">
                          <button onClick={() => navigate("/student-info", { state: { student } })} className="dashboard-action-btn-small view" >Result</button>
                          <button className="dashboard-action-btn-small edit">Edit</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tests Table */}
        {activeTab === 'tests' && (
          <div className="dashboard-table-section">
            <div className="dashboard-table-header">
              <h3 className="dashboard-table-title">Tests</h3>
              <p className="dashboard-table-description">
                Showing {filteredTests.length} of {tests.length} tests
              </p>
            </div>
            
            <div className="dashboard-table-wrapper">
              <table className="dashboard-data-table">
                <thead className="dashboard-table-head">
                  <tr>
                    <th className="dashboard-table-head-cell">ID</th>
                    <th className="dashboard-table-head-cell">Subject</th>
                    <th className="dashboard-table-head-cell">Chapter</th>
                    <th className="dashboard-table-head-cell">Total Marks</th>
                    <th className="dashboard-table-head-cell">Date</th>
                    <th className="dashboard-table-head-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="dashboard-table-body">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="dashboard-table-cell dashboard-empty-row">
                        {searchTerm ? `No tests found matching "${searchTerm}"` : 'No tests available'}
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((test) => (
                      <tr key={test.id} className="dashboard-table-row">
                        <td className="dashboard-table-cell">
                          <span className="dashboard-table-id">{test.id}</span>
                        </td>
                        <td className="dashboard-table-cell">
                          <div className="dashboard-table-subject">{test.subject}</div>
                        </td>
                        <td className="dashboard-table-cell">
                          <div className="dashboard-table-chapter">{test.chapter}</div>
                        </td>
                        <td className="dashboard-table-cell">
                          <span className="dashboard-marks">{test.total_marks}</span>
                        </td>
                        <td className="dashboard-table-cell">
                          <span className="dashboard-date">{formatDate(test.test_date)}</span>
                        </td>
                        <td className="dashboard-table-cell">
                          <button className="dashboard-action-btn-small view">View</button>
                          <button className="dashboard-action-btn-small edit">Results</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default Dashboard;