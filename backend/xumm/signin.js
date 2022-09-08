const {XummSdk} = require('xumm-sdk')
const {TxData} = require ('xrpl-txdata')


const Sdk    = new XummSdk('98bb5a6f-d55b-468d-8bdc-278467744bb7', 'bf46b760-6d2a-4235-8955-a19e1c9b4062');
const verify  = new TxData()

const main = async() => {
    const payload = {
       TransactionType:"SignIn"
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
        const result = await Sdk.payload.get(resolveData.payload_uuidv4)
        // const VerifiedResult = await verify.getOne(result.application.txid)
        console.log("Account :",result.response.signer)
    }
};
main();
