let STORAGE_KEY = "stock-register-v8";
let USERS_KEY = "stock-users-v1";

let data = {
  departments: { "Accounts": ["101"], "Pharmacy": ["201"], "Library": ["301"] },
  itemNames: ["Table Fan","Ceiling Fan","Tube Light","Chair","Desk","Computer"],
  department: "",
  room: "",
  items: {}
};

let users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
if (!users.admin) users.admin = { password: "admin123", role: "admin" };

let currentUser = null;

// ===== AUTH =====
function login() {
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value.trim();

  if (!u || !p) {
    document.getElementById("loginMsg").textContent = "⚠️ Username and password are required.";
    return;
  }

  if (users[u] && users[u].password === p) {
    currentUser = { ...users[u], username: u };
    document.getElementById("loginMsg").textContent = "";
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
    setupRole();
    render();
  } else {
    document.getElementById("loginMsg").textContent = "❌ Invalid username or password.";
  }
}

function logout() {
  currentUser = null;
  document.getElementById("app").style.display = "none";
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
}

function setupRole() {
  document.getElementById("currentUserLabel").textContent =
    currentUser.username + " (" + currentUser.role + ")";
  if (currentUser.role === "admin") {
    document.getElementById("adminPanel").style.display = "block";
    document.getElementById("btnExportAll").style.display = "inline-block";
    enableAdminControls(true);
  } else {
    document.getElementById("adminPanel").style.display = "none";
    document.getElementById("btnExportAll").style.display = "none";
    enableAdminControls(false);
    data.department = currentUser.department;
    data.room = currentUser.room;
  }
  save();
}

function enableAdminControls(on) {
  const ids = ["btnAddDept","btnDelDept","btnAddRoom","btnDelRoom"];
  ids.forEach(id => document.getElementById(id).style.display = on ? "inline-block" : "none");
  document.getElementById("dept").disabled = !on;
  document.getElementById("room").disabled = !on;
}

// ===== USER MGMT =====
function createDeptUser() {
  const dept = document.getElementById("deptForUser").value;
  const room = document.getElementById("roomForUser").value;
  if (!dept || !room) return alert("Select dept and room");
  const uname = dept + "-" + room;
  const pass = Math.random().toString(36).slice(-6);
  users[uname] = { password: pass, role: "dept", department: dept, room: room };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  renderUsers();
  alert("User created:\nUsername: " + uname + "\nPassword: " + pass);
}

function renderUsers() {
  const div = document.getElementById("usersList");
  div.innerHTML = Object.entries(users)
    .filter(([u,v]) => v.role==="dept")
    .map(([u,v]) => `<span class='tag'>${u} (${v.password})</span>`).join("");
}

// ===== STOCK REGISTER =====
function getKey(){ return data.department && data.room ? `${data.department}|${data.room}` : null; }
function getCurrentItems(){ const k=getKey(); return k ? (data.items[k]||[]) : []; }
function saveItems(newList){ const k=getKey(); if(!k)return; data.items[k]=newList; save(); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); render(); }
function load(){ const raw=localStorage.getItem(STORAGE_KEY); if(raw) data=JSON.parse(raw); }

function addItem(){
  const name=document.getElementById("newItemName").value.trim();
  const qty=parseInt(document.getElementById("newQty").value.trim())||0;
  if(!getKey())return alert("Select Dept & Room first!");
  if(name && !data.itemNames.includes(name)) data.itemNames.push(name);
  const list=getCurrentItems(); list.unshift({id:Date.now(),itemName:name,qty});
  saveItems(list);
  document.getElementById("newItemName").value="";
  document.getElementById("newQty").value="";
}

function removeItem(id){ saveItems(getCurrentItems().filter(it=>it.id!==id)); }
function updateItem(id,f,v){ if(f==="qty")v=parseInt(v)||0; saveItems(getCurrentItems().map(it=>it.id===id?{...it,[f]:v}:it)); }

function addOption(listName){
  if(listName==="departments"){
    const val=prompt("Enter new Department"); if(val && !data.departments[val]) data.departments[val]=[];
  } else if(listName==="rooms"){
    if(!data.department) return alert("Select a department first!");
    const val=prompt("Enter new Room No"); if(val && !data.departments[data.department].includes(val)) data.departments[data.department].push(val);
  }
  save();
}
function removeOption(list,val){
  if(list==="departments"){ if(confirm("Remove dept "+val+"?")){ delete data.departments[val]; if(data.department===val)data.department=''; } }
  else if(list==="rooms"){ data.departments[data.department]=data.departments[data.department].filter(r=>r!==val); if(data.room===val)data.room=''; }
  save();
}
function deleteSelected(list,id){ const sel=document.getElementById(id); if(sel.value) removeOption(list,sel.value); }

