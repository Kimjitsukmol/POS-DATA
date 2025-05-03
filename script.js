// ไฟล์ script.js

let productList = [];
let totalPrice = 0;
let totalQty = 0;
let rangeTimer = null;

let isEnterPressed = false;
let isBackspacePressed = false;

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCldZmocT5IHIvOvnV-dOGkVdLs5ycz-3A",
  authDomain: "pos-data-base.firebaseapp.com",
  projectId: "pos-data-base",
  storageBucket: "pos-data-base.firebasestorage.app",
  messagingSenderId: "360322939495",
  appId: "1:360322939495:web:823012c8a773efce9d32c2"
  // measurementId: "G-Y652M5JGC1"
};

// ✅ เริ่มเชื่อมต่อ Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
window.firebaseDB = db; // เผื่อใช้งานส่วนอื่น

// ✅ Project B – ยอดขาย
const salesFirebaseConfig = {
  apiKey: "AIzaSyA9Ru8KfM7W4K-bA947wuR8Z2nfInac5IE",
  authDomain: "pos-sales-data-3b435.firebaseapp.com",
  projectId: "pos-sales-data-3b435",
  storageBucket: "pos-sales-data-3b435.firebasestorage.app",
  messagingSenderId: "1038822270145",
  appId: "1:1038822270145:web:ce02aa0c2f294f6acc6040"
};

const salesApp = firebase.initializeApp(salesFirebaseConfig, "salesApp");
const salesDB = salesApp.firestore();


let productListReady = false;

db.collection("products").get().then(snapshot => {
  productList = snapshot.docs.map(doc => doc.data());
  productListReady = true;
  console.log("✅ โหลดสินค้าจาก Firestore แล้ว", productList);
}).catch(error => {
  console.error("❌ โหลดสินค้าจาก Firestore ล้มเหลว:", error);
});


  
  function speak(text) {
  // ✅ ยกเลิกเสียงที่ยังไม่พูดจบ (สำคัญ!)
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = 1; // ลองใช้ 1.5 หรือ 1.7
  speechSynthesis.speak(utterance);
}

window.addEventListener('load', () => {
  document.querySelector('.summary-box')?.classList.add('summary-fixed');
  document.querySelector('#changeBox')?.classList.add('change-fixed');
  document.getElementById("productCode").focus();
  document.getElementById("productCode").addEventListener("focus", () => {
    speak("");
  });

  document.getElementById("received").addEventListener("focus", () => {
  const rows = document.querySelectorAll("#productBody tr");

  if (rows.length === 0) {
    speak("");
  } else {
    const totalQty = rows.length;
    const totalPrice = Array.from(rows).reduce((sum, row) => {
      return sum + parseFloat(row.querySelector(".item-row-price").textContent);
    }, 0);
    speak(`รวม ${totalPrice} บาท`);
  }
});

});

 // ✅ 👉 เพิ่มส่วนนี้ต่อท้ายได้เลย
  window.addEventListener('keydown', function (e) {
    const codeInput = document.getElementById("productCode");

    // เช็กว่ากำลังกดเลข หรือ Enter
    const isTyping = /^[0-9]$/.test(e.key) || e.key === "Enter";

    // ถ้ายังไม่มีสินค้าในตาราง และกดพิมพ์ → ให้ focus ที่ช่องรหัส
    const isPopupOpen = document.getElementById("productPopup")?.style.display === "flex";

	if (!hasProductsInTable() && isTyping && !isPopupOpen) {
	  codeInput.focus();
	}

  });

let enterCooldown = false;
let backspaceCooldown = false;

