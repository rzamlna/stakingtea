let web3;
let userAddress;
let stakingContract;

const TEA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public/";
const stakingContractAddress = "0x4F580f84A3079247A5fC8c874BeA651654313dc6";

const stakingABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "Staked",
        "type": "event"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" }
        ],
        "name": "getStakedAmount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" }
        ],
        "name": "getReward",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stake",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "stakes",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalStaked",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "unstake",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        userAddress = (await web3.eth.getAccounts())[0];

        document.getElementById("connectWalletButton").style.display = 'none';
        document.getElementById("walletInfo").style.display = 'block';
        document.getElementById("walletAddress").innerText = `Address: ${userAddress}`;

        displayBalance();
        initStaking();
        simulateReward();
    } else {
        alert("Please install Metamask!");
    }
}

async function displayBalance() {
    const balance = await web3.eth.getBalance(userAddress);
    const balanceInETH = web3.utils.fromWei(balance, "ether");
    document.getElementById("balance").innerText = balanceInETH;
}

async function initStaking() {
    stakingContract = new web3.eth.Contract(stakingABI, stakingContractAddress);
    document.getElementById("stakingSection").style.display = 'block';
}

async function stakeTokens() {
    const amount = document.getElementById("stakeAmount").value;
    const amountWei = web3.utils.toWei(amount, "ether");

    try {
        if (parseFloat(amount) <= 0) {
            alert("Jumlah stake harus lebih dari 0.");
            return;
        }

        const staking = await stakingContract.methods.stake().send({
            from: userAddress,
            value: amountWei
        });

        if (staking.status) {
            alert("Stake berhasil!");
        } else {
            alert("Stake gagal. Periksa transaksi Anda.");
        }

        simulateReward();
        displayBalance();
    } catch (error) {
        console.error("Staking gagal:", error);
        alert("Staking gagal. Periksa transaksi Anda.");
    }
}

async function unstakeTokens() {
    const amount = document.getElementById("unstakeAmount").value;
    const amountWei = web3.utils.toWei(amount, "ether");

    try {
        if (parseFloat(amount) <= 0) {
            alert("Jumlah unstake harus lebih dari 0.");
            return;
        }

        const stakedAmount = await stakingContract.methods.stakes(userAddress).call();
        if (parseFloat(amountWei) > parseFloat(stakedAmount)) {
            alert("Jumlah unstake melebihi jumlah yang sudah distake.");
            return;
        }

        await stakingContract.methods.unstake(amountWei).send({ from: userAddress });
        alert("Unstake berhasil!");

        simulateReward();
        displayBalance();
    } catch (error) {
        console.error("Unstake gagal:", error);
        alert("Unstake gagal. Periksa transaksi Anda.");
    }
}

async function claimRewards() {
    try {
        await stakingContract.methods.withdraw().send({ from: userAddress });
        alert("Reward berhasil diklaim!");

        simulateReward();
        displayBalance();
    } catch (error) {
        console.error("Gagal klaim reward:", error);
        alert("Klaim reward gagal.");
    }
}

// Ambil reward asli dari kontrak
async function simulateReward() {
    if (!stakingContract || !userAddress) return;

    try {
        const rewardWei = await stakingContract.methods.getReward(userAddress).call();
        const reward = web3.utils.fromWei(rewardWei, "ether");
        document.getElementById("pendingReward").innerText = parseFloat(reward).toFixed(4);
    } catch (error) {
        console.error("Gagal ambil reward:", error);
        document.getElementById("pendingReward").innerText = "Error";
    }
}
