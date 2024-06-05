const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mysql = require("mysql");
const http = require("http");
const { Server } = require("socket.io");

const cookieParser = require("cookie-parser");
const session = require("express-session");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3003", "http://localhost:3002"],
    methods: ["GET", "POST", "DELETE", "PUT"],
  },
});

io.on("connection", (socket) => {
  console.log(`Client Connection: ${socket.id}`);
  socket.on("send_message", (data) => {
    socket.broadcast.emit("receive_message", data);
  });
});

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "fortunewheel",
});

app.use(
  cors({
    origin: ["http://localhost:3003", "http://localhost:3002"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    key: "adminspin",
    secret: "adminspin",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(
  session({
    key: "userspin",
    secret: "userspin",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 24 * 60 * 60 * 1000,
    },
  })
);

app.get("/", (req, res) => {
  res.send("Fortune Wheel Rest API");
});

app.get("/getdata", (req, res) => {
  const sqlSelect = "SELECT * FROM datatiket ORDER BY id DESC LIMIT 10";
  db.query(sqlSelect, (err, result) => {
    res.send(result);
  });
});

app.get("/getalldata", (req, res) => {
  const sqlSelect = "SELECT * FROM datatiket ORDER BY id DESC";
  db.query(sqlSelect, (err, result) => {
    res.send(result);
  });
});

app.get("/getdetail/:id", (req, res) => {
  const id = req.params.id;
  const sqlSelect = "SELECT * FROM datatiket WHERE id = ?";
  db.query(sqlSelect, id, (err, result) => {
    res.send(result);
  });
});

app.get("/api/getuser", (req, res) => {
  const sqlSelect = "SELECT * FROM user ORDER BY user DESC";
  db.query(sqlSelect, (err, result) => {
    res.send(result);
  });
});

app.get("/api/gettoday/:tanggal", (req, res) => {
  const tanggal = req.params.tanggal;

  const sqlSelect =
    "SELECT * FROM datatiket WHERE tanggal = ? ORDER BY id DESC";
  db.query(sqlSelect, [tanggal], (err, result) => {
    res.send(result);
  });
});

app.get("/claimed", (req, res) => {
  const sqlSelect = "SELECT * FROM datatiket WHERE konfir = 1 ORDER BY id DESC";
  db.query(sqlSelect, (err, result) => {
    res.send(result);
  });
});

app.get("/getclaimed", (req, res) => {
  const sqlSelect = "SELECT * FROM datatiket WHERE chance = 0 ORDER BY id DESC";
  db.query(sqlSelect, (err, result) => {
    res.send(result);
  });
});

app.put("/confirmed/:id", (req, res) => {
  const id = req.params.id;
  const sqlUpdate = "UPDATE datatiket SET konfir = 0 WHERE id = ?";
  db.query(sqlUpdate, id, (err, result) => {
    if (err) console.log(err);
  });
});

app.post("/api/daterange", (req, res) => {
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  const sqlSelect =
    "SELECT * FROM datatiket WHERE tanggal >= ? AND tanggal <= ?";
  db.query(sqlSelect, [startDate, endDate], (err, result) => {
    res.send(result);
  });
});

app.post("/api/regis", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const sqlInsert = "INSERT INTO user (user, password) VALUES (?,?)";
  const check = "SELECT * FROM user WHERE user = ?";

  db.query(check, [username], (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    if (username === "") {
      res.send({ message: "Username Tidak Boleh Kosong!" });
    } else if (password === "") {
      res.send({ message: "Password tidak boleh kosng!" });
    } else if (result.length > 0) {
      res.send({ message: "User Sudah ada" });
    } else {
      db.query(sqlInsert, [username, password], (err, result) => {
        res.send(result);
      });
    }
  });
});

app.post("/api/insert", (req, res) => {
  const username = req.body.username;
  const spincode = req.body.spincode;
  const hadiah = req.body.hadiah;
  const tanggal = req.body.tanggal;
  const admin = req.body.loginStatus;

  const sqlInsert =
    "INSERT INTO datatiket (tanggal, username, spincode, hadiah, chance, admin) VALUES (?,?,?,?,?,?)";
  const check = "SELECT * FROM datatiket WHERE spincode = ?";

  db.query(check, [spincode], (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    if (username === "") {
      res.send({ message: "Username Tidak Boleh Kosong!" });
    } else if (spincode === "") {
      res.send({ message: "Spincode Tidak Boleh Kosong!" });
    } else if (hadiah === "") {
      res.send({ message: "Pilih Hadiah!" });
    } else if (result.length > 0) {
      res.send({ message: "Maaf, Spincode sudah ada! Generate Ulang!" });
    } else {
      db.query(
        sqlInsert,
        [tanggal, username, spincode, hadiah, 1, admin],
        (err, result) => {
          console.log(result);
          res.send(result);
        }
      );
    }
  });
});

app.post("/insertdata", (req, res) => {
  const username = req.body.username;
  const spincode = req.body.spincode;
  const prize = req.body.prize;
  const tanggal = req.body.tanggal;
  const admin = req.body.loginStatus;

  const sqlInsert =
    "INSERT INTO datatiket (tanggal, username, spincode, hadiah, chance, admin) VALUES (?,?,?,?,?,?)";
  const check = "SELECT * FROM datatiket WHERE spincode = ?";

  db.query(check, [spincode], (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    if (username === "") {
      res.send({ messageError: "Username Tidak Boleh Kosong!" });
    } else if (spincode === "") {
      res.send({ messageError: "Spincode Tidak Boleh Kosong!" });
    } else if (prize === "") {
      res.send({ messageError: "Pilih Hadiah!" });
    } else if (result.length > 0) {
      res.send({ messageError: "Maaf, Spincode sudah ada! Generate Ulang!" });
    } else {
      db.query(
        sqlInsert,
        [tanggal, username, spincode, prize, 1, admin],
        (err, result) => {
          console.log(result);
          res.send(result);
        }
      );
    }
  });
});

app.delete("/api/delete/:id", (req, res) => {
  const id = req.params.id;
  const sqlDelete = "DELETE FROM datatiket WHERE id = ?";

  db.query(sqlDelete, id, (err, result) => {
    if (err) console.log(err);
  });
});

app.delete("/api/deletenew/:spincode", (req, res) => {
  const spincode = req.params.spincode;
  const sqlDelete = "DELETE FROM datatiket WHERE spincode = ?";

  db.query(sqlDelete, spincode, (err, result) => {
    if (err) console.log(err);
  });
});

app.put("/api/update/:id", (req, res) => {
  const nominal = req.body.nominal;
  const id = req.params.id;
  const sqlUpdate =
    "UPDATE datatiket SET chance = 0, nominal = ?, konfir = 1 WHERE id = ?";

  db.query(sqlUpdate, [nominal, id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send({ message: "berhasil" });
    }
  });
});

app.get("/loginforuser", (req, res) => {
  const sqlSelect = "SELECT * FROM prize";
  if (req.session.userspin) {
    db.query(sqlSelect, (err, result) => {
      res.send({ loggedIn: true, user: req.session.userspin, result });
    });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/loginforuser", (req, res) => {
  const username = req.body.username;
  const spincode = req.body.spincode;

  db.query(
    "SELECT * FROM datatiket WHERE username = ? AND spincode = ?",
    [username, spincode],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }

      if (result.length > 0) {
        req.session.userspin = result;
        res.send(result);
      } else {
        res.send({ messageError: "Login Failed!" });
      }
    }
  );
});

