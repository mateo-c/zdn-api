const {admin, db} = require('./admin');

const fbAuth = (req,res,next) => {
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
      idToken = req.headers.authorization.split('Bearer ')[1];
    }else {
      return res.status(403).json({error: "No autorizado"})
    }
  
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      
      return db.collection('users')
      .where('userId','==', req.user.uid)
      .limit(1)
      .get();
    })
    .then(data => {
      //console.log(data.docs[0].data());
      req.user.owner = data.docs[0].data().userId;
      req.user.id = data.docs[0].data().email;
      return next();
    })
    .catch(err => {
      console.error("Error verificando token ",err);
      return res.status(403).json(err);
    })
  };

  module.exports = { fbAuth }
