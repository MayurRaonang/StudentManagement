import React, { useState } from "react";
import BASE_URL from "../../assets/assests";
import { useNavigate } from "react-router-dom";
import "./studentRegister.css";

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    standard: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { 
        alert("You must be logged in to register a student.");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("Student registered successfully.");
        setFormData({ name: "", standard: "", email: "", totalFees: "" });
      } else {
        alert("Failed to register student.");
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  //Register form
  return (
    <div className="form-section">
      <div className="form-card">
        <h2>Register New Student</h2>
        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter student's full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="standard">Standard</label>
            <input
              id="standard"
              name="standard"
              value={formData.standard}
              onChange={handleChange}
              placeholder="Enter class/standard"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              type="email"
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Registering..." : "Register Student"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;
