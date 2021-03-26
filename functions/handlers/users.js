const { db } = require("../utils/admin");

const config = require("../utils/config");

const { isEmpty, isEmail } = require("../utils/validations");

const firebase = require("firebase");
firebase.initializeApp(config);

const signup = (req, res) => {
  //obtenemos los datos del formulario de singup
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Este campo no puede estar vacío.";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Debe ser una casilla válida.";
  }
  if (isEmpty(newUser.password)) {
    errors.password = "Este campo no puede estar vacío.";
  }
  if (newUser.password !== newUser.confirmPassword) {
    errors.confirmPassword = "Los campos no coinciden.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  let token, userId;
  db.doc(`/users/${newUser.email}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ usuario: "Usuario existente." });
      } else {
        //creamos autenticación
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      //onbtenemos el UID del usuario creado
      console.log("-------DATA------->");
      console.log(data);
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      //agregamos el usuario a la DB
      return db.doc(`users/${newUser.email}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.log(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email ya registrado." });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

const login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  let errors = {};

  if (isEmpty(user.email)) {
    errors.email = "Este campo no puede estar vacío.";
  }
  if (isEmpty(user.password)) {
    errors.password = "Este campo no puede estar vacío.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      res.json({ token });
    })
    .catch((err) => {
      if (err.code.split('/')[0] === "auth") {
        return res.status(403).json({ general: "Credenciales incorrectas." });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

//add user details
const addUserDetails = (req, res) => {
  const userDetails = {
    cuil: req.body.cuil,
    phone: req.body.phone
  };
  
  db.doc(`/users/${req.user.id}`)
  .update(userDetails)
  .then(()=>{
    return res.status(200).json({ok:"Detalles agregados"});
  })
  .catch(err => {
    console.log(err);
    return res.status(500).json({error: err.code});
  })
};

const getAuthenticatedUser = (req, res) => {
  let userData = {};

  db.doc(`/users/${req.user.id}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("shipments")
          .where("userId", "==", req.user.owner)
          .get();
      }
    })
    .then((data) => {
      userData.shipments = [];
      data.forEach((doc) => {
        userData.shipments.push(doc.data());
      });
      return res.json(userData)
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

module.exports = { signup, login, addUserDetails, getAuthenticatedUser };
