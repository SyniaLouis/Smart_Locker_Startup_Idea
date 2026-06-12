// === MQTT CONFIGURATION VIA EMQX ===
let mqttClient = null;
const MQTT_BROKER = "broker.emqx.io";
const MQTT_PORT = 8084; // Secure WebSockets port required for HTTPS (GitHub Pages)
const MQTT_TOPIC = "locker_may/command"; 

function setupMQTT() {
  const clientId = "WebApp_" + Math.random().toString(16).substr(2, 8);
  mqttClient = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, clientId);

  mqttClient.onConnectionLost = function (responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("MQTT Connection Lost: " + responseObject.errorMessage);
      setTimeout(setupMQTT, 3000); // Automatically reconnect after 3 seconds
    }
  };

  mqttClient.connect({
    useSSL: true, // Secure connection layer
    onSuccess: function () {
      console.log("Web App successfully connected to EMQX MQTT Broker");
    },
    onFailure: function (error) {
      console.log("MQTT Connection Failed: ", error.errorMessage);
    }
  });
}

// Publish UNLOCK command to the EMQX broker
function sendUnlockCommand() {
  if (mqttClient && mqttClient.isConnected()) {
    const cmd = "UNLOCK"; 
    const message = new Paho.MQTT.Message(cmd);
    message.destinationName = MQTT_TOPIC;
    mqttClient.send(message);
    console.log("Sent unlock command to ESP32: " + cmd);
  } else {
    showToast("MQTT Server offline! Trying to reconnect...");
  }
}

// === ORIGINAL APP LOGIC (MOCKED FOR PURE FRONTEND) ===
const view = document.querySelector("#view");
const toast = document.querySelector("#toast");
const roleBadge = document.querySelector("#roleBadge");
const accountName = document.querySelector("#accountName");
const ordersNavLabel = document.querySelector("#ordersNavLabel");
const historyNavLabel = document.querySelector("#historyNavLabel");

const demoLockerBlocks = [
  {
    id: "BLOCK-DH-001",
    publicCode: "BLOCK-DH-001",
    qrCode: "SL-LOCKER-05",
    name: "Block tủ A",
    locationName: "Khu nhà ở xã hội Định Hòa",
    address: "Phường Định Hòa, TP. Thủ Dầu Một, Bình Dương",
    floorLabel: "Sảnh A - Tầng trệt",
    status: "Online",
    smallAvailable: 6,
    mediumAvailable: 8,
    largeAvailable: 3,
  },
  {
    id: "BLOCK-EIU-002",
    publicCode: "BLOCK-EIU-002",
    qrCode: "SL-LOCKER-EIU-02",
    name: "Block tủ EIU-02",
    locationName: "Ký túc xá EIU",
    address: "Đại học Quốc tế Miền Đông, Bình Dương",
    floorLabel: "Sảnh ký túc xá",
    status: "Planned",
    smallAvailable: 0,
    mediumAvailable: 0,
    largeAvailable: 0,
  },
];

