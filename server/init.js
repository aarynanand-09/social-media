const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
/* global process */
const User = require('./models/users');
const Community = require('./models/communities');
const Post = require('./models/posts');
const Comment = require('./models/comments');
const LinkFlair = require('./models/linkflairs');

const userArgs = process.argv.slice(2);

if (userArgs.length !== 3) {
    console.log('Usage: node init.js <admin-email> <admin-displayName> <admin-password>');
    process.exit(1);
}

const [adminEmail, adminDisplayName, adminPassword] = userArgs;

mongoose.connect('mongodb://127.0.0.1:27017/phreddit');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

async function createUser(userObj) {
    const passwordHash = await bcrypt.hash(userObj.password, 10);
    const user = new User({
        email: userObj.email,
        displayName: userObj.displayName,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        passwordHash: passwordHash,
        reputation: userObj.reputation || 100,
        isAdmin: userObj.isAdmin || false
    });
    return await user.save();
}

async function createLinkFlair(linkFlairObj) {
    const linkFlair = new LinkFlair({
        content: linkFlairObj.content
    });
    return await linkFlair.save();
}

async function createComment(commentObj) {
    const comment = new Comment({
        content: commentObj.content,
        commentedBy: commentObj.commentedBy,
        commentedDate: commentObj.commentedDate,
        commentIDs: commentObj.commentIDs,
        postID: commentObj.postID,
        parentID: commentObj.parentID,
        votes: commentObj.votes || 0,
        upvotedBy: commentObj.upvotedBy || [],
        downvotedBy: commentObj.downvotedBy || []
    });
    return await comment.save();
}

async function createPost(postObj) {
    const post = new Post({
        title: postObj.title,
        content: postObj.content,
        postedBy: postObj.postedBy,
        postedDate: postObj.postedDate,
        views: postObj.views,
        linkFlairID: postObj.linkFlairID,
        commentIDs: postObj.commentIDs,
        votes: postObj.votes || 0,
        upvotedBy: postObj.upvotedBy || [],
        downvotedBy: postObj.downvotedBy || []
    });
    return await post.save();
}

async function createCommunity(communityObj) {
    const community = new Community({
        name: communityObj.name,
        description: communityObj.description,
        postIDs: communityObj.postIDs,
        startDate: communityObj.startDate,
        members: communityObj.members
    });
    return await community.save();
}

