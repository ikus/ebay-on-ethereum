var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

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

var ProductModel = mongoose.model('ProductModel',ProductSchema);

module.exports = ProductModel;

