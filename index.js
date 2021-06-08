const http = require("http");
const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
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

var connection;

function handleDisconnect() {
  connection = mysql.createConnection(
    "mysql://b29adaae436a89:785ca57e@eu-cdbr-west-01.cleardb.com/heroku_e1284fe7bf9d243?reconnect=true"
  ); // Recreate the connection, since
  // the old one cannot be reused.

  connection.connect(function (err) {
    // The server is either down
    if (err) {
      // or restarting (takes a while sometimes).
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  connection.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();
//test
app.get("/", (req, res) => {
  connection.query("SELECT * FROM user ", (err, result) => {
    if (err) {
      res.send(err);
    }
    res.send(result);
  });
});

//--------------------------------- Login ---------------------------

//Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log(password);
  connection.query(
    `SELECT * FROM user where email= "${email}"`,
    (err, result) => {
      if (err) {
        res.send(err);
      }
      if (result.length > 0) {
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            console.log(err);
          }
          console.log(result[0].password);
          bcrypt.compare(password, result[0].password, (error, response) => {
            if (response) {
              res.send({ status: true, email: email });
            } else {
              res.send({ status: false });
            }
          });
        });
      }
    }
  );
});

// ---------------------------- Utilizadores ----------------------------------------------------

//Adicionar user
app.post("/user", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  connection.query(
    `SELECT * FROM user where email= "${email}"`,
    (err, result) => {
      if (err) {
        console.log("DEU ERRO");
        res.send(err);
      }
      console.log(result);
      if (result.length > 0) {
        res.send("Já existe um utilizador com esse email");
      } else {
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            res.send(err);
          }
          console.log(hash);
          connection.query(
            `INSERT INTO user (email, password) VALUES ("${email}", "${hash}")`,
            (err, result) => {
              if (err) {
                res.send(err);
                console.log(err);
              } else {
                res.send({ res: "Registo com sucesso" });
                console.log("DEU caralho");
              }
            }
          );
        });
      }
    }
  );
});


// ---------------------------- Plantações ----------------------------------------------------

app.get("/plantacoes/getAll", (req, res) => {
  const email = req.body.email;

  connection.query(
    `SELECT * FROM plantacao P, user U WHERE P.id_user = U.idUser and U.email = "${email}"`,
    (err, result) => {
      if (err) {
        res.send(err);
      }
      else {
        res.send(result);
      }
    }
  );
});
