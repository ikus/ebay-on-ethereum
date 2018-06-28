var ecommerce_store_artifacts = require('./build/contracts/EcommerceStore.json');
var contract = require('truffle-contract');
var web3 = require('web3');
var provider = new web3.providers.HttpProvider("http://localhost:8545");
var EcommerceStore = contract(ecommerce_store_artifacts);
EcommerceStore.setProvider(provider);

var mongoose = require('mongoose');
var ProductModel = require('./product');
//var SomeModel = require('../models/somemodel')

var express = require('express');

var app = express();

app.use(function(req,res,next){
	res.header("Access-Control-Allow-Origin","*");
	res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.listen(3000, function(){
	console.log("Ebay on Ethereum server listening on port 3000");
});


app.get('/',function(req,res){
	res.send("Hello, Ethereum!");
});


app.get('/products',function(req,res){
	var query={};
	if(req.query.category !== undefined){
		query['category'] = {$eq: req.query.category};
	}
	ProductModel.find(query,null,{sort: 'startTime'},function(err,items){
		console.log(items.lenght);
		res.send(items);
	});
});

setupProductEventlistener();

function setupProductEventlistener(){
	var productEvent;
	EcommerceStore.deployed().then(function(i){
		productEvent = i.NewProduct({fromBlock: 0, toBlock:'latest'})
		productEvent.watch(function(err,result){
			if(err){
				console.log(err);
			}else{
				//console.log(result.args);
				saveProduct(result.args);
			}
		});
	});
}

function saveProduct(product){
	console.log("Saving: "+product._productId);
	//console.log("ProductModel: "+ProductModel);

	//ProductModel.findOne({'blockChainId': product._productId.toNumber()}).then(function(dbProduct){console.log("<<<>>>"+dbProduct);});

	ProductModel.findOne({'blockChainId': product._productId},function(err,dbProduct){
		console.log("Count : "+product);
		if(dbProduct!=null){
			console.log(dbProduct);
			return;
		}

		var p = new ProductModel({name: product._name, blockChainId: product._productId, 
			category:product._category ,ipfsImageHash: product._imageLink, ipfsDeschash: product._desLink, 
			startTime: product._startTime, price: product._price , condition: product._productCondition});

		p.save(function(error){
			if(error){
				console.log(error);
			}else{
				ProductModel.count({},function(err,count){
					console.log("Count is: "+count);
				});
			}
		});
	})
}

