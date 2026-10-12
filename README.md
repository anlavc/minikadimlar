# Minik Adımlar — Tanıtım sitesi

Prematüre bebek takibi uygulamasının Türkçe landing page'i. Yoğun bakım günlüğü, gelişim ve bakım özellikleri, iletişim formu ve iki bağımsız hukuki sayfa içerir.

## Yayın adresleri

- Ana sayfa: https://anlavc.github.io/minikadimlar/
- Gizlilik politikası: https://anlavc.github.io/minikadimlar/gizlilik-politikasi/
- Kullanım koşulları: https://anlavc.github.io/minikadimlar/kullanim-kosullari/
- İletişim: https://anlavc.github.io/minikadimlar/#iletisim

## Yerel önizleme

Derleme veya bağımlılık kurulumu gerekmez. Repo klasöründe:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

http://127.0.0.1:4173 adresini açın. HTML/CSS/JS ve marka görselleri yerel dosyalardan yüklenir; harici font veya web analiz betiği kullanılmaz.

## GitHub Pages

Repository → Settings → Pages → Build and deployment:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/ (root)**

`.nojekyll` dosyası sayesinde statik kaynaklar doğrudan yayımlanır. Sonraki `main` güncellemeleri yayını yeniler.

## İletişim formu

Formspree endpoint: `https://formspree.io/f/mkjozerq`.

İletişim e-postası: `anilavcidev@gmail.com`. Formspree'nin bildirim alıcısı endpoint sahibinin Formspree panelinde yönetilir; HTML alıcı ayarını değiştiremez. Gerçek mesaj gönderimi yapmadan form davranışları denetlenebilir. JavaScript açıkken sonuç aynı sayfada gösterilir, hata durumunda alanlar korunur. JavaScript kapalıyken standart HTML POST çalışır. Formda honeypot, yerleşik doğrulama, erişilebilir durum mesajı ve 20 saniyelik zaman aşımı vardır.

## Uygulamadaki Ayarlar bağlantıları

Uygulamanın `SettingsView` görünümü aşağıdaki Info.plist anahtarlarını okur. Bu repo uygulama kodunu değiştirmez; bağlantılar sonraki uygulama güncellemesinde eklenebilir:

```xml
<key>PrivacyPolicyURL</key>
<string>https://anlavc.github.io/minikadimlar/gizlilik-politikasi/</string>
<key>TermsOfUseURL</key>
<string>https://anlavc.github.io/minikadimlar/kullanim-kosullari/</string>
<key>SupportURL</key>
<string>https://anlavc.github.io/minikadimlar/#iletisim</string>
```

## Bakım

App Store bağlantısı: https://apps.apple.com/tr/app/id6766058604. Ana sayfadaki indirme düğmesi ve aile bölümü bu adrese yönlenir. Telefonda ve günlükteki veriler açıkça temsili olarak işaretlenmiştir.

Özellikler ve hukuki metinler mevcut SwiftUI/SwiftData uygulaması incelenerek hazırlanmıştır. Gizlilik metni Firebase Analytics/Crashlytics, RevenueCat, Apple, GitHub Pages ve Formspree kullanımını açıklar. Yeni bir SDK, yedekleme, veri aktarımı veya abonelik özelliği geldiğinde metinleri ve tarihlerini güncelleyin. Gerçek hizmet yapılandırmasıyla veri işleme yükümlülüklerinin uyumu, uygulama sahibinin ayrıca değerlendirmesi gereken bir konudur.

## Kontrol

```sh
node --check assets/site.js
python3 scripts/check-site.py
```

Bu kontrol yerel dosya bağlantılarını, sayfa içi hedefleri, yinelenen HTML kimliklerini, temel metadata'yı, form endpoint'ini ve etiketleri denetler. Form gönderim durumları `node --test scripts/form-behavior.test.cjs` ile dış hizmete mesaj göndermeden doğrulanır.
