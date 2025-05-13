import React from 'react';
import axios from 'axios';

export default function Voting({ 
    itemType, 
    itemId, 
    votes, 
    isLoggedIn, 
    currentUser, 
    onVoteUpdate,
    hasUpvoted,
    hasDownvoted 
}) {
    if (!isLoggedIn) {
        return (
            <div style={{ color: '#888', display: 'flex', alignItems: 'center' }}>
                <span>▲</span>
                <span style={{ margin: '0 5px' }}>{votes}</span>
                <span>▼</span>
            </div>
        );
    }

    const handleVote = async (voteType) => {
        try {
            const res = await axios.post(`http://localhost:8000/api/${itemType}/${itemId}/vote`, {
                userId: currentUser._id,
                voteType
            });
            if (onVoteUpdate) {
                onVoteUpdate(res.data);
            }
        } catch (err) {
            console.error('Voting error:', err);
            if (err.response && err.response.data && err.response.data.message) {
                alert(err.response.data.message);
            }
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button 
                onClick={() => handleVote('upvote')}
                disabled={currentUser?.reputation < 50}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: currentUser?.reputation >= 50 ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    color: hasUpvoted ? 'orangered' : '#888',
                    opacity: currentUser?.reputation < 50 ? 0.5 : 1
                }}
            >
                ▲
            </button>
            <span style={{ minWidth: '30px', textAlign: 'center' }}>{votes || 0}</span>
            <button 
                onClick={() => handleVote('downvote')}
                disabled={currentUser?.reputation < 50}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: currentUser?.reputation >= 50 ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    color: hasDownvoted ? 'blue' : '#888',
                    opacity: currentUser?.reputation < 50 ? 0.5 : 1
                }}
            >
                ▼
            </button>
        </div>
    );
}