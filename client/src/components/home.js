import React, { useState, useEffect, useCallback } from 'react';
import { timeformat } from './util';
import axios from 'axios';
import Voting from './voting';

export default function Home({
  posts,
  communities,
  linkFlairs,
  order,
  setOrder,
  setCurrentView,
  setSelectedPostID,
  forceUpdate,
  isSearch = false,
  isLoggedIn,
  currentUser
}) {
  const [searchResults, setSearchResults] = useState([]);
  const [postVotes, setPostVotes] = useState({});

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
    if (isSearch) {
      const query = window.searchQuery || "";
      if (query) {
        let searchUrl = `http://localhost:8000/api/search?q=${query}`;
        if (order === "active") {
          searchUrl += '&sort=active';
        } else if (order === "oldest") {
          searchUrl += '&sort=oldest';
        }

        axios.get(searchUrl)
          .then(response => {
            setSearchResults(response.data);
            initializeVotes(response.data);
          })
          .catch(err => {
            console.error("Error searching posts:", err);
            setSearchResults([]);
          });
      }
    } else {
      initializeVotes(posts);
    }
  }, [isSearch, order, posts, initializeVotes]);

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
  
  function findCommunityForPost(postId) {
    for (let i = 0; i < communities.length; i++) {
      const community = communities[i];
      if (community.postIDs && community.postIDs.some(id => id === postId || id.toString() === postId.toString())) {
        return community;
      }
    }
    return null;
  }

  function isUserCommunityPost(post) {
    if (!isLoggedIn || !currentUser) return false;
    
    const community = findCommunityForPost(post._id);
    if (!community) return false;
    
    return community.members && community.members.includes(currentUser._id);
  }
  
  function findCommunityName(postId) {
    for (let i = 0; i < communities.length; i++) {
      const community = communities[i];
      if (community.postIDs && community.postIDs.some(id => id === postId || id.toString() === postId.toString())) {
        return community.name;
      }
    }
    return "";
  }
  
  function countComments(post) {
    return post.commentIDs ? post.commentIDs.length : 0;
  }
  
  function getFlairContent(flairId) {
    if (!linkFlairs) return "";
    const flair = linkFlairs.find(f => f._id === flairId);
    return flair ? flair.content : "";
  }
  
  function renderPostItem(post) {
    const communityName = findCommunityName(post._id);
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
            .catch(err => {
              console.error("Error incrementing views:", err);
              setCurrentView("post");
              setSelectedPostID(post._id);
            });
        }}
      >
        <div className="post-metadata">
          {communityName} ~ {post.postedBy} ~ {timeformat(new Date(post.postedDate))}
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
          Views: {post.views} ~ Comments: {countComments(post)}
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

  function renderHome() {
    let allPosts = [...posts];
    
   
    if (order === "newest") {
      allPosts.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else if (order === "oldest") {
      allPosts.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
    }
    
   
    if (isLoggedIn && currentUser) {
     
      const userCommunityPosts = allPosts.filter(post => isUserCommunityPost(post));
      const otherCommunityPosts = allPosts.filter(post => !isUserCommunityPost(post));
      
      return (
        <div>
          <div className="header-container">
            <div className="page-header">All Posts</div>
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
          <div className="post-count">{posts.length} posts</div>
          <div className="header-separator"></div>
          
          <div className="post-listing">
            {userCommunityPosts.length > 0 && (
              <>
                <h3 className="community-section-header">Posts from your communities</h3>
                {userCommunityPosts.map(post => renderPostItem(post))}
                
                {otherCommunityPosts.length > 0 && (
                  <div className="community-divider" style={{
                    margin: '30px 0',
                    borderTop: '2px solid #ccc',
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'white',
                      padding: '0 15px',
                      color: '#666',
                      fontSize: '14px'
                    }}>Other communities</span>
                  </div>
                )}
              </>
            )}
            
            {otherCommunityPosts.map(post => renderPostItem(post))}
            
            {userCommunityPosts.length === 0 && otherCommunityPosts.length === 0 && (
              <div className="no-posts-message">No posts found</div>
            )}
          </div>
        </div>
      );
    } else {
     
      return (
        <div>
          <div className="header-container">
            <div className="page-header">All Posts</div>
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
          <div className="post-count">{posts.length} posts</div>
          <div className="header-separator"></div>
          <div className="post-listing">
            {allPosts.map((post) => renderPostItem(post))}
          </div>
        </div>
      );
    }
  }

  function renderSearch() {
    const query = window.searchQuery || "";
    
    if (!searchResults || searchResults.length === 0) {
      return (
        <div>
          <div className="header-container">
            <div className="page-header">No results found for: {query}</div>
          </div>
          <div className="post-count">0 posts</div>
          <div className="header-separator"></div>
          <div className="empty-search-container" style={{ textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
              We couldn't find anything matching your search
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>
              Try different keywords or check your spelling
            </div>
          </div>
        </div>
      );
    }
    let sortedResults = [...searchResults];
    if (order === "newest") {
      sortedResults.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else if (order === "oldest") {
      sortedResults.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
    } else if (order === "active") {
    }
    return (
      <div>
        <div className="header-container">
          <div className="page-header">Results for: {query}</div>
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
        <div className="post-count">{sortedResults.length} posts</div>
        <div className="header-separator"></div>
        <div className="post-listing">
          {sortedResults.map((post) => renderPostItem(post))}
        </div>
      </div>
    );
  }
  return isSearch ? renderSearch() : renderHome();
}