import React from 'react';

export default function Form({
  communities,
  linkFlairs,
  comments,
  currentView,
  communityName,
  setCommunityName,
  communityDesc,
  setCommunityDesc,
  communityUsername,
  setCommunityUsername,
  nameErr,
  descErr,
  userErr,
  handleCreateCommunity,
  postCommunityID,
  setPostCommunityID,
  postTitle,
  setPostTitle,
  postLinkFlair,
  setPostLinkFlair,
  postCustomFlair,
  setPostCustomFlair,
  postContent,
  setPostContent,
  postUsername,
  setPostUsername,
  communityErr,
  titleErr,
  flairErr,
  contentErr,
  postUserErr,
  handleCreatePost,
  currentCommentID,
  commentContent,
  setCommentContent,
  commentUsername,
  setCommentUsername,
  commentContentErr,
  commentUserErr,
  handleCreateComment,
  isLoggedIn,
  currentUser
}) {
  function findCommentById(commentId) {
    for (let i = 0; i < comments.length; i++) {
      if (comments[i]._id === commentId) {
        return comments[i];
      }
    }
    return null;
  }

  function renderNewCommunity() {
    return (
      <div className="form-container">
        <h2>Create a New Community</h2>
        <div className="input-group">
          <label className="input-label">
            Community Name <span className="required-indicator">*</span>
          </label>
          <input
            className="text-input"
            type="text"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
          />
          {nameErr && <div className="error-message">{nameErr}</div>}
        </div>
        <div className="input-group">
          <label className="input-label">
            Community Description <span className="required-indicator">*</span>
          </label>
          <textarea
            className="textarea-input"
            value={communityDesc}
            onChange={(e) => setCommunityDesc(e.target.value)}
          />
          {descErr && <div className="error-message">{descErr}</div>}
        </div>
        {!isLoggedIn && (
          <div className="input-group">
            <label className="input-label">
              Creator Username <span className="required-indicator">*</span>
            </label>
            <input
              className="text-input"
              type="text"
              value={communityUsername}
              onChange={(e) => setCommunityUsername(e.target.value)}
            />
            {userErr && <div className="error-message">{userErr}</div>}
          </div>
        )}
        <button className="submit-button" onClick={handleCreateCommunity}>
          Engender Community
        </button>
      </div>
    );
  }

  function renderNewPost() {
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
      <div className="form-container">
        <h2>Create a New Post</h2>
        <div className="input-group">
          <label className="input-label">
            Community <span className="required-indicator">*</span>
          </label>
          <select
            className="select-input"
            value={postCommunityID}
            onChange={(e) => setPostCommunityID(e.target.value)}
          >
            {sortedCommunities.map((comm) => (
              <option key={comm._id} value={comm._id}>
                {comm.name}
              </option>
            ))}
          </select>
          {communityErr && <div className="error-message">{communityErr}</div>}
        </div>
        <div className="input-group">
          <label className="input-label">
            Post Title <span className="required-indicator">*</span>
          </label>
          <input
            className="text-input"
            type="text"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
          />
          {titleErr && <div className="error-message">{titleErr}</div>}
        </div>
        <div className="input-group">
          <label className="input-label">Link Flair (Optional)</label>
          <select
            className="select-input"
            value={postLinkFlair}
            onChange={(e) => setPostLinkFlair(e.target.value)}
          >
            <option value="">~ No Flair ~</option>
            {linkFlairs.map((flair) => (
              <option key={flair._id} value={flair._id}>
                {flair.content}
              </option>
            ))}
            <option value="custom">~ Create New Flair ~</option>
          </select>
          {postLinkFlair === "custom" && (
            <input
              className="text-input"
              type="text"
              placeholder="Enter custom flair"
              value={postCustomFlair}
              onChange={(e) => setPostCustomFlair(e.target.value)}
              style={{ marginTop: "10px" }}
            />
          )}
          {flairErr && <div className="error-message">{flairErr}</div>}
        </div>
        <div className="input-group">
          <label className="input-label">
            Post Content <span className="required-indicator">*</span>
          </label>
          <textarea
            className="textarea-input"
            rows="8"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
          />
          {contentErr && <div className="error-message">{contentErr}</div>}
        </div>
        {!isLoggedIn && (
          <div className="input-group">
            <label className="input-label">
              Username <span className="required-indicator">*</span>
            </label>
            <input
              className="text-input"
              type="text"
              value={postUsername}
              onChange={(e) => setPostUsername(e.target.value)}
            />
            {postUserErr && <div className="error-message">{postUserErr}</div>}
          </div>
        )}
        <button className="submit-button" onClick={handleCreatePost}>
          Submit Post
        </button>
      </div>
    );
  }

  function renderNewComment() {
    return (
      <div className="form-container">
        <h2>{currentCommentID ? "Reply to Comment" : "Add a Comment"}</h2>
        {currentCommentID && (
          <div className="replying-to">
            <strong>Replying to: </strong>
            {findCommentById(currentCommentID)?.content}
          </div>
        )}
        <div className="input-group">
          <label className="input-label">
            Comment <span className="required-indicator">*</span>
          </label>
          <textarea
            className="textarea-input"
            rows="5"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          />
          {commentContentErr && (
            <div className="error-message">{commentContentErr}</div>
          )}
        </div>
        {!isLoggedIn && (
          <div className="input-group">
            <label className="input-label">
              Username <span className="required-indicator">*</span>
            </label>
            <input
              className="text-input"
              type="text"
              value={commentUsername}
              onChange={(e) => setCommentUsername(e.target.value)}
            />
            {commentUserErr && (
              <div className="error-message">{commentUserErr}</div>
            )}
          </div>
        )}
        <button className="submit-button" onClick={handleCreateComment}>
          Submit Comment
        </button>
      </div>
    );
  }
  
  if (currentView === "newCommunity") return renderNewCommunity();
  if (currentView === "newPost") return renderNewPost();
  if (currentView === "newComment") return renderNewComment();
  return null;
}