app.post("/logoutforuser", (req, res) => {
  // req.session.userspin.destroy();
  req.session.userspin = null;
  res.send({ loggedIn: false });
});

app.get("/logadmin", (req, res) => {
  if (req.session.adminspin) {
    res.send({ loggedIn: true, admin: req.session.adminspin });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/logadmin", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.query(
    "SELECT * FROM user WHERE user = ? AND password = ?",
    [username, password],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }

      if (result.length > 0) {
        req.session.adminspin = result;
        res.send(result);
      } else {
        res.send({ message: "Login Failed!" });
      }
    }
  );
});

app.post("/outadmin", (req, res) => {
  // req.session.adminspin.destroy(); // Menghapus session adminspin saja
  req.session.adminspin = null;
  res.send({ loggedIn: false });
});

server.listen(3001, () => {
  console.log("Listening on port 3001");
});

app.delete("/deleteBeforeEditPrize", (req, res) => {
  db.query("DELETE FROM prize");
});

app.post("/updateprize", (req, res) => {
  const smallArray = req.body.smallValues;
  const mediumArray = req.body.mediumValues;
  const bigArray = req.body.bigValues;
  const hugeArray = req.body.hugeValues;

  const sqlInsert = `INSERT INTO prize (small, medium, big, huge) VALUES (?,?,?,?)`;

  const totalArray = [...smallArray, ...mediumArray, ...bigArray, ...hugeArray];
  const totalLength = totalArray.length;

  const maxLength = Math.max(
    smallArray.length,
    mediumArray.length,
    bigArray.length,
    hugeArray.length
  );

  if (totalLength < 12) {
    res.send({ errMessage: "Failed Update Data!" });
  } else {
    for (let i = 0; i < maxLength; i++) {
      const smallValue = smallArray[i];
      const mediumValue = mediumArray[i];
      const bigValue = bigArray[i];
      const hugeValue = hugeArray[i];

      const values = [smallValue, mediumValue, bigValue, hugeValue];

      db.query(sqlInsert, values);
    }
    res.send({ successMessage: "Data Prize Has Been Updated" });
    console.log("Input Successfully!");
  }
});

app.get("/getprize", (req, res) => {
  const sqlSelect = "SELECT * FROM prize;";
  db.query(sqlSelect, (err, result) => {
    res.send(result);
  });
});
