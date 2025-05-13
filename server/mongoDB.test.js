/* eslint-disable no-undef */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const testPostSchema = new mongoose.Schema({
  title: String,
  content: String,
  commentIDs: [{ type: mongoose.Schema.Types.ObjectId }]
});
const TestPost = mongoose.model('TestPostModel', testPostSchema);
const testCommentSchema = new mongoose.Schema({
  content: String,
  postID: { type: mongoose.Schema.Types.ObjectId },
  parentID: { type: mongoose.Schema.Types.ObjectId }
});
const TestComment = mongoose.model('TestCommentModel', testCommentSchema);
async function deletePostAndComments(postId) {
  await TestComment.deleteMany({ postID: postId });
  await TestPost.findByIdAndDelete(postId);
}

describe('MongoDB cascade deletion test', () => {
  let mongoServer;
  
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  test('should delete post and all its comments', async () => {
    const post = await TestPost.create({
      title: 'Test Post',
      content: 'Test content'
    });
    
    const comment1 = await TestComment.create({
      content: 'Comment 1',
      postID: post._id
    });
    
    const comment2 = await TestComment.create({
      content: 'Comment 2',
      postID: post._id
    });
    
    const postId = post._id;
    const commentIds = [comment1._id, comment2._id];
    await deletePostAndComments(postId);
    const deletedPost = await TestPost.findById(postId);
    expect(deletedPost).toBeNull();
    for (const commentId of commentIds) {
      const deletedComment = await TestComment.findById(commentId);
      expect(deletedComment).toBeNull();
    }
  }, 10000);
});