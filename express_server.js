const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const usersDB = require("./user_database");
const urlsDB = require("./url_database");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const bcrypt = require('bcrypt');

app.set("view engine", "ejs")

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function urlsForUser(id) {
  const urlsList = {};
  for (let url in urlsDB) {
    console.log(urlsDB[url].userID);
    if (urlsDB[url].userID === id) {
      urlsList[url] = urlsDB[url];
    }
  }
  return urlsList;
}

app.get("/register", (req, res) => {
  res.render("urls_register");
})

app.get("/login", (req, res) => {
  res.render("urls_login");
})

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Oops, you gotta fill out both email and password fields");
  } else {
  for (let user in usersDB) {
    if (usersDB[user].email === req.body.email) {
    res.status(400).send("Oops, seems like you already registerd with us");
    break;
  }}
}

  const user_id = generateRandomString();
  usersDB[user_id] = {
    id: user_id,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  console.log(usersDB);
  req.session.user_id = user_id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  for (let user in usersDB) {
    if (req.body.email === usersDB[user].email) {
      if (bcrypt.compareSync(req.body.password, usersDB[user].password)) {
        req.session.user_id = usersDB[user].id;
        res.redirect("/");
        break;
      }
    }
  }
  res.status(403).send("That's not a valid email and password pairing.");
});

app.post("/urls/:id/update", (req, res) => {
  urlsDB[req.params.id].fullURL = req.body.longURL_field;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlsDB[req.params.id];
  res.redirect("/urls/" + req.params.id);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlsDB[req.params.shortURL]) {
    res.send('Oops, seems like you entered an invalid short URL.');
  } else {
  let longURL = urlsDB[req.params.shortURL].fullURL;
  res.redirect(longURL);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: usersDB[req.session.user_id]
  };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else { res.send("Log in first to create a new short URL.")}
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: usersDB[req.session.user_id]
  };
  console.log(urlsDB);
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlsDB[shortURL] = {
    userID: req.session.user_id,
    tinyURL: shortURL,
    fullURL: req.body.longURL
  };
  console.log(urlsDB);
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: usersDB[req.session.user_id]
  };
  console.log(urlsForUser(req.session.user_id));
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlsForUser(req.session.user_id),
    user: usersDB[req.session.user_id]
  };
  if (req.session.user_id === urlsDB[req.params.id].userID) {
    res.render("urls_show", templateVars);
  } else if (req.session.user_id) {
    res.send("You don't own this short URL.")
  } else { res.send("Log in first to view your short URLs."); }
});

app.get("/", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: usersDB[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect("/urls");
  } else { res.redirect("/login");}
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});