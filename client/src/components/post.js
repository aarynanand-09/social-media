import React, { useState, useEffect, useCallback } from 'react';
import { timeformat, parseHyperlinks } from './util';
import axios from 'axios';
import Voting from './voting';

export default function Post({
  posts,
  comments,
  communities,
  linkFlairs,
  selectedPostID,
  currentCommentID,
  setCurrentCommentID,
  setCurrentView,
  setOrder,
  isLoggedIn,
  currentUser
}) {
  const [post, setPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postVotes, setPostVotes] = useState({ votes: 0, hasUpvoted: false, hasDownvoted: false });
  const [commentVotes, setCommentVotes] = useState({});

  const initCommentVotes = useCallback((comments) => {
    const voteData = {};
    comments.forEach(comment => {
      voteData[comment._id] = {
        votes: comment.votes || 0,
        hasUpvoted: comment.upvotedBy?.includes(currentUser?._id),
        hasDownvoted: comment.downvotedBy?.includes(currentUser?._id)
      };
    });
    setCommentVotes(voteData);
  }, [currentUser]);
  
  useEffect(() => {
    if (selectedPostID) {
      setIsLoading(true);
      
      axios.get(`http://localhost:8000/api/posts/${selectedPostID}`)
        .then(response => {
          setPost(response.data);
          setPostVotes({
            votes: response.data.votes || 0,
            hasUpvoted: response.data.upvotedBy?.includes(currentUser?._id),
            hasDownvoted: response.data.downvotedBy?.includes(currentUser?._id)
          });
          return axios.get(`http://localhost:8000/api/posts/${selectedPostID}/comments`);
        })
        .then(response => {
          setPostComments(response.data);
          initCommentVotes(response.data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error fetching post data:", error);
          setIsLoading(false);
        });
    }
  }, [selectedPostID, currentUser, initCommentVotes]);

  const handleVoteUpdate = (data) => {
    setPostVotes({
      votes: data.votes,
      hasUpvoted: data.hasUpvoted,
      hasDownvoted: data.hasDownvoted
    });
  };

  const handleCommentVoteUpdate = (commentId, data) => {
    setCommentVotes(prev => ({
      ...prev,
      [commentId]: {
        votes: data.votes,
        hasUpvoted: data.hasUpvoted,
        hasDownvoted: data.hasDownvoted
      }
    }));
  };
  
  function getFlairContent(flairId) {
    if (!linkFlairs) return "";
    const flair = linkFlairs.find(f => f._id === flairId);
    return flair ? flair.content : "";
  }
  
  function findCommunityForPost(postId) {
    for (let i = 0; i < communities.length; i++) {
      const comm = communities[i];
      if (comm.postIDs && comm.postIDs.includes(postId)) {
        return comm;
      }
    }
    return null;
  }
  
  function countComments(post) {
    return post && post.commentIDs ? post.commentIDs.length : 0;
  }
  
  function getChildComments(commentId) {
    return postComments.filter(c => c.parentID === commentId);
  }

  function renderComment(comment, nestLevel) {
    if (!comment) return null;
    
    const childComments = getChildComments(comment._id);
    const votes = commentVotes[comment._id] || { votes: 0, hasUpvoted: false, hasDownvoted: false };
    
    return (
      <div
        key={comment._id}
        className={`comment-item ${nestLevel > 0 ? "nested-comment" : ""}`}
        style={{ marginLeft: nestLevel * 20 }}
      >
        <div className="comment-metadata">
          {comment.commentedBy} ~ {timeformat(new Date(comment.commentedDate))}
        </div>
        <div className="comment-content">{parseHyperlinks(comment.content)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
          {isLoggedIn && (
            <button
              className="reply-button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentCommentID(comment._id);
                setCurrentView("newComment");
              }}
            >
              Reply
            </button>
          )}
          {isLoggedIn && (
            <Voting
              itemType="comments"
              itemId={comment._id}
              votes={votes.votes}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onVoteUpdate={(data) => handleCommentVoteUpdate(comment._id, data)}
              hasUpvoted={votes.hasUpvoted}
              hasDownvoted={votes.hasDownvoted}
            />
          )}
        </div>
        {childComments
          .sort((a, b) => new Date(b.commentedDate) - new Date(a.commentedDate))
          .map((child) => renderComment(child, nestLevel + 1))}
      </div>
    );
  }

  function renderPost() {
    if (isLoading || !post) {
      return <div>Loading post...</div>;
    }
    
    const community = findCommunityForPost(post._id);
    
    const topLevelComments = postComments.filter(c => !c.parentID || c.parentID === null);
    
    return (
      <div>
        <div className="post-header">
          <div className="community-time">
            {(community ? community.name : "Unknown Community")} ~ {timeformat(new Date(post.postedDate))}
          </div>
          <div className="post-username">{post.postedBy}</div>
          <div className="post-title-full">{post.title}</div>
          {post.linkFlairID && (
            <div className="post-flair">{getFlairContent(post.linkFlairID)}</div>
          )}
          <div className="post-content">{parseHyperlinks(post.content)}</div>
          <div className="post-stats" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            Views: {post.views} ~ Comments: {countComments(post)}
            {isLoggedIn && (
              <Voting
                itemType="posts"
                itemId={post._id}
                votes={postVotes.votes}
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onVoteUpdate={handleVoteUpdate}
                hasUpvoted={postVotes.hasUpvoted}
                hasDownvoted={postVotes.hasDownvoted}
              />
            )}
          </div>
          {isLoggedIn && (
            <button
              className="add-comment-btn"
              onClick={() => {
                setCurrentView("newComment");
                setCurrentCommentID(null);
              }}
            >
              Add a comment
            </button>
          )}
          <div className="header-separator"></div>
        </div>
        <div className="comments-section">
          {topLevelComments
            .sort((a, b) => new Date(b.commentedDate) - new Date(a.commentedDate))
            .map((comment) => renderComment(comment, 0))}
        </div>
      </div>
    );
  }
  
  return renderPost();
}