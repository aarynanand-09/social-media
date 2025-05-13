import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onBack, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    const handleSubmit = async () => {
        const newErrors = {};
        
        if (!email.trim()) newErrors.email = "Email is required";
        if (!password) newErrors.password = "Password is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            const response = await axios.post('http://localhost:8000/api/auth/login', {
                email,
                password
            });
            
            onLoginSuccess(response.data.user);
        } catch (error) {
            if (error.response) {
                setErrors({ general: error.response.data.message });
            }
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            
            {errors.general && <div className="error-message">{errors.general}</div>}
            
            <div className="input-group">
                <label>Email <span className="required-indicator">*</span></label>
                <input 
                    type="email" 
                    className="text-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="input-group">
                <label>Password <span className="required-indicator">*</span></label>
                <input 
                    type="password" 
                    className="text-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <button className="submit-button" onClick={handleSubmit}>Login</button>
            <button className="submit-button" onClick={onBack} style={{marginLeft: '10px'}}>Back</button>
        </div>
    );
}