import React, { useState, useEffect } from 'react';
import Register from './registration';
import Login from './login';

export default function Welcome({ setCurrentView, setIsLoggedIn, setCurrentUser }) {
    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

   
    useEffect(() => {
       
        const sidebar = document.getElementById('sidebar');
        const header = document.getElementById('header');
        const main = document.getElementById('main');
        
        if (sidebar) sidebar.style.display = 'none';
        if (header) header.style.display = 'none';
        if (main) {
            main.style.margin = '0';
            main.style.padding = '0';
        }
        
       
        return () => {
            if (sidebar) sidebar.style.display = '';
            if (header) header.style.display = '';
            if (main) {
                main.style.margin = '';
                main.style.padding = '';
            }
        };
    }, []);

    const handleContinueAsGuest = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setCurrentView("home");
    };

    const handleLoginSuccess = (user) => {
        setIsLoggedIn(true);
        setCurrentUser(user);
        setCurrentView("home");
    };

    if (showRegister) {
        return <Register onBack={() => setShowRegister(false)} onLoginSuccess={handleLoginSuccess} />;
    }

    if (showLogin) {
        return <Login onBack={() => setShowLogin(false)} onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="welcome-container">
            <h1>Welcome to Phreddit</h1>
            
            <div className="welcome-options">
                <button 
                    className="welcome-button"
                    onClick={() => setShowRegister(true)}
                >
                    Register as New User
                </button>
                <button 
                    className="welcome-button"
                    onClick={() => setShowLogin(true)}
                >
                    Login as Existing User
                </button>
                <button 
                    className="welcome-button"
                    onClick={handleContinueAsGuest}
                >
                    Continue as Guest
                </button>
            </div>
        </div>
    );
}