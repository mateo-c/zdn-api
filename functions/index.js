const functions = require("firebase-functions");
const express = require("express");

const { fbAuth } = require("./utils/fbAuth");

const { getItems, createItem } = require("./handlers/items");
const { signup, login, addUserDetails, getAuthenticatedUser } = require("./handlers/users");

const app = express();

//items ROUTES --------------------------
// admin y usuario
app.get("/items", fbAuth, getItems);
//    app.post("/item", fbAuth, createShiptment);

//solo Admin
app.post("/items", fbAuth, createItem); //uno o varios items
//    app.post("/item", fbAuth, validateShipment);

//user ROUTES ---------------------------
app.post("/signup", signup);
app.post("/login", login);
app.post("/user", fbAuth, addUserDetails);
app.get('/user', fbAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
