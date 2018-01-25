const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs")

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
}

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL_field;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls/" + req.params.id);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.send('Oops, seems like you entered an invalid short URL.');
  }
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies.username
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies.username
  };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
