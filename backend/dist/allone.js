"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const xrpl_accountlib_1 = require("xrpl-accountlib");
const xrpl_client_1 = require("xrpl-client");
const verify_xrpl_signature_1 = require("verify-xrpl-signature");
const client = new xrpl_client_1.XrplClient("wss://xls20-sandbox.rippletest.net:51233");
const unified = "https://bafybeihcxgv6sscjmipq5rvu6vl2eqfwbvgma3mnybw5mq6bglhdobb.ipfs.nftstorage.link/"; // should change everytime the nft mint
const Uri = Buffer.from(unified).toString("hex");
//this secret key should be static. Do not change it 
const Pass = "ssvsjzkWcrjzmN2bEmQvMSvceNAUt"; // Issuer secret key
const account = xrpl_accountlib_1.derive.familySeed(Pass);
const buyer = "shMAR5RKyREkSwLNJLLk8KS7JzLZo"; //buyer  secret key -- should change everytime 
const wallet = xrpl_accountlib_1.derive.familySeed(buyer);
// don't forget to ensure that buyer secret should only stored in local database until transactions completed.
//========== Getting payment from buyer======================//
const payment = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield client.send({
        command: "account_info",
        account: wallet.address,
        strict: true,
    });
    const { id, signedTransaction } = (0, xrpl_accountlib_1.sign)(// transferring payment to issuer address
    {
        TransactionType: "Payment",
        Account: wallet.address,
        Destination: account.address,
        Amount: '100000000',
        Sequence: data.account_data.Sequence,
        Fee: String(12)
    }, wallet //this is signing wallet
    );
    console.log("id: ", id); //should match with transaction Hash
    console.log("signedTransaction: ", signedTransaction);
    const verifyResult = (0, verify_xrpl_signature_1.verifySignature)(signedTransaction);
    console.log("Verified: ", verifyResult);
    const result = yield client.send({
        command: "submit",
        tx_blob: signedTransaction,
    });
    console.log("Result: ", result);
    if (result.engine_result === "tesSUCCESS") { //checking if transaction stored on blockchain
        console.log("it passed");
        setTimeout(() => {
            main();
        }, 5000);
    }
    else {
        console.log("ERROR: payment doesn't pass. Please try again");
    }
});
payment();
// ======== Giving authorisation to other wallet address for minting================ // 
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = yield client.send({
        id: 1,
        command: "account_info",
        account: account.address,
        strict: true,
    });
    const payload = {
        TransactionType: "AccountSet",
        Account: account.address,
        Fee: "12",
        "Sequence": (_a = data.account_data) === null || _a === void 0 ? void 0 : _a.Sequence,
        SetFlag: 10,
        "NFTokenMinter": wallet.address, //buyers address
    };
    const { signedTransaction } = (0, xrpl_accountlib_1.sign)(payload, account);
    const result = (0, verify_xrpl_signature_1.verifySignature)(signedTransaction);
    console.log("Result1: ", result);
    const Submit = yield client.send({
        command: "submit",
        tx_blob: signedTransaction,
    });
    console.log("Submit1", Submit);
    if (Submit.engine_result === "tesSUCCESS") {
        console.log("it passed");
        setTimeout(() => {
            mint();
        }, 5000);
    }
    else {
        console.log("ERROR: authorisation is still haven't approved");
    }
});
//======== minting from minter's wallet================ //   
const mint = () => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const data2 = yield client.send({
        id: 1,
        command: "account_info",
        account: wallet.address,
        strict: true,
    });
    const { signedTransaction } = (0, xrpl_accountlib_1.sign)({
        TransactionType: "NFTokenMint",
        Account: wallet.address,
        Issuer: account.address,
        TransferFee: 3140,
        NFTokenTaxon: 1,
        Flags: 8,
        Sequence: (_b = data2.account_data) === null || _b === void 0 ? void 0 : _b.Sequence,
        Fee: "10",
        URI: Uri, //stated in the beginning 
    }, wallet);
    const Submit = yield client.send({
        command: "submit",
        tx_blob: signedTransaction,
    });
    console.log("Submit2: ", Submit);
    const Result = (0, verify_xrpl_signature_1.verifySignature)(signedTransaction);
    console.log("Result2:", Result);
    if (Submit.engine_result === "tesSUCCESS") {
        console.log("it passed");
        setTimeout(() => {
            change();
        }, 5000);
    }
    else {
        console.log("ERROR: minting process hasn't done");
    }
});
//======== changing minting authorisation to our other wallet================ //      
const change = () => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const data = yield client.send({
        id: 1,
        command: "account_info",
        account: account.address,
        strict: true,
    });
    // console.log("Data1: ",data);
    const Permission = {
        TransactionType: "AccountSet",
        Account: account.address,
        Fee: "12",
        "Sequence": (_c = data.account_data) === null || _c === void 0 ? void 0 : _c.Sequence,
        SetFlag: 10,
        "NFTokenMinter": "rE7e3ZnojoTHsUT8eY8YPFjep6SGzLgUPm", //other trusted account address
    };
    const { signedTransaction } = (0, xrpl_accountlib_1.sign)(Permission, account);
    const Submit = yield client.send({
        command: "submit",
        tx_blob: signedTransaction,
    });
    console.log("Submit3", Submit);
    const Result = (0, verify_xrpl_signature_1.verifySignature)(signedTransaction);
    console.log("Result3: ", Result);
});
