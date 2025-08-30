import React, { useState } from "react";
import "./register.css";
import { useNavigate, Link } from "react-router-dom";
import BASE_URL from "../../assets/assests";

function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
    insname: "",
    tagline: "",
    insaddress: "",
  });

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    // Institute name validation
    if (!formData.insname.trim()) {
      newErrors.insname = "Institute name is required";
    } else if (formData.insname.length < 2) {
      newErrors.insname = "Institute name must be at least 2 characters";
    }
    
    // Institute address validation
    if (!formData.insaddress.trim()) {
      newErrors.insaddress = "Institute address is required";
    } else if (formData.insaddress.length < 10) {
      newErrors.insaddress = "Please enter a complete address";
    }
    
    return newErrors;
  };

  const showToast = (message, type = 'error') => {
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
      z-index: 1000;
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Client-side validation
    // const validationErrors = validateForm();
    // if (Object.keys(validationErrors).length > 0) {
    //   setErrors(validationErrors);
    //   setIsLoading(false);
    //   showToast("Please fix the errors below");
    //   return;
    // }

    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      
      if (res.ok) {
        showToast("Registration successful! Redirecting to login...", 'success');
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
      } else {
        const errorMessage = result.error || result.message || "Registration failed";
        setErrors({ general: errorMessage });
        showToast(errorMessage);
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = "Server error. Please check your connection and try again.";
      setErrors({ general: errorMessage });
      showToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyle = (fieldName) => ({
    borderColor: errors[fieldName] ? '#ef4444' : '#e2e8f0'
  });

  return (
    <div className="login_container">
      <div className="register_container">
        <div className="register_logo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="46"
            height="46"
            fill="currentColor"
            className="bi bi-compass"
            viewBox="0 0 16 16"
          >
            <path d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A1 1 0 0 0 9 0H7a1 1 0 0 0-.962 1.276A7.5 7.5 0 0 0 8 16.016m6.5-7.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0" />
            <path d="m6.94 7.44 4.95-2.83-2.83 4.95-4.949 2.83 2.828-4.95z" />
          </svg>
          Career Compass
        </div>

        {errors.general && (
          <div className="error-banner" style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form_item">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              style={getInputStyle('username')}
              autoComplete="username"
            />
            {errors.username && (
              <span className="error-text">{errors.username}</span>
            )}
          </div>

          <div className="form_item">
            <input
              type="password"
              name="password"
              placeholder="Password (8+ chars with uppercase, lowercase, number)"
              value={formData.password}
              onChange={handleChange}
              required
              style={getInputStyle('password')}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className="form_item">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              style={getInputStyle('email')}
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          {/* <div className="form_item">
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              style={getInputStyle('phone')}
              autoComplete="tel"
            />
            {errors.phone && (
              <span className="error-text">{errors.phone}</span>
            )}
          </div>

          <div className="form_item">
            <input
              type="text"
              name="insname"
              placeholder="Institute Name"
              value={formData.insname}
              onChange={handleChange}
              required
              style={getInputStyle('insname')}
              autoComplete="organization"
            />
            {errors.insname && (
              <span className="error-text">{errors.insname}</span>
            )}
          </div>

          <div className="form_item">
            <input
              type="text"
              name="tagline"
              placeholder="Tagline (Optional)"
              value={formData.tagline}
              onChange={handleChange}
              style={getInputStyle('tagline')}
            />
            {errors.tagline && (
              <span className="error-text">{errors.tagline}</span>
            )}
          </div>

          <div className="form_item">
            <input
              type="text"
              name="insaddress"
              placeholder="Institute Address"
              value={formData.insaddress}
              onChange={handleChange}
              required
              style={getInputStyle('insaddress')}
              autoComplete="street-address"
            />
            {errors.insaddress && (
              <span className="error-text">{errors.insaddress}</span>
            )}
          </div> */}

          <button 
            type="submit" 
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="sign-in-text">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;