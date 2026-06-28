# Stellar Hesap Bölüştürme (Split Bill dApp)

Stellar **Testnet** üzerinde çalışan bir "hesap bölüştürme" web uygulamasıdır.
Freighter cüzdanını bağlar, XLM bakiyeni gösterir, bir hesabı kişi sayısına böler
ve senin payını seçtiğin bir adrese tek bir XLM ödemesiyle gönderir.

> Stellar Level 1 (White Belt) challenge projesi.

## Özellikler

- 🔌 **Cüzdan bağla / bağlantıyı kes** — Freighter (Stellar Testnet)
- 💰 **Bakiye gösterimi** — bağlı cüzdanın XLM bakiyesini Horizon Testnet'ten çeker
- ➗ **Hesap bölüştürme** — toplam tutar ÷ kişi sayısı = kişi başı tutar (7 ondalık, XLM hassasiyeti)
- 📤 **XLM transferi** — payını bir alıcı adrese gönderir
- ✅ **İşlem geri bildirimi** — imzalanıyor / gönderiliyor / başarılı / hata durumları,
  başarıda işlem hash'i + Stellar Expert (testnet) gezgin linki

## Teknolojiler

- React 18 + TypeScript
- Vite
- Tailwind CSS
- [@stellar/stellar-sdk](https://www.npmjs.com/package/@stellar/stellar-sdk) (Horizon Testnet)
- [@stellar/freighter-api](https://www.npmjs.com/package/@stellar/freighter-api)
- Vitest (birim testleri)

## Ön Koşullar

1. **Node.js 18+** ve npm
2. **Freighter** tarayıcı eklentisi — https://www.freighter.app/
   - Eklentiyi kurduktan sonra ağ olarak **Testnet**'i seç.
3. **Fonlanmış bir testnet hesabı** — hesabın testnet'te yoksa bakiye alınamaz.
   Freighter adresini Friendbot ile fonla: https://friendbot.stellar.org/?addr=ADRESIN

## Kurulum ve Çalıştırma (yerel)

```bash
# 1. Bağımlılıkları kur
npm install

# 2. Geliştirme sunucusunu başlat
npm run dev
# Tarayıcıda Vite'ın verdiği adresi aç (genellikle http://localhost:5173)
```

Diğer komutlar:

```bash
npm run build   # production build (tsc + vite build)
npm run preview # build çıktısını önizle
npm test        # birim testlerini çalıştır (Vitest)
```

## Kullanım

1. **Cüzdanı Bağla** butonuna tıkla, Freighter'da erişimi onayla.
2. Bağlandığında adresin ve XLM bakiyen görünür. (Hesap fonlanmamışsa "Friendbot ile
   fonlayın" uyarısı çıkar.)
3. **Toplam tutar** ve **kişi sayısı** gir, **Kişi Başı Hesapla**'ya bas.
4. **Alıcı adresi** (G... ile başlayan) ve gönderilecek **tutarı** gir (kişi başı tutar
   otomatik gelir, düzenleyebilirsin).
5. **Payımı Gönder**'e bas, Freighter'da işlemi imzala.
6. Başarılı olduğunda işlem hash'i ve gezgin linki görünür.

## Ekran Görüntüleri

> Ekran görüntüleri `docs/screenshots/` altında. (Aşağıdaki dosyaları kendi
> testnet işleminden alıp ekle.)

| Cüzdan bağlı | Bakiye gösterimi | Başarılı işlem |
|---|---|---|
| ![Cüzdan bağlı](docs/screenshots/wallet-connected.png) | ![Bakiye](docs/screenshots/balance.png) | ![İşlem](docs/screenshots/transaction-success.png) |

## Proje Yapısı

```
src/
├── lib/
│   ├── splitBill.ts      # kişi başı tutar hesabı (saf fonksiyon, testli)
│   ├── stellar.ts        # adres doğrulama, bakiye, ödeme (Horizon Testnet)
│   └── freighter.ts      # Freighter cüzdan sarmalayıcısı
├── hooks/
│   └── useWallet.ts      # cüzdan state'i (adres, bakiye, durum)
├── components/
│   ├── WalletConnect.tsx
│   ├── BalanceCard.tsx
│   ├── SplitForm.tsx
│   └── TxStatus.tsx
├── App.tsx
└── main.tsx
```

## Ağ

Uygulama yalnızca **Stellar Testnet** kullanır:

- Horizon: `https://horizon-testnet.org`
- Network passphrase: `Test SDF Network ; September 2015`

Gerçek (mainnet) fon kullanılmaz.

## Lisans

MIT
