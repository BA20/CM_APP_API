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

var db = mysql.createConnection(
  "mysql://b29adaae436a89:785ca57e@eu-cdbr-west-01.cleardb.com/heroku_e1284fe7bf9d243?reconnect=true"
);
db.connect();

app.get("/", (req, res) => {
  db.query("SELECT * FROM user ", (err, result) => {
    if (err) {
      res.send(err);
    }
    res.send(result.data);
  });
});

//--------------------------------- Login ---------------------------

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

  db.query("SELECT * FROM `user` WHERE email = ?", email, (err, result) => {
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
          "INSERT INTO user (email, password) VALUES (?, ?)",
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
