require("dotenv").config();
const express = require("express"),
  app = express(),
  passport = require("passport"),
  server = require("http").Server(app),
  router = express.Router(),
  bodyParser = require("body-parser"),
  cors = require("cors"),
  expressJwt = require("express-jwt"),
  fs = require("fs"),
  path = require("path"),
  port = process.env.PORT || 8000,
  _ = require("lodash"),
  cron = require("node-cron"),
  { verifyToken } = require("./app/lib/stacks"),
  { listenStactsTxns } = require("./app/lib/cron"),
  { Users, Profiles } = require("./app/models");

require("./app/lib/stacks");
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-Forwarded-For"],
    credentials: true,
  })
);

app.use(
  bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    type: "application/x-www-form-urlencoded",
  })
);

app.use(
  bodyParser.json({
    limit: "500mb",
    type: "application/*",
  })
);

// app.use(
//   expressJwt({
//     secret: process.env.JWT_SECRET_KEY || "supersecret",
//   }).unless({
//     path: [
//       {
//         url: /\/near\/sign*/,
//         methods: ["POST"],
//       },
//       {
//         url: /\/cron*/,
//         methods: ["GET", "POST"],
//       },
//     ],
//   })
// );

app.use(passport.initialize());

app.use(function (req, res, next) {
  if (req.query.related) {
    req.query.related = `[${req.query.related}]`;
  }
  next();
});

function parseQueryString(req, res, next) {
  if (req.query && req.query.hasOwnProperty("filter")) {
    req.query.filter = _.mapValues(req.query.filter, function (value, key) {
      if (value === "false") return false;
      else if (value === "true") return true;
      else return value;
    });
  }
  if (req.query && req.query.hasOwnProperty("filterRelated")) {
    req.query.filterRelated = _.mapValues(
      req.query.filterRelated,
      function (value, key) {
        if (value === "false") return false;
        else if (value === "true") return true;
        else return value;
      }
    );
  }
  next();
}

["log", "warn", "error"].forEach((methodName) => {
  // eslint-disable-next-line no-console
  const originalMethod = console[methodName];
  // eslint-disable-next-line no-console
  console[methodName] = (...args) => {
    try {
      throw new Error();
    } catch (error) {
      originalMethod.apply(console, [
        error.stack // Grabs the stack trace
          .split("\n")[2] // Grabs third line
          .trim() // Removes spaces
          .substring(3) // Removes three first characters ("at ")
          .replace(__dirname, "") // Removes script folder path
          .replace(/\s\(./, " at ") // Removes first parentheses and replaces it with " at "
          .replace(/\)/, ""), // Removes last parentheses
        "\n",
        ...args,
      ]);
    }
  };
});

async function verifyAuth(req, res, next) {
  try {
    let authRoutes = [
      { path: "/medals", methods: ["POST", "PATCH"] },
      { path: "/posts", methods: ["POST", "PATCH"] },
      // { path: "/claim", methods: ["POST", "PATCH"] },
      { path: "/profiles", methods: ["POST", "PATCH"] },
      { path: "/recommendation", methods: ["POST"] },
      { path: "/nft-supports", methods: ["POST", "PATCH"] },
      // { path: "/nft-supporters", methods: ["POST"] },
    ];
    let currentRoute = authRoutes.find((f) => f.path === req.baseUrl);
    if (currentRoute && currentRoute.methods.includes(req.method)) {
      let token = req.body.token || req.query.token;
      let account_id = verifyToken(token, req.body.message);
      if (account_id) {
        let user;
        delete account_id.message;
        user = await Users.query().findOne({
          is_deleted: false,
          stx_address: account_id,
        });
        if (!user) {
          user = await Users.query().insert({ stx_address: account_id });
          let profile = await Profiles.query().insert({ user_id: user.id });
        }
        req.user = { account_id, ...user };
        delete req.body.token;
        next();
      } else {
        res.status(401).json({
          success: false,
          message: "Authentication failed",
        });
      }
      // next();
    } else next();
  } catch (error) {
    console.log(error, "error1234");
  }
}

fs.readdirSync("./app/routes").forEach((file) => {
  router.use(
    `/${path.parse(file).name}`,
    parseQueryString,
    verifyAuth,
    require(`./app/routes/${file}`)(express.Router())
  );
});

app.use(router);

cron.schedule("*/5 * * * *", () => {
  console.log("running a task every 5 minutes");
  listenStactsTxns();
});

server.listen(port, () => {
  console.log(
    `Server active at http://localhost:${port} on ID: ${process.pid}`
  );
});
