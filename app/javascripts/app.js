  // Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI({host:'localhost',port:'5001',protocol:'http'});

// Import our contract artifacts and turn them into usable abstractions.
import ecommerce_store_artifacts from '../../build/contracts/EcommerceStore.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var EcommerceStore = contract(ecommerce_store_artifacts);
var reader;
window.App = {
 start: function() {
  var self = this;

  // Bootstrap the MetaCoin abstraction for Use.
  EcommerceStore.setProvider(web3.currentProvider);
  if($("#product-details").length>0){
    let productId = new URLSearchParams(window.location.search).get('id');
    renderProductDetails(productId);
  }else{
    renderStore();  
  }
  
  $("#product-image").change(function(event){
    const file  = event.target.files[0]
    reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
  });

  

  $("#add-item-to-store").submit(function(event){
    //console.log("Hola Nenes");
    const req = $("#add-item-to-store").serialize();
    let params = JSON.parse('{"'+req.replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
    let decodeParams ={}
    Object.keys(params).forEach(function(v){
      decodeParams[v] = decodeURIComponent(decodeURI(params[v]));
    });
    //console.log(decodeParams);
    saveProduct(decodeParams);
    event.preventDefault();
  });

  $("#buy-now").submit(function(event){
    $("#msg").hide();
    var sendAmount = $("#buy-now-price").val();
    var productId = $("#product-id").val();
    EcommerceStore.deployed().then(function(i){
      i.buy(productId,{value: sendAmount,from: web3.eth.accounts[0],gas: 440000}).then(function(){
        $("#msg").show();
        $("#msg").html("You have succesfully purchased the product");
      })
    });  
    event.preventDefault();
  });

  $("#release-funds").click(function(event){
    let productId = new URLSearchParams(window.location.search).get('id');
    EcommerceStore.deployed().then(function(f){
      $("#msg").html("Your tranasaction has been submited. Please wait for few seconds for the confirmation").show();
      console.log(productId);
      f.releaseAmountToSeller(productId,{from: web3.eth.accounts[0]}).then(function(f){
        console.log(f);
        location.reload();
      }).catch(function(e){
        console.log(e);
      })
    });
  });

  $("#refund-funds").click(function(event){
    let productId = new URLSearchParams(window.location.search).get('id');
    EcommerceStore.deployed().then(function(f){
      $("#msg").html("Your tranasaction has been submited. Please wait for few seconds for the confirmation").show();
      console.log(productId);
      f.refundAmountToBuyer(productId,{from: web3.eth.accounts[0]}).then(function(f){
        console.log(f);
        location.reload();
      }).catch(function(e){
        console.log(e);
      })
    });
  });

 }
};

function renderProductDetails(productId){
  EcommerceStore.deployed().then(function(f){
    f.getProduct.call(productId).then(function(p){
      $("#product-name").html(p[1]);
      //$("#product-image").html("<img src='http://localhost:8080/ipfs/"+p[3]+"'/>");
      $("#product-image").html("<img src='http://ipfs.io/ipfs/"+p[3]+"'/>");
      $("#product-price").html(displayPrice(p[6]));
      $("#product-id").val(p[0]);
      $("#buy-now-price").val(p[6]);
      ipfs.cat(p[4]).then(function(file){
        var content = file.toString();
        $("#product-description").append("<div>"+content+"</div>");
      })
      if(p[8]=='0x0000000000000000000000000000000000000000'){
        $("#escrow-info").hide();
      }else{
        $("#buy-now").hide();
        f.escrowInfo.call(productId).then(function(i){
          $("#buyer").html(i[0]);
          $("#seller").html(i[1]);
          $("#arbiter").html(i[2]);
          $("#release-count").html(i[4].toNumber());
          $("#refund-count").html(i[5].toNumber());
        });
      }
    })
  })
}


function saveProduct(product){
  // 1. Upload image to IPFS and get the hash 
  // 2. Add description to IPFS and get the hash
  // 3. Pass the 2 hashes to addProductToStore
  var imageId;
  var descId;
  saveImageOnIpfs(reader).then(function(id){
    imageId = id;
    saveTextBlobOnIpfs(product["product-description"]).then(function(id){
      descId =id;
      EcommerceStore.deployed().then(function(f){
        return f.addProductToStore(product["product-name"],product["product-category"],imageId,descId,Date.parse(product["product-start-time"])/1000, web3.toWei(product["product-price"],'ether'),product["product-condition"],{from: web3.eth.accounts[0], gas: 4700000} );
      }).then(function(f){
        alert("Prodcut added to store!")
      });    
    });
  });
}

function saveImageOnIpfs(reader){
  return new Promise(function(resolve,reject){
    const buffer = Buffer.from(reader.result);
    ipfs.add(buffer)
    .then((response) => {
      console.log(response)
      resolve(response[0].hash);
    }).catch((err) => {
      console.error(err)
      reject(err);
    })
  })
}

function saveTextBlobOnIpfs(blob){
  return new Promise(function(resolve,reject){
    const descBuffer = Buffer.from(blob,'utf-8');
    ipfs.add(descBuffer)
    .then((response) => {
      console.log(response)
      resolve(response[0].hash);
    }).catch((err) => {
      console.error(err)
      reject(err);
    })
  })
}

function renderStore(){
  //get the product count
  //Loop trrough and fetch all the products by id
  /*var instance;
  return EcommerceStore.deployed().then(function(f){
    instance=f;
    return instance.productIndex.call();
  }).then(function(count){
    for (var i = 1; i <= count; i++) {
      renderProduct(instance,i);
    }
  });*/
  $.ajax({    
    url: "http://127.0.0.1:3000/products",
    type: 'get',
    contentType: "application-json; charset=utf-8",
    data: {}
  }).done(function(data){
    while(data.length > 0){
      let chunks = data.splice(0,4);
      chunks.forEach(function(value){
        renderProduct(value);
      });
    }

  });
}
/*
function renderProduct(instance,index){
  instance.getProduct.call(index).then(function(f){
    let node = $("<div/>");
    node.addClass("col-sm-3 text-center col-margin-bottom-1 product");
    //node.append("<img src='http://localhost:8080/ipfs/"+f[3]+"'/>");
    node.append("<img src='http://ipfs.io/ipfs/"+f[3]+"'/>");
    node.append("<div class='title'>"+f[1]+"</div>");
    node.append("<div> Price: "+ displayPrice(f[6])+"</div>");
    node.append("<a href='product.html?id="+f[0]+"'>Details</a>");
    if( f[8]=== "0x0000000000000000000000000000000000000000"){
        $("#product-list").append(node);
    }else{
      $("#product-purchased").append(node);
    }
  });
}*/

function renderProduct(product){
  console.log(product);
  let node = $("<div/>");
    node.addClass("col-sm-3 text-center col-margin-bottom-1 product");
    //node.append("<img src='http://localhost:8080/ipfs/"+f[3]+"'/>");
    node.append("<img src='http://ipfs.io/ipfs/"+product.ipfsImageHash+"'/>");
    node.append("<div class='title'>"+product.name+"</div>");
    node.append("<div> Price: "+ displayPrice(product.price)+"</div>");
    node.append("<a href='product.html?id="+product.blockchainId+"'>Details</a>");
    if( product.buyer === "0x0000000000000000000000000000000000000000"){
        $("#product-list").append(node);
    }else{
      $("#product-purchased").append(node);
    }
}

function displayPrice(amt){
  return "&Xi;"+web3.fromWei(amt,'ether');
}


window.addEventListener('load', function() {
 // Checking if Web3 has been injected by the browser (Mist/MetaMask)
 if (typeof web3 !== 'undefined') {
  console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
  // Use Mist/MetaMask's provider
  window.web3 = new Web3(web3.currentProvider);
 } else {
  console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
 }

 App.start();
});