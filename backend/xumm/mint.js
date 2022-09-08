const {XummSdk} = require('xumm-sdk')
const {TxData} = require ('xrpl-txdata')


const Sdk    = new XummSdk('98bb5a6f-d55b-468d-8bdc-278467744bb7', 'bf46b760-6d2a-4235-8955-a19e1c9b4062');
const verify  = new TxData()

// const message = "ipfs://bafkreicjedfrzckhst2lplf64bbdllk2xdtazk6hh45lcib4x3hvsja37m" ;
// const Uri= Buffer.from(message).toString("hex");
// console.log(Uri);

const main = async() => {
    const payload = {
        TransactionType: "NFTokenMint",
        TransferFee: 1000,
        // Issuer: "rHCMcNp2JYyhtHqKRjnSynSxJboU6XQHjZ",
        NFTokenTaxon: 5,
        Flags: 8,
        Fee: "10",
        URI:"697066733a2f2f6261666b726569636a656466727a636b687374326c706c6636346262646c6c6b32786474617a6b36686834356c6369623478336876736a6133376d" ,   
    }

    const subscription = await Sdk.payload.createAndSubscribe(payload, event => {
        console.log("New payload event",event.data);

        if(Object.keys(event.data).indexOf('signed') > -1)
        {
            return event.data;
        }
    })
    console.log("Subscription",subscription.created.next.always);
    console.log("Pushed", subscription.created.pushed ? "Yes" : "No");

    const resolveData = await subscription.resolved
    if(resolveData.signed == false)
    {
        console.log("the transaction was Rejeted!!!");
    }
    else
    {
        console.log("Horray...The transaction is passed through!!!")
        const result = await Sdk.payload.get(resolveData.payload_uuidv4)
        const VerifiedResult = await verify.getOne(result.application.txid)
        console.log("On ledger Balance: ",VerifiedResult.balanceChanges);
        console.log("Account :",result.response.signer)
    }
};
main();
