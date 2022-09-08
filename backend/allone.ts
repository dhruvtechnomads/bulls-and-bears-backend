import { derive, sign} from "xrpl-accountlib";
import { XrplClient } from "xrpl-client";
import { verifySignature} from "verify-xrpl-signature";

const client= new XrplClient("wss://xls20-sandbox.rippletest.net:51233");

const unified = "https://bafybeihcxgv6sscjmipq5rvu6vl2eqfwbvgma3mnybw5mq6bglhdobb.ipfs.nftstorage.link/";// should change everytime the nft mint
const Uri= Buffer.from(unified).toString("hex");

//this secret key should be static. Do not change it 
const Pass = "ssvsjzkWcrjzmN2bEmQvMSvceNAUt";// Issuer secret key
const account = derive.familySeed(Pass);
  
const buyer = "shMAR5RKyREkSwLNJLLk8KS7JzLZo";//buyer  secret key -- should change everytime 
const wallet = derive.familySeed(buyer);
// don't forget to ensure that buyer secret should only stored in local database until transactions completed.

//========== Getting payment from buyer======================//
const payment = async() => {
    const data = await client.send({// for getting current Sequence number
        command : "account_info",
        account : wallet.address,
        strict : true,
    });

    const {id , signedTransaction} = sign(// transferring payment to issuer address
        {
            TransactionType: "Payment",
            Account: wallet.address,
            Destination: account.address,
            Amount: '100000000',//enter the amount in drops
            Sequence: data.account_data.Sequence,
            Fee: String(12)
        },
        wallet//this is signing wallet
    );
    console.log("id: ",id);//should match with transaction Hash
    console.log("signedTransaction: ",signedTransaction);
    const verifyResult= verifySignature(signedTransaction);
    console.log("Verified: ",verifyResult);

    const result = await client.send({//sending the data to blockchain
        command : "submit",
        tx_blob : signedTransaction,
    });
    console.log("Result: ",result);

    if(result.engine_result=== "tesSUCCESS"){//checking if transaction stored on blockchain
        console.log("it passed");
        setTimeout(() => {
            main();    
        }, 5000);
    }
    else{
        console.log("ERROR: payment doesn't pass. Please try again");
    }
};
payment();

// ======== Giving authorisation to other wallet address for minting================ // 
const main = async() => {
    const data = await client.send({
        id : 1,
        command : "account_info",
        account : account.address,
        strict : true,
    });
        
    const payload = {
        TransactionType: "AccountSet",
        Account : account.address,//issuer address
        Fee: "12",
        "Sequence": data.account_data?.Sequence,
        SetFlag: 10,// for giving authorisation to mint nft from other address
        "NFTokenMinter": wallet.address,//buyers address
    }
        
    const {signedTransaction} = sign(payload,account);
    const result = verifySignature(signedTransaction);
    console.log("Result1: ", result); 
    const Submit = await client.send({
        command: "submit",
        tx_blob: signedTransaction,
    })
    console.log("Submit1",Submit)

    if(Submit.engine_result=== "tesSUCCESS"){
        console.log("it passed");
        setTimeout(() => {
            mint();    
        }, 5000);
    }
    else{
        console.log("ERROR: authorisation is still haven't approved")
    }
      
};

//======== minting from minter's wallet================ //   
const mint = async() => {    
    const data2 = await client.send({
        id:1,
        command: "account_info",
        account : wallet.address,//buyers address
        strict : true,
    });
        
        
    const { signedTransaction} = sign({
        TransactionType: "NFTokenMint",
        Account: wallet.address,//buyers address
        Issuer: account.address,// issuer address
        TransferFee: 3140,//set royalty for each secondary sales
        NFTokenTaxon: 1,//give number for each different collection
        Flags: 8,//means transferrable
        Sequence: data2.account_data?.Sequence,
        Fee: "10",
        URI: Uri,//stated in the beginning 
    },
    wallet
    );
            
    const Submit = await client.send({
        command : "submit",
        tx_blob : signedTransaction,
    });
    console.log("Submit2: ",Submit);
            
    const Result = verifySignature(signedTransaction);
    console.log("Result2:", Result); 
    
    if(Submit.engine_result=== "tesSUCCESS"){
        console.log("it passed");
        setTimeout(() => {
            change();    
        }, 5000);
    }
    else{
        console.log("ERROR: minting process hasn't done");
    }
};

//======== changing minting authorisation to our other wallet================ //      
const change = async() =>{
    const data = await client.send({
        id : 1,
        command : "account_info",
        account : account.address,
        strict : true,
    });
    // console.log("Data1: ",data);
            
    const Permission = {
        TransactionType: "AccountSet",
        Account : account.address,
        Fee: "12",
        "Sequence": data.account_data?.Sequence,
        SetFlag: 10,
        "NFTokenMinter": "rE7e3ZnojoTHsUT8eY8YPFjep6SGzLgUPm",//other trusted account address
    }
            
    const {signedTransaction} = sign(Permission,account);
    const Submit = await client.send({
        command: "submit",
        tx_blob: signedTransaction,
    });
    console.log("Submit3",Submit)
    const Result = verifySignature(signedTransaction);
    console.log("Result3: ", Result);           
};

