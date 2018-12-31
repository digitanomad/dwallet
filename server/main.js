import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Web3 from 'web3';
//meteor npm install web3@0.20.1

Meteor.startup(() => {
  // code to run on server at startup
});

var DEBUG = 1;

Wallets = new Mongo.Collection('wallets');
Transactions = new Mongo.Collection('transactions');

Meteor.publish('wallets', function () {
    return Wallets.find({
        user: this.userId
    });
});

Meteor.publish('transactions', function () {
    return Transactions.find({
        user: this.userId
    });
});

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
  if (DEBUG) console.log('web3');
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  if (DEBUG) console.log('HttpProvider!');
}

Meteor.methods({
  'SubmitRegister': function(yourInfor) {    
      if (DEBUG) console.log("SubmitRegister ");

      // Trim Helper
      var trimInput = function(val) {
          return val.replace(/^\s*|\s*$/g, "");
      }

      var email = trimInput(yourInfor.youremail);
      var pwd = yourInfor.yourpass;
      var pwd2 = yourInfor.reyourpass;

      if (DEBUG) {
          console.log("email: " + email);
          console.log("pwd: " + pwd);
          console.log("pwd2: " + pwd2);
      }

      // Check password is at least 6 chars long
      var isValidPassword = function(pwd, pwd2) {
          if (pwd === pwd2) {
              if (DEBUG) console.log("Passwords match ");
              return pwd.length >= 6 ? true : false;
          } else {
              if (DEBUG) console.log("Passwords don’t match ");
              return; 
          }
      }

      // If validation passes, supply the appropriate fields to the
      // Accounts.createUser function.
      if (isValidPassword(yourInfor.yourpass, yourInfor.reyourpass)) {
          Accounts.createUser({
              username: yourInfor.yourname,
              email: yourInfor.youremail,
              password: yourInfor.yourpass
          });
          return true;
      }

      return false;
  },
  'SubmitLogin': function (yourInfor) {
      
      var user = Meteor.users.findOne({
          'emails.address': yourInfor.youremail
      });

      if (DEBUG) console.log("user: "+ user);
      var password = yourInfor.newyourpass;
      var result = Accounts._checkPassword(user, password);

      if (result.error) {
          return result.error;
        } else {
          return true;
        }
  },
  'addAddress' : function(walletAttributes) {
      var newAccount = web3.personal.newAccount(walletAttributes.yourpasswd);
      var userId = this.userId;
      var currentTime = new Date();
      var result = {
          address: newAccount,
          key: walletAttributes.yourpasswd,
          user: userId,
          name: walletAttributes.yourname,
          createAt:  currentTime
      };

      if (DEBUG) {
          console.log('userId: ' + result);
          console.log('newAccount: ' + newAccount);
          console.log('key       : ' + walletAttributes.yourpasswd);
          console.log('createAt  : ' + currentTime);
      }

      Wallets.insert(result);

      return true;
  },
  'checkBalance': function (address) {
      if (DEBUG) console.log('checkBalance : ' + address );

      walletAttributes = {};
      walletAttributes.address = address;
      walletAttributes.user = Meteor.userId();

      var balance = parseFloat(web3.fromWei(web3.eth.getBalance(address),"ether"));
      if (DEBUG) console.log("balance : " + balance);

      Wallets.update({
          address: walletAttributes.address,
          user: walletAttributes.user
      }, {
          $set: {
              balance: balance
          }
      });

      return balance;
  },
  'checkTXs' : function (accAddress) {
      // var txs = client.getTransactionsSync(address);
      // var txs = 

      if (DEBUG) console.log("checkTXs: ");

      var list = web3.eth.accounts;
      var endBlockNumber = web3.eth.blockNumber;
      var startBlockNumber = endBlockNumber - 10;
      var total = 0;

      if (DEBUG) console.log("currentBlock: " + endBlockNumber);

      //var n = eth.blocknumber;
      var txs = [];
      var arraytxs = [];
      // function a(accAddress, startBlockNumber, endBlockNumber) {
      // You can do a NULL check for the start/end blockNumber
      
      if (DEBUG) console.log("Searching for transactions to/from account \"" + accAddress + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);
      
        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
          var block = web3.eth.getBlock(i, true);
      
          if (block != null && block.transactions != null) {
            block.transactions.forEach( function(e) {
              if (accAddress == "*" || accAddress == e.from || accAddress == e.to) {
                if (DEBUG) {
                  console.log("  tx hash          : " + e.hash + "\n"
                  + "   nonce           : " + e.nonce + "\n"
                  + "   blockHash       : " + e.blockHash + "\n"
                  + "   blockNumber     : " + e.blockNumber + "\n"
                  + "   transactionIndex: " + e.transactionIndex + "\n"
                  + "   from            : " + e.from + "\n" 
                  + "   to              : " + e.to + "\n"
                  + "   value           : " + e.value + "\n"
                  + "   gasPrice        : " + e.gasPrice + "\n"
                  + "   gas             : " + e.gas + "\n"
                  + "   input           : " + e.input);
                }
                arraytxs.push(e);
              }
            });
          }
        }
      

      var txs = arraytxs.toString();

      if (DEBUG) console.log("txs: " + txs);

      Transactions.upsert({
          address: walletAttributes.address,
          user: walletAttributes.user
      }, {
          $set: {
              txs: txs
          }
      });
  },
  'sendCoin' : function (infor) {
    var privateKey = Wallets.findOne({address: infor.fromaddress}).key;
    var coinAmount = web3.toWei(infor.coinAmount,"ether");

    if (DEBUG) console.log("privateKey: " + privateKey);

    if (web3.personal.unlockAccount(infor.fromaddress,privateKey)) {
      var result = web3.eth.sendTransaction({from: infor.fromaddress, to:infor.toaddress, value:coinAmount});
      
      if (!result)
          console.log('Transaction is sent Successful!: ('+result+')');
      else
          console.log(result);
    }
  }
});