document.getElementById("productCode").addEventListener("keydown", function (e) {
  const codeInput = document.getElementById("productCode");
  const code = codeInput.value.trim();
  const firstRow = document.querySelector("#productBody tr");

  // ======= ENTER เพิ่มจำนวนสินค้า =======
  if (e.key === "Enter" && !isEnterPressed) {
    isEnterPressed = true;
    e.preventDefault();

    if (code === "") {
      if (!firstRow) {
        speak("ยังไม่มีสินค้า");
        return;
      }

      const qtyInput = firstRow.querySelector("input[type='number']");
      let qty = parseInt(qtyInput.value);
      qty += 1;
      qtyInput.value = qty;

      qtyInput.classList.add("qty-animate");
      setTimeout(() => qtyInput.classList.remove("qty-animate"), 300);

      const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];
      const toSpeak = qty <= 10 ? thaiNumbers[qty] : qty.toString();
      speak(toSpeak);
      updateTotals();
    } else {
      findProduct();
    }
  }

  // ======= BACKSPACE ลดจำนวนสินค้า =======
  else if (e.key === "Backspace" && !isBackspacePressed) {
    if (code === "" && firstRow) {
      isBackspacePressed = true;
      e.preventDefault();

      const qtyInput = firstRow.querySelector("input[type='number']");
      let qty = parseInt(qtyInput.value);

      if (qty > 1) {
        qty -= 1;
        qtyInput.value = qty;

        qtyInput.classList.add("qty-animate");
        setTimeout(() => qtyInput.classList.remove("qty-animate"), 300);

        const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];
        const toSpeak = qty <= 10 ? thaiNumbers[qty] : qty.toString();
        speak(toSpeak);
      } else {
        speak("ลบไม่ได้");
      }

      updateTotals();
    }
  }
});

document.getElementById("productCode").addEventListener("keyup", function (e) {
  if (e.key === "Enter") isEnterPressed = false;
  if (e.key === "Backspace") isBackspacePressed = false;
});




document.getElementById("received").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.repeat) {
    const rows = document.querySelectorAll("#productBody tr");
    if (rows.length === 0) {
    speak("กรุณาใส่สินค้าก่อน");
    return; // ❌ ยกเลิกไม่ให้ทำอะไรต่อ
}
    const received = parseFloat(document.getElementById("received").value);
    const change = received - totalPrice;

    const html = generateReceiptHTML();
    showReceiptPopup(html);
    saveReceiptToHistory(html);
    saveToLocalSummary();

    speak(`ขอบคุณค่ะ`);
    //ทอน ${change} 
    clearAll();
     setTimeout(() => {
      document.getElementById("productCode").focus();
    }, 3000); // 3000 = 3 วินาที
  }
});



document.getElementById("showTodayBtn").addEventListener("click", async () => {
  await showTodaySummary(); // ดึงข้อมูลจาก Firestore
  const box = document.getElementById("todaySummaryBox");
  box.style.display = "block";
  setTimeout(() => {
    box.style.display = "none";
  }, 10000); // แสดง 10 วินาที
});


window.addEventListener("keydown", function (e) {
  if (e.code === "NumpadDecimal") {
    document.getElementById("productCode").focus();
    e.preventDefault();
  } else if (e.code === "NumpadAdd") {
    document.getElementById("received").focus();
    e.preventDefault();
  }
});

