var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const app = express();
const passport = require('passport');
const passportJWT = require('passport-jwt');
const jwt = require('jsonwebtoken');


// ExtractJwt to help extract the token
let ExtractJwt = passportJWT.ExtractJwt;
// JwtStrategy which is the strategy for the authentication
let JwtStrategy = passportJWT.Strategy;
let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'jwt';
let strategy = new JwtStrategy(jwtOptions, function (jwtPayload, cb) {
  console.log(jwtPayload);
  return User.findOne({
    where: { id: jwtPayload.id },
  }).then(user => {
    return cb(null, user);
  }).catch(err => {
    return cb(err);
  });
});
passport.use(strategy);
router.use(passport.initialize());


const Sequelize = require('sequelize');
// initialize an instance of Sequelize
const sequelize = new Sequelize('RZkQki6aHw', 'RZkQki6aHw', 'ExLNJYnrEF', {
  host: 'remotemysql.com',
  dialect: 'mysql'

});
// check the databse connection
sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database: ', err));

const User = sequelize.define('user', {
  name: {
    type: Sequelize.STRING,
  },
  password: {
    type: Sequelize.STRING,
  },
});

// create table with user model
User.sync()
  .then(() => console.log(' User table has been created successfully'))
  .catch(err => console.log('Error, did you enter wrong database credentials ?'));
const createUser = async ({ name, password }) => {
  return await User.create({ name, password });
};
const getAllUsers = async () => {
  return await User.findAll();
};
const getUser = async obj => {
  return await User.findOne({
    where: obj,
  });
};
var connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'usersdatabase'
});
router.get('/users', function (req, res) {
  getAllUsers().then(user => res.json(user));
});
// register route
router.post('/register', function (req, res, next) {
  const { name, password } = req.body;
  createUser({ name, password }).then(user =>
    res.json({ user, msg: 'account created successfully' })
  );
});
// login route
router.post('/login', async function (req, res, next) {
  const { name, password } = req.body;
  if (name && password) {
    // we get the user with the name and save the resolved promise returned
    let user = await getUser({ name });
    if (!user) {
      res.status(401).json({ msg: 'No such user found', user });
    }
    if (user.password === password) {
      // from now on we'll identify the user by the id and the id is
      // the only personalized value that goes into our token
      let payload = { id: user.id };
      let token = jwt.sign(payload, jwtOptions.secretOrKey);
      res.json({ msg: 'ok', token: token });
    } else {
      res.status(401).json({ msg: 'Password is incorrect' });
    }
  }
});
// protected route
router.get('/me', passport.authenticate('jwt', { session: false }), function (req, res, next) {

  res.json({ 'user': req.user, msg: 'Congrats! You are seeing this because you are authorized' });


});
// connection.connect();
// router.get('/users/ ', function (req, res, next) {
//   connection.query('SELECT * FROM usersinfomation ', [req.params.id], (err, rows, fields) => {
//     if (!err)
//       res.send(rows);
//     else
//       res.send(err);
//   })
// });
// /*register . */
// router.post('/users//register', (req, res) => {
//   var user = req.body;
//   connection.query('INSERT  INTO usersinfomation (`username`, `password`, `firstname`, `lastname`, `email`) VALUES (?,?,?,?,?);',
//     [user.username, user.password, user.firstname, user.lastname, user.email],
//     (err, rows, fields) => {
//       if (!err)
//         res.send("Add Successfull");
//       else
//         res.send(err);
//     }
//   )

// });
// router.post('/users/login', (req, res) => {

//   var username = req.body.username;
//   var password = req.body.password;
//   if (username && password) {
//     connection.query('SELECT * FROM usersinfomation WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
//       if (results.length > 0) {

//         res.send("Login Successfull");

//       } else {
//         res.send('Incorrect Username and/or Password!');
//       }
//       res.end();
//     });
//   }

// });
module.exports = router;
