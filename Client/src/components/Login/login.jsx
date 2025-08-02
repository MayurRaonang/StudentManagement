import React, { useState } from "react";
import "./login.css";
import { useNavigate, Link } from "react-router-dom";
import BASE_URL from "../../assets/assests";

function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = (username, password) => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    return newErrors;
  };

  const showToast = (message, type = 'error') => {
    // Create toast notification
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
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const username = e.target.username.value.trim();
    const password = e.target.password.value;

    // Client-side validation
    const validationErrors = validateForm(username, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("username", username);
        
        showToast("Login successful! Redirecting...", 'success');
        
        // Small delay for better UX
        setTimeout(() => {
          if (data.role === "admin") {
            navigate("/dashboard", { replace: true });
          } else if (data.role === "student") {
            navigate("/student", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }, 1000);
        
      } else {
        const errorMessage = data.error || data.message || "Login failed";
        setErrors({ general: errorMessage });
        showToast(errorMessage);
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = "Server error. Please check your connection and try again.";
      setErrors({ general: errorMessage });
      showToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field) => {
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

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
              placeholder="Username"
              id="username"
              name="username"
              required
              onChange={() => handleInputChange('username')}
              style={{
                borderColor: errors.username ? '#ef4444' : '#e2e8f0'
              }}
              autoComplete="username"
            />
            {errors.username && (
              <span style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                display: 'block'
              }}>
                {errors.username}
              </span>
            )}
          </div>
          
          <div className="form_item">
            <input
              type="password"
              placeholder="Password"
              id="password"
              name="password"
              required
              onChange={() => handleInputChange('password')}
              style={{
                borderColor: errors.password ? '#ef4444' : '#e2e8f0'
              }}
              autoComplete="current-password"
            />
            {errors.password && (
              <span style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                display: 'block'
              }}>
                {errors.password}
              </span>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <p className="sign-in-text">
            Don't have an account? <Link to="/register">Create Account</Link>
          </p>
        </form>
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
}

export default Login;