const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function getContract() {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('appUser');
    if (!identity) {
        throw new Error('An identity for the user "appUser" does not exist in the wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('supplychain');
    return contract;
}

app.post('/createAsset', async (req, res) => {
    try {
        const { id, manufacturer } = req.body;
        const contract = await getContract();
        await contract.submitTransaction('CreateAsset', id, manufacturer);
        res.status(200).send('Asset created');
    } catch (error) {
        res.status(500).send(`Failed to create asset: ${error}`);
    }
});

app.post('/transferAsset', async (req, res) => {
    try {
        const { id, newOwner } = req.body;
        const contract = await getContract();
        await contract.submitTransaction('TransferAsset', id, newOwner);
        res.status(200).send('Asset transferred');
    } catch (error) {
        res.status(500).send(`Failed to transfer asset: ${error}`);
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
