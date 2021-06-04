const http = require("http");
const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const hostname = "plantme-api.herokuapp.com";
const port = process.env.PORT || 3004;
const saltRounds = 10;

app.listen(port, () => {
  console.log(`runnig server! http://${hostname}:${port}/`);
});

//Olá mundo
app.get("/", (req, res) => {
  res.send("Olá");
  console.log("Olá mundo");
});

//--------------------------------- Login ---------------------------

const db = mysql.createConnection({
  host: "plantme-api.herokuapp.com",
  user: "b29adaae436a89",
  password: "785ca57e",
  database: "heroku_e1284fe7bf9d243",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Mysql Connected...");
});

//Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query("SELECT * FROM users WHERE email = ?", email, (err, result) => {
    if (err) {
      res.send(err);
    }
    if (result.length > 0) {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          console.log(err);
        }

        bcrypt.compare(password, result[0].password, (error, response) => {
          if (response) {
            res.json({ status: true, email: email });
          } else {
            res.json({ status: false });
          }
        });
      });
    }
  });
});

// ---------------------------- Utilizadores ----------------------------------------------------

//Adicionar user
app.post("/user", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query("SELECT * FROM `users` WHERE email = ?", email, (err, result) => {
    if (err) {
      res.send(err);
    }

    if (result.length > 0) {
      res.send("Já existe um utilizador com esse email");
    } else {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          res.send(err);
        }
        db.query(
          "INSERT INTO users (email, password) VALUES (?, ?)",
          [email, hash],
          (err, result) => {
            if (err) {
              res.send(err);
            } else {
              res.send("Registo com sucesso");
            }
          }
        );
      });
    }
  });
});
