import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/Sidebar";
import "./Report.css";
import BASE_URL from "../../assets/assests";

const Results = () => {
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customStd, setCustomStd] = useState(""); // <-- NEW
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

  // Filter results based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResults(results);
      setCurrentIndex(0);
    } else {
      const filtered = results.filter(result =>
        result.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(filtered);
      setCurrentIndex(0);
    }
  }, [searchTerm, results]);

  const handleCustomSubmit = async () => {
    if (!customFrom || !customTo || !customStd) {
      showToast("Please select both dates and standard.", "error");
      return;
    }

    if (new Date(customFrom) > new Date(customTo)) {
      showToast("From date cannot be later than To date.", "error");
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await axios.post(`${BASE_URL}/api/report/custom`, {
          from: customFrom,
          to: customTo,
          std: parseInt(customStd)
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log("Custom report response:", response.data.results);
      setResults(response.data.results || []);
      setMessage({ 
        type: 'success', 
        text: `Found ${response.data.results?.length || 0} student results` 
      });
      
      if (response.data.results?.length === 0) {
        showToast("No results found for the selected date range.", "error");
      } else {
        showToast(`Successfully loaded ${response.data.results.length} student results`, "success");
      }
      
    } catch (err) {
      console.error("Error fetching results:", err);
      const errorMessage = err.response?.data?.message || "Failed to fetch results.";
      setMessage({ type: 'error', text: errorMessage });
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (filteredResults.length === 0) {
      showToast("No results available to send.", "error");
      return;
    }

    try {
      setEmailLoading(true);
      
      const response = await axios.post(`${BASE_URL}/api/report/send-emails`, {
        from: customFrom,
        to: customTo,
        results: filteredResults
      });
      
      showToast("Results sent to all student email addresses successfully!", "success");
      setMessage({ 
        type: 'success', 
        text: `Emails sent to ${filteredResults.length} students` 
      });
      
    } catch (err) {
      console.error("Error sending emails:", err);
      const errorMessage = err.response?.data?.message || "Failed to send emails.";
      showToast(errorMessage, "error");
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setEmailLoading(false);
    }
  };

  // PDF Generation Function
  const handleDownloadPDF = async () => {
    if (filteredResults.length === 0) {
      showToast("No results available to download.", "error");
      return;
    }

    try {
      setPdfLoading(true);
      
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      
      // Generate HTML content for PDF
      const pdfContent = generatePDFContent();
      
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 1000);
      
      showToast("PDF report generated successfully!", "success");
      setMessage({ 
        type: 'success', 
        text: `PDF report generated for ${filteredResults.length} students` 
      });
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      showToast("Failed to generate PDF report.", "error");
    } finally {
      setPdfLoading(false);
    }
  };

const generatePDFContent = () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateTotalMarks = (tests) => {
    return (tests || []).reduce(
    (sum, t) => sum + (t.marksObtained == null ? 0 : t.marksObtained), 0
  );
  };

  const calculateTotalPossible = (tests) => {
    return (tests || []).reduce(
    (sum, t) => sum + (t.marksObtained == null ? 0 : t.totalMarks), 0
  );
  };

  const calculatePercentage = (obtained, total) => {
    return total > 0 ? ((obtained / total) * 100).toFixed(2) : 0;
  };

  const getRank = (studentResults, currentStudent) => {
    const studentsWithPercentage = studentResults.map(student => ({
      ...student,
      percentage: calculatePercentage(
        calculateTotalMarks(student.tests || []),
        calculateTotalPossible(student.tests || [])
      )
    }));
    
    // Sort by percentage in descending order
    studentsWithPercentage.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
    
    // Find current student's rank
    const rank = studentsWithPercentage.findIndex(student => 
      student.studentName === currentStudent.studentName
    ) + 1;
    
    return rank;
  };

  // Get all subjects for the table header
  const allSubjects = [...new Set(
    filteredResults.flatMap(student => 
      (student.tests || []).map(test => test.subject)
    )
  )];

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Results Report Card</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: #333;
          background: white;
          font-size: 12px;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm;
          margin: 0 auto;
          background: white;
          page-break-after: always;
          border: 2px solid #000;
        }
        
        .page:last-child {
          page-break-after: avoid;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 3px solid #000;
          padding-bottom: 15px;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }
        
        .student-info-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
          font-size: 11px;
        }
        
        .info-item {
          display: flex;
          align-items: center;
        }
        
        .info-label {
          font-weight: bold;
          margin-right: 10px;
          min-width: 60px;
        }
        
        .info-value {
          border-bottom: 1px solid #000;
          flex: 1;
          padding-bottom: 2px;
        }
        
        .period-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        .tests-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 2px solid #000;
        }
        
        .tests-table th,
        .tests-table td {
          border: 1px solid #000;
          padding: 6px 4px;
          text-align: center;
          font-size: 12px;
          vertical-align: middle;
        }
        
        .tests-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        
        .sr-no-col { width: 8%; }
        .date-col { width: 12%; }
        .subject-col { width: 12%; }
        .topic-col { width: 25%; }
        .marks-col { width: 10%; }
        .highest-col { width: 10%; }
        .total-col { width: 10%; }
        
        .summary-section {
          margin-top: 20px;
        }
        
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
        }
        
        .summary-table th,
        .summary-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: center;
          font-size: 13px;
        }
        
        .summary-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        
        .total-row {
          font-weight: bold;
          background: #f8f8f8;
        }
        
        .percentage-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 15px;
          font-size: 12px;
        }
        
        .percentage-box {
          border: 2px solid #000;
          padding: 10px;
          text-align: center;
        }
        
        .percentage-value {
          font-size: 18px;
          font-weight: bold;
          margin: 5px 0;
        }
        
        .rank-value {
          font-size: 18px;
          font-weight: bold;
          margin: 5px 0;
        }
        
        .signature-section {
          margin-top: 60px;
          text-align: center;
          font-size: 13px;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 150px;
          margin: 0 auto;
        }
        
        .chart-placeholder {
          width: 100%;
          height: 150px;
          border: 1px solid #ccc;
          background: #f9f9f9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
          font-size: 10px;
          color: #666;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .page {
            box-shadow: none;
            margin: 0;
            width: 100%;
            min-height: 100vh;
          }
        }
      </style>
    </head>
    <body>
  `;

  // Generate a page for each student
  filteredResults.forEach((student, index) => {
    const totalObtained = calculateTotalMarks(student.tests || []);
    const totalPossible = calculateTotalPossible(student.tests || []);
    const overallPercentage = calculatePercentage(totalObtained, totalPossible);
    const rank = getRank(filteredResults, student);
    const totalConducted = new Set(
  filteredResults.flatMap(s => (s.tests || []).map(t => t.testId))
).size;

// total tests attended by this student = only where marksObtained != null
const totalAttended = (student.tests || []).filter(
  test => test.marksObtained !== null
).length;

    // Group tests by subject for summary
    const subjectSummary = {};
    (student.tests || []).forEach(test => {
      if (!subjectSummary[test.subject]) {
        subjectSummary[test.subject] = {
          testsCount: 0,
          obtainedMarks: 0,
          totalMarks: 0
        };
      }
      subjectSummary[test.subject].testsCount++;
      subjectSummary[test.subject].obtainedMarks += test.marksObtained;
      subjectSummary[test.subject].totalMarks += test.totalMarks;
    });

    htmlContent += `
      <div class="page">
        <div class="header">
          <h1>ADHYAYAN CLASSES</h1>
        </div>
        
        <div class="student-info-header">
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">${student.studentName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Roll No:</span>
            <span class="info-value">${student.studentId}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Standard:</span>
            <span class="info-value">${customStd}</span>
          </div>
        </div>
        
        <div class="period-info">
          <div class="info-item">
            <span class="info-label">From:</span>
            <span class="info-value">${formatDate(customFrom)}</span>
            <span style="margin-left: 20px;" class="info-label">To:</span>
            <span class="info-value">${formatDate(customTo)}</span>
          </div>
          <div style="text-align: right;">
            <span class="info-label">No of Tests Attended:</span>
            <span class="info-value" style="display: inline-block; width: 30px; text-align: center;">${totalAttended}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 10px; font-weight: bold;">
          No of Tests Conducted: <span style="border-bottom: 1px solid #000; padding: 0 10px;">${totalConducted}</span>
        </div>
        
        <table class="tests-table">
          <thead>
            <tr>
              <th class="sr-no-col">Sr. No.</th>
              <th class="date-col">Date</th>
              <th class="subject-col">Subject</th>
              <th class="topic-col">TOPIC</th>
              <th class="marks-col">Marks Obtained</th>
              <th class="highest-col">Highest Scored</th>
              <th class="total-col">Total Marks</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Add test rows
    if (student.tests && student.tests.length > 0) {
      student.tests.forEach((test, testIndex) => {
        // Calculate highest score for this test across all students
        const highestScore = Math.max(
          ...filteredResults.flatMap(s => 
            (s.tests || [])
              .filter(t => t.testId === test.testId)
              .map(t => t.marksObtained)
          )
        );

        htmlContent += `
          <tr>
            <td>${testIndex + 1}</td>
            <td>${formatDate(test.testDate)}</td>
            <td>${test.subject}</td>
            <td style="text-align: left; padding-left: 8px;">${test.chapter}</td>
            <td>${test.marksObtained == null ? 'A' : test.marksObtained}</td>
            <td>${highestScore}</td>
            <td>${test.marksObtained == null ? 0 : test.totalMarks}</td>
          </tr>
        `;
      });
    }

    // Add empty rows if needed (to maintain consistent table height)
    for (let i = (student.tests?.length || 0); i < 12; i++) {
      htmlContent += `
        <tr>
          <td>${i + 1}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `;
    }

    htmlContent += `
          <tr class="total-row">
            <td colspan="4" style="text-align: center; font-weight: bold;">Total Marks</td>
            <td style="font-weight: bold;">${totalObtained}</td>
            <td></td>
            <td style="font-weight: bold;">${totalPossible}</td>
          </tr>
          <tr class="total-row">
            <td colspan="4" style="text-align: center; font-weight: bold;">Percentage Score</td>
            <td style="font-weight: bold;">${overallPercentage}%</td>
            <td style="font-weight: bold;">Rank</td>
            <td style="font-weight: bold;">${rank}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Subject-wise Summary -->
      <div class="summary-section">
        <table class="summary-table">
          <thead>
            <tr>
              <th>SUBJECT</th>
    `;

    // Add subject columns
    Object.keys(subjectSummary).forEach(subject => {
      htmlContent += `<th>${subject.toUpperCase()}</th>`;
    });

    htmlContent += `
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: bold;">NO OF TESTS CONDUCTED</td>
    `;

    Object.values(subjectSummary).forEach(summary => {
      htmlContent += `<td>${summary.testsCount}</td>`;
    });

    htmlContent += `
            </tr>
            <tr>
              <td style="font-weight: bold;">MARKS OBTAINED</td>
    `;

    Object.values(subjectSummary).forEach(summary => {
      htmlContent += `<td>${summary.obtainedMarks}</td>`;
    });

    htmlContent += `
            </tr>
            <tr>
              <td style="font-weight: bold;">TOTAL MARKS</td>
    `;

    Object.values(subjectSummary).forEach(summary => {
      htmlContent += `<td>${summary.totalMarks}</td>`;
    });

    htmlContent += `
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Performance Chart Placeholder -->
      
      
      <div class="signature-section">
        <div class="signature-line"></div>
        <div style="margin-top: 5px;">Stamp & Signature of Authority</div>
      </div>
      
    </div>
    `;
  });

  htmlContent += `
    </body>
    </html>
  `;

  return htmlContent;
};

  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : filteredResults.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev < filteredResults.length - 1 ? prev + 1 : 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateTotalMarks = (tests) => {
    return tests.reduce((sum, test) => sum + test.marksObtained, 0);
  };

  const calculateTotalPossible = (tests) => {
    return tests.reduce((sum, test) => sum + test.totalMarks, 0);
  };

  const calculatePercentage = (obtained, total) => {
    return total > 0 ? ((obtained / total) * 100).toFixed(1) : 0;
  };

  const currentResult = filteredResults[currentIndex];

  return (
    <div className="results-page-container">
      <Sidebar />
      <div className="results-main-content">
        {/* Page Header */}
        <div className="results-page-header">
          <h1 className="results-page-title">Student Results</h1>
          <p className="results-page-subtitle">
            Generate and view student performance reports by date range
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`results-${message.type}-message`}>
            {message.text}
          </div>
        )}

        {/* Date Range Selection */}
        <div className="results-date-section">
          <div className="results-date-card">
            <h2 className="results-section-title">Select Date Range</h2>
            <div className="results-date-inputs">
              <div className="results-form-group">
                <label className="results-form-label">From Date *</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="results-form-input"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="results-form-group">
                <label className="results-form-label">To Date *</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="results-form-input"
                  max={new Date().toISOString().split('T')[0]}
                  min={customFrom}
                />
              </div>
              <div className="results-form-group">
                <label className="results-form-label">Standard *</label>
                <input
                  type="number"
                  value={customStd}
                  onChange={(e) => setCustomStd(e.target.value)}
                  className="results-form-input"
                  min="1"
                  max="12"
                  placeholder="Enter standard (e.g. 12)"
                />
              </div>
            </div>
            <button
              onClick={handleCustomSubmit}
              disabled={loading}
              className={`results-generate-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <div className="results-loading-spinner"></div>
                  Generating Results...
                </>
              ) : (
                'Generate Results'
              )}
            </button>
          </div>
        </div>

        {/* Results Display */}
        {filteredResults.length > 0 && (
          <>
            {/* Search and Navigation */}
            <div className="results-controls">
              <div className="results-search-container">
                <input
                  type="text"
                  placeholder="Search students by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="results-search-input"
                />
                <span className="results-search-icon">🔍</span>
              </div>

              <div className="results-navigation">
                <span className="results-counter">
                  {filteredResults.length > 0 ? currentIndex + 1 : 0} of {filteredResults.length}
                </span>
                <div className="results-nav-buttons">
                  <button
                    onClick={handlePrevious}
                    disabled={filteredResults.length <= 1}
                    className="results-nav-btn"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={filteredResults.length <= 1}
                    className="results-nav-btn"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Current Student Result */}
            {currentResult && (
              <div className="results-student-card">
                <div className="results-student-header">
                  <div className="results-student-avatar">
                    <span className="results-avatar-text">
                      {currentResult.studentName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="results-student-info">
                    <h3 className="results-student-name">{currentResult.studentName}</h3>
                    <p className="results-student-email">{currentResult.studentEmail}</p>
                    <div className="results-student-stats">
                      <span className="results-stat-item">
                        Tests: {currentResult.tests?.length || 0}
                      </span>
                      <span className="results-stat-item">
                        Total Score: {calculateTotalMarks(currentResult.tests || [])} / {calculateTotalPossible(currentResult.tests || [])}
                      </span>
                      <span className="results-stat-item">
                        Percentage: {calculatePercentage(
                          calculateTotalMarks(currentResult.tests || []),
                          calculateTotalPossible(currentResult.tests || [])
                        )}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Test Results Table */}
                <div className="results-tests-section">
                  <h4 className="results-tests-title">Test Results</h4>
                  {currentResult.tests && currentResult.tests.length > 0 ? (
                    <div className="results-table-wrapper">
                      <table className="results-data-table">
                        <thead className="results-table-head">
                          <tr>
                            <th className="results-table-head-cell">Test ID</th>
                            <th className="results-table-head-cell">Subject</th>
                            <th className="results-table-head-cell">Chapter</th>
                            <th className="results-table-head-cell">Date</th>
                            <th className="results-table-head-cell">Marks</th>
                            <th className="results-table-head-cell">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="results-table-body">
                          {currentResult.tests.map((test, index) => {
                            const percentage = ((test.marksObtained / test.totalMarks) * 100).toFixed(1);
                            return (
                              <tr key={index} className="results-table-row">
                                <td className="results-table-cell">
                                  <span className="results-test-id">{test.testId}</span>
                                </td>
                                <td className="results-table-cell">
                                  <div className="results-subject">{test.subject}</div>
                                </td>
                                <td className="results-table-cell">
                                  <div className="results-chapter">{test.chapter}</div>
                                </td>
                                <td className="results-table-cell">
                                  <span className="results-date">{formatDate(test.testDate)}</span>
                                </td>
                                <td className="results-table-cell">
                                  <span className="results-marks">
                                    {test.marksObtained}/{test.totalMarks}
                                  </span>
                                </td>
                                <td className="results-table-cell">
                                  <span className="results-percentage">
                                    {percentage}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="results-no-tests">
                      <span className="results-no-tests-icon">📋</span>
                      <p>No tests found for this student in the selected date range.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="results-action-section" style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              {/* Send Email Button */}
              <div className="results-email-section" style={{ flex: 1 }}>
                <button
                  onClick={handleSendEmails}
                  disabled={emailLoading}
                  className={`results-email-btn ${emailLoading ? 'loading' : ''}`}
                >
                  {emailLoading ? (
                    <>
                      <div className="results-loading-spinner"></div>
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      📧 Send Results via Email
                    </>
                  )}
                </button>
                <p className="results-email-description">
                  Send individual result reports to {filteredResults.length} student{filteredResults.length !== 1 ? 's' : ''} via email.
                </p>
              </div>

              {/* Download PDF Button */}
              <div className="results-pdf-section" style={{ flex: 1 }}>
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className={`results-email-btn ${pdfLoading ? 'loading' : ''}`}
                  style={{ 
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    border: 'none'
                  }}
                >
                  {pdfLoading ? (
                    <>
                      <div className="results-loading-spinner"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      📄 Download PDF Report
                    </>
                  )}
                </button>
                <p className="results-email-description">
                  Download comprehensive PDF report with {filteredResults.length} student{filteredResults.length !== 1 ? 's' : ''} (each on separate page).
                </p>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && customFrom && customTo && (
          <div className="results-empty-state">
            <div className="results-empty-icon">📊</div>
            <h3 className="results-empty-title">No Results Found</h3>
            <p className="results-empty-description">
              No student results were found for the selected date range.
              Try selecting a different date range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;