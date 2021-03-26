const { db } = require("../utils/admin");

const getItems = (req, res) => {
  db.collection("items")
    //.orderBy('chekinAt','desc')
    .where("owner", "==", req.user.owner)
    .get()
    .then((data) => {
      let items = [];
      data.forEach((doc) => {
        items.push({
          itemId: doc.id,
          owner: doc.data().owner,
          name: doc.data().name,
          quantity: doc.data().quantity,
          chekinAt: doc.data().chekinAt,
        });
      });
      return res.json(items);
    })
    .catch((err) => console.log(err));
};

const createItem = (req, res) => {
  let batch = db.batch();

  const newItems = req.body.items;

  newItems.forEach((item) => {
    item.owner = req.user.owner;
    item.chekinAt = new Date().toISOString();
    let docRef = db.collection("items").doc(); //automatically generate unique id
    batch.set(docRef, item);
  })
  batch.commit()

  // db.collection("items")
  //   .add(newItems)
    .then((doc) => {
      res.json({ message: doc });
      // res.json({ message: `Documento ${doc.id} creado con éxito!` });
    })
    .catch((err) => {
      res.status(500).json({ error: `Something went wrong` });
      console.error(err);
    });
};

module.exports = { getItems, createItem };
