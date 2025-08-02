import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import "./StudentInfo.css";
import BASE_URL from "../../assets/assests";

const StudentInfo = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const student = location.state?.student;
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTests: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalMarksObtained: 0,
        totalPossibleMarks: 0
    });

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

    // Calculate student statistics
    const calculateStats = (marksData) => {
        if (marksData.length === 0) {
            setStats({
                totalTests: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                totalMarksObtained: 0,
                totalPossibleMarks: 0
            });
            return;
        }

        const totalTests = marksData.length;
        const scores = marksData.map(mark => (mark.marks_obtained / mark.total_marks) * 100);
        const totalMarksObtained = marksData.reduce((sum, mark) => sum + mark.marks_obtained, 0);
        const totalPossibleMarks = marksData.reduce((sum, mark) => sum + mark.total_marks, 0);
        
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalTests;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);

        setStats({
            totalTests,
            averageScore: averageScore || 0,
            highestScore: highestScore || 0,
            lowestScore: lowestScore || 0,
            totalMarksObtained,
            totalPossibleMarks
        });
    };

    // Fetch student marks
    useEffect(() => {
        const fetchInfo = async () => {
            if (!student?.id) return;
            
            setLoading(true);
            try {
                const response = await fetch(`${BASE_URL}/api/result/${student.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch student marks');
                }
                const data = await response.json();
                setMarks(data);
                calculateStats(data);
                console.log("Fetched marks:", data);
            } catch (error) {
                console.error("Error fetching marks:", error);
                showToast('Failed to load student marks', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, [student?.id]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'grade-a';
        if (percentage >= 80) return 'grade-b';
        if (percentage >= 70) return 'grade-c';
        if (percentage >= 60) return 'grade-d';
        return 'grade-f';
    };

    const getGradeLetter = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        return 'F';
    };

    if (!student) {
        return (
            <div className="student-info-page-container">
                <Sidebar />
                <div className="student-info-main-content">
                    <div className="student-info-error-container">
                        <div className="student-info-error-icon">⚠️</div>
                        <h3 className="student-info-error-title">No Student Data</h3>
                        <p className="student-info-error-description">
                            Student information is not available. Please go back and select a student.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="student-info-back-btn"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="student-info-page-container">
                <Sidebar />
                <div className="student-info-main-content">
                    <div className="student-info-loading-container">
                        <div className="student-info-loading-spinner"></div>
                        <p className="student-info-loading-text">Loading student information...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-info-page-container">
            <Sidebar />
            <div className="student-info-main-content">
                {/* Page Header */}
                <div className="student-info-page-header">
                    <div className="student-info-header-content">
                        <h1 className="student-info-page-title">Student Profile</h1>
                        <p className="student-info-page-subtitle">
                            Detailed information and performance overview
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="student-info-back-btn"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {/* Student Details Card */}
                <div className="student-info-details-card">
                    <div className="student-info-avatar">
                        <span className="student-info-avatar-text">
                            {student.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="student-info-details">
                        <h2 className="student-info-name">{student.name}</h2>
                        <div className="student-info-meta">
                            <div className="student-info-meta-item">
                                <span className="student-info-meta-label">Student ID:</span>
                                <span className="student-info-meta-value">{student.id}</span>
                            </div>
                            <div className="student-info-meta-item">
                                <span className="student-info-meta-label">Email:</span>
                                <span className="student-info-meta-value">{student.email}</span>
                            </div>
                            {student.class && (
                                <div className="student-info-meta-item">
                                    <span className="student-info-meta-label">Class:</span>
                                    <span className="student-info-meta-value">{student.class}</span>
                                </div>
                            )}
                            {student.section && (
                                <div className="student-info-meta-item">
                                    <span className="student-info-meta-label">Section:</span>
                                    <span className="student-info-meta-value">{student.section}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="student-info-stats-grid">
                    <div className="student-info-stat-card">
                        <div className="student-info-stat-icon tests">📝</div>
                        <div className="student-info-stat-content">
                            <h3 className="student-info-stat-number">{stats.totalTests}</h3>
                            <p className="student-info-stat-label">Total Tests</p>
                        </div>
                    </div>
                    
                    <div className="student-info-stat-card">
                        <div className="student-info-stat-icon average">📊</div>
                        <div className="student-info-stat-content">
                            <h3 className="student-info-stat-number">{stats.averageScore.toFixed(1)}%</h3>
                            <p className="student-info-stat-label">Average Score</p>
                        </div>
                    </div>
                    
                    <div className="student-info-stat-card">
                        <div className="student-info-stat-icon highest">🏆</div>
                        <div className="student-info-stat-content">
                            <h3 className="student-info-stat-number">{stats.highestScore.toFixed(1)}%</h3>
                            <p className="student-info-stat-label">Highest Score</p>
                        </div>
                    </div>
                    
                    <div className="student-info-stat-card">
                        <div className="student-info-stat-icon total">🎯</div>
                        <div className="student-info-stat-content">
                            <h3 className="student-info-stat-number">{stats.totalMarksObtained}/{stats.totalPossibleMarks}</h3>
                            <p className="student-info-stat-label">Total Marks</p>
                        </div>
                    </div>
                </div>

                {/* Marks Table */}
                <div className="student-info-table-section">
                    <div className="student-info-table-header">
                        <h3 className="student-info-table-title">Test Results</h3>
                        <p className="student-info-table-description">
                            Complete performance history for {student.name}
                        </p>
                    </div>
                    
                    {marks.length > 0 ? (
                        <div className="student-info-table-wrapper">
                            <table className="student-info-data-table">
                                <thead className="student-info-table-head">
                                    <tr>
                                        <th className="student-info-table-head-cell">Test ID</th>
                                        <th className="student-info-table-head-cell">Subject</th>
                                        <th className="student-info-table-head-cell">Chapter</th>
                                        <th className="student-info-table-head-cell">Test Date</th>
                                        <th className="student-info-table-head-cell">Marks</th>
                                        <th className="student-info-table-head-cell">Percentage</th>
                                        <th className="student-info-table-head-cell">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="student-info-table-body">
                                    {marks.map((mark) => {
                                        const percentage = (mark.marks_obtained / mark.total_marks) * 100;
                                        return (
                                            <tr key={mark.test_id} className="student-info-table-row">
                                                <td className="student-info-table-cell">
                                                    <span className="student-info-test-id">{mark.test_id}</span>
                                                </td>
                                                <td className="student-info-table-cell">
                                                    <div className="student-info-subject">{mark.subject}</div>
                                                </td>
                                                <td className="student-info-table-cell">
                                                    <div className="student-info-chapter">{mark.chapter}</div>
                                                </td>
                                                <td className="student-info-table-cell">
                                                    <span className="student-info-date">{formatDate(mark.test_date)}</span>
                                                </td>
                                                <td className="student-info-table-cell">
                                                    <span className="student-info-marks">
                                                        {mark.marks_obtained}/{mark.total_marks}
                                                    </span>
                                                </td>
                                                <td className="student-info-table-cell">
                                                    <span className="student-info-percentage">
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="student-info-table-cell">
                                                    <span className={`student-info-grade ${getGradeColor(percentage)}`}>
                                                        {getGradeLetter(percentage)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="student-info-empty-state">
                            <div className="student-info-empty-icon">📋</div>
                            <h3 className="student-info-empty-title">No Test Results</h3>
                            <p className="student-info-empty-description">
                                This student hasn't taken any tests yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default StudentInfo;