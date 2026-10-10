AC/DC BİLİŞİM — ORTAK DEMO

YERELDE ÇALIŞTIRMA
1. Node.js LTS kurulu olsun.
2. Bu ZIP dosyasını tamamen çıkar.
3. start-localhost.bat dosyasına çift tıkla.
4. Site: http://localhost:3017
5. Yönetim: http://localhost:3017/admin

DEMO GİRİŞ
Kullanıcı: acdcadmin
Şifre: ACdc2026!

BU SÜRÜMDE NE DEĞİŞTİ?
- Fotoğraflar, logo, işlerimiz kartları (her işe birden fazla fotoğraf), hizmetler, metinler ve görünüm sunucudaki data/site-state.json dosyasına kaydedilir.
- Siteyi başka cihazdan açan ziyaretçiler de sunucuda kaydedilen aynı içeriği görür.
- Teklif talepleri data/requests.json dosyasına kaydedilir ve yönetim panelinde listelenir.
- Fotoğraflar için 100 MB JSON isteği sınırı bulunur; çok sayıda fotoğraf eklerken dosyaları küçük tutun.

İNTERNETE ÜCRETSİZ DEMO YAYINLAMA
Render gibi bir Node.js Web Service kullanabilirsiniz. Build command: npm install (package.json gerekmediğinden boş bırakılabilir); Start command: node server.js. Sunucu PORT ortam değişkenini kullanır. Kullanıcı/şifreyi ACDC_ADMIN_USER ve ACDC_ADMIN_PASS ortam değişkenleriyle ayarlayın.

ÖNEMLİ BARINDIRMA NOTU
Bu demo, JSON dosyalarını sunucunun yerel diskinde tutar. Bazı ücretsiz hosting servisleri yeniden dağıtımda veya uyku/yeniden başlatmada yerel dosyaları silebilir; kalıcı veriler için kalıcı disk ya da harici veritabanı/depolama gerekir. Gerçek müşterilerin bilgilerini toplamadan önce HTTPS, güçlü parola, yedekleme ve KVKK/gizlilik metnini tamamlayın.
