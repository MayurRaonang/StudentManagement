import React, { useEffect, useState } from "react";
import axios from "axios";
  import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import "./testManagement.css";
import BASE_URL from "../../assets/assests";

const StudentsTable = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [testInfo, setTestInfo] = useState({
    subject: "",
    chapter: "",
    total_marks: "",
    date: ""
  });
  
  const [excelStudents, setExcelStudents] = useState([]);
  const [rows, setRows] = useState([]); // store excel rows

  const [marks, setMarks] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
  const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStandard = testInfo.standard ? student.std === parseInt(testInfo.standard) : true;
  return matchesSearch && matchesStandard;
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

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/students/`,{
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ send token
    },
  });
        setStudents(response.data);
        setMessage({ type: 'success', text: `${response.data.length} students loaded successfully` });
      } catch (error) {
        console.error("Error fetching students:", error);
        setMessage({ type: 'error', text: 'Failed to load students. Please try again.' });
        showToast('Failed to load students', 'error');
      } finally {
        setLoading(false);
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    };

    fetchStudents();
  }, []);

  const handleTestChange = (e) => {
    setTestInfo({ ...testInfo, [e.target.name]: e.target.value });
  };

  const handleMarkChange = (studentId, value) => {
    // Validate marks don't exceed total marks
    const numValue = parseInt(value) || 0;
    const totalMarks = parseInt(testInfo.total_marks) || 0;
    
    if (totalMarks > 0 && numValue > totalMarks) {
      showToast(`Marks cannot exceed total marks (${totalMarks})`, 'error');
      return;
    }
    
    setMarks({ ...marks, [studentId]: value });
  };

  const validateForm = () => {
    if (!testInfo.subject.trim()) {
      showToast('Subject is required', 'error');
      return false;
    }
    if (!testInfo.chapter.trim()) {
      showToast('Chapter is required', 'error');
      return false;
    }
    if (!testInfo.total_marks || parseInt(testInfo.total_marks) <= 0) {
      showToast('Valid total marks is required', 'error');
      return false;
    }
    if (!testInfo.date) {
      showToast('Test date is required', 'error');
      return false;
    }
    
    // Check if at least one student has marks entered
    const hasMarks = Object.values(marks).some(mark => mark && parseInt(mark) >= 0);
    if (!hasMarks) {
      showToast('Please enter marks for at least one student', 'error');
      return false;
    }
    
    return true;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleManualSubmit  = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const testData = {
      ...testInfo,
      students: students.map((student) => ({
        student_id: student.id,
        marks_obtained: parseInt(marks[student.id]) || 0
      })),
    };

    try {
      // First create the test
      const testResponse = await axios.post(`${BASE_URL}/api/tests`, {
        subject: testInfo.subject,
        chapter: testInfo.chapter,
        total_marks: parseInt(testInfo.total_marks),
        test_date: testInfo.date,
        standard: parseInt(testInfo.standard)
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ send token
        },
      }
    );
      
      const testId = testResponse.data.id;
      console.log("Test created with ID:", testId);
      
      // Then submit the marks for students who have marks entered
      const studentsWithMarks = testData.students.filter(student => 
        marks[student.student_id] !== undefined && marks[student.student_id] !== ''
      );
      
      const markPromises = studentsWithMarks.map(student =>
        axios.post(`${BASE_URL}/api/marks`, {
          studentId: student.student_id,
          testId: testId,
          score: student.marks_obtained
        })
      );
      
      await Promise.all(markPromises);
      
      showToast('Test and marks submitted successfully!', 'success');
      setMessage({ type: 'success', text: 'Test and marks submitted successfully!' });
      
      // Reset form
      setTestInfo({
        subject: "",
        chapter: "",
        total_marks: "",
        date: ""
      });
      setMarks({});
      
    } catch (error) {
      console.error("Error submitting test or marks:", error);
      const errorMessage = error.response?.data?.message || 'Failed to submit test and marks';
      showToast(errorMessage, 'error');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcelSubmit = async (e) => {
    e.preventDefault();
    if (rows.length === 0) {
      showToast("Please upload the Excel file first!", "error");
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const colIndex = findTestColumn(
        testInfo.subject,
        testInfo.chapter,
        testInfo.date,   // "yyyy-mm-dd" from <input type="date">
        testInfo.total_marks,
        rows
      );

      if (colIndex === -1) {
        showToast("Matching test not found in Excel!", "error");
        setIsSubmitting(false);
        return;
      }

      // ✅ Extract marks
      const excelResults = getStudentMarks(colIndex, rows);
      console.log(excelResults);
      setExcelStudents(excelResults);

      // First create the test
      const testResponse = await axios.post(`${BASE_URL}/api/tests`, {
        subject: testInfo.subject,
        chapter: testInfo.chapter,
        total_marks: parseInt(testInfo.total_marks),
        test_date: testInfo.date,
        standard: parseInt(testInfo.standard)
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ send token
        },
      }
      );
      
      const testId = testResponse.data.id;
      console.log("Test created with ID:", testId);
      
      const markPromises = excelResults.map(student => {
      let score = student.marks;

      // Convert "A" or empty string to null
      if (score === "A" || score === "" || score === undefined) {
        score = null;
      } else {
        score = Number(score); // ensure numeric
      }

      return axios.post(`${BASE_URL}/api/marks`, {
          studentId: student.roll,  // Or use your internal DB student_id mapping
          testId: testId,
          score: score
        });
      });


      await Promise.all(markPromises);
    
      showToast('Test and marks submitted successfully!', 'success');
      setMessage({ type: 'success', text: 'Test and marks submitted successfully!' });
      
      // Reset form
      setTestInfo({
        subject: "",
        chapter: "",
        total_marks: "",
        date: ""
      });
      setMarks({});
      
    } catch (error) {
      console.error("Error submitting test or marks:", error);
      const errorMessage = error.response?.data?.message || 'Failed to submit test and marks';
      showToast(errorMessage, 'error');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
};

  const handleUpdateMark = async (studentId) => {
    // Validate input first
    if (!validateForm()) return;

    const studentMark = marks[studentId];
    if (studentMark === undefined || studentMark === "") {
      showToast("Please enter marks before updating", "error");
      return;
    }

    try {
      // Try to find test with matching subject, chapter and date
      const response = await axios.get(`${BASE_URL}/api/tests/check`, {
        params: {
          subject: testInfo.subject,
          chapter: testInfo.chapter,
          date: testInfo.date
        }
      });

     const test = response.data;
      if (!test?.id) {
        showToast("Test not found. Please create the test first.", "error");
        return;
      }
      
      // Update mark for this student
      await axios.put(`${BASE_URL}/api/marks`, {
        studentId,
        testId: test.id,
        score: parseInt(studentMark)
      });

      showToast("Marks updated successfully", "success");
      setMessage({ type: 'success', text: 'Marks updated successfully' });
      // Reset the mark input for this student
      setMarks({ ...marks, [studentId]: "" });

    } catch (error) {
      console.error("Error updating mark:", error);
      const errorMessage = error.response?.data?.message || "Failed to update marks";
      showToast(errorMessage, "error");
    }
  };

const handleExcelUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    // ✅ Explicitly pick only "XII Test Result" sheet
    const sheetName = "XII Test Result";
    if (!workbook.Sheets[sheetName]) {
      showToast(`Sheet "${sheetName}" not found in file!`, "error");
      return;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    setRows(rows);

    showToast("Data imported from 'XII Test Result' successfully!", "success");
    
    // const colIndex = findTestColumn(testInfo.subject,
    //   testInfo.chapter,
    //   testInfo.date,        // already in yyyy-mm-dd from input
    //   testInfo.total_marks,
    //   rows
    // );

    // if (colIndex === -1) {
    //   console.log("Test not found!");
    // } else {
    //   const results = getStudentMarks(colIndex, rows);
    //   console.log(results);
    //   setExcelStudents(results); 
    // }

  };

  reader.readAsArrayBuffer(file);
};

  function findTestColumn(subject, chapter, date, totalMarks, rows) {
      function formatDate(date) {
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const yyyy = date.getFullYear();
        return `${yyyy}-${mm}-${dd}`;
      }
      const subjects = rows[0];
      const chapters = rows[1];
      const dates = rows[2];
      const totals = rows[3];
      console.log("subjects = ", subject, " chapter = ", chapter, " date = ", date, " total marks = ", totalMarks)
      for (let col = 0; col < subjects.length; col++) {
        const excelEpoch = new Date(1899, 11, 30); // Excel epoch starts at 30-Dec-1899
        const readableDate = new Date(excelEpoch.getTime() + dates[col] * 86400000);
        const excelDateStr = formatDate(readableDate);
        console.log("for col = ", col, " subjects = ", subjects[col], " chapter = ", chapters[col], " date = ", dates[col], " total marks = ", totals[col], " readable date = ",excelDateStr)
        if (
          subjects[col] === subject &&
          chapters[col] === chapter &&
          excelDateStr === date && // dd-mm-yyyy
          totals[col] == totalMarks
        ) {
          return col;
        }
      }
    return -1;
  }

  function getStudentMarks(colIndex, rows) {
    const studentData = [];
    for (let i = 5; i < 9; i++) {
      const row = rows[i];
      studentData.push({
        roll: row[0],
        name: row[1],
        college: row[2],
        marks: row[colIndex]
      });
    }

    return studentData;
  }


  if (loading) {
    return (
      <div className="students-page-container">
        <Sidebar />
        <div className="students-main-content">
          <div className="students-loading-container">
            <div className="students-loading-spinner"></div>
            <p className="students-loading-text">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="students-page-container">
        <Sidebar />
        <div className="students-main-content">
          <div className="students-empty-state">
            <div className="students-empty-icon">👥</div>
            <h3 className="students-empty-title">No Students Found</h3>
            <p className="students-empty-description">
              There are no students in the system yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="students-page-container">
      <Sidebar />
      <div className="students-main-content">
        {/* Page Header */}
        <div className="students-page-header">
          <h1 className="students-page-title">Test Management</h1>
          <p className="students-page-subtitle">
            Create tests and assign marks to students
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`students-${message.type}-message`}>
            {message.text}
          </div>
        )}

        {/* Test Information Form */}
        <form className="students-test-form">
          <div className="students-form-grid">
            <div className="students-form-group">
              <label className="students-form-label">Subject *</label>
              <input
                type="text"
                name="subject"
                value={testInfo.subject}
                onChange={handleTestChange}
                className="students-form-input"
                placeholder="Enter subject name"
                required
              />
            </div>
              
            <div className="students-form-group">
              <label className="students-form-label">Chapter *</label>
              <input
                type="text"
                name="chapter"
                value={testInfo.chapter}
                onChange={handleTestChange}
                className="students-form-input"
                placeholder="Enter chapter name"
                required
              />
            </div>
              
            <div className="students-form-group">
              <label className="students-form-label">Total Marks *</label>
              <input
                type="number"
                name="total_marks"
                value={testInfo.total_marks}
                onChange={handleTestChange}
                className="students-form-input"
                placeholder="Enter total marks"
                min="1"
                required
              />
            </div>
              
            <div className="students-form-group">
              <label className="students-form-label">Test Date *</label>
              <input
                type="date"
                name="date"
                value={testInfo.date}
                onChange={handleTestChange}
                className="students-form-input"
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
              
            <div className="students-form-group">
              <label className="students-form-label">Standard *</label>
              <input
                type="text"
                name="standard"
                value={testInfo.standard}
                onChange={handleTestChange}
                className="students-form-input"
                placeholder="e.g. 12Science"
                required
              />
            </div>
              
            <div className="students-upload-container">
              <label className="students-form-label">Upload Excel Marks</label>
              <input
                type="file"
                accept=".xlsx,.xls,.xlsm"
                onChange={handleExcelUpload}
              />
            </div>
          </div>
              
          {/* Students Table (for manual entry) */}
          <div className="students-table-section">
            <div className="students-table-header">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <h3 className="students-table-title">Student Marks Entry</h3>
                  <p className="students-table-description">
                    Enter marks for each student (Total: {filteredStudents.length} of{" "}
                    {students.length} students)
                  </p>
                </div>
                <div className="students-search-container">
                  <input
                    type="text"
                    placeholder="Search students by name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="students-search-input"
                  />
                  <span className="students-search-icon">🔍</span>
                </div>
              </div>
            </div>
                    
            <div className="students-table-wrapper">
              <table className="students-data-table">
                <thead className="students-table-head">
                  <tr>
                    <th className="students-table-head-cell">ID</th>
                    <th className="students-table-head-cell">Student Name</th>
                    <th className="students-table-head-cell">Email</th>
                    <th className="students-table-head-cell">Marks Obtained</th>
                    <th className="students-table-head-cell">Actions</th>
                  </tr>
                </thead>
                    
                <tbody className="students-table-body">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="students-table-cell"
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#6b7280",
                        }}
                      >
                        {searchTerm
                          ? `No students found matching "${searchTerm}"`
                          : "No students available"}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="students-table-row">
                        <td className="students-table-cell">
                          <span className="students-table-id">{student.id}</span>
                        </td>
                        <td className="students-table-cell">
                          <div className="students-table-name">{student.name}</div>
                        </td>
                        <td className="students-table-cell">
                          <div className="students-table-email">{student.email}</div>
                        </td>
                        <td className="students-table-cell">
                          <input
                            type="number"
                            value={marks[student.id] || ""}
                            onChange={(e) =>
                              handleMarkChange(student.id, e.target.value)
                            }
                            className="students-marks-input"
                            min="0"
                            max={testInfo.total_marks || 100}
                            placeholder="0"
                          />
                          {testInfo.total_marks && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginLeft: "8px",
                              }}
                            >
                              / {testInfo.total_marks}
                            </span>
                          )}
                        </td>
                        <td className="students-table-cell">
                          <button
                            type="button"
                            className="students-result-btn"
                            onClick={() => handleUpdateMark(student.id)}
                          >
                            Update Mark
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
                
          {/* Submit Buttons */}
          <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
            <button
              type="button"
              onClick={handleManualSubmit }
              disabled={isSubmitting}
              className={`students-submit-btn ${isSubmitting ? "loading" : ""}`}
            >
              {isSubmitting ? "Submitting..." : "Submit Manual Marks"}
            </button>
                
            <button
              type="button"
              onClick={handleExcelSubmit}
              disabled={isSubmitting}
              className={`students-submit-btn ${isSubmitting ? "loading" : ""}`}
            >
              {isSubmitting ? "Submitting..." : "Submit Excel Marks"}
            </button>
          </div>
        </form>

      </div>

      
    </div>
  );
};

export default StudentsTable;