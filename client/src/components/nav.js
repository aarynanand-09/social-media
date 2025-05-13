import React, { useState } from 'react';
import axios from 'axios';

export default function Navigation({ 
  communities, 
  currentView, 
  setCurrentView, 
  setOrder,
  selectedCommunityID,
  setSelectedCommunityID,
  handleSearchKeyDown,
  isLoggedIn,
  currentUser,
  setIsLoggedIn,
  setCurrentUser
}) {
 
  const [logoutError, setLogoutError] = useState(null);
  const [navigationError, setNavigationError] = useState(null);
  
 
  const checkServerAvailability = async () => {
    try {
      await axios.get('http://localhost:8000/api/ping', {
        timeout: 500,
        validateStatus: false
      });
      return true;
    } catch (error) {
      console.error("Server availability check failed:", error);
      return false;
    }
  };
  
  const handleLogout = async () => {
    try {
     
      await axios.get('http://localhost:8000/api/ping', { 
        timeout: 500,
        validateStatus: false
      });
      
     
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentView("open");
      setLogoutError(null);
    } catch (error) {
      console.error("Logout error:", error);
     
      setLogoutError("Logout failed: Network error - Server unavailable");
      
     
      setTimeout(() => {
        setLogoutError(null);
      }, 5000);
    }
  };
  
 
  const handleLogoClick = async () => {
    const serverAvailable = await checkServerAvailability();
    
    if (serverAvailable) {
      setCurrentView("open");
      setNavigationError(null);
    } else {
      setNavigationError("Navigation failed: Network error - Server unavailable");
      setTimeout(() => {
        setNavigationError(null);
      }, 5000);
    }
  };
  
  function renderBanner() {
    return (
      <div id="header" className="header">
        <span
          id="name"
          onClick={handleLogoClick}
        >
          phreddit
        </span>
        <div id="searchBox">
          <input
            type="text"
            id="searchInput"
            placeholder="Search Phreddit..."
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        
        {/* Render logout error message if present */}
        {logoutError && (
          <div style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px 20px',
            borderRadius: '4px',
            zIndex: 1001,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            fontSize: '1.1em',
            border: '2px solid #dc3545',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ marginRight: '8px', fontSize: '1.2em' }}>⚠️</span>
            {logoutError}
          </div>
        )}
        
        {/* Render navigation error message if present */}
        {navigationError && (
          <div style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px 20px',
            borderRadius: '4px',
            zIndex: 1001,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            fontSize: '1.1em',
            border: '2px solid #dc3545',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ marginRight: '8px', fontSize: '1.2em' }}>⚠️</span>
            {navigationError}
          </div>
        )}
        
        {isLoggedIn ? (
          <>
            <button 
              id="userProfile" 
              onClick={() => setCurrentView("userProfile")}
              style={{
                position: 'absolute',
                right: '200px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '35px',
                backgroundColor: 'orangered',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: '300px',
                fontSize: '0.5em'
              }}
            >
              {currentUser?.displayName}
            </button>
            <button 
              id="logoutBtn" 
              onClick={handleLogout}
              style={{
                position: 'absolute',
                right: '320px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '35px',
                backgroundColor: 'orangered',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: '300px',
                fontSize: '0.5em'
              }}
            >
              Logout
            </button>
            <button
              id="postButt"
              onClick={() => setCurrentView("newPost")}
              style={{
                backgroundColor: currentView === "newPost" ? "orangered" : "gray",
                transition: "background-color 0.3s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "orangered"}
              onMouseLeave={(e) => e.target.style.backgroundColor = currentView === "newPost" ? "orangered" : "gray"}
            >
              Create Post
            </button>
          </>
        ) : (
          <>
            <button 
              id="userProfile" 
              style={{ 
                opacity: 0.5, 
                backgroundColor: 'gray',
                position: 'absolute',
                right: '140px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '35px',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '300px',
                fontSize: '0.5em'
              }}
              disabled
            >
              Guest
            </button>
            <button
              id="postButt"
              style={{ backgroundColor: "gray", opacity: 0.5 }}
              disabled
            >
              Create Post
            </button>
          </>
        )}
      </div>
    );
  }

  function renderSidebar() {
    const sortedCommunities = [...communities];
    if (isLoggedIn && currentUser) {
      sortedCommunities.sort((a, b) => {
        const aIsMember = a.members && a.members.includes(currentUser._id);
        const bIsMember = b.members && b.members.includes(currentUser._id);
        if (aIsMember && !bIsMember) return -1;
        if (!aIsMember && bIsMember) return 1;
        return 0;
      });
    }
    
    return (
      <div id="sidebar">
        <div
          id="homeLink"
          className="home-link"
          style={{
            backgroundColor: currentView === "home" ? "orangered" : ""
          }}
          onClick={() => {
            setOrder("newest");
            setCurrentView("home");
          }}
        >
          Home
        </div>
        <div className="side-separator"></div>
        <h3 className="communities-header">Communities</h3>
        <button
          id="commButt"
          onClick={() => {
            setCurrentView("newCommunity");
          }}
          style={{
            backgroundColor: currentView === "newCommunity" ? "orangered" : "",
            opacity: isLoggedIn ? 1 : 0.5
          }}
          disabled={!isLoggedIn}
        >
          Create Community
        </button>
        <div id="communitiesList">
          {sortedCommunities.map((community) => (
            <div
              key={community._id}
              className="comms"
              style={{
                backgroundColor: 
                  currentView === "community" && selectedCommunityID === community._id 
                    ? "orangered" : "",
                color: 
                  currentView === "community" && selectedCommunityID === community._id 
                    ? "white" : ""
              }}
              onClick={() => {
                setCurrentView("community");
                setSelectedCommunityID(community._id);
              }}
            >
              {community.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {renderBanner()}
      {renderSidebar()}
    </>
  );
}