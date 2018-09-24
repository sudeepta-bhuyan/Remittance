require("file-loader?name=../index.html!../index.html");

const Web3 = require("web3");
const Promise = require("bluebird");
const truffleContract = require("truffle-contract");
const $ = require("jquery");

const remittanceJson = require('../../build/contracts/Remittance.json');

if (typeof web3 !== 'undefined') {
    window.web3 = new Web3(web3.currentProvider);
} else {
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545')); 
}

Promise.promisifyAll(web3.eth, { suffix: "Promise" });
Promise.promisifyAll(web3.version, { suffix: "Promise" });

const Remittance = truffleContract(remittanceJson);
Remittance.setProvider(web3.currentProvider);

window.addEventListener('load', function(){
    return web3.eth.getAccountsPromise()
        .then(accounts => {
            if (accounts.length <= 2) {
                throw new Error("Two accounts needed for this demo: one for sender and one for exchange");
            }
            window.senderAccount = accounts[0];
            window.exchangeAccount = accounts[1];
            console.log("Sender account: ", window.senderAccount);
            console.log("Exchange account: ", window.exchangeAccount);
            //Just for this demo
            $("input[name='exchange']").val(window.exchangeAccount);
            
            return web3.version.getNetworkPromise();
        })
        .then(network =>{
            console.log("Network: ", network.toString(10));
            return Remittance.deployed();
        })
        .then(() => $("#submit").click(createRemittance))
        .catch(console.error);
});

const createRemittance = function() {
    let deployed;
    return Remittance.deployed()
        .then(_deployed => {
            deployed = _deployed;
            return _deployed.createRemittance.call(
                $("input[name='exchange']").val(),
                web3.fromAscii(
                    web3.sha3(
                        $("input[name='exch_otp']").val() + $("input[name='receiver_otp']").val()
                    )
                ),
                {from: window.senderAccount, value: $("input[name='amount']").val()}
            );
        })
        .then(success => {
            if (!success) {
                throw new Error("The transaction will fail anyway, not sending");
            }

            // let passwordhash = web3.sha3($("input[name='exch_otp']").val() + $("input[name='receiver_otp']").val()); 
            // console.log("password: " + passwordhash);
            // console.log("password fromAscii: " + web3.fromAscii(passwordhash));

            return deployed.createRemittance.sendTransaction(
                $("input[name='exchange']").val(),
                web3.sha3(
                        $("input[name='exch_otp']").val() + $("input[name='receiver_otp']").val()
                ),
                {from: window.senderAccount, value: $("input[name='amount']").val()}
            );
        })
        .then(txHash => {
            $("#sender-status").html("Transaction on the way " + txHash);

            const tryAgain = () => web3.eth.getTransactionReceiptPromise(txHash)
                .then(receipt => receipt !== null ?
                    receipt :
                    // Let's hope we don't hit any max call stack depth
                    Promise.delay(1000).then(tryAgain));
            return tryAgain();
        })
        .then(receipt => {
            if (parseInt(receipt.status) != 1) {
                console.error("Wrong status");
                console.error(receipt);
                $("#sender-status").html("There was an error in the tx execution, status not 1");
            } else if (receipt.logs.length == 0) {
                console.error("Empty logs");
                console.error(receipt);
                $("#sender-status").html("There was an error in the tx execution");
            } else {
                // Format the event nicely.
                console.log(deployed.RemittanceCreated().formatter(receipt.logs[0]).args);
                $("#sender-status").html("Transfer executed");
                $('#submit').prop('disabled', true);
                $("#verify").click(solvePuzzle);
                $('#verify').prop('disabled', false);
            }
        })
        .catch(e => {
            $("#sender-status").html(e.toString());
            console.error(e);
        });
};

const solvePuzzle = function() {
    let deployed;
    return Remittance.deployed()
        .then(_deployed => {
            deployed = _deployed;
            return _deployed.solvePuzzle.call(
                $("input[name='verify_exch_otp']").val() + $("input[name='verify_receiver_otp']").val(),
                {from: window.exchangeAccount}
            );
        })
        .then(success => {
            if (!success) {
                throw new Error("The transaction will fail anyway, not sending");
            }

            // let passwordstring = $("input[name='verify_exch_otp']").val() + $("input[name='verify_receiver_otp']").val();
            // console.log("solve: " + passwordstring);
            // console.log("solve hash: " + web3.sha3(passwordstring));

            return deployed.solvePuzzle.sendTransaction(
                $("input[name='verify_exch_otp']").val() + $("input[name='verify_receiver_otp']").val(),
                {from: window.exchangeAccount}
            );
        })
        .then(txHash => {
            $("#exchange-status").html("Transaction on the way " + txHash);

            const tryAgain = () => web3.eth.getTransactionReceiptPromise(txHash)
                .then(receipt => receipt !== null ?
                    receipt :
                    // Let's hope we don't hit any max call stack depth
                    Promise.delay(1000).then(tryAgain));
            return tryAgain();
        })
        .then(receipt => {
            if (parseInt(receipt.status) != 1) {
                console.error("Wrong status");
                console.error(receipt);
                $("#exchange-status").html("There was an error in the tx execution, status not 1");
            } else if (receipt.logs.length == 0) {
                console.error("Empty logs");
                console.error(receipt);
                $("#exchange-status").html("There was an error in the tx execution");
            } else {
                // Format the event nicely.
                console.log(deployed.PuzzleSolved().formatter(receipt.logs[0]).args);
                $("#exchange-status").html("Transfer executed, Puzzle solved");
                $('#verify').prop('disabled', true);
                $("#withdraw").click(withdrawFund);
                $('#withdraw').prop('disabled', false);
            }
        })
        .catch(e => {
            $("#exchange-status").html(e.toString());
            console.error(e);
        });
};

const withdrawFund = function () {
    let deployed;
    return Remittance.deployed()
        .then(_deployed => {
            deployed = _deployed;
            return _deployed.withdrawFund.call({from: window.exchangeAccount});
        })
        .then(success => {
            if (!success) {
                throw new Error("The transaction will fail anyway, not sending");
            }

            return deployed.withdrawFund.sendTransaction({from: window.exchangeAccount});
        })
        .then(txHash => {
            $("#withdraw-status").html("Transaction on the way " + txHash);

            const tryAgain = () => web3.eth.getTransactionReceiptPromise(txHash)
                .then(receipt => receipt !== null ?
                    receipt :
                    // Let's hope we don't hit any max call stack depth
                    Promise.delay(1000).then(tryAgain));
            return tryAgain();
        })
        .then(receipt => {
            if (parseInt(receipt.status) != 1) {
                console.error("Wrong status");
                console.error(receipt);
                $("#withdraw-status").html("There was an error in the tx execution, status not 1");
            } else if (receipt.logs.length == 0) {
                console.error("Empty logs");
                console.error(receipt);
                $("#withdraw-status").html("There was an error in the tx execution");
            } else {
                // Format the event nicely.
                console.log(deployed.FundWithdrawn().formatter(receipt.logs[0]).args);
                $("#withdraw-status").html("Fund withdrawn");
                $('#withdraw').prop('disabled', true);
                $('#submit').prop('disabled', false);
            }
        })
        .catch(e => {
            $("#withdraw-status").html(e.toString());
            console.error(e);
        });
};