function render(){
  // Dept & room
  const deptSel=document.getElementById("dept");
  deptSel.innerHTML="<option value=''>-- Select --</option>"+Object.keys(data.departments).map(d=>`<option ${d===data.department?"selected":""}>${d}</option>`).join("");
  const roomSel=document.getElementById("room");
  let rooms=data.department?(data.departments[data.department]||[]):[];
  roomSel.innerHTML="<option value=''>-- Select --</option>"+rooms.map(r=>`<option ${r===data.room?"selected":""}>${r}</option>`).join("");
  document.getElementById("itemList").innerHTML=data.itemNames.map(n=>`<option value=\"${n}\">`).join("");

  const items=getCurrentItems(); document.getElementById("total").innerText=items.length;
  const tbody=document.getElementById("items"); tbody.innerHTML="";
  items.forEach((it,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${i+1}</td>
      <td><input value="${it.itemName}" onchange="updateItem(${it.id},'itemName',this.value)"></td>
      <td><input type='number' value="${it.qty}" onchange="updateItem(${it.id},'qty',this.value)"></td>
      <td><button class="btn btn-danger" onclick="removeItem(${it.id})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("deptTags").innerHTML=Object.keys(data.departments).map(d=>`<span class='tag'>${d}</span>`).join("");
  document.getElementById("roomTags").innerHTML=rooms.map(r=>`<span class='tag'>${r}</span>`).join("");
  document.getElementById("itemTags").innerHTML=data.itemNames.map(n=>`<span class='tag'>${n}</span>`).join("");

  // Admin user list
  if(currentUser && currentUser.role==="admin"){
    const deptForUser=document.getElementById("deptForUser");
    deptForUser.innerHTML=Object.keys(data.departments).map(d=>`<option>${d}</option>`).join("");
    const roomForUser=document.getElementById("roomForUser");
    const roomsSel=data.department?(data.departments[data.department]||[]):[];
    roomForUser.innerHTML=roomsSel.map(r=>`<option>${r}</option>`).join("");
    renderUsers();
  }
}

function init(){
  load();
  document.getElementById("dept").onchange=e=>{data.department=e.target.value;data.room="";save();};
  document.getElementById("room").onchange=e=>{data.room=e.target.value;save();};
}

// ===== EXPORT / IMPORT =====
function exportCSV() {
  const items = getCurrentItems();
  if (!items.length) return alert("No items to export!");

  let csv = "Item Name,Quantity\n";
  items.forEach(it => {
    csv += `${it.itemName},${it.qty}\n`;
  });

  downloadFile("stock_register.csv", csv, "text/csv");
}

function exportJSON() {
  const items = getCurrentItems();
  if (!items.length) return alert("No items to export!");

  const json = JSON.stringify(items, null, 2);
  downloadFile("stock_register.json", json, "application/json");
}

function exportAllCSV() {
  if (currentUser.role !== "admin") {
    return alert("Only admin can export all data");
  }

  // Collect all unique items
  let itemMap = {}; 
  let deptRooms = [];

  for (const dept in data.departments) {
    const rooms = data.departments[dept];
    rooms.forEach(room => {
      const label = `${dept}-${room}`;
      deptRooms.push(label);

      const key = `${dept}|${room}`;
      const items = data.items[key] || [];
      items.forEach(it => {
        const itemKey = it.itemName;
        if (!itemMap[itemKey]) {
          itemMap[itemKey] = { itemName: it.itemName, quantities: {} };
        }
        itemMap[itemKey].quantities[label] = (itemMap[itemKey].quantities[label] || 0) + it.qty;
      });
    });
  }

  // Header
  let rows = ["Item Name," + deptRooms.join(",")];

  // Rows
  for (const itemKey in itemMap) {
    const item = itemMap[itemKey];
    let row = [item.itemName];
    deptRooms.forEach(label => {
      row.push(item.quantities[label] || 0);
    });
    rows.push(row.join(","));
  }

  if (rows.length === 1) {
    return alert("No items to export!");
  }

  const csv = rows.join("\n");
  downloadFile("all_departments_stock.csv", csv, "text/csv");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const items = JSON.parse(e.target.result);
      if (!Array.isArray(items)) throw new Error("Invalid format");
      saveItems(items);
    } catch (err) {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
}

// ===== LOGIN ENHANCEMENTS =====
// Show/Hide Password
function togglePassword() {
  const passField = document.getElementById("loginPass");
  passField.type = passField.type === "password" ? "text" : "password";
}

// Trigger login on Enter key (only on login page)
document.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && document.getElementById("loginPage").style.display !== "none") {
    login();
  }
});
