var mongoose = require('mongoose');




//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose.connect(mongoDB);




mongoose.Promise = global.Promise;

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));




var Schema = mongoose.Schema;


var ProductSchema = new Schema({
	blockChainId: Number,
	name: String,
	category: String,
	ipfsImageHash: String,
	ipfsDeschash: String,
	startTime: Number,
	price: Number,
	condition: Number,
	buyer: String
});

var ProductModel = mongoose.model('ProductModel',ProductSchema,'ProductModels');

module.exports = ProductModel;


