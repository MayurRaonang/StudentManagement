import db from '../db.js';
import nodemailer from 'nodemailer';

export const getAllResults = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM results");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const transformToStudentResults = (flatData) => {
  const studentMap = {};
  
  flatData.forEach(record => {
    const studentId = record.student_id;
    
    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        studentId: record.student_id,
        studentName: record.student_name,
        studentEmail: record.student_email,
        tests: []
      };
    }
    
    studentMap[studentId].tests.push({
      testId: record.test_id,
      subject: record.subject,
      chapter: record.chapter,
      totalMarks: record.total_marks,
      testDate: record.test_date,
      marksObtained: record.marks_obtained
    });
  });
  
  return Object.values(studentMap);
};

export const getCustomReport = async (req, res) => {
    const { from, to, std } = req.body;
    const userID = req.user.id; // { id, role }
    console.log("Fetching custom report from:", from, "to:", to, "for standard:", std, "userID:", userID);

    if (!from || !to || !std) {
        return res.status(400).json({ error: "Please provide from date, to date, and student ID." });
    }
    try {
        const result = await db.query(
  `
  SELECT
    s.id AS student_id,
    s.name AS student_name,
    s.email AS student_email,
    t.id AS test_id,
    t.subject,
    t.chapter,
    t.total_marks,
    t.test_date,
    m.marks_obtained
FROM students s
CROSS JOIN tests t
LEFT JOIN marks m 
    ON m.student_id = s.id 
   AND m.test_id = t.id
WHERE s.std = $1
  AND t.test_date BETWEEN $2 AND $3
  AND t.user_id = $4
  AND s.user_id = $4
ORDER BY s.id, t.test_date ASC;
  `,
  [std, from, to, userID]
);
console.log("Custom report query result:", result.rows);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No results found for the specified date range and student ID." });
        }
        const transformedResults = transformToStudentResults(result.rows);
        res.json({
      success: true,
      results: transformedResults,
      message: `Found ${transformedResults.length} students`
    });
    }
    catch (err) {
        console.error("Error fetching custom report:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getWeeklyReport = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT 
                tests.id AS test_id, 
                tests.subject,
                tests.chapter,
                tests.total_marks,
                tests.test_date,
                marks.marks_obtained
            FROM marks
            JOIN tests ON marks.test_id = tests.id
            WHERE tests.test_date >= NOW() - INTERVAL '7 days'
            ORDER BY tests.test_date ASC;
            `
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No results found for the past week" });
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMonthlyReport = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                tests.id AS test_id,
                tests.subject,
                tests.chapter,
                tests.total_marks,
                tests.test_date,
                marks.marks_obtained
            FROM marks
            JOIN tests ON marks.test_id = tests.id
            WHERE tests.test_date >= NOW() - INTERVAL '1 month'
            ORDER BY tests.test_date ASC;
            `
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No results found for the past month" });
        }
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const sendEmailReport = async (req, res) => {
  try {
    const { from, to, results } = req.body;
    
    // results is already in the grouped format:
    // [
    //   {
    //     studentId: 1,
    //     studentName: 'Ravi Kumar',
    //     studentEmail: 'ravi@student.com',
    //     tests: [
    //       { testId: 2, subject: 'Chemistry', ... },
    //       { testId: 8, subject: 'Chemistry', ... }
    //     ]
    //   },
    //   ...
    // ]
    
    const emailPromises = results.map(async (studentResult) => {
      try {
        // Generate email content for this student
        const emailContent = generateEmailContent(studentResult, from, to);
        
        // Send email (using your preferred email service)
        await sendEmail({
          to: studentResult.studentEmail,
          subject: `Test Results - ${from} to ${to}`,
          html: emailContent
        });
        
        console.log(`Email sent successfully to ${studentResult.studentEmail}`);
        return { success: true, email: studentResult.studentEmail };
        
      } catch (emailError) {
        console.error(`Failed to send email to ${studentResult.studentEmail}:`, emailError);
        return { success: false, email: studentResult.studentEmail, error: emailError.message };
      }
    });
    
    // Wait for all emails to be sent
    const emailResults = await Promise.all(emailPromises);
    
    // Count successful and failed emails
    const successful = emailResults.filter(result => result.success).length;
    const failed = emailResults.filter(result => !result.success).length;
    
    res.json({
      success: true,
      message: `Emails sent: ${successful} successful, ${failed} failed`,
      totalStudents: results.length,
      successful,
      failed,
      details: emailResults
    });
    
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send emails',
      error: error.message 
    });
  }
};

// Helper function to generate email content
const generateEmailContent = (studentResult, fromDate, toDate) => {
  const { studentName, tests } = studentResult;
  
  // Calculate totals
  const totalMarksObtained = tests.reduce((sum, test) => sum + test.marksObtained, 0);
  const totalMarksPossible = tests.reduce((sum, test) => sum + test.totalMarks, 0);
  const overallPercentage = totalMarksPossible > 0 ? ((totalMarksObtained / totalMarksPossible) * 100).toFixed(1) : 0;
  
  // Generate test rows HTML
  const testRowsHtml = tests.map(test => {
    const percentage = ((test.marksObtained / test.totalMarks) * 100).toFixed(1);
    const testDate = new Date(test.testDate).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    return `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;">${test.testId}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${test.subject}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${test.chapter}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${testDate}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${test.marksObtained}/${test.totalMarks}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${percentage}%</td>
      </tr>
    `;
  }).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Results Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px;">
          <h1 style="color: #4f46e5; margin: 0;">Test Results Report</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Period: ${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}</p>
        </div>
        
        <!-- Student Info -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; margin-bottom: 15px;">Dear ${studentName},</h2>
          <p style="color: #666; line-height: 1.6;">Here are your test results for the selected period:</p>
        </div>
        
        <!-- Summary Stats -->
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #333; margin-top: 0;">Summary</h3>
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
            <div style="margin-bottom: 10px;">
              <strong>Total Tests:</strong> ${tests.length}
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Total Score:</strong> ${totalMarksObtained}/${totalMarksPossible}
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Overall Percentage:</strong> ${overallPercentage}%
            </div>
          </div>
        </div>
        
        <!-- Test Results Table -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333;">Detailed Results</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #4f46e5; color: white;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Test ID</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Subject</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Chapter</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Date</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Marks</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${testRowsHtml}
            </tbody>
          </table>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>If you have any questions, please contact your teacher or administrator.</p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

// Example email sending function (replace with your email service)
const sendEmail = async ({ to, subject, html }) => {
  // Using nodemailer example - replace with your email service
  
  
  const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
  
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: to,
    subject: subject,
    html: html
  };
  
  return await transporter.sendMail(mailOptions);
};