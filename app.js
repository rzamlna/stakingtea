let web3;
let userAddress;
let stakingContract;

const TEA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public/"; // Ganti dengan RPC TEA yang valid
const stakingContractAddress = "0x419C709ce36551362eF76487Bb25390e95838513";  // Alamat kontrak staking

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
        "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view", "type": "function"
    },
    {
        "inputs": [], "name": "stake", "outputs": [], "stateMutability": "payable", "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "stakes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function"
    },
    {
        "inputs": [], "name": "totalStaked", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "unstake", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function"
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
    const balanceInETH = web3.utils.fromWei(balance, "ether");  // Konversi Wei ke ETH
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
    const amountWei = web3.utils.toWei(amount, "ether");  // Konversi ke Wei

    try {
        // Pastikan jumlah yang akan disetorkan lebih besar dari 0
        if (parseFloat(amount) <= 0) {
            alert("Jumlah stake harus lebih dari 0.");
            return;
        }

        // Lakukan staking langsung dengan mentransfer ETH ke kontrak staking
        const staking = await stakingContract.methods.stake().send({
            from: userAddress,
            value: amountWei  // Mengirim ETH sebagai value
        });

        // Cek status staking
        if (staking.status) {
            alert("Stake berhasil!");
        } else {
            alert("Stake gagal. Periksa transaksi Anda.");
        }
    } catch (error) {
        console.error("Staking gagal:", error);
        alert("Staking gagal. Periksa transaksi Anda.");
    }
}

// Fungsi Unstake
async function unstakeTokens() {
    const amount = document.getElementById("unstakeAmount").value;
    const amountWei = web3.utils.toWei(amount, "ether");  // Konversi ke Wei

    try {
        // Cek apakah jumlah unstake lebih besar dari 0
        if (parseFloat(amount) <= 0) {
            alert("Jumlah unstake harus lebih dari 0.");
            return;
        }

        const stakedAmount = await stakingContract.methods.stakes(userAddress).call();
        if (parseFloat(amountWei) > parseFloat(stakedAmount)) {
            alert("Jumlah unstake melebihi jumlah yang sudah distake.");
            return;
        }

        // Lakukan unstake
        await stakingContract.methods.unstake(amountWei).send({ from: userAddress });
        alert("Unstake berhasil!");
    } catch (error) {
        console.error("Unstake gagal:", error);
        alert("Unstake gagal. Periksa transaksi Anda.");
    }
}

// Pastikan Anda sudah memiliki saldo yang cukup untuk staking dan biaya gas
async function checkBalanceAndStake() {
    const balance = await web3.eth.getBalance(userAddress);
    const balanceInETH = web3.utils.fromWei(balance, "ether");

    if (parseFloat(balanceInETH) < 0.01) {  // Misalnya, minimal 0.01 ETH untuk staking
        alert("Saldo Anda tidak cukup untuk staking.");
    } else {
        stakeTokens();  // Lanjutkan staking jika saldo cukup
    }
}
