import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './nav';
import Home from './home';
import Community from './comm';
import Post from './post';
import Form from './form';
import Open from './open';
import UserProfile from './profile';
import { checkHyperlinks } from './util';
import axios from 'axios';

export default function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [linkFlairs, setLinkFlairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("open");
  const [selectedCommunityID, setSelectedCommunityID] = useState(null);
  const [selectedPostID, setSelectedPostID] = useState(null);
  const [order, setOrder] = useState("newest");
  const [currentCommentID, setCurrentCommentID] = useState(null);
  const [dummy, setDummy] = useState(0);
  
  const [communityName, setCommunityName] = useState("");
  const [communityDesc, setCommunityDesc] = useState("");
  const [communityUsername, setCommunityUsername] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [descErr, setDescErr] = useState("");
  const [userErr, setUserErr] = useState("");
  const [postCommunityID, setPostCommunityID] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postLinkFlair, setPostLinkFlair] = useState("");
  const [postCustomFlair, setPostCustomFlair] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postUsername, setPostUsername] = useState("");
  const [communityErr, setCommunityErr] = useState("");
  const [titleErr, setTitleErr] = useState("");
  const [flairErr, setFlairErr] = useState("");
  const [contentErr, setContentErr] = useState("");
  const [postUserErr, setPostUserErr] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentUsername, setCommentUsername] = useState("");
  const [commentContentErr, setCommentContentErr] = useState("");
  const [commentUserErr, setCommentUserErr] = useState("");

  const fetchData = useCallback((currentOrder) => {
    setIsLoading(true);
    let headers = {};
    if (currentUser) {
      headers = { 'user-id': currentUser._id };
    }
    
    axios.get('http://localhost:8000/api/communities', { headers })
      .then(res => {
        setCommunities(res.data);
        if (res.data.length > 0) {
          setPostCommunityID(res.data[0]._id);
        }
        const orderToUse = currentOrder || order;
        let postsEndpoint = 'http://localhost:8000/api/posts';
        if (orderToUse === "active") {
          postsEndpoint += '?sort=active';
        }
        return axios.get(postsEndpoint, { headers });
      })
      .then(res => {
        setPosts(res.data);
        return axios.get('http://localhost:8000/api/comments');
      })
      .then(res => {
        setComments(res.data);
        return axios.get('http://localhost:8000/api/linkflairs');
      })
      .then(res => {
        setLinkFlairs(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setIsLoading(false);
      });
  }, [order, currentUser]);

  useEffect(() => {
    if (currentView !== "open") {
      fetchData();
    }
  }, [fetchData, currentView]);

  function forceUpdate(newOrder) {
    setDummy(dummy + 1);
    fetchData(newOrder);
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      window.searchQuery = e.target.value;
      setOrder("newest");
      setCurrentView("search");
      forceUpdate();
    }
  }

  function handleCreateCommunity() {
    setNameErr("");
    setDescErr("");
    setUserErr("");
    let valid = true;
    
    if (!communityName.trim()) {
      setNameErr("Community name is required");
      valid = false;
    } else if (communityName.trim().length > 100) {
      setNameErr("Community name must be at most 100 characters");
      valid = false;
    }
    
    if (!communityDesc.trim()) {
      setDescErr("Community description is required");
      valid = false;
    } else if (communityDesc.trim().length > 500) {
      setDescErr("Community description must be at most 500 characters");
      valid = false;
    }
    
    let hyperlinkError = checkHyperlinks(communityDesc);
    if (hyperlinkError) {
      setDescErr(hyperlinkError);
      valid = false;
    }
    
    if (!isLoggedIn) {
      if (!communityUsername.trim()) {
        setUserErr("Username is required");
        valid = false;
      }
    }
    
    if (!valid) return;
    
    let headers = {};
    if (currentUser) {
      headers = { 'user-id': currentUser._id };
    }
    
    const newCommunity = {
      name: communityName.trim(),
      description: communityDesc.trim(),
      members: isLoggedIn ? [currentUser._id] : [communityUsername.trim()]
    };
    
    axios.post('http://localhost:8000/api/communities', newCommunity, { headers })
      .then(response => {
        setCommunities([...communities, response.data]);
        setCommunityName("");
        setCommunityDesc("");
        setCommunityUsername("");
        setSelectedCommunityID(response.data._id);
        setCurrentView("community");
      })
      .catch(error => {
        console.error("Error creating community:", error);
        if (error.response && error.response.data && error.response.data.message) {
          setNameErr(error.response.data.message);
        } else {
          setNameErr("Failed to create community");
        }
      });
  }

  function handleCreatePost() {
    setCommunityErr("");
    setTitleErr("");
    setFlairErr("");
    setContentErr("");
    setPostUserErr("");
    let valid = true;
    
    if (!postCommunityID) {
      setCommunityErr("Community selection is required");
      valid = false;
    }
    
    if (!postTitle.trim()) {
      setTitleErr("Post title is required");
      valid = false;
    } else if (postTitle.trim().length > 100) {
      setTitleErr("Post title must be at most 100 characters");
      valid = false;
    }
    
    let flairID = postLinkFlair;
    if (flairID === "custom") {
      if (!postCustomFlair.trim()) {
        setFlairErr("Custom flair content is required");
        valid = false;
      } else if (postCustomFlair.trim().length > 30) {
        setFlairErr("Custom flair must be at most 30 characters");
        valid = false;
      }
    }
    
    if (!postContent.trim()) {
      setContentErr("Post content is required");
      valid = false;
    }
    
    let hyperlinkError = checkHyperlinks(postContent);
    if (hyperlinkError) {
      setContentErr(hyperlinkError);
      valid = false;
    }
    
    if (!isLoggedIn) {
      if (!postUsername.trim()) {
        setPostUserErr("Username is required");
        valid = false;
      }
    }
    
    if (!valid) return;
    
    let createPost = () => {
      const newPost = {
        title: postTitle.trim(),
        content: postContent.trim(),
        linkFlairID: flairID,
        postedBy: isLoggedIn ? currentUser.displayName : postUsername.trim(),
        communityID: postCommunityID
      };
      
      const headers = currentUser ? { 'user-id': currentUser._id } : {};
      
      axios.post('http://localhost:8000/api/posts', newPost, { headers })
        .then(response => {
          setPosts([...posts, response.data]);
          setPostTitle("");
          setPostLinkFlair("");
          setPostCustomFlair("");
          setPostContent("");
          setPostUsername("");
          setCurrentView("home");
          fetchData();
        })
        .catch(error => {
          console.error("Error creating post:", error);
          setContentErr("Failed to create post");
        });
    };
    
    if (flairID === "custom") {
      const newFlair = {
        content: postCustomFlair.trim()
      };
      axios.post('http://localhost:8000/api/linkflairs', newFlair)
        .then(response => {
          flairID = response.data._id;
          createPost();
        })
        .catch(error => {
          console.error("Error creating link flair:", error);
          setFlairErr("Failed to create link flair");
        });
    } else if (flairID === "") {
      flairID = null;
      createPost();
    } else {
      createPost();
    }
  }

  function handleCreateComment() {
    setCommentContentErr("");
    setCommentUserErr("");
    let valid = true;
    
    if (!commentContent.trim()) {
      setCommentContentErr("Comment content is required");
      valid = false;
    } else if (commentContent.trim().length > 500) {
      setCommentContentErr("Comment must be at most 500 characters");
      valid = false;
    }
    
    let hyperlinkError = checkHyperlinks(commentContent);
    if (hyperlinkError) {
      setCommentContentErr(hyperlinkError);
      valid = false;
    }
    
    if (!isLoggedIn) {
      if (!commentUsername.trim()) {
        setCommentUserErr("Username is required");
        valid = false;
      }
    }
    
    if (!valid) return;
    
    const newComment = {
      content: commentContent.trim(),
      commentedBy: isLoggedIn ? currentUser.displayName : commentUsername.trim(),
      parentID: currentCommentID || null,
      postID: selectedPostID
    };
    
    const headers = currentUser ? { 'user-id': currentUser._id } : {};
    
    axios.post('http://localhost:8000/api/comments', newComment, { headers })
      .then(response => {
        setComments([...comments, response.data]);
        setCommentContent("");
        setCommentUsername("");
        setCurrentCommentID(null);
        setCurrentView("post");
        fetchData();
      })
      .catch(error => {
        console.error("Error creating comment:", error);
        setCommentContentErr("Failed to create comment");
      });
  }

  const handleViewUserProfile = (user) => {
    setViewUser(user);
    setCurrentView("viewUserProfile");
  };

  if (isLoading && currentView !== "open") {
    return <div>Loading...</div>;
  }

  return (
    <>
      {currentView !== "open" && (
        <Navigation
          communities={communities}
          currentView={currentView}
          setCurrentView={(view) => {
            setOrder("newest");
            setCurrentView(view);
          }}
          setOrder={setOrder}
          handleSearchKeyDown={handleSearchKeyDown}
          selectedCommunityID={selectedCommunityID}
          setSelectedCommunityID={(id) => {
            setOrder("newest");
            setSelectedCommunityID(id);
          }}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          setIsLoggedIn={setIsLoggedIn}
          setCurrentUser={setCurrentUser}
        />
      )}
      <div id="main">
        {currentView === "open" && (
          <Open
            setCurrentView={setCurrentView}
            setIsLoggedIn={setIsLoggedIn}
            setCurrentUser={setCurrentUser}
          />
        )}
        
        {currentView === "userProfile" && (
          <UserProfile 
            currentUser={currentUser}
            setCurrentView={setCurrentView}
            setSelectedPostID={setSelectedPostID}
            setSelectedCommunityID={setSelectedCommunityID}
            handleViewUserProfile={handleViewUserProfile}
          />
        )}
        
        {currentView === "viewUserProfile" && (
          <UserProfile 
            currentUser={viewUser}
            setCurrentView={setCurrentView}
            setSelectedPostID={setSelectedPostID}
            setSelectedCommunityID={setSelectedCommunityID}
            isViewMode={true}
            adminUser={currentUser}
            handleViewUserProfile={handleViewUserProfile}
          />
        )}
        
        {currentView === "home" && (
          <Home
            posts={posts}
            communities={communities}
            linkFlairs={linkFlairs}
            order={order}
            setOrder={setOrder}
            setCurrentView={setCurrentView}
            setSelectedPostID={setSelectedPostID}
            forceUpdate={forceUpdate}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
          />
        )}
        
        {currentView === "search" && (
          <Home
            posts={posts}
            communities={communities}
            linkFlairs={linkFlairs}
            order={order}
            setOrder={setOrder}
            setCurrentView={setCurrentView}
            setSelectedPostID={setSelectedPostID}
            forceUpdate={forceUpdate}
            isSearch={true}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
          />
        )}
        
        {currentView === "community" && (
          <Community
            communities={communities}
            posts={posts}
            linkFlairs={linkFlairs}
            selectedCommunityID={selectedCommunityID}
            order={order}
            setOrder={setOrder}
            setCurrentView={setCurrentView}
            setSelectedPostID={setSelectedPostID}
            forceUpdate={forceUpdate}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
          />
        )}
        
        {currentView === "post" && (
          <Post
            posts={posts}
            comments={comments}
            communities={communities}
            linkFlairs={linkFlairs}
            selectedPostID={selectedPostID}
            currentCommentID={currentCommentID}
            setCurrentCommentID={setCurrentCommentID}
            setCurrentView={setCurrentView}
            setOrder={setOrder}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
          />
        )}

        {(currentView === "newCommunity" || currentView === "newPost" || currentView === "newComment") && (
          <Form
            communities={communities}
            linkFlairs={linkFlairs}
            comments={comments}
            currentView={currentView}
            communityName={communityName}
            setCommunityName={setCommunityName}
            communityDesc={communityDesc}
            setCommunityDesc={setCommunityDesc}
            communityUsername={communityUsername}
            setCommunityUsername={setCommunityUsername}
            nameErr={nameErr}
            descErr={descErr}
            userErr={userErr}
            handleCreateCommunity={handleCreateCommunity}
            postCommunityID={postCommunityID}
            setPostCommunityID={setPostCommunityID}
            postTitle={postTitle}
            setPostTitle={setPostTitle}
            postLinkFlair={postLinkFlair}
            setPostLinkFlair={setPostLinkFlair}
            postCustomFlair={postCustomFlair}
            setPostCustomFlair={setPostCustomFlair}
            postContent={postContent}
            setPostContent={setPostContent}
            postUsername={postUsername}
            setPostUsername={setPostUsername}
            communityErr={communityErr}
            titleErr={titleErr}
            flairErr={flairErr}
            contentErr={contentErr}
            postUserErr={postUserErr}
            handleCreatePost={handleCreatePost}
            currentCommentID={currentCommentID}
            commentContent={commentContent}
            setCommentContent={setCommentContent}
            commentUsername={commentUsername}
            setCommentUsername={setCommentUsername}
            commentContentErr={commentContentErr}
            commentUserErr={commentUserErr}
            handleCreateComment={handleCreateComment}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
          />
        )}
      </div>
    </>
  );
}