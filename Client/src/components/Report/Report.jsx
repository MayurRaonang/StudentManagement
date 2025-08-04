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
      });
      console.log("Custom report response:", response.data.result);
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

  // Generate PDF HTML Content
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
      return tests.reduce((sum, test) => sum + test.marksObtained, 0);
    };

    const calculateTotalPossible = (tests) => {
      return tests.reduce((sum, test) => sum + test.totalMarks, 0);
    };

    const calculatePercentage = (obtained, total) => {
      return total > 0 ? ((obtained / total) * 100).toFixed(1) : 0;
    };

    const getGrade = (percentage) => {
      if (percentage >= 90) return 'A+';
      if (percentage >= 80) return 'A';
      if (percentage >= 70) return 'B+';
      if (percentage >= 60) return 'B';
      if (percentage >= 50) return 'C';
      if (percentage >= 40) return 'D';
      return 'F';
    };

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Results Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background: white;
            page-break-after: always;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          .page:last-child {
            page-break-after: avoid;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
          }
          
          .header h1 {
            color: #4f46e5;
            font-size: 28px;
            margin-bottom: 10px;
          }
          
          .header .period {
            font-size: 16px;
            color: #666;
            font-weight: 500;
          }
          
          .student-info {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
          }
          
          .student-info h2 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          
          .student-info p {
            font-size: 16px;
            opacity: 0.9;
          }
          
          .summary-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          
          .stat-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
          }
          
          .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 5px;
          }
          
          .tests-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .tests-table th,
          .tests-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .tests-table th {
            background: #4f46e5;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          
          .tests-table tr:hover {
            background: #f8fafc;
          }
          
          .grade-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
          }
          
          .grade-A\\+ { background: #dcfce7; color: #166534; }
          .grade-A { background: #dbeafe; color: #1e40af; }
          .grade-B\\+ { background: #fef3c7; color: #92400e; }
          .grade-B { background: #fed7aa; color: #9a3412; }
          .grade-C { background: #fde68a; color: #92400e; }
          .grade-D { background: #fecaca; color: #991b1b; }
          .grade-F { background: #fee2e2; color: #dc2626; }
          
          .performance-summary {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4f46e5;
          }
          
          .performance-summary h3 {
            color: #334155;
            margin-bottom: 15px;
          }
          
          .performance-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          
          .performance-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
          }
          
          .performance-label {
            font-weight: 500;
            color: #475569;
          }
          
          .performance-value {
            font-weight: bold;
            color: #334155;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          
          .no-tests {
            text-align: center;
            padding: 40px;
            color: #64748b;
            font-style: italic;
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
      const overallGrade = getGrade(parseFloat(overallPercentage));
      const averagePercentage = student.tests?.length > 0 
        ? (student.tests.reduce((sum, test) => sum + ((test.marksObtained / test.totalMarks) * 100), 0) / student.tests.length).toFixed(1)
        : 0;

      htmlContent += `
        <div class="page">
          <div class="header">
            <h1>📊 Student Performance Report</h1>
            <div class="period">
              Report Period: ${formatDate(customFrom)} to ${formatDate(customTo)}
              ${customStd ? ` | Standard: ${customStd}` : ''}
            </div>
          </div>
          
          <div class="student-info">
            <h2>👤 ${student.studentName}</h2>
            <p>📧 ${student.studentEmail}</p>
          </div>
          
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-number">${student.tests?.length || 0}</div>
              <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${totalObtained}/${totalPossible}</div>
              <div class="stat-label">Total Marks</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${overallPercentage}%</div>
              <div class="stat-label">Overall %</div>
            </div>
            <div class="stat-card">
              <div class="stat-number grade-${overallGrade.replace('+', '\\+')}">${overallGrade}</div>
              <div class="stat-label">Grade</div>
            </div>
          </div>
      `;

      if (student.tests && student.tests.length > 0) {
        htmlContent += `
          <table class="tests-table">
            <thead>
              <tr>
                <th>Test ID</th>
                <th>Subject</th>
                <th>Chapter</th>
                <th>Date</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
        `;

        student.tests.forEach(test => {
          const testPercentage = ((test.marksObtained / test.totalMarks) * 100).toFixed(1);
          const testGrade = getGrade(parseFloat(testPercentage));
          
          htmlContent += `
            <tr>
              <td>${test.testId}</td>
              <td>${test.subject}</td>
              <td>${test.chapter}</td>
              <td>${formatDate(test.testDate)}</td>
              <td>${test.marksObtained}/${test.totalMarks}</td>
              <td>${testPercentage}%</td>
              <td><span class="grade-badge grade-${testGrade.replace('+', '\\+')}">${testGrade}</span></td>
            </tr>
          `;
        });

        htmlContent += `
            </tbody>
          </table>
          
          <div class="performance-summary">
            <h3>📈 Performance Summary</h3>
            <div class="performance-grid">
              <div class="performance-item">
                <span class="performance-label">Total Tests Taken:</span>
                <span class="performance-value">${student.tests.length}</span>
              </div>
              <div class="performance-item">
                <span class="performance-label">Average Percentage:</span>
                <span class="performance-value">${averagePercentage}%</span>
              </div>
              <div class="performance-item">
                <span class="performance-label">Best Performance:</span>
                <span class="performance-value">${Math.max(...student.tests.map(t => ((t.marksObtained / t.totalMarks) * 100))).toFixed(1)}%</span>
              </div>
              <div class="performance-item">
                <span class="performance-label">Improvement Needed:</span>
                <span class="performance-value">${overallPercentage < 60 ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        htmlContent += `
          <div class="no-tests">
            <h3>📋 No Test Records Found</h3>
            <p>No tests were taken by this student in the selected date range.</p>
          </div>
        `;
      }

      htmlContent += `
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} | Student ${index + 1} of ${filteredResults.length}</p>
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