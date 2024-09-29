import { createClient } from "@supabase/supabase-js";
import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createClient as createRedisClient } from "redis";

import { findUser } from "./services/findUser.service";

import cors from "cors";
require("dotenv").config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL + "";
const supabaseKey = process.env.SUPABASE_ANON_KEY + "";
const supabase = createClient(supabaseUrl, supabaseKey);

const redis = createRedisClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT + ""),
  },
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

// initialize the express.js server
const app = express();

app.use(cors());

// BODY PARSING MIDDLEWARE
app.use(express.urlencoded({ extended: true }));

// COOKIE PARSER MIDDLEWARE
app.use(cookieParser());

// adding the ejs view engine
app.set("view engine", "ejs");
app.set("views", "./views");

app.use((req, res, next) => {
  if (!req.cookies.token && req.url != "/login") {
    return res.redirect("/login");
  }
  const token = next();
});

app.use(express.static("./static"));

app.get("/", (req, res) => {
  return res.send("Hello motherfucker");
});

app.get("/login", (req, res) => {
  return res.render("login", { error: "" });
});

app.post("/login", async (req, res) => {
  const user = await findUser(supabase, req.body.phone);
  if (user == null) {
    return res.render("login", { error: "Code 1 non existant" });
  }

  if (user.code_2 != req.body.password) {
    return res.render("login", { error: "Code 2 incorrect" });
  }

  const token = user.uid;
  // Set the token as a cookie in the response
  res.cookie("token", token, { maxAge: 3600000 * 24 * 3, httpOnly: true }); // Set cookie with 3 days expiration (1 hour * 24 * 3) expiration
  await (await redis).set(token, token);
  return res.redirect("/");
});

app.listen(process.env.PORT, () => {
  console.log(`APP LISTENING ON PORT : ${process.env.PORT}`);
});
