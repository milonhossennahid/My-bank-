function showAdminLogin() {
  document.getElementById('adminModal').style.display='flex';
}
function hideAdminModal() {
  document.getElementById('adminModal').style.display='none';
}
function login() {
  let username = document.getElementById('loginUsername').value.trim();
  let password = document.getElementById('loginPassword').value;
  let error = document.getElementById('loginError');
  error.style.display = "none";
  if (!username || !password) {
    error.innerText = "ইউজারনেম এবং পাসওয়ার্ড দিন!";
    error.style.display = "block";
    return;
  }
  db.collection("users").doc(username).get().then(doc=>{
    if (!doc.exists) {
      error.innerText = "ইউজার খুঁজে পাওয়া যায়নি!";
      error.style.display = "block";
      return;
    }
    let userdata = doc.data();
    if (userdata.password !== password) {
      error.innerText = "পাসওয়ার্ড ভুল!";
      error.style.display = "block";
      return;
    }
    if (userdata.status !== "approved" && userdata.status !== "active") {
      error.innerText = "ইউজার অনুমোদিত হয়নি!";
      error.style.display = "block";
      return;
    }
    showUserPanel(userdata);
  }).catch(e=>{
    error.innerText = "Error: " + e.message;
    error.style.display = "block";
  });
}
function createAccount() {
  let name = document.getElementById('createName').value.trim();
  let mobile = document.getElementById('createMobile').value.trim();
  let password = document.getElementById('createPassword').value;
  let error = document.getElementById('createError');
  error.style.display = "none";
  if (!name || !mobile || !password) {
    error.innerText = "সব তথ্য দিন!";
    error.style.display = "block";
    return;
  }
  let username = mobile;
  db.collection("users").doc(username).set({
    name, mobile, username, password, balance: 0, status: "pending"
  }).then(() => {
    alert("রেজিস্ট্রেশন সফল! অনুমোদনের জন্য অপেক্ষা করুন।");
    document.getElementById('createName').value = "";
    document.getElementById('createMobile').value = "";
    document.getElementById('createPassword').value = "";
  }).catch(e=>{
    error.innerText = "Error: " + e.message;
    error.style.display = "block";
  });
}
function showUserPanel(user) {
  document.querySelector('.main-panel').style.display = 'none';
  document.getElementById('userPanel').style.display = 'block';
  document.getElementById('upName').innerText = user.name;
  document.getElementById('upMobile').innerText = user.mobile;
  document.getElementById('upBalance').innerText = user.balance + " TK";
  document.getElementById('userAvatar').innerText = user.name[0];
  document.getElementById('cardNum').innerText = maskCardNum(user.username);
  document.getElementById('cardHolder').innerText = user.name;
  document.getElementById('cardExpiry').innerText = "12/28";
}
function maskCardNum(username) {
  let s = String(username).padEnd(12, "0");
  return s.replace(/(.{4})/g, "$1 ").trim();
}
function userLogout() {
  document.getElementById('userPanel').style.display = 'none';
  document.querySelector('.main-panel').style.display = 'flex';
}
function adminLogin() {
  let username = document.getElementById('adminUsername').value.trim();
  let password = document.getElementById('adminPassword').value;
  let error = document.getElementById('adminLoginError');
  error.style.display = "none";
  if (username !== "Admin" || password !== "bank-A") {
    error.innerText = "এডমিন তথ্য ভুল!";
    error.style.display = "block";
    return;
  }
  hideAdminModal();
  document.querySelector('.main-panel').style.display = 'none';
  document.getElementById('adminPanel').style.display='block';
  loadAdminUsers();
}
function adminLogout() {
  document.getElementById('adminPanel').style.display='none';
  document.querySelector('.main-panel').style.display = 'flex';
}
function loadAdminUsers() {
  let list = document.getElementById('adminUserList');
  list.innerHTML = '';
  db.collection("users").get().then(query=>{
    let html = `<table class="user-list-table" style="width:100%;border-collapse:collapse;"><tr>
      <th>#</th><th>নাম</th><th>মোবাইল</th><th>ব্যালেন্স</th><th>স্ট্যাটাস</th><th>অপশন</th></tr>`;
    let i=1;
    query.forEach(doc=>{
      let u = doc.data();
      html += `<tr>
        <td>${i++}</td>
        <td>${u.name}</td>
        <td>${u.mobile}</td>
        <td>${u.balance||0}</td>
        <td>${u.status}</td>
        <td>
          <button onclick="approveUser('${u.username}')">Approve</button>
          <button onclick="blockUser('${u.username}')">Block</button>
        </td>
      </tr>`;
    });
    html += '</table>';
    list.innerHTML = html;
  });
}
function approveUser(uname) {
  db.collection("users").doc(uname).update({status:"active"}).then(loadAdminUsers);
}
function blockUser(uname) {
  db.collection("users").doc(uname).update({status:"blocked"}).then(loadAdminUsers);
}
function addBalance() {
  let uname = document.getElementById('balanceUser').value.trim();
  let amt = parseFloat(document.getElementById('balanceAmt').value);
  let error = document.getElementById('balanceError');
  error.style.display = "none";
  if (!uname || isNaN(amt) || amt<=0) {
    error.innerText = "ইউজার ও টাকা দিন!";
    error.style.display = "block";
    return;
  }
  db.collection("users").doc(uname).get().then(doc=>{
    if (!doc.exists) {
      error.innerText = "ইউজার খুঁজে পাওয়া যায়নি!";
      error.style.display = "block";
      return;
    }
    let bal = doc.data().balance || 0;
    db.collection("users").doc(uname).update({balance:bal+amt}).then(()=>{
      error.style.display = "none";
      document.getElementById('balanceUser').value = "";
      document.getElementById('balanceAmt').value = "";
      loadAdminUsers();
    });
  });
}
function subtractBalance() {
  let uname = document.getElementById('balanceUser').value.trim();
  let amt = parseFloat(document.getElementById('balanceAmt').value);
  let error = document.getElementById('balanceError');
  error.style.display = "none";
  if (!uname || isNaN(amt) || amt<=0) {
    error.innerText = "ইউজার ও টাকা দিন!";
    error.style.display = "block";
    return;
  }
  db.collection("users").doc(uname).get().then(doc=>{
    if (!doc.exists) {
      error.innerText = "ইউজার খুঁজে পাওয়া যায়নি!";
      error.style.display = "block";
      return;
    }
    let bal = doc.data().balance || 0;
    if (bal < amt) {
      error.innerText = "ব্যালেন্স কম!";
      error.style.display = "block";
      return;
    }
    db.collection("users").doc(uname).update({balance:bal-amt}).then(()=>{
      error.style.display = "none";
      document.getElementById('balanceUser').value = "";
      document.getElementById('balanceAmt').value = "";
      loadAdminUsers();
    });
  });
}
// User Panel: Withdraw, Bkash, Bank, Recharge
function showWithdrawModal() { hideAllModals(); document.getElementById('modalWithdraw').style.display='flex'; }
function showBkashModal() { hideAllModals(); document.getElementById('modalBkash').style.display='flex'; }
function showBankModal() { hideAllModals(); document.getElementById('modalBank').style.display='flex'; }
function showRechargeModal() { hideAllModals(); document.getElementById('modalRecharge').style.display='flex'; }
function hideModal(id) { document.getElementById(id).style.display='none'; }
function hideAllModals() {
  ['modalWithdraw','modalBkash','modalBank','modalRecharge'].forEach(id=>document.getElementById(id).style.display='none');
}
function withdrawMoney() {
  let amt = parseFloat(document.getElementById('withdrawAmt').value);
  let error = document.getElementById('withdrawError');
  error.style.display = "none";
  if (!amt || amt<=0) {
    error.innerText = "Amount দিন!";
    error.style.display = "block";
    return;
  }
  let uname = document.getElementById('upMobile').innerText;
  db.collection("users").doc(uname).get().then(doc=>{
    let bal = doc.data().balance || 0;
    if (bal < amt) {
      error.innerText = "ব্যালেন্স কম!";
      error.style.display = "block";
      return;
    }
    db.collection("users").doc(uname).update({balance:bal-amt}).then(()=>{
      hideModal('modalWithdraw');
      loadUserPanel(uname);
    });
  });
}
function bkashSend() {
  let num = document.getElementById('bkashNum').value.trim();
  let amt = parseFloat(document.getElementById('bkashAmt').value);
  let error = document.getElementById('bkashError');
  error.style.display = "none";
  if (!num || !amt || amt<=0) {
    error.innerText = "নম্বর ও Amount দিন!";
    error.style.display = "block";
    return;
  }
  alert("বিকাশ সফল (ডেমো)!");
  hideModal('modalBkash');
}
function bankSend() {
  let acc = document.getElementById('bankAcc').value.trim();
  let amt = parseFloat(document.getElementById('bankAmt').value);
  let error = document.getElementById('bankError');
  error.style.display = "none";
  if (!acc || !amt || amt<=0) {
    error.innerText = "Account এবং Amount দিন!";
    error.style.display = "block";
    return;
  }
  alert("Bank Transfer সফল (সফল)!");
  hideModal('modalBank');
}
function rechargeSend() {
  let num = document.getElementById('rechargeNum').value.trim();
  let amt = parseFloat(document.getElementById('rechargeAmt').value);
  let error = document.getElementById('rechargeError');
  error.style.display = "none";
  if (!num || !amt || amt<=0) {
    error.innerText = "নম্বর এবং Amount দিন!";
    error.style.display = "block";
    return;
  }
  alert("রিচার্জ সফল (সফল)!");
  hideModal('modalRecharge');
}
function loadUserPanel(uname) {
  db.collection("users").doc(uname).get().then(doc=>{
    if(doc.exists) showUserPanel(doc.data());
  });
}