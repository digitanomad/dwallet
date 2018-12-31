import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var DEBUG = 1;

Wallets = new Mongo.Collection('wallets');
Transactions = new Mongo.Collection('transactions');

Template.wallets.onCreated(function helloOnCreated() {
  Meteor.subscribe('wallets');
  Meteor.subscribe('transactions');
});

Template.wallets.onRendered(function () {
});

Template.login.events({
  'click #SubmitRegister'(event, instance) {
    event.preventDefault();
    var youremail = $('#youremail').val();
    var yourname = $('#yourname').val();
    var yourpass = $('#yourpass').val();
    var reyourpass = $('#reyourpass').val();

    yourInfor = {
      youremail: youremail,
      yourname: yourname,
      yourpass: yourpass,
      reyourpass: reyourpass
    };

    if (DEBUG) {
      console.log("youremail : " + youremail);
      console.log("yourname : " + yourname);
      console.log("yourpass : " + yourpass);
      console.log("reyourpass : " + reyourpass);
    }

    Meteor.call('SubmitRegister', yourInfor, function (error, result) {
      if (error) {
        if (DEBUG) {
          console.log(error);
          console.log('error !');
        }
      } else {
        if (DEBUG) {
          console.log('success !');
        }
        alert("User success..!!");
      }
    });
  },
  'click #SubmitLogin'(event, instance) {
    var newyouremail = $('#newyouremail').val();
    var newyourpass = $('#newyourpass').val();

    yourInfor = {
      newyouremail: newyouremail,
      newyourpass: newyourpass,
    };

    if (DEBUG) {
      console.log("youremail : " + newyouremail);
      console.log("newyourpass : " + newyourpass);
    }

    // Meteor.loginWithPassword(newyouremail, newyourpass);

    Meteor.loginWithPassword(newyouremail, newyourpass, function (error) {
      if (error) {
        if (DEBUG) console.log(error);
        alert("User not found..!!");
      }
      else {
        if (DEBUG) console.log("Please");
      }
    });

  }
});

Template.wallets.helpers({
  transactions() {
    if (Session.get('viewAddress')) {
      return Transactions.findOne({
        _id: Session.get('viewAddress')
      });
    } else {
      return false;
    }
  },
  wallets() {
    return Wallets.find({});
  },
  wallet() {
    if (Session.get('viewAddress') && Session.get('isForm')) {
      if (DEBUG) console.log("viewAddress");
      var returnVal;

      if (Wallets.findOne({ address: Session.get('viewAddress') })) {
        if (DEBUG) console.log("wallet");
        returnVal = Wallets.findOne({ address: Session.get('viewAddress') });
      }

      if (DEBUG) console.log('isForm true');
      return returnVal;

    } else {
      if (DEBUG) console.log("wallet else");
      return false;
    }
  },

});

Template.wallets.events({
  'click #addAddress'(event, instance) {
    // TODO
    var walletName = window.prompt('Input Wallet Name!', 'Wallet Name');
    var walletPass = window.prompt('Input Wallet Password!', 'Wallet Password');
    var user = Meteor.users.findOne(Meteor.userId());

    if (DEBUG) {
      console.log("user : " + user);
    }

    wallet = {
      yourname: walletName,
      yourpasswd: walletPass
    };

    if (user) {
      Meteor.call('addAddress', wallet, function (error, result) {
        if (error) {
          if (DEBUG) console.log(error);
          alert('error !');
        } else {
          alert('success !');
        }
      });
    }


  },
  'click .logout': function (event) {
    event.preventDefault();
    Meteor.logout();
    Session.set('isForm', false);
  },
  "click a[name='checkBalance']"(event, instance) {

    var address = $(event.currentTarget).attr('value');
    var addressKey = $(event.currentTarget).attr('keyvalue');

    if (DEBUG) {
      console.log("value: " + address);
      console.log("keyvalue: " + addressKey);
    }

    Session.set('viewAddress', address);
    Session.set('viewAddressKey', addressKey);

    if (DEBUG) console.log('isForm true');
    Session.set('isForm', true);

    Meteor.call('checkBalance', address, function (error, result) {
      if (error) {
        if (DEBUG) {
          console.log(error);
          console.log('error !');
        }
      } else {
        if (DEBUG) console.log('checkBalance success !');
      }
    });

    // Meteor.call('checkTXs', address, function (error, result) {
    //   if (error) {
    //     if (DEBUG) {
    //       console.log(error);
    //       console.log('error !');
    //     }
    //   } else {
    //     if (DEBUG) console.log('checkTXs success !');
    //   }
    // });

    $('#qrcode').empty();
    $('#qrcode').qrcode({
      size: 150,
      text: 'bitcoin:' + address
    });
  },
  "click #sendCoin"(event, instance) {
    var toaddress = $('#toAddress').val();
    var fromaddress = Session.get('viewAddress');
    var coinAmount = $('#coinAmount').val();

    if (DEBUG) {
      console.log('address: ' + toaddress);
      console.log('fromaddress: ' + fromaddress);
      console.log('coinAmount: ' + coinAmount);
    }

    var info = {
      toaddress: toaddress,
      fromaddress: fromaddress,
      coinAmount: coinAmount
    }

    Meteor.call('sendCoin', info, function (error, result) {
      if (error) {
        if (DEBUG) {
          console.log(error);
          console.log('error !');
        }
      } else {
        if (DEBUG) console.log('sendETC success !');
      }
    });

  }
});