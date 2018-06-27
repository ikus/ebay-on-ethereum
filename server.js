var ecommerce_store_artifacts = require('./build/contracts/EcommerceStore.json');
var contract = require('truffle-contract');
var web3 = require('web3');
var provider = new web3.providers.HttpProvider("http://localhost:8545");
var EcommerceStore = contract(ecommerce_store_artifacts);
EcommerceStore.setProvider(provider);

var express = require('express');

var app = express();

app.listen(3000, function(){
	console.log("Ebay on Ethereum server listening on port 3000");
});


app.get('/',function(req,res){
	res.send("Hello, Ethereum!");
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
				console.log(result.args);
			}
		});
	});
}