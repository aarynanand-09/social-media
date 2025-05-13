[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/2tEDYwzN)
# Term Project
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
It is very important for our database to keep the username AdminUser because we would like to reserve that for the admin. 

So for initialization it is extremely to initialize with this exact command, the password and email can still be changed but it is very important to keep that username. DO NOT CHANGE THE USERNAME FOR INITIALIZATION.

Then you need to run nodemon server.js in server folder and on a separate command line run npm start in the client folder.
And that is it your app will start at port 3000 on localhost.

Contribution:
Aaryn Anand: Modifying css to incorporate a few better functioning functionalities like creator names for posts etc., modify components js code for the same to fix issue. Implementing the models' js files within server folder. Implementation of profile page view  and ordering of communities. Implementation of initialization js and guest view.

Ashna Jambavat: Implementation of server.js and optimizing new server files. Setting up of MongoDB and running test cases. Implementation of welcome, login and register pages. Implementation of minuet new adjustments for new interface such as new separators. Composed UML diagrams.
