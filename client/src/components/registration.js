import React, { useState } from 'react';
import axios from 'axios';

export default function Register({ onBack, onLoginSuccess }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async () => {
        const newErrors = {};
        
        if (!firstName.trim()) newErrors.firstName = "First name is required";
        if (!lastName.trim()) newErrors.lastName = "Last name is required";
        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(email)) {
            newErrors.email = "Invalid email format";
        }
        if (!displayName.trim()) newErrors.displayName = "Display name is required";
        if (!password) newErrors.password = "Password is required";
        if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match";
        
        if (password) {
            const passwordLower = password.toLowerCase();
            const firstNameLower = firstName.toLowerCase();
            const lastNameLower = lastName.toLowerCase();
            const displayNameLower = displayName.toLowerCase();
            const emailLower = email.toLowerCase();
            
            if (passwordLower.includes(firstNameLower) || 
                passwordLower.includes(lastNameLower) || 
                passwordLower.includes(displayNameLower) || 
                passwordLower.includes(emailLower)) {
                newErrors.password = "Password cannot contain personal information (including first/last name)";
            }
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            const response = await axios.post('http://localhost:8000/api/auth/register', {
                firstName,
                lastName,
                email,
                displayName,
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
            <h2>Create New Account</h2>
            
            {errors.general && <div className="error-message">{errors.general}</div>}
            
            <div className="input-group">
                <label>First Name <span className="required-indicator">*</span></label>
                <input 
                    type="text" 
                    className="text-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                {errors.firstName && <div className="error-message">{errors.firstName}</div>}
            </div>

            <div className="input-group">
                <label>Last Name <span className="required-indicator">*</span></label>
                <input 
                    type="text" 
                    className="text-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
                {errors.lastName && <div className="error-message">{errors.lastName}</div>}
            </div>

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
                <label>Display Name <span className="required-indicator">*</span></label>
                <input 
                    type="text" 
                    className="text-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
                {errors.displayName && <div className="error-message">{errors.displayName}</div>}
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

            <div className="input-group">
                <label>Confirm Password <span className="required-indicator">*</span></label>
                <input 
                    type="password" 
                    className="text-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>
            
            <button className="submit-button" onClick={handleSubmit}>Sign Up</button>
            <button className="submit-button" onClick={onBack} style={{marginLeft: '10px'}}>Back</button>
        </div>
    );
}