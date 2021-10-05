const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");  // require mongoose
const _ = require("lodash");
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.static("public"));

// connect to MongoDB and create database
mongoose.connect("mongodb://localhost:27017/todolistDB");


//create a schema
const itemSchema = {
  name: String
}

//create a mongoose model based on schema
const Item = mongoose.model("Item", itemSchema);

//create default to do list items
const item1 = new Item({
  name: "create to do list"  
});

const item2 = new Item({
  name: "cross something off"
});

const defaultItems = [item1, item2];

//check if the DB is empty, if it is then add the default items
Item.find({}, function(err, results) {
  if (err) {
    console.log(err);
  } else {
    if (results.length === 0) {
      // insert into the db using an array
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log("error inserting items");
        } else {
          console.log("Successfully inserted items");
        }
      });
    }    
  }
});

/*
  Beginning of Routes
*/

app.get("/", function(req, res) {  

  Item.find({}, function(err, results){
    if (err) {
      console.log(err);
    } else {
                        
      res.render("list", { listTitle: "Today", newListItems: results}); 
    } 
  });
  
});

const listSchema = {
  name: String, 
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  // check if list name already exists
  List.findOne({name: customListName}, function(err, foundList){
    // if no error
    if (!err) {
      //create a new list if list not found
      if (!foundList) {        
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        
        list.save();
        res.redirect("/" + customListName);
      }
    else {
      //show an existing list  
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

    }
  }
  });  
});


app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(itemName);
  console.log(listName);

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/"); 

  } else {
    List.findOne({name: listName}, function(err, foundList) {
      console.log(foundList);
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    });
  }
})



app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      console.log(err);
    });
    res.redirect("/");  
  } else {

    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, results){
      if (!err) {
        res.redirect("/" + listName);
      } 
    });

  }
})


app.listen(port, () => {
  console.log(`example app listening at http://localhost:${port}`);
});
