import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function UserProfile({ 
    currentUser, 
    setCurrentView, 
    setSelectedPostID, 
    setSelectedCommunityID, 
    isViewMode = false, 
    adminUser = null,
    handleViewUserProfile = null 
}) {
    const [activeTab, setActiveTab] = useState('posts');
    const [userContent, setUserContent] = useState([]);
    const [loading, setLoading] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailView, setShowDetailView] = useState(false);

    
    const isAdmin = (isViewMode ? adminUser?.displayName === 'AdminUser' : currentUser?.displayName === 'AdminUser');
    
    
    useEffect(() => {
        if (isViewMode && activeTab === 'users') {
            setActiveTab('posts');
        }
    }, [isViewMode, activeTab]);

    const fetchUserContent = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8000/api/users/${currentUser._id}/content`, {
                params: { type: activeTab }
            });
            setUserContent(response.data);
        } catch (error) {
            console.error('Error fetching user content:', error);
            setUserContent([]);
        }
        setLoading(false);
    }, [currentUser._id, activeTab]);

    
    const fetchCommunityDetails = useCallback(async (communityId) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/communities/${communityId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching community details:', error);
            return null;
        }
    }, []);

    
    const fetchPostDetails = useCallback(async (postId) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/posts/${postId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching post details:', error);
            return null;
        }
    }, []);

    
    const fetchCommentDetails = useCallback(async (commentId) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/comments/${commentId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching comment details:', error);
            return null;
        }
    }, []);

    
    const fetchLinkFlairs = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/linkflairs');
            return response.data;
        } catch (error) {
            console.error('Error fetching link flairs:', error);
            return [];
        }
    }, []);

    const fetchAllUsers = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const response = await axios.get('http://localhost:8000/api/admin/users');
            setAllUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }, [isAdmin]);

    useEffect(() => {
        if (currentUser) {
            if (activeTab === 'users' && isAdmin) {
                fetchAllUsers();
            } else {
                fetchUserContent();
            }
        }
    }, [currentUser, activeTab, fetchUserContent, fetchAllUsers, isAdmin]);

    const handleEdit = async (e, item, type) => {
        
        if (e) {
            e.stopPropagation();
        }
        
        setEditingItem({ ...item, type });
        setEditForm(item);
        
        
        if (type === 'post') {
            try {
                const linkFlairs = await fetchLinkFlairs();
                setEditingItem({ ...item, type, linkFlairs });
            } catch (error) {
                console.error('Error fetching link flairs:', error);
            }
        }
        
        setShowEditForm(true);
        setError('');
    };

    const handleDelete = async (e, item, type) => {
        
        if (e) {
            e.stopPropagation();
        }
        
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            let url;
            if (type === 'post') {
                url = `http://localhost:8000/api/posts/${item._id}`;
            } else if (type === 'comment') {
                url = `http://localhost:8000/api/comments/${item._id}`;
            } else if (type === 'community') {
                url = `http://localhost:8000/api/communities/${item._id}`;
            } else if (type === 'user') {
                url = `http://localhost:8000/api/admin/users/${item._id}`;
            }

            await axios.delete(url);
            
            if (type === 'user') {
                fetchAllUsers();
                if (isViewMode) {
                    
                    setCurrentView('userProfile');
                }
            } else {
                fetchUserContent();
                if (showDetailView) {
                    setShowDetailView(false);
                }
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            setError('Failed to delete item');
        }
    };

    const handleSubmitEdit = async () => {
        try {
            let url;
            if (editingItem.type === 'post') {
                url = `http://localhost:8000/api/posts/${editingItem._id}`;
            } else if (editingItem.type === 'comment') {
                url = `http://localhost:8000/api/comments/${editingItem._id}`;
            } else if (editingItem.type === 'community') {
                url = `http://localhost:8000/api/communities/${editingItem._id}`;
            } else if (editingItem.type === 'user') {
                url = `http://localhost:8000/api/admin/users/${editingItem._id}`;
            }

            const response = await axios.put(url, editForm);
            
            
            setShowEditForm(false);
            setEditingItem(null);
            setEditForm({});
            
            if (editingItem.type === 'user') {
                fetchAllUsers();
                if (isViewMode && editingItem._id === currentUser._id) {
                    
                    
                    const updatedUser = { ...currentUser, ...editForm };
                    if (handleViewUserProfile) {
                        handleViewUserProfile(updatedUser);
                    } else {
                        
                        console.log('handleViewUserProfile not available, updating locally');
                        setCurrentView('userProfile');
                    }
                }
            } else {
                
                fetchUserContent();
                
                
                if (showDetailView && selectedItem) {
                    
                    const updatedItem = response?.data || { ...selectedItem, ...editForm };
                    setSelectedItem({ ...updatedItem, type: selectedItem.type });
                    
                    
                    if (selectedItem.type === 'post' && selectedItem.linkFlairs) {
                        setSelectedItem(prev => ({ ...prev, linkFlairs: selectedItem.linkFlairs }));
                    }
                    
                    
                    if (selectedItem.type === 'comment' && selectedItem.associatedPost) {
                        setSelectedItem(prev => ({ ...prev, associatedPost: selectedItem.associatedPost }));
                    }
                }
            }
        } catch (error) {
            console.error('Error updating item:', error);
            setError('Failed to update item: ' + (error.response?.data?.message || error.message));
        }
    };

    
    const handleUserClick = (user) => {
        if (handleViewUserProfile) {
            handleViewUserProfile(user);
        }
    };

    
    const handleBackToAdminProfile = () => {
        setCurrentView('userProfile');
    };

    
    const handleCommunityClick = async (community) => {
        try {
            const fullCommunity = await fetchCommunityDetails(community._id);
            if (fullCommunity) {
                setSelectedItem({...fullCommunity, type: 'community'});
                setShowDetailView(true);
            } else {
                setError('Failed to load community details');
            }
        } catch (error) {
            console.error('Error in handleCommunityClick:', error);
            setError('Failed to load community details');
        }
    };

    
    const handleDetailEdit = (e, item, type) => {
        
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        console.log("Edit button clicked in detail view");
        
        
        setTimeout(() => {
            
            setEditingItem({ ...item, type });
            setEditForm(item);
            setShowEditForm(true);
            setError('');
            
            
            if (type === 'post') {
                fetchLinkFlairs().then(linkFlairs => {
                    setEditingItem(prev => ({ ...prev, linkFlairs }));
                }).catch(error => {
                    console.error('Error fetching link flairs:', error);
                });
            }
        }, 0);
    };

    
    const handleListItemEdit = (e, item, type) => {
        
        e.stopPropagation();
        console.log("Edit button clicked in list view");
        handleEdit(e, item, type);
    };

    
    const handlePostClick = async (post) => {
        try {
            const fullPost = await fetchPostDetails(post._id);
            if (fullPost) {
                const linkFlairs = await fetchLinkFlairs();
                setSelectedItem({...fullPost, type: 'post', linkFlairs});
                setShowDetailView(true);
            } else {
                setError('Failed to load post details');
            }
        } catch (error) {
            console.error('Error in handlePostClick:', error);
            setError('Failed to load post details');
        }
    };

    
    const handleCommentClick = async (comment) => {
        try {
            const fullComment = await fetchCommentDetails(comment._id);
            if (fullComment) {
                
                let associatedPost = null;
                if (fullComment.postID) {
                    try {
                        associatedPost = await fetchPostDetails(fullComment.postID);
                    } catch (postError) {
                        console.error('Error fetching associated post:', postError);
                    }
                }
                setSelectedItem({...fullComment, type: 'comment', associatedPost});
                setShowDetailView(true);
            } else {
                setError('Failed to load comment details');
            }
        } catch (error) {
            console.error('Error in handleCommentClick:', error);
            setError('Failed to load comment details');
        }
    };

    
    const handleBackFromDetail = () => {
        setShowDetailView(false);
        setSelectedItem(null);
        
        if (editingItem && showEditForm) {
            console.log("Keeping edit form visible after going back");
        }
    };

    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    };

    
    useEffect(() => {
        if (showEditForm) {
            console.log("Edit form should be visible now", editingItem?.type);
        }
    }, [showEditForm, editingItem]);

    
    if (showDetailView && selectedItem) {
        if (selectedItem.type === 'community') {
            return (
                <div className="community-detail" style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
                    <button 
                        onClick={handleBackFromDetail}
                        style={{
                            marginBottom: '20px',
                            background: '#f8f8f8',
                            border: '1px solid #ddd',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Profile
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2>{selectedItem.name}</h2>
                            <p>{selectedItem.description}</p>
                            <p>Created: {formatDate(selectedItem.createdDate || selectedItem.startDate)}</p>
                            <p>Members: {selectedItem.members ? selectedItem.members.length : 0}</p>
                        </div>

                        <div>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Community Edit button clicked - direct");
                                    
                                    setEditingItem({ ...selectedItem, type: 'community' });
                                    setEditForm(selectedItem);
                                    setShowEditForm(true);
                                }}
                                style={{
                                    background: '#4444ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    marginRight: '5px'
                                }}
                            >
                                Edit
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, selectedItem, 'community')}
                                style={{
                                    background: '#ff4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                </div>
            );
        } else if (selectedItem.type === 'post') {
            return (
                <div className="post-detail" style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
                    <button 
                        onClick={handleBackFromDetail}
                        style={{
                            marginBottom: '20px',
                            background: '#f8f8f8',
                            border: '1px solid #ddd',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Profile
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2>{selectedItem.title}</h2>
                            {selectedItem.linkFlairID && selectedItem.linkFlairs && (
                                <div style={{ 
                                    display: 'inline-block', 
                                    backgroundColor: '#e8e8e8', 
                                    padding: '2px 8px', 
                                    borderRadius: '4px',
                                    margin: '5px 0 10px 0',
                                    fontSize: '0.8em'
                                }}>
                                    {selectedItem.linkFlairs.find(flair => flair._id === selectedItem.linkFlairID)?.content || 'Flair'}
                                </div>
                            )}
                            <div style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                                {selectedItem.content}
                            </div>
                            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '15px' }}>
                                Posted by: {selectedItem.postedBy} on {formatDate(selectedItem.postedDate)}
                            </p>
                            <p style={{ fontSize: '0.9em', color: '#666' }}>
                                Upvotes: {selectedItem.upvotes || 0} | Downvotes: {selectedItem.downvotes || 0}
                            </p>
                        </div>

                        <div>
                            <button 
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Post Edit button clicked - direct");
                                    
                                    
                                    let linkFlairs;
                                    try {
                                        linkFlairs = selectedItem.linkFlairs || await fetchLinkFlairs();
                                    } catch (error) {
                                        console.error('Error fetching link flairs:', error);
                                        linkFlairs = [];
                                    }
                                    
                                    
                                    setEditingItem({ ...selectedItem, type: 'post', linkFlairs });
                                    setEditForm(selectedItem);
                                    setShowEditForm(true);
                                }}
                                style={{
                                    background: '#4444ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    marginRight: '5px'
                                }}
                            >
                                Edit
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, selectedItem, 'post')}
                                style={{
                                    background: '#ff4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                </div>
            );
        } else if (selectedItem.type === 'comment') {
            return (
                <div className="comment-detail" style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
                    <button 
                        onClick={handleBackFromDetail}
                        style={{
                            marginBottom: '20px',
                            background: '#f8f8f8',
                            border: '1px solid #ddd',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Profile
                    </button>

                    {selectedItem.associatedPost && (
                        <div style={{ 
                            backgroundColor: '#f9f9f9',
                            padding: '10px',
                            borderRadius: '5px',
                            marginBottom: '15px'
                        }}>
                            <h4>On post: {selectedItem.associatedPost.title}</h4>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ 
                                backgroundColor: 'white',
                                padding: '15px',
                                borderRadius: '5px',
                                border: '1px solid #eee',
                                marginBottom: '15px'
                            }}>
                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedItem.content}
                                </div>
                                <p style={{ fontSize: '0.9em', color: '#666', marginTop: '15px' }}>
                                    Commented by: {selectedItem.commentedBy} on {formatDate(selectedItem.commentedDate)}
                                </p>
                                <p style={{ fontSize: '0.9em', color: '#666' }}>
                                    Upvotes: {selectedItem.upvotes || 0} | Downvotes: {selectedItem.downvotes || 0}
                                </p>
                            </div>
                        </div>

                        <div>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Comment Edit button clicked - direct");
                                    
                                    
                                    setEditingItem({ ...selectedItem, type: 'comment' });
                                    setEditForm(selectedItem);
                                    setShowEditForm(true);
                                }}
                                style={{
                                    background: '#4444ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    marginRight: '5px'
                                }}
                            >
                                Edit
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, selectedItem, 'comment')}
                                style={{
                                    background: '#ff4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                </div>
            );
        }
    }

    return (
        <div className="user-profile" style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
            {/* Add a back button when viewing another user's profile */}
            {isViewMode && isAdmin && (
                <button 
                    onClick={handleBackToAdminProfile}
                    style={{
                        marginBottom: '20px',
                        background: '#f8f8f8',
                        border: '1px solid #ddd',
                        padding: '5px 10px',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    ← Back to Admin Profile
                </button>
            )}
            
            <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>{currentUser.displayName} {isViewMode && <span style={{ fontSize: '0.8em', color: '#666' }}>(Viewed by Admin)</span>}</h2>
                    <p>Email: {currentUser.email}</p>
                    <p>Member since: {formatDate(currentUser.createdDate)}</p>
                    <p>Reputation: {currentUser.reputation}</p>
                </div>
                
                {/* Add edit and delete buttons for admin when viewing another user's profile */}
                {isViewMode && isAdmin && (
                    <div>
                        <button 
                            onClick={(e) => handleDetailEdit(e, currentUser, 'user')}
                            style={{
                                background: '#4444ff',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                marginRight: '5px'
                            }}
                        >
                            Edit User
                        </button>
                        <button 
                            onClick={(e) => handleDelete(e, currentUser, 'user')}
                            style={{
                                background: '#ff4444',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '3px',
                                cursor: 'pointer'
                            }}
                        >
                            Delete User
                        </button>
                    </div>
                )}
            </div>
            
            <div className="profile-tabs" style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                <button 
                    className={activeTab === 'posts' ? 'active' : ''}
                    onClick={() => setActiveTab('posts')}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #ccc',
                        background: activeTab === 'posts' ? 'orangered' : 'white',
                        color: activeTab === 'posts' ? 'white' : 'black',
                        cursor: 'pointer'
                    }}
                >
                    {isViewMode ? 'Posts' : 'My Posts'}
                </button>
                <button 
                    className={activeTab === 'comments' ? 'active' : ''}
                    onClick={() => setActiveTab('comments')}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #ccc',
                        background: activeTab === 'comments' ? 'orangered' : 'white',
                        color: activeTab === 'comments' ? 'white' : 'black',
                        cursor: 'pointer'
                    }}
                >
                    {isViewMode ? 'Comments' : 'My Comments'}
                </button>
                <button 
                    className={activeTab === 'communities' ? 'active' : ''}
                    onClick={() => setActiveTab('communities')}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #ccc',
                        background: activeTab === 'communities' ? 'orangered' : 'white',
                        color: activeTab === 'communities' ? 'white' : 'black',
                        cursor: 'pointer'
                    }}
                >
                    {isViewMode ? 'Communities' : 'My Communities'}
                </button>
                {/* Only show Users tab for admin when not in view mode */}
                {isAdmin && !isViewMode && (
                    <button 
                        className={activeTab === 'users' ? 'active' : ''}
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #ccc',
                            background: activeTab === 'users' ? 'orangered' : 'white',
                            color: activeTab === 'users' ? 'white' : 'black',
                            cursor: 'pointer'
                        }}
                    >
                        All Users
                    </button>
                )}
            </div>
            
            <div className="profile-content">
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                
                {loading ? (
                    <div>Loading...</div>
                ) : activeTab === 'users' && isAdmin ? (
                    <div>
                        {allUsers.length === 0 ? (
                            <div>No users found.</div>
                        ) : (
                            <div>
                                {allUsers.map((user) => (
                                    <div key={user._id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div 
                                            onClick={() => handleUserClick(user)} 
                                            style={{ 
                                                cursor: 'pointer', 
                                                flex: 1, 
                                                padding: '10px',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <h4>{user.displayName}</h4>
                                            <p>Email: {user.email}</p>
                                            <p>Reputation: {user.reputation}</p>
                                        </div>
                                        <div>
                                            <button 
                                                onClick={(e) => handleListItemEdit(e, user, 'user')}
                                                style={{
                                                    background: '#4444ff',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    marginRight: '5px'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(e, user, 'user')}
                                                style={{
                                                    background: '#ff4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : userContent.length === 0 ? (
                    <div>No {activeTab} found.</div>
                ) : (
                    <div>
                        {userContent.map((item, index) => (
                            <div key={item._id || index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                {activeTab === 'posts' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div 
                                                onClick={() => handlePostClick(item)}
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    flex: 1,
                                                    padding: '10px',
                                                    borderRadius: '4px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <h4>{item.title}</h4>
                                                <p>{item.content ? (item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content) : 'No content'}</p>
                                            </div>
                                            <div>
                                                <button 
                                                    onClick={(e) => handleListItemEdit(e, item, 'post')}
                                                    style={{
                                                        background: '#4444ff',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        marginRight: '5px'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, item, 'post')}
                                                    style={{
                                                        background: '#ff4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'comments' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div 
                                                onClick={() => handleCommentClick(item)}
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    flex: 1,
                                                    padding: '10px',
                                                    borderRadius: '4px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <p>{item.content}</p>
                                                <small>Posted on: {formatDate(item.commentedDate)}</small>
                                            </div>
                                            <div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log("Comment Edit button clicked - direct");
                                                        
                                                        
                                                        setEditingItem({ ...item, type: 'comment' });
                                                        setEditForm(item);
                                                        setShowEditForm(true);
                                                    }}
                                                    style={{
                                                        background: '#4444ff',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        marginRight: '5px'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, item, 'comment')}
                                                    style={{
                                                        background: '#ff4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'communities' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div 
                                                onClick={() => handleCommunityClick(item)}
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    flex: 1,
                                                    padding: '10px',
                                                    borderRadius: '4px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <h4>{item.name}</h4>
                                                <p>{item.description}</p>
                                            </div>
                                            <div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log("Community Edit button in list clicked - direct");
                                                        
                                                        
                                                        setEditingItem({ ...item, type: 'community' });
                                                        setEditForm(item);
                                                        setShowEditForm(true);
                                                    }}
                                                    style={{
                                                        background: '#4444ff',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        marginRight: '5px'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, item, 'community')}
                                                    style={{
                                                        background: '#ff4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {showEditForm && (
                <>
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 999
                    }} onClick={(e) => {
                        
                        e.stopPropagation();
                        
                        
                        if (e.target === e.currentTarget) {
                            setShowEditForm(false);
                            setEditingItem(null);
                            setEditForm({});
                            setError('');
                        }
                    }} />
                    
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '20px',
                        zIndex: 1000,
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h3>Edit {editingItem.type}</h3>
                        {editingItem.type === 'post' && (
                            <div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Title:</label>
                                    <input
                                        type="text"
                                        value={editForm.title || ''}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Content:</label>
                                    <textarea
                                        value={editForm.content || ''}
                                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                        style={{ width: '100%', height: '100px', padding: '5px', marginTop: '5px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Link Flair:</label>
                                    <select
                                        value={editForm.linkFlairID || ''}
                                        onChange={(e) => setEditForm({ ...editForm, linkFlairID: e.target.value })}
                                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                                    >
                                        <option value="">No flair</option>
                                        {editingItem.linkFlairs && editingItem.linkFlairs.map(flair => (
                                            <option key={flair._id} value={flair._id}>
                                                {flair.content}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        {editingItem.type === 'comment' && (
                            <div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Content:</label>
                                    <textarea
                                        value={editForm.content || ''}
                                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                        style={{ width: '100%', height: '100px', padding: '5px', marginTop: '5px' }}
                                    />
                                </div>
                            </div>
                        )}
                        {editingItem.type === 'community' && (
                            <div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Name:</label>
                                    <input
                                        type="text"
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Description:</label>
                                    <textarea
                                        value={editForm.description || ''}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        style={{ width: '100%', height: '100px', padding: '5px', marginTop: '5px' }}
                                    />
                                </div>
                            </div>
                        )}
                        {editingItem && editingItem.type === 'user' && (
                            <div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Display Name:</label>
                                    <input
                                        type="text"
                                        value={editForm.displayName || ''}
                                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        value={editForm.email || ''}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Reputation:</label>
                                    <input
                                        type="number"
                                        value={editForm.reputation || 0}
                                        onChange={(e) => setEditForm({ ...editForm, reputation: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                                    />
                                </div>
                            </div>
                        )}
                        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => {
                                    setShowEditForm(false);
                                    setEditingItem(null);
                                    setEditForm({});
                                    setError('');
                                }}
                                style={{
                                    background: '#ccc',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmitEdit}
                                style={{
                                    background: '#4444ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}