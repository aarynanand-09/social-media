To run this project you need to clone out repository and install the project dependencies first which you can do by the following:
cd server
npm install
and
cd client
npm install
This is because you need to install both client-side and server-side dependencies.
We have only used MongoDB, React and Node.

After that you have to initialize the database by this command in the server folder:
node init.js admin@phreddit.com AdminUser Unknown009
You can keep any email id username and password in that respective order: email username password.

Then you need to run nodemon server.js in server folder and on a separate command line run npm start in the client folder.
And that is it your app will start at port 3000 on localhost.
