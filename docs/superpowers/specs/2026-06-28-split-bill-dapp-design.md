# Split Bill dApp — Tasarım Dokümanı

**Tarih:** 2026-06-28
**Seviye:** Stellar Level 1 (White Belt)
**Yığın:** React + Vite + TypeScript + Tailwind CSS

## 1. Amaç

Stellar Testnet üzerinde çalışan bir "Hesap Bölüştürme" web dApp'i. Kullanıcı
Freighter cüzdanını bağlar, XLM bakiyesini görür, toplam hesabı ve kişi sayısını
girer, kişi başı tutar hesaplanır ve kendi payını tek bir alıcı adrese XLM olarak
gönderir.

Level 1 gereksinimlerinin tamamını karşılar:
- Freighter cüzdan kurulumu (Testnet)
- Cüzdan bağla / bağlantıyı kes
- Bağlı cüzdanın XLM bakiyesini çekme ve gösterme
- Testnet'te XLM transferi + kullanıcıya işlem geri bildirimi (başarı/hata, hash)

## 2. Mimari

Sorumluluk ayrımına dayalı katmanlar:

- **UI Katmanı (React bileşenleri):** Yalnızca görünüm ve kullanıcı etkileşimi.
- **Servis Katmanı (`src/lib/`):** Stellar/Freighter ile tüm iletişim. Saf
  TypeScript, React'tan bağımsız, ayrı test edilebilir.
- **State Katmanı (React hook'ları):** Cüzdan adresi, bakiye, işlem durumu.

### Dosya yapısı

```
src/
├── lib/
│   ├── freighter.ts      # connect, disconnect, getAddress
│   ├── stellar.ts        # getBalance, sendPayment, isValidAddress (Horizon testnet)
│   └── splitBill.ts      # kişi başı tutar hesaplama (saf fonksiyon)
├── hooks/
│   └── useWallet.ts      # cüzdan state'i (adres, bağlı mı)
├── components/
│   ├── WalletConnect.tsx # bağla/kes butonu + adres gösterimi
│   ├── BalanceCard.tsx   # XLM bakiye gösterimi
│   ├── SplitForm.tsx     # toplam tutar + kişi sayısı + hesaplama + gönderim
│   └── TxStatus.tsx      # işlem geri bildirimi (başarı/hata/hash)
├── App.tsx               # bileşenleri bir araya getirir
└── main.tsx
```

Not: Önceki deneme dosyaları (`test.js`, kök `index.html`) yok sayılacak / temizlenecek.

## 3. Veri Akışı

### Cüzdan bağlama
1. "Cüzdanı Bağla" → `freighter.ts` → `isConnected()` → `requestAccess()` → public key.
2. `useWallet` hook adresi state'e yazar.
3. Adres geldiğinde `stellar.ts → getBalance(address)` Horizon Testnet'ten XLM
   bakiyesini çeker, `BalanceCard` gösterir.
4. "Bağlantıyı Kes" → state temizlenir (adres `null`), UI sıfırlanır.

### Hesap bölüştürme (saf fonksiyon — `splitBill.ts`)
- Girdi: `toplamTutar` (XLM), `kisiSayisi`.
- Çıktı: `kisiBasiTutar = toplamTutar / kisiSayisi`, 7 ondalık basamağa yuvarlanır
  (Stellar XLM hassasiyeti = 7 hane).
- Doğrulama: tutar > 0, kişi sayısı ≥ 1 (tam sayı).

### Ödeme (`stellar.ts → sendPayment`)
1. Kullanıcı alıcı adresi girer; hesaplanan kişi başı tutar gönderilecek miktar
   olarak gelir (kullanıcı düzenleyebilir).
2. Alıcı adres geçerliliği `StrKey` ile kontrol edilir.
3. Horizon'dan gönderen hesabı yüklenir → `TransactionBuilder` + `Payment`
   operation → `Networks.TESTNET` passphrase.
4. İşlem Freighter'a `signTransaction` ile imzalatılır.
5. İmzalı işlem Horizon'a `submitTransaction` ile gönderilir.
6. Sonuç (`hash`) `TxStatus` bileşeninde gösterilir.

### Ağ ayarları
- Horizon Testnet: `https://horizon-testnet.org`
- Network passphrase: `Networks.TESTNET`

## 4. Hata Yönetimi

| Durum | Davranış |
|-------|----------|
| Freighter kurulu değil | Uyarı + indirme linki |
| Bağlantı reddedildi | Mesaj, UI eski haline döner |
| Hesap testnet'te yok (fonlanmamış) | "Friendbot ile fonlayın" + link/buton |
| Geçersiz alıcı adresi | Inline doğrulama, gönder butonu pasif |
| Yetersiz bakiye | "Yetersiz bakiye" uyarısı |
| İmzalama iptal | "İşlem iptal edildi" |
| Gönderim hatası | Horizon'dan gelen sebep gösterilir |

**İşlem durum makinesi (`TxStatus`):** `idle → signing → submitting → success | error`.
İşlem sırasında buton pasif + spinner. Başarıda hash + Stellar Expert testnet linki.

## 5. Test Yaklaşımı

- **Birim testleri (Vitest):** `splitBill.ts` (bölme, yuvarlama, geçersiz girdi),
  adres doğrulama.
- **Servis katmanı:** `stellar.ts` / `freighter.ts` için Freighter API ve Horizon
  mock'lanarak temel akış testleri.
- **Manuel doğrulama:** Gerçek Freighter + Testnet ile bağlanma, bakiye, gerçek
  işlem gönderimi (README ekran görüntüleri için).
- TDD: önce saf mantık (`splitBill.ts`) için test, sonra implementasyon.

## 6. Teslimat (Submission) Gereksinimleri

- Public GitHub reposu + README (proje açıklaması, yerel çalıştırma adımları,
  ekran görüntüleri: cüzdan bağlı, bakiye, başarılı işlem + sonuç gösterimi).
