const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./models/tourModel');
const User = require('./models/userModel');
const Review = require('./models/reviewModel');
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    //console.log(con.connections);
    console.log('DB CONNECTION SUCCESFUL');
  });

//Read json file

const tours = JSON.parse(fs.readFileSync('tours.json', 'utf-8'));
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/starter/dev-data/data/users.json`, 'utf-8')
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/starter/dev-data/data/reviews.json`, 'utf-8')
);
console.log(tours);
//import data to database
const importdata = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    console.log('data succesfully loaded');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};
//delete all data from collection
const deletedata = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('data succesfully deleted');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--import') {
  importdata();
} else if (process.argv[2] === '--delete') {
  deletedata();
}

console.log(process.argv);
