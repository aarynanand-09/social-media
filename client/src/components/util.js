import React from 'react';

export function timeformat(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) {
    return diffInSeconds + " seconds ago";
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 2) {
    return "1 minute ago";
  }
  if (diffInMinutes < 60) {
    return diffInMinutes + " minutes ago";
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours + " hours ago";
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays + " days ago";
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths + " month(s) ago";
  }
  const diffInYears = Math.floor(diffInMonths / 12);
  return diffInYears + " year(s) ago";
}

export function findCommunityById(communities, id) {
  return communities.find(c => c._id === id);
}

export function findPostById(posts, id) {
  return posts.find(p => p._id === id);
}

export function findCommentById(comments, id) {
  return comments.find(c => c._id === id);
}

export function findFlairById(flairs, id) {
  return flairs.find(f => f._id === id);
}

export function countNestedComments(comments, parentId) {
  const children = comments.filter(comment => comment.parentID === parentId);
  if (!children || children.length === 0) {
    return 0;
  }
  let count = children.length;
  for (let i = 0; i < children.length; i++) {
    count += countNestedComments(comments, children[i]._id);
  }
  return count;
}

export function countComments(comments, post) {
  if (!post || !post.commentIDs) {
    return 0;
  }
  let count = post.commentIDs.length;
  for (let i = 0; i < post.commentIDs.length; i++) {
    count += countNestedComments(comments, post.commentIDs[i]);
  }
  return count;
}

export function findLatestCommentDate(comments, parentId) {
  const children = comments.filter(comment => comment.parentID === parentId);
  
  if (!children || children.length === 0) {
    return new Date(0);
  }
  let latestDate = new Date(0);
  for (let i = 0; i < children.length; i++) {
    const commentDate = new Date(children[i].commentedDate);
    if (commentDate > latestDate) {
      latestDate = commentDate;
    }
    const nestedLatestDate = findLatestCommentDate(comments, children[i]._id);
    if (nestedLatestDate > latestDate) {
      latestDate = nestedLatestDate;
    }
  }
  return latestDate;
}

export function getLatestPostActivity(comments, post) {
  if (!post || !post.commentIDs || post.commentIDs.length === 0) {
    return new Date(post.postedDate);
  }
  let latestDate = new Date(post.postedDate);
  for (let i = 0; i < post.commentIDs.length; i++) {
    const comment = comments.find(c => c._id === post.commentIDs[i]);
    if (comment && new Date(comment.commentedDate) > latestDate) {
      latestDate = new Date(comment.commentedDate);
    }
    const nestedLatestDate = findLatestCommentDate(comments, post.commentIDs[i]);
    if (nestedLatestDate > latestDate) {
      latestDate = nestedLatestDate;
    }
  }
  return latestDate;
}

export function parseHyperlinks(text) {
  if (!text) {
    return text;
  }
  let linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    let linkText = match[1];
    let linkUrl = match[2];
    if (linkUrl.startsWith("http://") || linkUrl.startsWith("https://")) {
      parts.push(
        <a 
          key={match.index} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {linkText}
        </a>
      );
    } else {
      parts.push(match[0]);
    } 
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? <>{parts}</> : text;
}

export function checkHyperlinks(text) {
  if (!text) {
    return null;
  }
  const emptyBracketsRegex = /\[\s*\]\([^)]*\)/g;
  if (emptyBracketsRegex.test(text)) {
    return "Error message reporting empty missing link name";
  }
  const emptyParenthesesRegex = /\[[^\]]+\]\(\s*\)/g;
  if (emptyParenthesesRegex.test(text)) {
    return "Error message reporting missing actual link";
  }
  let linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    let linkText = match[1];
    let linkUrl = match[2]; 
    if (linkText.trim() === "") {
      return "Hyperlink text cannot be empty";
    }
    if (linkUrl.trim() === "") {
      return "Hyperlink URL cannot be empty";
    } 
    if (!linkUrl.startsWith("http://") && !linkUrl.startsWith("https://")) {
      return "Hyperlink URL must start with http:// or https://";
    }
  }
  return null;
}