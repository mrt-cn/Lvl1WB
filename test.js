import { isConnected, requestAccess } from "@stellar/freighter-api";
//Cüzdanı Bağlama Fonksiyonu

async function connectWallet() {
  if (await isConnected()) {
    try {
      // requestAccess artık bir obje dönüyor, içindeki address alanını alıyoruz
      const result = await requestAccess();

      // Eğer dönen sonuç bir obje ise result.address, eski versiyonsa direkt result kullan
      const publicKey = typeof result === 'object' ? result.address : result;

      console.log("Cüzdan başarıyla bağlandı! Adres:", publicKey);
      return publicKey;
    } catch (error) {
      console.error("Kullanıcı cüzdan bağlantısını reddetti veya hata oluştu:", error);
    }
  } else {
    alert("Lütfen önce Freighter cüzdan uzantısını tarayıcınıza yükleyin!");
  }
}


// Cüzdan Bağlantısını Kesme Fonksiyonu
function disconnectWallet() {
  // NOT: Web3 cüzdanlarında (Freighter dahil) doğrudan cüzdanın içindeki oturumu kodla kapatamazsınız. 
  // Bağlantıyı kesmek (Disconnect), uygulamanızın hafızasındaki (state) cüzdan adresini temizlemek anlamına gelir.
  
  console.log("Cüzdan bağlantısı uygulama tarafında kesildi.");
  // Arayüzündeki cüzdan adresi değişkenini null/boş yapmalısın.
  return null;
}


// HTML elementlerini seçiyoruz
const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const walletStatus = document.getElementById("walletStatus");

// Bağlan butonuna tıklandığında
connectBtn.addEventListener("click", async () => {
  const publicKey = await connectWallet();
  if (publicKey) {
    walletStatus.innerText = `Bağlı Adres: ${publicKey}`;
    connectBtn.style.display = "none";
    disconnectBtn.style.display = "inline";
  }
});

// Bağlantıyı Kes butonuna tıklandığında
disconnectBtn.addEventListener("click", () => {
  disconnectWallet();
  walletStatus.innerText = "Cüzdan bağlı değil.";
  connectBtn.style.display = "inline";
  disconnectBtn.style.display = "none";
});


