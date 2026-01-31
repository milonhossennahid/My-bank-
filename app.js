// আপনার দেওয়া Firebase কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyC46mnAjWV65Ty4KxB903s1O3l92z16SRk",
  authDomain: "callsmspanel.firebaseapp.com",
  databaseURL: "https://callsmspanel-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "callsmspanel",
  storageBucket: "callsmspanel.firebasestorage.app",
  messagingSenderId: "110135980756",
  appId: "1:110135980756:web:5b70189d71e2fa0c9d8141"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Auth Functions ---
function showSignup() {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('signupBox').classList.remove('hidden');
}

function hideSignup() {
    document.getElementById('signupBox').classList.add('hidden');
    document.getElementById('loginBox').classList.remove('hidden');
}

// লগইন ফাংশন
function login() {
    let mobile = document.getElementById('loginUsername').value.trim();
    let password = document.getElementById('loginPassword').value;
    let errorEl = document.getElementById('loginError');
    
    if(!mobile || !password) {
        alert("মোবাইল নম্বর ও পাসওয়ার্ড দিন");
        return;
    }

    db.ref("users/" + mobile).once("value").then(snap => {
        if (!snap.exists()) {
            errorEl.innerText = "এই নম্বরে কোনো অ্যাকাউন্ট নেই!";
            errorEl.classList.remove('hidden');
            return;
        }
        
        let user = snap.val();
        if (user.password !== password) {
            errorEl.innerText = "ভুল পাসওয়ার্ড!";
            errorEl.classList.remove('hidden');
            return;
        }
        
        if (user.status === "blocked") {
            alert("আপনার অ্যাকাউন্টটি অ্যাডমিন দ্বারা ব্লক করা হয়েছে।");
            return;
        }
        
        // লগইন সফল হলে ড্যাশবোর্ড দেখান
        showDashboard(mobile); 
    }).catch(err => {
        console.error(err);
        alert("সার্ভার সমস্যা! ডাটাবেজ রুলস চেক করুন।");
    });
}

// রেজিস্ট্রেশন ফাংশন
function signup() {
    let name = document.getElementById('signupName').value.trim();
    let mobile = document.getElementById('signupMobile').value.trim();
    let pass = document.getElementById('signupPassword').value;

    if(!name || !mobile || !pass) return alert("সবগুলো ঘর পূরণ করুন");

    db.ref("users/" + mobile).set({
        name: name,
        mobile: mobile,
        password: pass,
        balance: 0,
        status: "active", 
        reg_date: Date.now()
    }).then(() => {
        alert("অ্যাকাউন্ট তৈরি সফল হয়েছে! এখন লগইন করুন।");
        hideSignup();
    }).catch(err => {
        alert("ভুল হয়েছে: " + err.message);
    });
}

// --- ড্যাশবোর্ড আপডেট ও লাইভ ব্যালেন্স ---
function showDashboard(mobile) {
    document.getElementById('mainPanel').classList.add('hidden');
    document.getElementById('userPanel').classList.remove('hidden');

    // ডাটাবেজ থেকে লাইভ ডাটা শোনা (Listening)
    db.ref("users/" + mobile).on("value", snap => {
        let user = snap.val();
        window.currentUser = user; // গ্লোবাল ভেরিয়েবল

        document.getElementById('upName').innerText = user.name;
        document.getElementById('upMobile').innerText = "AC: " + user.mobile;
        document.getElementById('upBalance').innerText = user.balance.toFixed(2);
        document.getElementById('userAvatar').innerText = user.name[0];
        document.getElementById('cardHolder').innerText = user.name;
        document.getElementById('cardNum').innerText = "**** **** **** " + user.mobile.slice(-4);
    });

    loadHistory(mobile);
}

function userLogout() {
    location.reload(); // পেজ রিফ্রেশ করে লগআউট
}

// --- ফান্ড অ্যাড রিকোয়েস্ট ---
function submitDeposit() {
    let amt = parseFloat(document.getElementById('depositAmt').value);
    let txn = document.getElementById('depositTxn').value.trim();
    
    if(!amt || !txn) return alert("টাকা এবং ট্রানজেকশন আইডি দিন");

    let reqId = "DEP" + Date.now();
    db.ref("addfund_requests/" + reqId).set({
        user: currentUser.mobile,
        name: currentUser.name,
        amount: amt,
        txnid: txn,
        status: "pending",
        time: Date.now()
    }).then(() => {
        alert("অনুরোধ পাঠানো হয়েছে! সাপোর্ট টিম (২/৩) ঘন্টা মধ্যে চেক করে আপনার ব্যালেন্স যোগ করে দিবে চিন্তা করবেন না।");
        closeModal();
    });
}

// হিস্ট্রি লোড করা
function loadHistory(mobile) {
    let box = document.getElementById('liveHistory');
    db.ref("addfund_requests").orderByChild("user").equalTo(mobile).on("value", snap => {
        box.innerHTML = '<h3 class="font-bold text-slate-800 text-sm mb-2">Recent Activity</h3>';
        if(!snap.exists()) {
            box.innerHTML += '<p class="text-xs text-gray-400">কোনো লেনদেন পাওয়া যায়নি।</p>';
            return;
        }
        
        let requests = [];
        snap.forEach(child => { requests.push(child.val()); });
        requests.reverse(); // নতুনগুলো উপরে দেখাবে

        requests.forEach(data => {
            let statusColor = data.status === "pending" ? "text-orange-500" : (data.status === "approved" ? "text-green-500" : "text-red-500");
            box.innerHTML += `
                <div class="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs"><i class="fas fa-arrow-down"></i></div>
                        <div>
                            <p class="text-xs font-bold">Add Money</p>
                            <p class="text-[9px] text-slate-400">${new Date(data.time).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-bold text-slate-800">৳${data.amount}</p>
                        <p class="text-[9px] font-bold ${statusColor} uppercase">${data.status}</p>
                    </div>
                </div>
            `;
        });
    });
}

// মোডাল কন্ট্রোল
function showDepositModal() {
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('depositModal').classList.remove('hidden');
}
function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}
