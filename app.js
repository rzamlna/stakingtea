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
        "name": "claimReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Koneksi Wallet
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
    } else {
        alert("Please install Metamask!");
    }
}

// Tampilkan saldo ETH
async function displayBalance() {
    const balance = await web3.eth.getBalance(userAddress);
    const balanceInETH = web3.utils.fromWei(balance, "ether");
    document.getElementById("balance").innerText = balanceInETH;
}

// Inisialisasi Staking
async function initStaking() {
    stakingContract = new web3.eth.Contract(stakingABI, stakingContractAddress);
    document.getElementById("stakingSection").style.display = 'block';

    simulateReward();
}

// Fungsi Stake
async function stakeTokens() {
    const amount = document.getElementById("stakeAmount").value;
    const amountWei = web3.utils.toWei(amount, "ether");

    if (parseFloat(amount) <= 0) {
        alert("Jumlah stake harus lebih dari 0.");
        return;
    }

    try {
        const tx = await stakingContract.methods.stake().send({
            from: userAddress,
            value: amountWei
        });

        if (tx.status) {
            alert("Stake berhasil!");
            simulateReward();
        } else {
            alert("Stake gagal.");
        }
    } catch (error) {
        console.error("Staking error:", error);
        alert("Gagal melakukan stake.");
    }
}

// Fungsi Unstake
async function unstakeTokens() {
    const amount = document.getElementById("unstakeAmount").value;
    const amountWei = web3.utils.toWei(amount, "ether");

    if (parseFloat(amount) <= 0) {
        alert("Jumlah unstake harus lebih dari 0.");
        return;
    }

    try {
        const stakedAmount = await stakingContract.methods.stakes(userAddress).call();
        if (parseFloat(amountWei) > parseFloat(stakedAmount)) {
            alert("Jumlah unstake melebihi jumlah stake.");
            return;
        }

        await stakingContract.methods.unstake(amountWei).send({ from: userAddress });
        alert("Unstake berhasil!");
        simulateReward();
    } catch (error) {
        console.error("Unstake error:", error);
        alert("Gagal melakukan unstake.");
    }
}

// Fungsi Claim Reward
async function claimRewards() {
    try {
        const tx = await stakingContract.methods.claimReward().send({ from: userAddress });
        if (tx.status) {
            alert("Reward berhasil diklaim!");
            updatePendingReward(); // refresh nilai reward
        } else {
            alert("Klaim reward gagal.");
        }
    } catch (error) {
        console.error("Klaim reward error:", error);
        alert("Klaim reward gagal.");
    }
}

// Tampilkan Reward Sementara
async function updatePendingReward() {
    if (!stakingContract || !userAddress) return;

    try {
        const pending = await stakingContract.methods.getPendingReward(userAddress).call();
        const formatted = web3.utils.fromWei(pending, "ether");
        document.getElementById("pendingReward").innerText = `${formatted} WTEA`;
    } catch (error) {
        console.error("Gagal ambil pending reward:", error);
        document.getElementById("pendingReward").innerText = `Error`;
    }
}
