import React, { useState, useEffect, useCallback } from 'react';
import { timeformat, parseHyperlinks } from './util';
import axios from 'axios';
import Voting from './voting';

export default function Community({
  communities,
  posts,
  linkFlairs,
  selectedCommunityID,
  order,
  setOrder,
  setCurrentView,
  setSelectedPostID,
  forceUpdate,
  isLoggedIn,
  currentUser
}) {
  const [communityPosts, setCommunityPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [postVotes, setPostVotes] = useState({});
  const [communityCreator, setCommunityCreator] = useState('');
  
  const initializeVotes = useCallback((postList) => {
    const voteData = {};
    postList.forEach(post => {
      voteData[post._id] = {
        votes: post.votes || 0,
        hasUpvoted: post.upvotedBy?.includes(currentUser?._id),
        hasDownvoted: post.downvotedBy?.includes(currentUser?._id)
      };
    });
    setPostVotes(voteData);
  }, [currentUser]);
  
  useEffect(() => {
    if (selectedCommunityID) {
      setIsLoading(true);
      
      let endpoint = `http://localhost:8000/api/communities/${selectedCommunityID}/posts`;
      if (order === "active") {
        endpoint += '?sort=active';
      }
      
      axios.get(endpoint)
        .then(response => {
          setCommunityPosts(response.data);
          initializeVotes(response.data);
          return axios.get(`http://localhost:8000/api/communities/${selectedCommunityID}`);
        })
        .then(response => {
          setIsMember(response.data.members?.includes(currentUser?._id));
          const community = response.data;
          const creator = community.members && community.members.length > 0 ? community.members[0] : '';
          
          if (creator) {
            axios.get(`http://localhost:8000/api/admin/users`)
              .then(userRes => {
                const users = userRes.data;
                const foundUser = users.find(user => user._id === creator);
                if (foundUser) {
                  setCommunityCreator(foundUser.displayName);
                }
              })
              .catch(err => {
                console.error("Error fetching user info:", err);
                setCommunityCreator('Unknown');
              });
          }
          
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error fetching community posts:", error);
          setIsLoading(false);
        });
    }
  }, [selectedCommunityID, order, currentUser, initializeVotes]);

  const handleVoteUpdate = (postId, data) => {
    setPostVotes(prev => ({
      ...prev,
      [postId]: {
        votes: data.votes,
        hasUpvoted: data.hasUpvoted,
        hasDownvoted: data.hasDownvoted
      }
    }));
  };
  
  const handleJoinLeave = async () => {
    if (!isLoggedIn || !currentUser) return;
    
    try {
      const endpoint = isMember ? 'leave' : 'join';
      await axios.post(`http://localhost:8000/api/communities/${selectedCommunityID}/${endpoint}`, {
        userId: currentUser._id
      });
      setIsMember(!isMember);
      
     
      await axios.get('http://localhost:8000/api/communities', { 
        headers: { 'user-id': currentUser._id } 
      });
      forceUpdate();
    } catch (error) {
      console.error(`Error ${isMember ? 'leaving' : 'joining'} community:`, error);
    }
  };
  
  function getFlairContent(flairId) {
    if (!linkFlairs) return "";
    const flair = linkFlairs.find(f => f._id === flairId);
    return flair ? flair.content : "";
  }
  
  function countComments(post) {
    return post.commentIDs ? post.commentIDs.length : 0;
  }

  function renderCommunityPostItem(post) {
    const votes = postVotes[post._id] || { votes: 0, hasUpvoted: false, hasDownvoted: false };

    return (
      <div
        key={post._id}
        className="post-item"
        onClick={() => {
          axios.put(`http://localhost:8000/api/posts/${post._id}/view`)
            .then(() => {
              setCurrentView("post");
              setSelectedPostID(post._id);
              forceUpdate();
            })
            .catch(error => {
              console.error("Error incrementing views:", error);
              setCurrentView("post");
              setSelectedPostID(post._id);
            });
        }}
      >
        <div className="post-metadata">
          {post.postedBy} ~ {timeformat(new Date(post.postedDate))}
        </div>
        <div className="post-title">{post.title}</div>
        {post.linkFlairID && (
          <div className="post-flair">{getFlairContent(post.linkFlairID)}</div>
        )}
        <div className="post-preview">
          {post.content.substring(0, 80)}
          {post.content.length > 80 ? "..." : ""}
        </div>
        <div className="post-stats" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          Views: {post.views} ~ Comments: {countComments(post)} ~ Votes: {votes.votes}
          <div onClick={(e) => e.stopPropagation()}>
            <Voting
              itemType="posts"
              itemId={post._id}
              votes={votes.votes}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onVoteUpdate={(data) => handleVoteUpdate(post._id, data)}
              hasUpvoted={votes.hasUpvoted}
              hasDownvoted={votes.hasDownvoted}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderCommunity() {
    const community = communities.find(c => c._id === selectedCommunityID);
    if (!community) return null;
    
    let sortedPosts = [...communityPosts];
    if (order === "newest") {
      sortedPosts.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else if (order === "oldest") {
      sortedPosts.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
    } else if (order === "active") {
    }
    
    return (
      <div>
        <div className="header-container">
          <div className="page-header">{community.name}</div>
          <div className="sort-buttons">
            <button
              className="sort-button"
              onClick={() => {
                setOrder("newest");
                forceUpdate("newest");
              }}
            >
              Newest
            </button>
            <button
              className="sort-button"
              onClick={() => {
                setOrder("oldest");
                forceUpdate("oldest");
              }}
            >
              Oldest
            </button>
            <button
              className="sort-button"
              onClick={() => {
                setOrder("active");
                forceUpdate("active");
              }}
            >
              Active
            </button>
          </div>
        </div>
        <div className="community-description">{parseHyperlinks(community.description)}</div>
        <div className="community-age">Created {timeformat(new Date(community.startDate))} by {communityCreator}</div>
        <div className="community-stats">
          Posts: {community.postIDs ? community.postIDs.length : 0} ~ Members: {community.members ? community.members.length : 0}
        </div>
        {isLoggedIn && (
          <button 
            className="join-leave-button"
            onClick={handleJoinLeave}
            style={{
              background: isMember ? '#ff4444' : '#44aa44',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              margin: '10px 0'
            }}
          >
            {isMember ? 'Leave Community' : 'Join Community'}
          </button>
        )}
        <div className="post-count">{sortedPosts.length} posts</div>
        <div className="header-separator"></div>
        {isLoading ? (
          <div>Loading posts...</div>
        ) : (
          <div className="post-listing">
            {sortedPosts.map((post) => renderCommunityPostItem(post))}
          </div>
        )}
      </div>
    );
  }
  
  return renderCommunity();
}