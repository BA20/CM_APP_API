const http = require("http");
const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();
const axios = require("axios");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const hostname = "plantme-api.herokuapp.com";
const port = process.env.PORT || 3004;
const saltRounds = 10;

//const hostname = "localhost";
//const port = 3004;
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
              res.send({ status: true, email: email, id: result[0].idUser });
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

app.get("/plantacoes/getAll/:email", (req, res) => {
  const email = req.params.email;

  connection.query(
    `SELECT P.*, PROD.nomePlanta FROM plantacao P, user U, produto PROD WHERE P.id_user = U.idUser 
    and P.id_produto = PROD.idProduto and U.email = "${email}"`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, plantacoes: result });
      }
    }
  );
});

// ---------------------------- Produtos ----------------------------------------------------

app.get("/produtos/getById/:id", (req, res) => {
  const idProduto = req.params.id;

  connection.query(
    `SELECT * FROM produto WHERE idProduto = "${idProduto}"`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, produto: result[0] });
      }
    }
  );
});

// ---------------------------- Eventos ----------------------------------------------------

app.get("/eventos/getLatest/:id", (req, res) => {
  const idPlantacao = req.params.id;

  connection.query(
    `SELECT * FROM evento WHERE id_plantacao = ${idPlantacao} ORDER BY data DESC LIMIT 5`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, eventos: result });
      }
    }
  );
});

// ---------------------------- SUGESTÕES ----------------------------------------------------

app.get("/sugestoes/getEpocaAtual", (req, res) => {
  connection.query(
    `SELECT * FROM sugestao WHERE MONTH(data_inicio) >= MONTH(CURRENT_DATE()) and
    DAY(data_inicio) >= DAY(CURRENT_DATE())`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, sugestoes: result });
      }
    }
  );
});

// ---------------------------- VENDAS ----------------------------------------------------

app.get("/vendas/getAll", (req, res) => {
  connection.query(`SELECT * FROM venda`, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send({ status: true, vendas: result });
    }
  });
});

app.get("/vendas/getMes/:mes", (req, res) => {
  const mes = req.params.mes;

  connection.query(
    `SELECT V.*, P.nomePlanta FROM venda V, produto P WHERE MONTH(date) = ${mes} and V.id_produto = P.id_produto`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, vendas: result });
      }
    }
  );
});

app.get("/vendas/getMesAno/:ano-:mes", (req, res) => {
  const mes = req.params.mes;
  const ano = req.params.ano;

  connection.query(
    `SELECT V.*, P.nomePlanta FROM venda V, produto P WHERE MONTH(date) = ${mes} and YEAR(date) = ${ano} and V.id_produto = P.id_produto`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, vendas: result });
      }
    }
  );
});

app.get("/vendas/getAno/:ano", (req, res) => {
  const ano = req.params.ano;

  connection.query(
    `SELECT V.*, P.nomePlanta FROM venda WHERE YEAR(date) = ${ano} and V.id_produto = P.id_produto`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, vendas: result });
      }
    }
  );
});

app.get("/vendas/getPorProduto/:id_produto", (req, res) => {
  const idProd = req.params.id_produto;

  connection.query(
    `SELECT V.*, P.nomePlanta FROM venda V, produto P WHERE id_produto = ${idProd} and V.id_produto = P.id_produto`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, vendas: result });
      }
    }
  );
});

// ---------------------------- ALERTAS ----------------------------------------------------

app.get("/alertas/getAllUser/:id_user", (req, res) => {
  const idUser = req.params.id_user;

  connection.query(
    `SELECT * FROM alerta WHERE id_user = ${idUser};`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, vendas: result });
      }
    }
  );
});

app.get("/alertas/getAllPlantacao/:id_user-:id_plantacao", (req, res) => {
  const idUser = req.params.id_user;
  const idPlantacao = req.params.id_plantacao;

  connection.query(
    `SELECT * FROM alerta WHERE id_user = ${idUser} and id_plantacao = ${idPlantacao};`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        res.send({ status: true, vendas: result });
      }
    }
  );
});

// ---------------------------- OBTER METEOROLOGIA ----------------------------------------------------
app.get("/meteorologia/:lat/:lng", (req, res) => {
  const lat = req.params.lat;
  const lng = req.params.lng;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=bbbeb5909216a1fb4708287193a9c88d`;
  try {
    const res = axios.get(url);
    console.log(res.data);
  } catch (err) {
    console.log(err);
  }
});