function findProduct() {
  if (!productListReady) {
    speak("กำลังโหลดสินค้า กรุณารอสักครู่");
    return;
  }

  const code = document.getElementById("productCode").value.trim();
  document.getElementById("productCode").value = "";
  let found = false;

  for (let i = 0; i < productList.length; i++) {
    if (String(productList[i]["รหัสสินค้า"]) === code) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${productList[i]["รหัสสินค้า"]}</td>
        <td>${productList[i]["ชื่อสินค้า"]}</td>
        <td><input type='number' value='1' min='1' oninput='updateTotals()' style='width: 23px;'></td>
        <td class='item-row-price'>${productList[i]["ราคาขาย"]}</td>
        <td><button class='delete-btn'>❌</button></td>
      `;
      row.querySelector(".delete-btn").addEventListener("click", function () {
        row.remove();
        updateTotals();
        updateRowColors();
      });

      row.classList.add("row-animate");
      document.getElementById("productBody").insertBefore(row, productBody.firstChild);
      updateTotals();
      updateRowColors();
      speak(`${productList[i]["ราคาขาย"]} บาท`);
      found = true;
      break;
    }
  }

  if (!found) {
    speak("ไม่มี");
  }
}


function updateRowColors_DEPRECATED() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.style.backgroundColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
  });
}


function updateTotals() {
  const rows = document.querySelectorAll("#productBody tr");
  totalPrice = 0;
  totalQty = 0;

  rows.forEach(row => {
    const qtyInput = row.querySelector("input[type='number']");
    const qty = parseInt(qtyInput.value);
    const unitPrice = parseFloat(row.querySelector(".item-row-price").getAttribute("data-unit-price") || row.querySelector(".item-row-price").textContent);
    const itemTotal = qty * unitPrice;
    row.querySelector(".item-row-price").textContent = itemTotal.toFixed(0);
    totalQty += qty;
    totalPrice += itemTotal;
    if (!row.querySelector(".item-row-price").getAttribute("data-unit-price")) {
      row.querySelector(".item-row-price").setAttribute("data-unit-price", unitPrice);
    }
  });

  document.getElementById("totalQty").textContent = `${totalQty} รายการ`;
  document.getElementById("totalPrice").textContent = `${totalPrice.toFixed(0)}`;
  const summaryBox = document.querySelector(".summary-box");
  summaryBox.classList.add("animate-grow");
  setTimeout(() => summaryBox.classList.remove("animate-grow"), 300);
  calculateChange();
}

let calculateSpeakTimer = null;

function calculateChange() {
  const receivedInput = document.getElementById("received");
  const changeBox = document.getElementById("changeAmount");
  const received = parseFloat(receivedInput.value);
  const summaryBox = document.querySelector(".summary-box");

  if (!receivedInput.value || isNaN(received)) {
    changeBox.textContent = "";
    summaryBox.classList.remove("animate-shrink");
    clearTimeout(calculateSpeakTimer); // ป้องกันเสียงค้าง
    return;
  }

  const change = received - totalPrice;
  changeBox.textContent = `${change.toFixed(0)}`;
  summaryBox.classList.add("animate-shrink");

  changeBox.classList.remove("animate-grow");
  void changeBox.offsetWidth;
  changeBox.classList.add("animate-grow");

  // ✅ ✅ ✅ เพิ่มดีเลย์การพูดเมื่อหยุดพิมพ์แล้ว 1 วินาที
  clearTimeout(calculateSpeakTimer);
  calculateSpeakTimer = setTimeout(() => {
    if (change >= 0) {
      speak(`รับเงิน ${received.toFixed(0)} บาท`);
      setTimeout(() => speak(`เงินทอน ${change.toFixed(0)} บาท`), 800);
    } else {
      speak(`รับเงินไม่พอ`);
    }
  }, 1000); // ← รอ 1 วิ หลังหยุดพิมพ์
}



function clearAll() {
  document.getElementById("productBody").innerHTML = "";
  document.getElementById("received").value = "";
  totalPrice = 0;
  totalQty = 0;
  updateTotals();
  const summaryBox = document.querySelector(".summary-box");
  summaryBox.classList.remove("animate-shrink");
  summaryBox.style.opacity = "1";
}

function saveToLocalSummary() {
  const now = new Date();
  const dateKey = now.toLocaleDateString("th-TH"); // ex. "2/5/2567"
  let summary = JSON.parse(localStorage.getItem("posSummary")) || {};

  summary = cleanupOldSummary(summary);

  if (summary[dateKey]) {
    summary[dateKey].price += totalPrice;
    summary[dateKey].qty += totalQty;
  } else {
    summary[dateKey] = { price: totalPrice, qty: totalQty };
  }

  localStorage.setItem("posSummary", JSON.stringify(summary));

  // ✅ ✅ ✅ เพิ่มบันทึกขึ้น Firestore ตรงนี้:
  salesDB.collection("salesSummary").doc(dateKey).set({
    price: summary[dateKey].price,
    qty: summary[dateKey].qty,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

window.addEventListener("load", () => {
  showTodaySummary(); // ✅ ใช้ Firebase จริง
});



function updateTodaySummaryBox() {
  const dateKey = new Date().toLocaleDateString("th-TH");
  const summary = JSON.parse(localStorage.getItem("posSummary")) || {};
  const todayTotal = summary[dateKey] || { price: 0, qty: 0 };
  document.getElementById("todayTotal").textContent = `ขายได้ ${todayTotal.qty} ชิ้น รวมยอด ฿${todayTotal.price.toFixed(2)}`;

}

// เรียกทันทีเมื่อโหลดหน้า
updateTodaySummaryBox();

function updateRowColors_OLD() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.style.backgroundColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
  });
}


function updateRowColors_OLD() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.removeAttribute("class");
    row.style.backgroundColor = (index % 2 === 0) ? "#f2f2f2" : "#ffffff";
  });
}


function updateRowColors() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    const bg = (index % 2 === 0) ? "#f2f2f2" : "#ffffff";
    row.querySelectorAll("td").forEach(cell => {
      cell.style.backgroundColor = bg;
    });
  });
}


function showReceiptPopup() {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "55%";
  popup.style.transform = "translate(-50%, -50%)"; // <<< ให้กลางจริง
  popup.style.padding = "15px";
  popup.style.backgroundColor = "white";
  popup.style.color = "black";
  popup.style.border = "1px solid #ccc";
  popup.style.zIndex = "9999";
  popup.style.width = "300px";
  popup.style.fontFamily = "monospace";
  popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  popup.innerHTML = generateReceiptHTML();
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 5000);
}


function generateReceiptHTML() {
  const rows = document.querySelectorAll("#productBody tr");
  let listHTML = "<table style='width:100%; border-collapse: collapse; font-size: 12px;'>"
               + "<tr><th style='text-align:left;'>สินค้า</th><th style='text-align:center;'>จำนวน</th><th style='text-align:right;'>ราคา</th></tr>";

  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    const name = cols[1].textContent;
    const qty = cols[2].querySelector("input").value;
    const price = cols[3].textContent;
    listHTML += "<tr>"
              + `<td>${name}</td>`
              + `<td style='text-align:center;'>${qty}</td>`
              + `<td style='text-align:right;'>฿${price}</td>`
              + "</tr>";
  });

  listHTML += "</table>";

  const date = new Date();
  const time = date.toLocaleTimeString("th-TH");
  const dateStr = date.toLocaleDateString("th-TH");

  const received = parseFloat(document.getElementById("received").value || 0);
  const change = received - totalPrice;

  return `
    <div style="text-align:left;">
      <strong style="font-size:16px;">ร้านเจ้พิน</strong><br>
      <small>${dateStr} ${time}</small><br><hr>
      ${listHTML}<hr>
      <div style="text-align:right;">
        รวม: ฿${totalPrice.toFixed(2)}<br>
        รับเงิน: ฿${received.toFixed(2)}<br>
        เงินทอน: ฿${change.toFixed(2)}<br><br>
      </div>
      <div style="text-align:center;">ขอบคุณที่อุดหนุน ❤️</div>
    </div>
  `;
}

function saveReceiptToHistory(receiptHTML) {
  let history = JSON.parse(localStorage.getItem("receiptHistory")) || [];
  history.push(receiptHTML);

  if (history.length > 200) {
    history.shift(); // ลบใบแรกออก
  }

  localStorage.setItem("receiptHistory", JSON.stringify(history));
}


function showReceiptHistory() {
  const history = JSON.parse(localStorage.getItem("receiptHistory")) || [];
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "80vw";
  container.style.height = "100vh";
  container.style.overflowY = "scroll";
  container.style.overflow = "auto";
  container.style.background = "rgba(0,0,0,0.7)";
  container.style.zIndex = "9999";
  container.style.padding = "30px";
  container.style.color = "#000";

  let html = "<div style='background:white; padding:12px; max-width:500px; font-size:12px; margin:auto; border-radius:10px;'>";
  html += `<h3>ใบเสร็จย้อนหลัง (${history.length} ใบ)</h3><hr>`;
  for (let i = history.length - 1; i >= 0; i--) {
    html += `<div style='margin-bottom:20px; border-bottom:1px dashed #ccc;'>${history[i]}</div>`;
  }
html += "<button onclick='this.closest(`div`).parentElement.remove()' style='position:absolute; top:25px; right:370px;'>ปิด</button>";
html += `<h3 style='text-align:center;'>ใบเสร็จย้อนหลัง (${history.length} ใบ)</h3><hr>`;

  container.innerHTML = html;
  document.body.appendChild(container);
}


function updateDateTime() {
  const now = new Date();

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

  document.querySelector('.date').textContent = now.toLocaleDateString('th-TH', dateOptions);
  document.querySelector('.time').textContent = now.toLocaleTimeString('th-TH', timeOptions);
}

// เรียกทุกวินาที
setInterval(updateDateTime, 1000);

// เรียกครั้งแรก
updateDateTime();

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH"; // ตั้งค่าให้พูดภาษาไทย
  utterance.rate = 1.0;     // ความเร็วในการพูด (1.0 = ปกติ)
  speechSynthesis.speak(utterance);
}

function cleanupOldSummary(summary) {
  const today = new Date();
  const maxDays = 60;

  const sortedKeys = Object.keys(summary).sort((a, b) => {
    const [da, ma, ya] = a.split('/');
    const [db, mb, yb] = b.split('/');
    const dateA = new Date(+ya - 543, +ma - 1, +da);
    const dateB = new Date(+yb - 543, +mb - 1, +db);
    return dateA - dateB;
  });

  // ถ้ามากกว่า 60 วัน → ตัดทิ้ง
  while (sortedKeys.length > maxDays) {
    const oldestKey = sortedKeys.shift();
    delete summary[oldestKey];
  }

  return summary;
}

async function showLastDays(days) {
  const today = new Date();
  let totalSales = 0;
  let itemCount = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;

    try {
      const docRef = salesDB
        .collection("salesSummary")
        .doc(String(month))
        .collection(String(day))
        .doc(String(year));

      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const data = docSnap.data();
        totalSales += data.price || 0;
        itemCount += data.qty || 0;
      }
    } catch (error) {
      console.warn(`❌ ไม่พบข้อมูลวันที่ ${day}/${month}/${year}`, error);
    }
  }

  const box = document.getElementById("rangeTotal");
  box.textContent = `${itemCount} ชิ้น / ฿${totalSales.toLocaleString()}`;
  box.classList.remove("hidden");
  box.style.display = "block";
  box.offsetHeight;

  clearTimeout(rangeTimer);
  rangeTimer = setTimeout(() => {
    box.classList.add("hidden");
    setTimeout(() => {
      box.style.display = "none";
    }, 500);
  }, 10000);
}




flatpickr("#customRange", {
  mode: "range",
  dateFormat: "d/m/Y",
  locale: "th",

  onChange: async function (selectedDates) {
    if (selectedDates.length === 2) {
      const [startRaw, endRaw] = selectedDates;

      const start = new Date(startRaw.getFullYear(), startRaw.getMonth(), startRaw.getDate(), 0, 0, 0);
      const end = new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate(), 23, 59, 59);

      try {
        const snapshot = await firebaseDB.collection("sales")
          .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(start))
          .where("timestamp", "<=", firebase.firestore.Timestamp.fromDate(end))
          .get();

        const salesData = snapshot.docs.map(doc => doc.data());
        const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
        const itemCount = salesData.reduce((count, sale) => count + sale.items.length, 0);

        const resultBox = document.getElementById("rangeTotal");
        resultBox.textContent = (totalSales === 0 && itemCount === 0)
          ? "ไม่พบข้อมูล"
          : `${itemCount} ชิ้น / ฿${totalSales.toFixed(2)}`;
        
        resultBox.classList.remove("hidden");
        resultBox.style.display = "block";
        resultBox.offsetHeight;

        clearTimeout(rangeTimer);
        rangeTimer = setTimeout(() => {
          resultBox.classList.add("hidden");
          setTimeout(() => {
            resultBox.style.display = "none";
          }, 500);
        }, 10000);
      } catch (error) {
        console.error("ดึงข้อมูลย้อนหลังล้มเหลว:", error);
        alert("ไม่สามารถโหลดข้อมูลได้");
      }
    }
  }
});




function convertToBuddhistYear(fpInstance) {
  setTimeout(() => {
    const yearElements = fpInstance.calendarContainer.querySelectorAll(".flatpickr-current-month .cur-year");
    yearElements.forEach(el => {
      const year = parseInt(el.value || el.innerText);
      if (year < 2500) {
        const buddhistYear = year + 543;
        el.value = buddhistYear;
        el.innerText = buddhistYear;
      }
    });
  }, 5);
}

function showYesterday() {
  showLastDays(1);
}


function hasProductsInTable() {
  return document.querySelectorAll("#productBody tr").length > 0;
}

// ✅ ให้ Enter ใช้แทนการกด "บันทึก" ใน popup เพิ่มสินค้า
document.addEventListener("keydown", function (e) {
  const popup = document.getElementById("productPopup");
  const isVisible = popup && popup.style.display === "flex";

  // กด Enter ขณะ popup เปิด
  if (isVisible && e.key === "Enter") {
    e.preventDefault(); // ป้องกัน Enter ไปกระตุ้นฟอร์มอื่น
    document.getElementById("saveProductBtn").click(); // คลิกปุ่มบันทึก
  }
});

document.getElementById("saveProductBtn").addEventListener("click", async () => {
  const code = document.getElementById("newCode").value.trim();
  const name = document.getElementById("newName").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value);

  if (!code || !name || isNaN(price)) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน และราคาต้องเป็นตัวเลข");
    return;
  }

  const product = {
    "รหัสสินค้า": code,
    "ชื่อสินค้า": name,
    "ราคาขาย": price
  };

  try {
    if (isEditMode) {
      await firebaseDB.collection("products").doc(editingCode).update({
        "ชื่อสินค้า": name,
        "ราคาขาย": price
      });
      alert("✅ แก้ไขราคาสินค้าสำเร็จ");
    } else {
      await firebaseDB.collection("products").doc(code).set(product);
      alert("✅ เพิ่มสินค้าเรียบร้อยแล้ว");
    }
    
    alert("✅ เพิ่มสินค้าเรียบร้อยแล้ว");
    closePopup();
    isEditMode = false;
    editingCode = "";


    // โหลดสินค้าทั้งหมดใหม่
    const snapshot = await firebaseDB.collection("products").get();
    productList = snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.error("❌ เพิ่มสินค้าไม่สำเร็จ", err);
    alert("❌ เกิดข้อผิดพลาด");
  }
});

function closePopup() {
  document.getElementById("productPopup").style.display = "none";
}

function openPopup() {
  document.getElementById("productPopup").style.display = "flex";
}

let isEditMode = false;
let editingCode = "";

document.getElementById("editProductBtn").addEventListener("click", () => {
  const code = prompt("ใส่รหัสสินค้าที่ต้องการแก้ไข:");
  const product = productList.find(p => String(p["รหัสสินค้า"]) === code);

  if (!product) {
    alert("❌ ไม่พบสินค้านี้");
    return;
  }

  // เตรียมข้อมูลใน popup
  document.getElementById("newCode").value = product["รหัสสินค้า"];
  document.getElementById("newName").value = product["ชื่อสินค้า"];
  document.getElementById("newPrice").value = product["ราคาขาย"];

  // ตั้งค่าโหมด
  isEditMode = true;
  editingCode = code;
  openPopup();
});

function saveSalesToFirestore(salesItems, total, cashReceived, change) {
  const saleRecord = {
    timestamp: firebase.firestore.FieldValue.serverTimestamp(), // ✅ เวลาเซิร์ฟเวอร์
    items: salesItems,
    total: total,
    cashReceived: cashReceived,
    change: change
  };

  salesDB.collection("sales").add(saleRecord)
    .then((docRef) => {
      console.log("✅ บันทึกยอดขายแล้ว:", docRef.id);
    })
    .catch((error) => {
      console.error("❌ เกิดข้อผิดพลาดในการบันทึก:", error);
    });
}



document.getElementById("cashInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    const cash = parseFloat(this.value);
    if (isNaN(cash)) {
      alert("กรุณาใส่จำนวนเงินให้ถูกต้อง");
      return;
    }

    const total = calculateTotal(); // สมมุติว่าคุณมีฟังก์ชันรวมยอด
    const change = cash - total;

    // แสดงเงินทอน (หากมี)
    document.getElementById("changeDisplay").textContent = `เงินทอน: ${change} บาท`;

    // ดึงรายการในตะกร้า
    const salesItems = getCartItems(); // ฟังก์ชันนี้คุณต้องมีหรือเขียนเพิ่ม

    // ✅ บันทึกลง Firestore
    saveSalesToFirestore(salesItems, total, cash, change);
  }
});


function getCartItems() {
  const rows = document.querySelectorAll("#saleTable tbody tr");
  const items = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    items.push({
      รหัสสินค้า: cells[0].textContent,
      ชื่อสินค้า: cells[1].textContent,
      ราคา: parseFloat(cells[2].textContent)
    });
  });

  return items;
}

function formatDateThai(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('th-TH', options);
}

async function showTodaySummary() {
  const today = new Date();
  const month = today.getDate();         // 👈 '3' คือเดือน
  const day = today.getMonth() + 1;      // 👈 '5' คือวันที่
  const year = today.getFullYear() + 543;

  try {
    const docRef = salesDB
      .collection("salesSummary")
      .doc(String(month))           // '3'
      .collection(String(day))      // '5'
      .doc(String(year));           // '2568'

    const docSnap = await docRef.get();

    const todayTotal = document.getElementById("todayTotal");

    if (docSnap.exists) {
      const data = docSnap.data();
      todayTotal.textContent = `ขายได้ ${data.qty} ชิ้น รวมยอด ฿${data.price.toLocaleString()}`;
    } else {
      todayTotal.textContent = "ไม่มีข้อมูลยอดขายวันนี้";
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    document.getElementById("todayTotal").textContent = "ไม่สามารถดึงยอดวันนี้ได้";
  }
}






async function showSummary(days) {
  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - days);

  try {
    const snapshot = await salesDB.collection("sales")
      .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(pastDate))
      .where("timestamp", "<=", firebase.firestore.Timestamp.fromDate(now))
      .get();

    const salesData = snapshot.docs.map(doc => doc.data());

    const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
    const itemCount = salesData.reduce((count, sale) => count + sale.items.length, 0);

    alert(`📊 สรุปยอด ${days === 1 ? "เมื่อวาน" : `${days} วันที่ผ่านมา`}:\n\nจำนวนรายการ: ${itemCount} รายการ\nยอดขายรวม: ${totalSales.toLocaleString()} บาท`);

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลจาก Firestore:", error);
    alert("ไม่สามารถโหลดข้อมูลยอดขายได้");
  }
}

function saveToSalesSummary(totalPrice, totalQty) {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear() + 543;

  const docRef = salesDB
    .collection("salesSummary")
    .doc(String(day))
    .collection(String(month))
    .doc(String(year));

  docRef.get().then(docSnap => {
    let oldPrice = 0;
    let oldQty = 0;

    if (docSnap.exists) {
      const data = docSnap.data();
      oldPrice = data.price || 0;
      oldQty = data.qty || 0;
    }

    docRef.set({
      price: oldPrice + totalPrice,
      qty: oldQty + totalQty,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log("✅ บันทึกยอดรวมสำเร็จ");
  }).catch(error => {
    console.error("❌ เกิดข้อผิดพลาดในการบันทึกยอดรวม:", error);
  });
}
