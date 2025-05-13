/* eslint-disable no-undef */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

mongoose.connect('mongodb://127.0.0.1:27017/phreddit', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  removeDuplicates();
})
.catch(err => console.error('MongoDB connection error:', err));

async function removeDuplicates() {
  const Community = require('./models/communities');
  const Post = require('./models/posts');
  try {
    const communities = await Community.find();
    const communityNames = new Set();
    const communityDuplicates = [];
    communities.forEach(community => {
      if (communityNames.has(community.name)) {
        communityDuplicates.push(community._id);
      } else {
        communityNames.add(community.name);
      }
    });
    if (communityDuplicates.length > 0) {
      await Community.deleteMany({ _id: { $in: communityDuplicates } });
    }
    const posts = await Post.find();
    const postTitles = new Set();
    const postDuplicates = [];
    posts.forEach(post => {
      if (postTitles.has(post.title)) {
        postDuplicates.push(post._id);
      } else {
        postTitles.add(post.title);
      }
    });
    if (postDuplicates.length > 0) {
      await Post.deleteMany({ _id: { $in: postDuplicates } });
    }
    console.log('Duplicate check completed');
  } catch (err) {
    console.error('Error removing duplicates:', err);
  }
}

const Community = require('./models/communities');
const Post = require('./models/posts');
const Comment = require('./models/comments');
const LinkFlair = require('./models/linkflairs');
const User = require('./models/users');

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, displayName, firstName, lastName, password } = req.body;
    const existingUser = await User.findOne({ 
      $or: [{ email }, { displayName }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email or display name already exists' 
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      displayName,
      firstName,
      lastName,
      passwordHash,
      reputation: 100
    });
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    res.status(201).json({ user: userResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    res.json({ user: userResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/communities', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    const communities = await Community.find();
    if (userId) {
      communities.sort((a, b) => {
        const aIsMember = a.members && a.members.includes(userId);
        const bIsMember = b.members && b.members.includes(userId);
        if (aIsMember && !bIsMember) return -1;
        if (!aIsMember && bIsMember) return 1;
        return 0;
      });
    }
    res.json(communities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/communities/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    res.json(community);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/communities', async (req, res) => {
  try {
    const existingCommunity = await Community.findOne({ name: req.body.name });
    if (existingCommunity) {
      return res.status(400).json({ message: 'A community with this name already exists' });
    }
    const community = new Community({
      name: req.body.name,
      description: req.body.description,
      members: req.body.members || []
    });
    const newCommunity = await community.save();
    if (req.headers['user-id']) {
      await User.findByIdAndUpdate(
        req.headers['user-id'],
        { $push: { joinedCommunities: newCommunity._id } }
      );
    }
    res.status(201).json(newCommunity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/communities/:id/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.id);
    const user = await User.findById(userId);
    if (!community.members.includes(userId)) {
      community.members.push(userId);
      await community.save();
    }
    if (!user.joinedCommunities.includes(req.params.id)) {
      user.joinedCommunities.push(req.params.id);
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/communities/:id/leave', async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.id);
    const user = await User.findById(userId);
    community.members = community.members.filter(id => id.toString() !== userId);
    await community.save();
    user.joinedCommunities = user.joinedCommunities.filter(id => id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/:id/content', async (req, res) => {
  try {
    const userId = req.params.id;
    const contentType = req.query.type || 'posts';
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    let content;
    switch (contentType) {
      case 'posts':
        content = await Post.find({ postedBy: user.displayName });
        break;
      case 'comments':
        content = await Comment.find({ commentedBy: user.displayName });
        break;
      case 'communities':
        {
          const userCommunities = await Community.find({ members: { $elemMatch: { $eq: userId } } });
          content = userCommunities.filter(community => {
            return community.members.length > 0 && community.members[0].toString() === userId;
          });
        }
        break;
      default:
        content = [];
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const sort = req.query.sort || 'newest';
    const userId = req.headers['user-id'];
    let posts;
    if (userId && sort !== 'active') {
      const user = await User.findById(userId);
      if (user) {
        const userPosts = await Post.find({
          $or: [
            { _id: { $in: await Community.find({ _id: { $in: user.joinedCommunities } }).distinct('postIDs') } }
          ]
        });        
        const otherPosts = await Post.find({
          $and: [
            { _id: { $nin: await Community.find({ _id: { $in: user.joinedCommunities } }).distinct('postIDs') } }
          ]
        });         
        posts = [...userPosts, ...otherPosts];
      } else {
        posts = await Post.find();
      }
    } else {
      posts = await Post.find();
    }
    if (sort === 'newest') {
      posts.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else if (sort === 'oldest') {
      posts.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
    } else if (sort === 'active') {
      const comments = await Comment.find();
      const findLatestCommentDate = (commentIds, memo = new Map()) => {
        if (!commentIds || commentIds.length === 0) return null;
        let latestDate = null;
        for (const commentId of commentIds) {
          if (memo.has(commentId.toString())) continue;
          memo.set(commentId.toString(), true);
          const comment = comments.find(c => c._id.toString() === commentId.toString());
          if (!comment) continue;
          const commentDate = new Date(comment.commentedDate);
          if (!latestDate || commentDate > latestDate) {
            latestDate = commentDate;
          }
          if (comment.commentIDs && comment.commentIDs.length > 0) {
            const childLatestDate = findLatestCommentDate(comment.commentIDs, memo);
            if (childLatestDate && (!latestDate || childLatestDate > latestDate)) {
              latestDate = childLatestDate;
            }
          }
        }
        return latestDate;
      };
      
      posts.sort((a, b) => {
        const aLatestComment = findLatestCommentDate(a.commentIDs);
        const bLatestComment = findLatestCommentDate(b.commentIDs);
        if (!aLatestComment && !bLatestComment) {
          return new Date(b.postedDate) - new Date(a.postedDate);
        }
        if (!aLatestComment) return 1;
        if (!bLatestComment) return -1;
        const dateDiff = bLatestComment - aLatestComment;
        if (dateDiff === 0) {
          return new Date(b.postedDate) - new Date(a.postedDate);
        }
        return dateDiff;
      });
    }
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    linkFlairID: req.body.linkFlairID,
    postedBy: req.body.postedBy,
    votes: 0,
    upvotedBy: [],
    downvotedBy: []
  });
  try {
    const newPost = await post.save();
    if (req.body.communityID) {
      await Community.findByIdAndUpdate(
        req.body.communityID,
        { $push: { postIDs: newPost._id } }
      );
    } 
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/posts/:id/view', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/posts/:id/vote', async (req, res) => {
  try {
    const { userId, voteType } = req.body;
    const post = await Post.findById(req.params.id);
    const user = await User.findById(userId);
    
    if (!post || !user) {
      return res.status(404).json({ message: 'Post or user not found' });
    }
    
    if (user.reputation < 50) {
      return res.status(403).json({ message: 'Insufficient reputation to vote' });
    }
    
    const hasUpvoted = post.upvotedBy.includes(userId);
    const hasDownvoted = post.downvotedBy.includes(userId);
    
    const postAuthor = await User.findOne({ displayName: post.postedBy });
    if (!postAuthor) {
      return res.status(404).json({ message: 'Post author not found' });
    }
    
    if (voteType === 'upvote') {
      if (hasUpvoted) {
        return res.status(400).json({ message: 'Already upvoted' });
      }
      if (hasDownvoted) {
        post.downvotedBy = post.downvotedBy.filter(id => id.toString() !== userId);
        post.votes += 1;
        await User.findByIdAndUpdate(postAuthor._id, { $inc: { reputation: 10 } });
      }
      post.upvotedBy.push(userId);
      post.votes += 1;
      await User.findByIdAndUpdate(postAuthor._id, { $inc: { reputation: 5 } });
    } else if (voteType === 'downvote') {
      if (hasDownvoted) {
        return res.status(400).json({ message: 'Already downvoted' });
      }
      if (hasUpvoted) {
        post.upvotedBy = post.upvotedBy.filter(id => id.toString() !== userId);
        post.votes -= 1;
        await User.findByIdAndUpdate(postAuthor._id, { $inc: { reputation: -5 } });
      }
      post.downvotedBy.push(userId);
      post.votes -= 1;
      await User.findByIdAndUpdate(postAuthor._id, { $inc: { reputation: -10 } });
    }
    
    await post.save();
    res.json({
      postId: post._id,
      votes: post.votes,
      hasUpvoted: post.upvotedBy.includes(userId),
      hasDownvoted: post.downvotedBy.includes(userId)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/communities/:id/posts', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    
    const sort = req.query.sort || 'newest';
    if (sort === 'active') {
      const communityPosts = await Post.find({ _id: { $in: community.postIDs } });
      const comments = await Comment.find();
      const findLatestCommentDate = (commentIds, memo = new Map()) => {
        if (!commentIds || commentIds.length === 0) return null;
        let latestDate = null;
        for (const commentId of commentIds) {
          if (memo.has(commentId.toString())) continue;
          memo.set(commentId.toString(), true);
          const comment = comments.find(c => c._id.toString() === commentId.toString());
          if (!comment) continue;
          const commentDate = new Date(comment.commentedDate);
          if (!latestDate || commentDate > latestDate) {
            latestDate = commentDate;
          }

          if (comment.commentIDs && comment.commentIDs.length > 0) {
            const childLatestDate = findLatestCommentDate(comment.commentIDs, memo);
            if (childLatestDate && (!latestDate || childLatestDate > latestDate)) {
              latestDate = childLatestDate;
            }
          }
        }
        
        return latestDate;
      };

      communityPosts.sort((a, b) => {
        const aLatestComment = findLatestCommentDate(a.commentIDs);
        const bLatestComment = findLatestCommentDate(b.commentIDs);
        if (!aLatestComment && !bLatestComment) {
          return new Date(b.postedDate) - new Date(a.postedDate);
        }

        if (!aLatestComment) return 1;
        if (!bLatestComment) return -1;
        const dateDiff = bLatestComment - aLatestComment;

        if (dateDiff === 0) {
          return new Date(b.postedDate) - new Date(a.postedDate);
        }
        
        return dateDiff;
      });
      
      return res.json(communityPosts);
    } else {
      const sortOption = sort === 'oldest' ? { postedDate: 1 } : { postedDate: -1 };
      const posts = await Post.find({ _id: { $in: community.postIDs } }).sort(sortOption);
      res.json(posts);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/comments', async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/comments', async (req, res) => {
  const comment = new Comment({
    content: req.body.content,
    commentedBy: req.body.commentedBy,
    commentIDs: [],
    postID: req.body.postID || null,
    parentID: req.body.parentID || null,
    votes: 0,
    upvotedBy: [],
    downvotedBy: []
  });
  try {
    const newComment = await comment.save();
    if (req.body.parentID) {
      await Comment.findByIdAndUpdate(
        req.body.parentID,
        { $push: { commentIDs: newComment._id } }
      );
    } else if (req.body.postID) {
      await Post.findByIdAndUpdate(
        req.body.postID,
        { $push: { commentIDs: newComment._id } }
      );
    }
    res.status(201).json(newComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/comments/:id/vote', async (req, res) => {
  try {
    const { userId, voteType } = req.body;
    const comment = await Comment.findById(req.params.id);
    const user = await User.findById(userId);
    
    if (!comment || !user) {
      return res.status(404).json({ message: 'Comment or user not found' });
    }
    
    if (user.reputation < 50) {
      return res.status(403).json({ message: 'Insufficient reputation to vote' });
    }
    
    const hasUpvoted = comment.upvotedBy.includes(userId);
    const hasDownvoted = comment.downvotedBy.includes(userId);
    
    const commentAuthor = await User.findOne({ displayName: comment.commentedBy });
    if (!commentAuthor) {
      return res.status(404).json({ message: 'Comment author not found' });
    }
    
    if (voteType === 'upvote') {
      if (hasUpvoted) {
        return res.status(400).json({ message: 'Already upvoted' });
      }
      if (hasDownvoted) {
        comment.downvotedBy = comment.downvotedBy.filter(id => id.toString() !== userId);
        comment.votes += 1;
        await User.findByIdAndUpdate(commentAuthor._id, { $inc: { reputation: 10 } });
      }
      comment.upvotedBy.push(userId);
      comment.votes += 1;
      await User.findByIdAndUpdate(commentAuthor._id, { $inc: { reputation: 5 } });
    } else if (voteType === 'downvote') {
      if (hasDownvoted) {
        return res.status(400).json({ message: 'Already downvoted' });
      }
      if (hasUpvoted) {
        comment.upvotedBy = comment.upvotedBy.filter(id => id.toString() !== userId);
        comment.votes -= 1;
        await User.findByIdAndUpdate(commentAuthor._id, { $inc: { reputation: -5 } });
      }
      comment.downvotedBy.push(userId);
      comment.votes -= 1;
      await User.findByIdAndUpdate(commentAuthor._id, { $inc: { reputation: -10 } });
    }
    
    await comment.save();
    res.json({
      commentId: comment._id,
      votes: comment.votes,
      hasUpvoted: comment.upvotedBy.includes(userId),
      hasDownvoted: comment.downvotedBy.includes(userId)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/linkflairs', async (req, res) => {
  try {
    const linkFlairs = await LinkFlair.find();
    res.json(linkFlairs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/linkflairs', async (req, res) => {
  const linkFlair = new LinkFlair({
    content: req.body.content
  });
  try {
    const newLinkFlair = await linkFlair.save();
    res.status(201).json(newLinkFlair);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ postID: postId });
    if (comments.length === 0) {
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      if (post.commentIDs && post.commentIDs.length > 0) {
        const postComments = await Comment.find({ _id: { $in: post.commentIDs } });
        res.json(postComments);
      } else {
        res.json([]);
      }
    } else {
      res.json(comments);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  const searchTerms = req.query.q.split(' ');
  const searchRegexes = searchTerms.map(term => new RegExp(term, 'i'));
  const sort = req.query.sort || 'newest';
  const userId = req.headers['user-id'];
  
  try {
    const postResults = await Post.find({
      $or: [
        { title: { $in: searchRegexes } },
        { content: { $in: searchRegexes } }
      ]
    });
    const commentResults = await Comment.find({
      content: { $in: searchRegexes }
    });
    const postIdsFromComments = [...new Set(commentResults.map(comment => comment.postID))];
    const postsWithMatchingComments = await Post.find({
      _id: { $in: postIdsFromComments }
    });

    const allResults = [...postResults];
    postsWithMatchingComments.forEach(post => {
      if (!allResults.some(p => p._id.toString() === post._id.toString())) {
        allResults.push(post);
      }
    });
    
    if (userId && sort !== 'active') {
      const user = await User.findById(userId);
      if (user) {
        const userPostIds = await Community.find({ _id: { $in: user.joinedCommunities } }).distinct('postIDs');
        const filteredResults = allResults.filter(post => userPostIds.includes(post._id));
        const otherResults = allResults.filter(post => !userPostIds.includes(post._id));
        allResults.length = 0;
        allResults.push(...filteredResults, ...otherResults);
      }
    }
    
    if (sort === 'active') {
      const comments = await Comment.find();
      const findLatestCommentDate = (commentIds, memo = new Map()) => {
        if (!commentIds || commentIds.length === 0) return null;
        let latestDate = null;
        for (const commentId of commentIds) {
          if (memo.has(commentId.toString())) continue;
          memo.set(commentId.toString(), true);

          const comment = comments.find(c => c._id.toString() === commentId.toString());
          if (!comment) continue;
          
          const commentDate = new Date(comment.commentedDate);
          
          if (!latestDate || commentDate > latestDate) {
            latestDate = commentDate;
          }
          
          if (comment.commentIDs && comment.commentIDs.length > 0) {
            const childLatestDate = findLatestCommentDate(comment.commentIDs, memo);
            if (childLatestDate && (!latestDate || childLatestDate > latestDate)) {
              latestDate = childLatestDate;
            }
          }
        }
        
        return latestDate;
      };
      
      allResults.sort((a, b) => {
        const aLatestComment = findLatestCommentDate(a.commentIDs);
        const bLatestComment = findLatestCommentDate(b.commentIDs);
        if (!aLatestComment && !bLatestComment) {
          return new Date(b.postedDate) - new Date(a.postedDate);
        }
        if (!aLatestComment) return 1;
        if (!bLatestComment) return -1;
        const dateDiff = bLatestComment - aLatestComment;
        
        if (dateDiff === 0) {
          return new Date(b.postedDate) - new Date(a.postedDate);
        }
        return dateDiff;
      });
    } else if (sort === 'oldest') {
      allResults.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
    } else {
      allResults.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    }
    res.json(allResults);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    async function deleteCommentsRecursively(commentIds) {
      for (const commentId of commentIds) {
        const comment = await Comment.findById(commentId);
        if (comment) {
          if (comment.commentIDs && comment.commentIDs.length > 0) {
            await deleteCommentsRecursively(comment.commentIDs);
          }
          await Comment.findByIdAndDelete(commentId);
        }
      }
    }
    
    if (post.commentIDs && post.commentIDs.length > 0) {
      await deleteCommentsRecursively(post.commentIDs);
    }
    
    await Community.updateMany(
      { postIDs: req.params.id },
      { $pull: { postIDs: req.params.id } }
    );
    
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    async function deleteCommentsRecursively(commentIds) {
      for (const commentId of commentIds) {
        const comment = await Comment.findById(commentId);
        if (comment) {
          if (comment.commentIDs && comment.commentIDs.length > 0) {
            await deleteCommentsRecursively(comment.commentIDs);
          }
          await Comment.findByIdAndDelete(commentId);
        }
      }
    }
    
    if (comment.commentIDs && comment.commentIDs.length > 0) {
      await deleteCommentsRecursively(comment.commentIDs);
    }
    
    await Comment.updateMany(
      { commentIDs: req.params.id },
      { $pull: { commentIDs: req.params.id } }
    );
    
    await Post.updateMany(
      { commentIDs: req.params.id },
      { $pull: { commentIDs: req.params.id } }
    );
    
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/communities/:id', async (req, res) => {
  try {
    if (req.body.name) {
      const existingCommunity = await Community.findOne({ 
        name: req.body.name,
        _id: { $ne: req.params.id } 
      });
      
      if (existingCommunity) {
        return res.status(400).json({ message: 'A community with this name already exists' });
      }
    }
    
    const community = await Community.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!community) return res.status(404).json({ message: 'Community not found' });
    res.json(community);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/communities/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    
    if (community.postIDs && community.postIDs.length > 0) {
      for (const postId of community.postIDs) {
        const post = await Post.findById(postId);
        if (post) {
          async function deleteCommentsRecursively(commentIds) {
            for (const commentId of commentIds) {
              const comment = await Comment.findById(commentId);
              if (comment) {
                if (comment.commentIDs && comment.commentIDs.length > 0) {
                  await deleteCommentsRecursively(comment.commentIDs);
                }
                await Comment.findByIdAndDelete(commentId);
              }
            }
          }
          
          if (post.commentIDs && post.commentIDs.length > 0) {
            await deleteCommentsRecursively(post.commentIDs);
          }
          
          await Post.findByIdAndDelete(postId);
        }
      }
    }
    
    await Community.findByIdAndDelete(req.params.id);
    res.json({ message: 'Community deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (updateData.displayName) {
      const existingUser = await User.findOne({ 
        displayName: updateData.displayName,
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Display name already in use' });
      }
    }
    
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const posts = await Post.find({ postedBy: user.displayName });
    for (const post of posts) {
      async function deleteCommentsRecursively(commentIds) {
        for (const commentId of commentIds) {
          const comment = await Comment.findById(commentId);
          if (comment) {
            if (comment.commentIDs && comment.commentIDs.length > 0) {
              await deleteCommentsRecursively(comment.commentIDs);
            }
            await Comment.findByIdAndDelete(commentId);
          }
        }
      }
      
      if (post.commentIDs && post.commentIDs.length > 0) {
        await deleteCommentsRecursively(post.commentIDs);
      }
      
      await Community.updateMany(
        { postIDs: post._id },
        { $pull: { postIDs: post._id } }
      );
      
      await Post.findByIdAndDelete(post._id);
    }
    
    const comments = await Comment.find({ commentedBy: user.displayName });
    for (const comment of comments) {
      if (comment.parentID) {
        await Comment.updateOne(
          { _id: comment.parentID },
          { $pull: { commentIDs: comment._id } }
        );
      } else if (comment.postID) {
        await Post.updateOne(
          { _id: comment.postID },
          { $pull: { commentIDs: comment._id } }
        );
      }
      
      async function deleteChildComments(commentId) {
        const childComments = await Comment.find({ parentID: commentId });
        for (const child of childComments) {
          await deleteChildComments(child._id);
          await Comment.findByIdAndDelete(child._id);
        }
      }
      
      await deleteChildComments(comment._id);
      await Comment.findByIdAndDelete(comment._id);
    }
    
    const communities = await Community.find({ members: req.params.id });
    for (const community of communities) {
      community.members = community.members.filter(id => id.toString() !== req.params.id);
      await community.save();
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'Server is alive' });
});

app.listen(PORT, () => { 
  console.log(`Server running on port ${PORT}`);
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Server closed. Database instance disconnected.');
    process.exit(0);
  });
});

module.exports = app;