async function initializeDB() {
    try {
        const adminUser = await createUser({
            email: adminEmail,
            displayName: adminDisplayName,
            firstName: 'Admin',
            lastName: 'User',
            password: adminPassword,
            reputation: 1000,
            isAdmin: true
        });

        const users = [];
        
        const user1 = await createUser({
            email: 'swimstar@example.com',
            displayName: 'swimstar',
            firstName: 'Michael',
            lastName: 'Dolphin',
            password: 'password123',
            reputation: 150
        });
        users.push(user1);

        const user2 = await createUser({
            email: 'aquachamp@example.com',
            displayName: 'aquachamp',
            firstName: 'Katie',
            lastName: 'Waters',
            password: 'password123',
            reputation: 200
        });
        users.push(user2);

        const user3 = await createUser({
            email: 'barbielover@example.com',
            displayName: 'barbielover',
            firstName: 'Ken',
            lastName: 'Dreamhouse',
            password: 'password123',
            reputation: 300
        });
        users.push(user3);

        const user4 = await createUser({
            email: 'butterflykick@example.com',
            displayName: 'butterflykick',
            firstName: 'Fly',
            lastName: 'Kicker',
            password: 'password123',
            reputation: 50
        });
        users.push(user4);

        const user5 = await createUser({
            email: 'margot@example.com',
            displayName: 'MargotFan',
            firstName: 'Margot',
            lastName: 'Robbie',
            password: 'password123',
            reputation: 250
        });
        users.push(user5);

        const user6 = await createUser({
            email: 'olympicgold@example.com',
            displayName: 'olympicgold',
            firstName: 'Gold',
            lastName: 'Medalist',
            password: 'password123',
            reputation: 100
        });
        users.push(user6);

        const user7 = await createUser({
            email: 'kenergy@example.com',
            displayName: 'kenergy',
            firstName: 'Ryan',
            lastName: 'Gosling',
            password: 'password123',
            reputation: 100
        });
        users.push(user7);

        const linkFlair1 = await createLinkFlair({
            content: 'Technique Question'
        });

        await createLinkFlair({
            content: 'Olympic Discussion'
        });

        const linkFlair3 = await createLinkFlair({
            content: 'Barbie World'
        });

        await createLinkFlair({
            content: 'Kenergy Only'
        });

        const comment7 = await createComment({
            content: 'I have all the Barbie movie merch, totally worth it!',
            commentIDs: [],
            commentedBy: 'olympicgold',
            commentedDate: new Date('September 10, 2024 09:43:00')
        });

        const comment6 = await createComment({
            content: 'Ken was the real star of the movie tbh.',
            commentIDs: [comment7._id],
            commentedBy: 'kenergy',
            commentedDate: new Date('September 10, 2024 07:18:00')
        });

        const comment5 = await createComment({
            content: 'Saw the movie 5 times already. The patriarchy will never recover!',
            commentIDs: [],
            commentedBy: 'olympicgold',
            commentedDate: new Date('September 09, 2024 17:03:00')
        });

        const comment4 = await createComment({
            content: 'Margot Robbie was perfect casting for Barbie.',
            commentIDs: [comment6._id],
            commentedBy: 'barbielover',
            commentedDate: new Date('September 10, 2024 6:41:00')
        });

        const comment3 = await createComment({
            content: 'Actually, the flutter kick is great for beginners! Keep at it and you\'ll be doing butterfly in no time.',
            commentIDs: [],
            commentedBy: 'swimstar',
            commentedDate: new Date('August 23, 2024 09:31:00')
        });

        const comment2 = await createComment({
            content: 'I recommend watching YouTube tutorials on butterfly technique. Your timing might be off. Try focusing on the undulation motion first.',
            commentIDs: [],
            commentedBy: 'barbielover',
            commentedDate: new Date('August 23, 2024 10:57:00')
        });

        const comment1 = await createComment({
            content: 'Have you tried using a kickboard to isolate the lower body movement? That really helped me with butterfly.',
            commentIDs: [comment3._id],
            commentedBy: 'aquachamp',
            commentedDate: new Date('August 23, 2024 08:22:00')
        });

        const post1 = await createPost({
            title: 'Help with butterfly stroke technique? I keep sinking in the middle',
            content: 'So I\'ve been swimming for about a year now and I\'m trying to learn the butterfly stroke. I can do freestyle and breaststroke fine, but every time I try butterfly I end up sinking in the middle of the pool. My coach says my timing is off but I don\'t understand what that means. Any tips from experienced swimmers? Also, do I need to be stronger to do this stroke properly?',
            linkFlairID: linkFlair1._id,
            postedBy: 'butterflykick',
            postedDate: new Date('August 23, 2024 01:19:00'),
            commentIDs: [comment1._id, comment2._id],
            views: 14,
            votes: -5,
            upvotedBy: [user2._id],
            downvotedBy: [user1._id, user3._id]
        });

        const post2 = await createPost({
            title: "Barbie movie changed my life!",
            content: 'Just saw the Barbie movie for the fourth time and I\'m still discovering new details! The way they handled feminism, capitalism, and existential crisis was brilliant.\n\nAnyone else think the beach scene was a direct reference to Plato\'s allegory of the cave? And that ending... I was in tears. What were your favorite moments?',
            linkFlairID: linkFlair3._id,
            postedBy: 'MargotFan',
            postedDate: new Date('September 9, 2024 14:24:00'),
            commentIDs: [comment4._id, comment5._id],
            views: 1023,
            votes: 8,
            upvotedBy: [user1._id, user2._id, user3._id],
            downvotedBy: []
        });

        await Comment.findByIdAndUpdate(comment1._id, { postID: post1._id });
        await Comment.findByIdAndUpdate(comment2._id, { postID: post1._id });
        await Comment.findByIdAndUpdate(comment3._id, { postID: post1._id, parentID: comment1._id });
        await Comment.findByIdAndUpdate(comment4._id, { postID: post2._id });
        await Comment.findByIdAndUpdate(comment5._id, { postID: post2._id });
        await Comment.findByIdAndUpdate(comment6._id, { postID: post2._id, parentID: comment4._id });
        await Comment.findByIdAndUpdate(comment7._id, { postID: post2._id, parentID: comment6._id });

        const community1 = await createCommunity({
            name: 'SwimGeeks',
            description: 'For all things swimming - technique, training, competition and community.',
            postIDs: [post1._id],
            startDate: new Date('August 10, 2014 04:18:00'),
            members: [user1._id, user2._id, user3._id, user4._id]
        });

        const community2 = await createCommunity({
            name: 'Barbie World',
            description: 'Life in plastic, it\'s fantastic! Everything Barbie, from movies to merchandise.',
            postIDs: [post2._id],
            startDate: new Date('May 4, 2017 08:32:00'),
            members: [user5._id, user3._id]
        });

        await User.findByIdAndUpdate(user1._id, { joinedCommunities: [community1._id] });
        await User.findByIdAndUpdate(user2._id, { joinedCommunities: [community1._id] });
        await User.findByIdAndUpdate(user3._id, { joinedCommunities: [community1._id, community2._id] });
        await User.findByIdAndUpdate(user4._id, { joinedCommunities: [community1._id] });
        await User.findByIdAndUpdate(user5._id, { joinedCommunities: [community2._id] });

        console.log('Database initialized successfully');
        console.log(`Admin user created: ${adminUser.displayName} (${adminUser.email})`);
        console.log('Sample communities, posts, comments, and users created');
        
        if (db) {
            db.close();
        }
    } catch (err) {
        console.error('ERROR: ' + err);
        console.trace();
        if (db) {
            db.close();
        }
    }
}

initializeDB();
console.log('Initializing database...');