const demoParcels = [
  {
    id: "demo-dh001",
    code: "DH001",
    receiverName: "Nguyễn Văn A",
    receiverPhone: "0901234567",
    receiverAddress: "Căn A1204, Khu nhà ở xã hội Định Hòa",
    lockerBlockName: "Block tủ A",
    compartmentCode: "A12",
    pickupFee: 2000,
    paymentStatus: "Pending",
    status: "PaymentPending",
    createdAt: new Date().toISOString(),
    storedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-dh002",
    code: "DH002",
    receiverName: "Nguyễn Văn A",
    receiverPhone: "0901234567",
    receiverAddress: "Căn A1204, Khu nhà ở xã hội Định Hòa",
    lockerBlockName: "Block tủ A",
    compartmentCode: "B02",
    pickupFee: 4000,
    paymentStatus: "Pending",
    status: "PaymentPending",
    createdAt: new Date().toISOString(),
    storedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

const demoCompartments = Array.from({ length: 12 }, (_, index) => {
  const code = `A${String(index).padStart(2, "0")}`;
  return {
    id: `demo-${code}`,
    code,
    size: index <= 2 ? "Small" : index <= 8 ? "Medium" : "Large",
    status: code === "A01" ? "Available" : "Unavailable",
  };
});

const state = {
  route: "lockerScan",
  apiOnline: true,
  isBusy: false,
  scanning: false,
  role: localStorage.getItem("shipmates.role") || "",
  token: localStorage.getItem("shipmates.token") || "mock-token",
  user: readJson("shipmates.user", null),
  lockerBlocks: demoLockerBlocks,
  locker: readJson("shipmates.locker", null),
  residentProfile: readJson("shipmates.residentProfile", {
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    apartmentAddress: "Căn A1204, Khu nhà ở xã hội Định Hòa",
  }),
  shipperProfile: readJson("shipmates.shipperProfile", {
    fullName: "Lê Minh Shipper",
    phone: "0987654321",
    deliveryPartner: "SPX Express",
  }),
  residentParcels: demoParcels,
  selectedParcel: null,
  payment: null,
  auth: {
    phone: "0901234567",
    otp: "123456",
    otpSent: true,
    accountExists: true,
    fullName: "Nguyễn Văn A",
    apartmentAddress: "Căn A1204",
    deliveryPartner: "SPX Express",
  },
  helper: { phone: "", otp: "", parcelCode: "" },
  dropoff: {
    parcelCode: "DH118",
    receiverPhone: "0901234567",
    receiverName: "Nguyễn Văn A",
    receiverAddress: "Căn A1204, Khu nhà ở xã hội Định Hòa",
    compartments: demoCompartments,
    selectedCompartmentCode: "A01",
    evidenceReady: false,
    openedParcel: null,
  },
  refreshingCompartments: false,
  history: readJson("shipmates.history", []),
};

const routes = {
  lockerScan,
  lockerLocation,
  lockerMap,
  roleSelect,
  login,
  home,
  residentProfile,
  residentOrders,
  residentHelper,
  residentPayment,
  residentOpen,
  residentClose,
  residentDone,
  shipperDropoff,
  shipperOpen,
  shipperProof,
  shipperClose,
  shipperDone,
  orders,
  history,
  profile,
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem("shipmates.role", state.role || "");
  localStorage.setItem("shipmates.token", state.token || "");
  localStorage.setItem("shipmates.user", JSON.stringify(state.user));
  localStorage.setItem("shipmates.locker", JSON.stringify(state.locker));
  localStorage.setItem("shipmates.residentProfile", JSON.stringify(state.residentProfile));
  localStorage.setItem("shipmates.shipperProfile", JSON.stringify(state.shipperProfile));
  localStorage.setItem("shipmates.residentParcels", JSON.stringify(state.residentParcels));
  localStorage.setItem("shipmates.history", JSON.stringify(state.history));
}

function icon(name, cls = "") {
  return `<span class="material-symbols-outlined ${cls}" aria-hidden="true">${name}</span>`;
}

function money(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function displayText(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "object") {
    return displayText(value.label ?? value.name ?? value.title ?? value.code ?? value.value, fallback);
  }
  return fallback;
}

function storageInfo(parcel) {
  return { fee: 2000, label: "Đã lưu trong tủ 1 giờ 30 phút", isOvernight: false };
}

function storageFeeGuide() {
  return `
    <article class="storage-rule-card">
      ${icon("schedule")}
      <div>
        <strong>Phí lưu trữ được tính tự động</strong>
        <dl class="storage-fee-list">
          <div><dt>Từ 0 đến 4 giờ</dt><dd>2.000đ</dd></div>
          <div><dt>Trên 4 đến 8 giờ</dt><dd>4.000đ</dd></div>
          <div><dt>Trên 8 giờ</dt><dd>6.000đ</dd></div>
          <div><dt>Qua đêm</dt><dd>10.000đ</dd></div>
        </dl>
      </div>
    </article>
  `;
}

function statusText(value) {
  return {
    Online: "Đang hoạt động",
    Planned: "Đang cập nhật",
    Offline: "Tạm ngưng",
    Maintenance: "Bảo trì",
    Stored: "Đang chờ nhận",
    PaymentPending: "Cần thanh toán phí",
    PickedUp: "Đã nhận",
    Paid: "Đã thanh toán",
    Pending: "Chờ thanh toán",
  }[value] || value || "Đang cập nhật";
}

function setRoute(route) {
  state.route = route;
  render();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(window.shipmatesToastTimer);
  window.shipmatesToastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}
function render() {
  updateChrome();
  if (view) {
    view.innerHTML = (routes[state.route] || lockerScan)();
  }
}

function updateChrome() {
  const loggedIn = Boolean(state.user);
  if (roleBadge) {
    roleBadge.textContent = loggedIn ? (state.role === "shipper" ? "Người giao hàng" : "Người nhận hàng") : "Chưa đăng nhập";
    roleBadge.classList.toggle("shipper", state.role === "shipper");
  }
  if (accountName) {
    accountName.textContent = loggedIn ? (state.user.displayName || "Khách Demo") : "Đăng nhập";
  }
  if (ordersNavLabel) {
    ordersNavLabel.textContent = state.role === "shipper" ? "Đơn giao" : "Đơn hàng";
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    const route = button.dataset.route;
    button.classList.toggle("active", route === state.route || (route === "home" && state.route.endsWith("Done")));
  });
}

function lockerSummary() {
  const locker = state.locker || demoLockerBlocks[0];
  return `
    <article class="location-card">
      <div class="icon-tile">${icon("inventory_2")}</div>
      <div>
        <strong>${displayText(locker.name, "Block tủ A")}</strong>
        <p>${displayText(locker.locationName, "Khu nhà ở xã hội Định Hòa")}</p>
        <p class="muted">${displayText(locker.floorLabel)} · ${displayText(locker.address)}</p>
      </div>
      <span class="status-pill">${statusText(displayText(locker.status))}</span>
    </article>
  `;
}

function lockerScan() {
  const body = `
    <div class="scan-layout">
      <div class="qr-stage ${state.scanning ? "is-scanning" : ""}">
        <div class="qr-frame">
          <div class="qr-demo" aria-hidden="true"></div>
          <div class="scan-line"></div>
        </div>
        <p>${state.scanning ? "Đang nhận diện mã QR trên block tủ..." : "Căn mã QR dán vào khung quét"}</p>
      </div>
      <div class="button-grid">
        <button class="secondary-btn" data-action="manualLocker" type="button">${icon("pin_drop")} Dùng tủ Định Hòa</button>
        <button class="primary-btn next-cta" data-action="scanLocker" type="button" ${state.scanning ? "disabled" : ""}>
          ${icon("qr_code_scanner")} ${state.scanning ? "Đang quét..." : "Quét mã block tủ"}
        </button>
      </div>
    </div>
  `;
  return shell("Quét mã block tủ", "", body, { eyebrow: "SmartLocker" });
}

function lockerLocation() {
  const body = `
    ${lockerSummary()}
    <section class="metric-grid">
      ${metric("Ngăn nhỏ còn trống", state.locker?.smallAvailable ?? 6)}
      ${metric("Ngăn vừa còn trống", state.locker?.mediumAvailable ?? 8)}
      ${metric("Ngăn lớn còn trống", state.locker?.largeAvailable ?? 3)}
    </section>
    <div class="hero-card">
      <img src="./assets/green-locker.png" alt="Tủ khóa thông minh màu xanh" />
      <div>
        <h3>Vị trí tủ đã sẵn sàng</h3>
        <p class="muted">Bạn có thể xem bản đồ mạng lưới hoặc tiếp tục thao tác tại block tủ hiện tại.</p>
      </div>
    </div>
    <div class="button-grid">
      <button class="secondary-btn" data-route="lockerMap" type="button">${icon("map")} Xem bản đồ tủ</button>
      <button class="primary-btn next-cta" data-route="roleSelect" type="button">Tiếp tục</button>
    </div>
  `;
  return shell("Vị trí tủ đã sẵn sàng", "", body, { back: { route: "lockerScan", label: "Quay lại quét tủ" } });
}

function lockerMap() {
  const body = `
    <div class="map-board">
      ${state.lockerBlocks.map((block) => `
        <button class="locker-network-card ${block.publicCode === state.locker?.publicCode ? "selected" : ""}" data-action="selectLocker" data-locker="${block.publicCode}" type="button">
          <div class="icon-tile">${icon(block.status === "Online" ? "location_on" : "pending")}</div>
          <div>
            <strong>${block.locationName}</strong>
            <p>${block.name} · ${block.floorLabel}</p>
            <small>${statusText(block.status)}</small>
          </div>
        </button>
      `).join("")}
    </div>
    <div class="notice-card">${icon("hub")} Màn hình này dùng để mở rộng nhiều điểm đặt tủ trong tương lai.</div>
    <button class="primary-btn next-cta" data-route="roleSelect" type="button">Tiếp tục</button>
  `;
  return shell("Bản đồ mạng lưới tủ", "", body, { back: { route: "lockerLocation", label: "Quay về vị trí tủ" } });
}

function roleSelect() {
  const body = `
    <div class="role-grid">
      <button class="role-card" data-action="chooseRole" data-role="resident" type="button">
        <div class="icon-tile">${icon("home")}</div>
        <span><strong>Tôi là Người nhận hàng</strong><small>Nhận hàng của mình hoặc nhận hộ</small></span>
      </button>
      <button class="role-card" data-action="chooseRole" data-role="shipper" type="button">
        <div class="icon-tile">${icon("local_shipping")}</div>
        <span><strong>Tôi là Người giao hàng</strong><small>Gửi hàng nhanh vào tủ</small></span>
      </button>
    </div>
  `;
  return shell("Bạn đang thao tác với tư cách nào?", "", body, {
    back: { route: "lockerLocation", label: "Quay về vị trí tủ" },
    beforeTitle: lockerSummary(),
    eyebrow: "Chọn vai trò",
  });
}

function login() {
  const label = state.role === "shipper" ? "Người giao hàng" : "Người nhận hàng";
  const isShipper = state.role === "shipper";
  const body = `
    ${lockerSummary()}
    <article class="login-card phone-login-card">
      <div class="icon-tile">${icon("phone_iphone")}</div>
      <div>
        <strong>Đăng nhập hệ thống Demo</strong>
        <p class="muted" style="font-weight: bold; color: rgb(63, 127, 178);">${label}</p>
      </div>
    </article>
    <div class="auth-form">
      ${input("Số điện thoại (Đã tự điền mẫu)", "auth.phone", state.auth.phone, "Ví dụ: 0901234567", "tel")}
      <div class="demo-otp-notice">
        ${icon("key")}
        <span>Mã OTP dùng cho bản demo: <strong>123456</strong></span>
      </div>
      ${input("Mã OTP (Đã tự điền mẫu)", "auth.otp", state.auth.otp, "Nhập 123456")}
      <div class="button-grid">
        <button class="primary-btn next-cta" data-action="verifyPhoneOtp" type="button">
          ${icon("login")} Đăng nhập nhanh
        </button>
        <button class="secondary-btn" data-route="roleSelect" type="button">Chọn lại vai trò</button>
      </div>
    </div>
  `;
  return shell(`Tiếp tục với vai trò ${label}`, "", body, { back: { route: "roleSelect", label: "Quay lại chọn vai trò" } });
}

function home() {
  if (!state.user) return login();
  const isShipper = state.role === "shipper";
  const body = `
    <section class="dashboard-hero">
      <div>
        <span class="eyebrow">${isShipper ? "Giao hàng" : "Nhận hàng"}</span>
        <h1>${isShipper ? "Gửi hàng vào tủ nhanh hơn!" : "Hàng của bạn đang chờ nhận!"}</h1>
      </div>
      <img src="./assets/green-locker.png" alt="Tủ khóa thông minh" />
    </section>
    <section class="metric-grid">
      ${metric("Block tủ", state.locker?.name || "Block tủ A")}
      ${metric(isShipper ? "Luồng chính" : "Đơn chờ nhận", isShipper ? "Gửi nhanh" : (state.residentParcels?.length ?? 0))}
      ${metric("Vai trò", isShipper ? "Người giao hàng" : "Người nhận hàng")}
    </section>
    <div class="button-stack">
      <button class="primary-btn next-cta" data-route="${isShipper ? "shipperDropoff" : "residentOrders"}" type="button">
        ${icon(isShipper ? "barcode_scanner" : "inventory_2")} ${isShipper ? "Giao đơn mới" : "Xem hàng cần nhận"}
      </button>
    </div>
  `;
  return shell(isShipper ? "Trang chủ Người giao hàng" : "Trang chủ Người nhận hàng", "", body);
}

function residentProfile() {
  return residentOrders();
}

function residentOrders() {
  const parcels = state.residentParcels || [];
  const body = `
    ${storageFeeGuide()}
    <div class="section-head">
      <h3>Đơn đang chờ nhận</h3>
    </div>
    <div class="list-stack">
      ${parcels.length ? parcels.map(parcelCard).join("") : `<div class="empty-card">${icon("inventory_2")} Không còn đơn nào cần nhận tại block tủ này.</div>`}
    </div>
  `;
  return shell("Danh sách hàng cần nhận", "", body, { back: { route: "home", label: "Quay về trang chủ" } });
}

function parcelCard(parcel) {
  const storage = storageInfo(parcel);
  return `
    <article class="parcel-card">
      <div>
        <strong>${displayText(parcel.code, "Chao")} - Ngăn ${displayText(parcel.compartmentCode, "A01")}</strong>
        <p>${displayText(parcel.receiverName, "Người nhận")} · ${displayText(parcel.receiverPhone)}</p>
        <div class="storage-summary">
          <span>${icon("schedule")} ${storage.label}</span>
          <strong>${money(storage.fee)}</strong>
        </div>
      </div>
      <button class="mini-btn" data-action="selectParcel" data-id="${parcel.id}" type="button">Lấy hàng</button>
    </article>
  `;
}

function residentHelper() {
  return residentOrders();
}

function residentPayment() {
  const parcel = state.selectedParcel || demoParcels[0];
  const body = `
    ${parcelDetail(parcel)}
    ${paymentBox()}
    <button class="primary-btn next-cta" data-action="openResidentLocker" type="button">
      ${icon("door_open")} Mở tủ lấy hàng
    </button>
  `;
  return shell("Xác thực đơn hàng", "Hệ thống kiểm tra đúng đơn, đúng người nhận và phí lưu trữ nếu có.", body, { back: { route: "residentOrders", label: "Quay về danh sách đơn" } });
}

function paymentBox() {
  if (!state.payment) {
    return `<div class="notice-card done">${icon("verified")} Nhấp nút bên dưới để gửi lệnh mở khóa và lấy hàng.</div>`;
  }
  return `
    <article class="payment-card">
      <div>
        <span class="eyebrow">Thanh toán phí lưu trữ</span>
        <h3>${money(state.payment.amount)}</h3>
      </div>
      <div class="button-grid">
        <button class="primary-btn" data-action="simulatePayment" type="button">${icon("task_alt")} Mở tủ (Bỏ qua thanh toán)</button>
      </div>
    </article>
  `;
}

function residentOpen() {
  const parcel = state.selectedParcel || demoParcels[0];
  const body = `
    ${processList(["Xác thực đơn hàng", "Gửi lệnh mở tủ qua EMQX", "Chờ bạn lấy hàng và đóng cửa"], 2)}
    <button class="primary-btn next-cta" data-route="residentClose" type="button">${icon("inventory_2")} Tôi đã lấy hàng</button>
  `;
  return shell(`Ngăn ${parcel?.compartmentCode || "A01"} đã mở`, "Vui lòng lấy hàng ra khỏi tủ rồi đóng cửa lại.", body, { back: { route: "residentPayment", label: "Quay về xác thực" } });
}

function residentClose() {
  const parcel = state.selectedParcel || demoParcels[0];
  const body = `
    <div class="door-state warning">${icon("door_open")} Cửa ngăn ${parcel?.compartmentCode || "A01"} đang mở</div>
    <button class="primary-btn next-cta" data-action="completePickup" type="button">${icon("door_front")} Tôi đã đóng cửa tủ</button>
  `;
  return shell("Đóng cửa tủ", "Sau khi cửa đóng, hệ thống cập nhật đơn đã lấy và chuyển ngăn về trạng thái trống.", body, { back: { route: "residentOpen", label: "Quay lại bước lấy hàng" } });
}

function residentDone() {
  return successScreen("Nhận hàng thành công", "Đơn đã được cập nhật đã nhận. Ngăn tủ chuyển về trạng thái trống.", "Về trang chủ", "home");
}

function shipperDropoff() {
  const d = state.dropoff;
  const body = `
    ${lockerSummary()}
    <div class="form-stack">
      ${input("Mã vận đơn", "dropoff.parcelCode", d.parcelCode, "DH118")}
      ${input("Số điện thoại người nhận", "dropoff.receiverPhone", d.receiverPhone, "0901234567")}
      ${input("Tên người nhận", "dropoff.receiverName", d.receiverName, "Nguyễn Văn A")}
      <button class="secondary-btn" data-action="fillDemoParcel" type="button">${icon("barcode_scanner")} Tự động điền dữ liệu mẫu nhanh</button>

      ${compartmentPicker(d.compartments, d.selectedCompartmentCode)}
      ${storageFeeGuide()}
      <button class="primary-btn next-cta" data-action="createDropoff" type="button" ${d.selectedCompartmentCode ? "" : "disabled"}>${icon("door_open")} Xác nhận giao hàng vào ngăn ${d.selectedCompartmentCode || "A01"}</button>
    </div>
  `;
  return shell("Thông tin đơn giao", "", body, { back: { route: "home", label: "Quay về trang chủ" } });
}

function compartmentPicker(compartments = demoCompartments, selectedCode = "A01") {
  const sizeLabels = { Small: "Nhỏ", Medium: "Vừa", Large: "Lớn" };
  const statusLabels = { Available: "Trống", Occupied: "Đang chứa hàng", Unavailable: "Chưa hoạt động" };
  
  return `
    <section class="compartment-picker">
      <div class="compartment-picker-heading">
        <div>
          <span class="eyebrow">Chọn ngăn tủ</span>
          <h3>Sơ đồ tủ Demo</h3>
        </div>
      </div>
      <div class="locker-front">
        ${demoCompartments.map((item) => {
          const selected = selectedCode === item.code;
          return `
            <button
              class="locker-door status-${item.status.toLowerCase()} ${selected ? "selected" : ""}"
              data-action="selectCompartment"
              data-code="${item.code}"
              type="button"
            >
              <span class="door-code">${item.code}</span>
              <span class="door-size">${sizeLabels[item.size] || "Vừa"}</span>
              <span class="door-status">${statusLabels[item.status]}</span>
              <span class="door-handle"></span>
            </button>
          `;
        }).join("")}
      </div>
      <p class="compartment-selection">
        ${icon("check_circle")} Đã chọn ngăn <strong>${selectedCode}</strong> để kích hoạt gửi MQTT
      </p>
    </section>
  `;
}

function shipperOpen() {
  const parcel = state.dropoff.openedParcel || demoParcels[0];
  const body = `
    ${parcelDetail(parcel)}
    ${processList(["Kiểm tra ngăn trống", "Gửi lệnh mở tủ qua EMQX MQTT", "Chờ người giao hàng bỏ hàng"], 2)}
    <button class="primary-btn next-cta" data-route="shipperProof" type="button">${icon("inventory_2")} Tôi đã bỏ hàng vào tủ</button>
  `;
  return shell(`Ngăn ${parcel?.compartmentCode || "A01"} đã mở`, "Kiện hàng của bạn đã được gửi lệnh mở khóa thành công.", body, { back: { route: "shipperDropoff", label: "Quay lại thông tin đơn" } });
}

function shipperProof() {
  const body = `
    <div class="capture-card done">
      <div class="capture-frame">${icon("check_circle")}</div>
      <strong>Đã mô phỏng ảnh minh chứng thành công</strong>
    </div>
    <div class="button-grid">
      <button class="primary-btn next-cta" data-route="shipperClose" type="button">Tiếp tục đóng tủ</button>
    </div>
  `;
  return shell("Ảnh minh chứng", "Bước này ghi nhận kiện hàng đã được bỏ vào đúng ngăn.", body, { back: { route: "shipperOpen", label: "Quay lại mở tủ" } });
}

function shipperClose() {
  const parcel = state.dropoff.openedParcel || demoParcels[0];
  const body = `
    <div class="door-state warning">${icon("door_open")} Cửa ngăn ${parcel?.compartmentCode || "A01"} đang mở</div>
    <button class="primary-btn next-cta" data-action="completeDropoff" type="button">${icon("door_front")} Tôi đã đóng cửa tủ</button>
  `;
  return shell("Đóng cửa tủ", "Hệ thống sẽ ghi nhận lưu kho và hoàn tất chu trình.", body, { back: { route: "shipperProof", label: "Quay về ảnh minh chứng" } });
}

function shipperDone() {
  return successScreen("Giao hàng thành công", "Đơn đã lưu trong tủ. Hệ thống đã đồng bộ trạng thái mô phỏng.", "Giao đơn tiếp theo", "shipperDropoff");
}

function orders() {
  return state.role === "shipper" ? shipperDropoff() : residentOrders();
}

function history() {
  const body = `
    <div class="list-stack">
      ${state.history.length ? state.history.map((item) => `
        <article class="history-item">
          ${icon("inventory_2")}
          <div><strong>${displayText(item.title, "Hoạt động")}</strong><p class="muted">${displayText(item.status)}</p></div>
        </article>
      `).join("") : `<div class="empty-card">${icon("history")} Chưa có lịch sử thao tác.</div>`}
    </div>
  `;
  return shell("Lịch sử", "", body, { back: { route: "home", label: "Quay về trang chủ" } });
}

function profile() {
  const isShipper = state.role === "shipper";
  const profile = isShipper ? state.shipperProfile : state.residentProfile;
  const body = `
    <article class="profile-card">
      <div class="avatar large">${isShipper ? "G" : "N"}</div>
      <div>
        <strong>${displayText(profile.fullName, "Khách Demo")}</strong>
        <p>${displayText(profile.phone)}</p>
      </div>
    </article>
    ${metricRow("Vai trò", isShipper ? "Người giao hàng" : "Người nhận hàng")}
    ${metricRow("Trạng thái kết nối", "GitHub Pages Client (Standalone)")}
    <div class="button-stack">
      <button class="danger-btn" data-action="logout" type="button">${icon("logout")} Đăng xuất</button>
    </div>
  `;
  return shell("Tài khoản", "", body, { back: { route: "home", label: "Quay về trang chủ" } });
}

function successScreen(title, subtitle, cta, route) {
  return shell(title, subtitle, `
    <article class="success-card">
      ${icon("check_circle")}
      <strong>${title}</strong>
      <p class="muted">${subtitle}</p>
    </article>
    <button class="primary-btn next-cta" data-route="${route}" type="button">${cta}</button>
  `);
}

function parcelDetail(parcel) {
  if (!parcel) return "";
  const storage = storageInfo(parcel);
  return `
    <article class="parcel-detail">
      <div class="avatar">K</div>
      <div>
        <strong>${displayText(parcel.receiverName)}</strong>
        <p>${displayText(parcel.receiverPhone)}</p>
      </div>
      <div class="detail-code">
        <span>Mã đơn</span>
        <strong>${displayText(parcel.code)}</strong>
      </div>
    </article>
  `;
}

function input(label, name, value, placeholder, type = "text") {
  return `
    <label class="field">
      <span>${label}</span>
      <input type="${type}" data-field="${name}" value="${displayText(value)}" placeholder="${displayText(placeholder)}" />
    </label>
  `;
}

function select(label, name, value, options) {
  return `
    <label class="field">
      <span>${label}</span>
      <select data-field="${name}">
        ${options.map(([val, text]) => `<option value="${displayText(val)}" ${val === value ? "selected" : ""}>${displayText(text)}</option>`).join("")}
      </select>
    </label>
  `;
}

function metric(label, value) {
  return `<article class="metric-card"><span>${displayText(label)}</span><strong>${displayText(value, "0")}</strong></article>`;
}

function metricRow(label, value) {
  return `<div class="metric-row"><span>${displayText(label)}</span><strong>${displayText(value)}</strong></div>`;
}

function processList(items, activeIndex) {
  return `
    <div class="process-list">
      ${items.map((item, index) => `
        <div class="${index < activeIndex ? "done" : index === activeIndex ? "current" : "todo"}">
          ${icon(index < activeIndex ? "check_circle" : index === activeIndex ? "pending" : "radio_button_unchecked")}
          <strong>${item}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

// === INTERACTIVE ACTION HANDLING ===
async function handleAction(action, button) {
  if (action === "scanLocker") {
    state.scanning = true;
    render();
    window.setTimeout(async () => {
      state.scanning = false;
      state.locker = demoLockerBlocks[0];
      setRoute("lockerLocation");
      showToast("Đã nhận diện block tủ A");
    }, 500);
  }

  if (action === "manualLocker") {
    state.locker = demoLockerBlocks[0];
    setRoute("lockerLocation");
  }

  if (action === "selectLocker") {
    state.locker = demoLockerBlocks.find((item) => item.publicCode === button.dataset.locker) || demoLockerBlocks[0];
    render();
  }

  if (action === "chooseRole") {
    state.role = button.dataset.role;
    // Auto-fill authentication state with credentials to bypass manual configuration
    state.auth = {
      phone: "0901234567",
      otp: "123456",
      otpSent: true,
      accountExists: true,
      fullName: "Nguyễn Văn A",
      apartmentAddress: "Căn A1204",
      deliveryPartner: "SPX Express",
    };
    saveState();
    setRoute("login");
  }

  if (action === "verifyPhoneOtp") {
    const isShipper = state.role === "shipper";
    const displayName = isShipper ? "Lê Minh Shipper" : "Nguyễn Văn A";
    state.user = {
      email: `${state.auth.phone}@phone.shipmates.local`,
      displayName,
      phone: state.auth.phone,
      role: isShipper ? "Shipper" : "Resident",
    };
    saveState();
    setRoute(isShipper ? "shipperDropoff" : "residentOrders");
  }

  if (action === "selectParcel") {
    state.selectedParcel = demoParcels.find((item) => String(item.id) === button.dataset.id) || demoParcels[0];
    state.payment = null;
    setRoute("residentPayment");
  }

  if (action === "openResidentLocker" || action === "simulatePayment") {
    sendUnlockCommand(); // Send UNLOCK to MQTT server when user opens the locker
    setRoute("residentOpen");
  }

  if (action === "completePickup") {
    const parcel = state.selectedParcel || demoParcels[0];
    state.residentParcels = (state.residentParcels || []).filter((item) => item.id !== parcel.id);
    state.history.unshift({ type: "resident", title: parcel.code, status: "Đã nhận hàng và đóng tủ." });
    saveState();
    setRoute("residentDone");
  }

  if (action === "fillDemoParcel") {
    state.dropoff.parcelCode = "DH118";
    state.dropoff.receiverPhone = "0901234567";
    state.dropoff.receiverName = "Nguyễn Văn A";
    render();
  }

  if (action === "selectCompartment") {
    state.dropoff.selectedCompartmentCode = button.dataset.code;
    render();
  }

  if (action === "createDropoff") {
    const d = state.dropoff;
    state.dropoff.openedParcel = {
      id: `demo-${Date.now()}`,
      code: d.parcelCode || "DH118",
      receiverName: d.receiverName || "Nguyễn Văn A",
      receiverPhone: d.receiverPhone || "0901234567",
      compartmentCode: d.selectedCompartmentCode || "A01",
    };
    sendUnlockCommand(); // Send UNLOCK to MQTT server when shipper confirms dropoff into compartment (e.g. A01)
    state.dropoff.evidenceReady = true;
    saveState();
    setRoute("shipperOpen");
  }

  if (action === "completeDropoff") {
    const parcel = state.dropoff.openedParcel || demoParcels[0];
    state.history.unshift({ type: "shipper", title: parcel.code, status: `Đã gửi vào ngăn ${parcel.compartmentCode}.` });
    state.dropoff = { ...state.dropoff, parcelCode: "DH118", evidenceReady: false, openedParcel: null };
    saveState();
    setRoute("shipperDone");
  }

  if (action === "logout") logout();
}

function logout() {
  state.token = "";
  state.user = null;
  state.role = "";
  localStorage.removeItem("shipmates.token");
  localStorage.removeItem("shipmates.user");
  localStorage.removeItem("shipmates.role");
  showToast("Đã đăng xuất khỏi hệ thống.");
  setRoute("lockerScan");
}

function shell(title, subtitle, body, opts = {}) {
  return `
    <div class="page flow-page">
      ${opts.back ? backButton(opts.back.route, opts.back.label) : ""}
      ${opts.beforeTitle || ""}
      <div class="title-block">
        ${opts.eyebrow ? `<span class="eyebrow">${opts.eyebrow}</span>` : ""}
        <h1>${title}</h1>
        ${subtitle ? `<p class="lead">${subtitle}</p>` : ""}
      </div>
      ${body}
    </div>
  `;
}

// === EVEN LISTENERS ===
document.addEventListener("click", async (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) setRoute(routeButton.dataset.route);

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton || state.isBusy) return;

  state.isBusy = true;
  actionButton.classList.add("is-pressed");
  try {
    await handleAction(actionButton.dataset.action, actionButton);
  } finally {
    state.isBusy = false;
    actionButton.classList.remove("is-pressed");
  }
});

document.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  if (!field) return;
  const [group, name] = field.split(".");
  if (!state[group]) return;
  state[group][name] = event.target.value;
  saveState();
});

// === APPLICATION BOOTSTRAP ===
function boot() {
  setupMQTT(); // Boot MQTT network connection
  state.lockerBlocks = demoLockerBlocks;
  state.locker = demoLockerBlocks[0];
  render();
}

boot();