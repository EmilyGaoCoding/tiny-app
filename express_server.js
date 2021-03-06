const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const usersDB = require("./user_database");
const urlsDB = require("./url_database");
const validator = require("validator");

const moment = require("moment");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  //keys: ['key1', 'key2'],
  keys: ['key1'],
  maxAge: 24 * 60 * 60 * 1000
}));

const bcrypt = require('bcrypt');

app.set("view engine", "ejs");

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function urlsForUser(id) {
  const urlsList = {};
  for (let url in urlsDB) {
    if (urlsDB[url].userID === id) {
      urlsList[url] = urlsDB[url];
    }
  }
  return urlsList;
}

function isCookieValid(id) {
  for (let user in usersDB) {
    if (id === user) {
      return true;
    } return false;
  }
}

app.get("/register", (req, res) => {
  if (req.session.userId && isCookieValid(req.session.userId)) {
    res.redirect("/urls");
  } else { res.render("urls_register"); }
});

app.get("/login", (req, res) => {
  if (req.session.userId && isCookieValid(req.session.userId)) {
    res.redirect("/urls");
  } else { res.render("urls_login"); }
});

app.post("/register", (req, res) => {
  if (!validator.isEmail(req.body.email)) {
    res.status(400).send("That's not a valid email address!");
  } else if (!req.body.email || !req.body.password) {
    res.status(400).send("Oops, you gotta fill out both email and password fields");
  } else {
    for (let user in usersDB) {
      if (usersDB[user].email === req.body.email) {
        res.status(400).send("Oops, seems like you already registerd with us");
        break;
      }
    }
  }
  const userId = generateRandomString();
  usersDB[userId] = {
    id: userId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.userId = userId;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/logout", (req, res) => {
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  for (let user in usersDB) {
    if (req.body.email === usersDB[user].email) {
      if (bcrypt.compareSync(req.body.password, usersDB[user].password)) {
        req.session.userId = usersDB[user].id;
        res.redirect("/urls");
        break;
      }
    }
  }
  res.status(403).send("That's not a valid email and password pairing.");
});

app.post("/urls/:id", (req, res) => {
  if (req.session.userId) {
    if (urlsDB.hasOwnProperty(req.params.id)) {
      if (req.session.userId === urlsDB[req.params.id].userID) {
        urlsDB[req.params.id].fullURL = req.body.longURL_field;
        res.redirect("/urls");
      } else { res.send("You don't own this short URL."); }
    } else { res.send("This short URL doesn't exist."); }
  } else { res.send("Log in first to view your short URLs."); }
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.session.userId) {
    if (urlsDB.hasOwnProperty(req.params.id)) {
      if (req.session.userId === urlsDB[req.params.id].userID) {
        delete urlsDB[req.params.id];
        res.redirect("/urls");
      } else { res.send("You don't own this short URL."); }
    } else { res.send("This short URL doesn't exist."); }
  } else { res.send("Log in first to view your short URLs."); }
});



app.get("/u/:id", (req, res) => {
  if (!urlsDB[req.params.id]) {
    res.send('Oops, seems like you entered an invalid short URL.');
  } else {
    let longURL = urlsDB[req.params.id].fullURL;
    if (longURL.startsWith("http")) {
      res.redirect(longURL);
    } else { res.redirect("//" + longURL); }
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.userId),
    user: usersDB[req.session.userId]
  };
  if (req.session.userId) {
    res.render("urls_new", templateVars);
  } else { res.redirect("/login"); }
});

app.get("/urls", (req, res) => {
  // if (req.session.userId) {
  //   if (ifValidUser(req.session.userId)) {
    let templateVars = {
      urls: urlsForUser(req.session.userId),
      user: usersDB[req.session.userId]
    };
    res.render("urls_index", templateVars);
    // }
  // } else { res.redirect("/login"); }
});

app.post("/urls", (req, res) => {
  if (req.session.userId) {
    let shortURL = generateRandomString();
    urlsDB[shortURL] = {
      userID: req.session.userId,
      tinyURL: shortURL,
      fullURL: req.body.longURL,
      date: moment().format('MMM D, YYYY')
    };
    let templateVars = {
      urls: urlsForUser(req.session.userId),
      user: usersDB[req.session.userId]
    };
    res.redirect("/urls/" + shortURL);
  } else { res.send("Please log in first."); }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlsForUser(req.session.userId),
    user: usersDB[req.session.userId]
  };
  if (req.session.userId) {
    if (urlsDB.hasOwnProperty(req.params.id)) {
      if (req.session.userId === urlsDB[req.params.id].userID) {
        res.render("urls_show", templateVars);
      } else { res.send("You don't own this short URL."); }
    } else { res.send("This short URL doesn't exist."); }
  } else { res.send("Log in first to view your short URLs."); }
});

app.get("/", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.userId),
    user: usersDB[req.session.userId]
  };
  if (req.session.userId) {
    res.redirect("/urls");
  } else { res.redirect("/login"); }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});