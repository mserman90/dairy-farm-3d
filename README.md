# 🐄 Süt Sığırı Çiftliği 3D (3D Dairy Cattle Farm Simulator)
**Gerçekçi Süt Sığırcılığı ve Sürü Yönetimi Simülasyonu**

> **Sürüm:** 1.0.0  
> **Platform:** Web / Tarayıcı (React 19 + TypeScript + Three.js + Tailwind CSS v4 + Zustand + Web Audio API)  
> **Dil:** İki dilli (Türkçe / English)

---

## 🎯 Özellikler & Gerçekçi Tarımsal Sistemler

1. **Sürü Sistemi (Herd Lifecycle & Cattle Registry):**
   - **Bireysel Hayvan Kütüğü:** Her sığır benzersiz ID, kulak küpesi no, isim, ırk, yaş, canlı ağırlık, kondisyon skoru (BCS), laktasyon günü, somatik hücre sayısı (SCC) ve soy ağacına sahiptir.
   - **Yaşam Döngüsü Evreleri:** Buzağı (0–2 ay), Sütten kesilmiş buzağı (2–6 ay), Düve (6–24 ay), Gebe Düve, Sağılan İnek (Laktasyon 1–305 gün), Kuru Dönem (60 gün dinlenme) ve Sürüden Çıkarma (Culling).
   - **Irklar:**
     - **Holstein-Friesian:** Pik 42 L, %3.7 yağ, %3.2 protein, yüksek verim.
     - **Jersey:** Pik 26 L, %5.0 yağ, %3.9 protein, zengin yağ/protein, kompakt gövde.
     - **Simmental (Fleckvieh):** Pik 30 L, %4.0 yağ, %3.4 protein, kombine süt+et ırkı.
     - **Brown Swiss (Montofon):** Pik 28 L, %4.0 yağ, %3.5 protein, güçlü tırnak/ayak yapısı, uzun ömür.
   - **Özel Irk Mühendisi (Custom Breed Engineer):**
     - Kendi genetik ırkınızı tasarlayın: Pik verim, yağ/protein oranları, yetişkin ağırlık, hastalıklara direnç, sıcak toleransı, gövde rengi, alaca benek rengi ve boynuz yapısı.
   - **Genetik & Yapay Tohumlama (AI Sire Catalog):**
     - 12 damızlık boğadan oluşan sperma kataloğu (+Süt indeksi, Tip/Meme yapısı, Ayak-bacak puanı, Doğum kolaylığı).
     - Akrabalık katsayısı ($F$) hesabı ve akraba eşleşmesi cezası.
     - Genomik test (opsiyonel analiz, $\pm 15\%$ doğruluk).

2. **Beslenme & TMR Rasyon Yönetimi (Nutrition):**
   - **Yem Bileşenleri:** Mısır silajı, Yonca kuru otu, Çayır otu, Süt yemi konsantresi (%18 HP), Soya küspesi (%44 HP), Mısır kırması, Mineral/vitamin premiksi.
   - **TMR Analizi:** Kuru madde tüketimi (DMI kg), Net Enerji Laktasyon (NEL MJ/kg KM), Ham Protein (% HP), Lif (NDF %).
   - **Rumen Asidozu Risk Ölçümü:** Lif oranı NDF <%28 olduğunda asidoz riski canlı olarak hesaplanır.
   - **Yem Depo & Silo Yönetimi:** Mısır silajı bunkerleri ve yem siloları için toplu alım ve stok takibi.

3. **Sağım & Wood Laktasyon Eğrisi (Milking):**
   - **Wood Modeli:** $Y(t) = a \cdot t^b \cdot e^{-c \cdot t}$ formülü ile 305 günlük laktasyon seyrini bireysel ve interaktif SVG grafiğinde gösterir.
   - **Sağım Sistemleri:** Boru hatlı, 2x8 Paralel sağım salonu, Döner (Rotary) platform veya **AMS Robotik Otomatik Sağım**.
   - **Süt Kalitesi & Ödeme:** Taban fiyat (€0.42/L), yağ/protein kalite primleri, Somatik Hücre Sayısı (SCC > 400k) cezası ve Organik Süt (+%30) primi.

4. **Sağlık & Veteriner Yönetimi (Health & Biosecurity):**
   - **Gizli Durum / Belirti Dinamiği:** Mastitis (24s pencere), Laminitis (48s pencere), Ketozis (12s pencere), Hipokalsemi / Milk fever (4s kritik pencere), Metritis (3 gün) ve Rumen asidozu.
   - **Veteriner Çağrısı:** Acil veteriner muayenesi ve tedavi.
   - **Koruyucu Hekimlik:** Tüm sürü tırnak bakımı (60 gün koruma) ve koruyucu aşı takvimi (90 gün bağışıklık).

5. **Barınak, Altyapı & Refah (Housing):**
   - Serbest duraklı (Freestall), Bağlı (Tie-stall), Mera tabanlı veya Kompost yataklı barınak sistemleri.
   - Havalandırma fanları & sisleme (Sıcaklık > 25°C veya THI > 72 olduğunda ısı stresini önler).
   - 16 saat fotoperiyot aydınlatması (+%5 süt artışı).
   - Otomatik hidrolik gübre sıyırıcı ve hijyen takibi.

6. **Finans & Banka Kredileri (Economy):**
   - Litre başı maliyet (€/L), inek başına yıllık gelir, yem dönüşüm etkinliği (FCE), sürü yenileme oranı.
   - Banka kredisi çekme, borç ödeme, günlük faiz ve gelir-gider tablosu.

7. **Tamamen Sentetik Web Audio API Ses Motoru:**
   - Harici ses dosyası indirilmez; inek böğürmesi (formant filtreli osilatörler), sağım pulsatörü (`tsch-chhh`), traktör motoru, kırsal ambiyans, alarm sesleri ve prosedürel pastoral müzik Web Audio ile canlı sentezlenir.

8. **İnteraktif 3D Çiftlik Sahnesi (Three.js):**
   - Serbest duraklı barınak, metal makaslar, sarı durak demirleri, dönen tavan fanları, silolar, süt tankı, buzağı kulübeleri, traktör & TMR mikser vagonu, çitlerle çevrili mera ve otlayan/yatan/geviş getiren animasyonlu sığırlar.
   - Gece/gündüz ışıklandırması (şafak, öğle, gün batımı, gece aydınlatması) ve dinamik hava durumu parçacıkları (yağmur, kar).

---

## 🎮 Kontroller & Kısayollar

| Tuş | Eylem |
|---|---|
| `W A S D` / Sürükle | Kamerayı ileri, geri, sola, sağa hareket ettir |
| `Q / E` | Kamerayı yükselt / alçalt |
| `Fare Tekerleği` | Yakınlaş / uzaklaş (Zoom) |
| `R` | Kamera pozisyonunu sıfırla |
| `1` | 1. Çiftlik Genel Bakış |
| `2` | 2. Sağım Salonu |
| `3` | 3. Serbest Duraklı Barınak |
| `4` | 4. Buzağı Kulübeleri |
| `5` | 5. Yem Siloları & Depo |
| `Space` | Simülasyonu Duraklat / Devam Et |
| `F` | Hızı Değiştir (1× → 4× → 12× → 24× → 120×) |
| `Tab` | Sürü Yönetimi Panelini Aç / Kapat |
| `H` | Zen Modu (Arayüzü Gizle) |
| `Esc` | Açık Modalı veya Seçili İneği Kapat |
| `Sol Tık (İnek)` | İneğin detaylı pasaportunu ve laktasyon eğrisini açar |

---

## 🛠️ Kurulum & Çalıştırma

```bash
# Proje dizinine girin
cd C:\Users\mert\.gemini\antigravity\scratch\dairy-farm-3d

# Geliştirme sunucusunu başlatın
npm run dev

# Saf simülasyon birim testlerini çalıştırın
npm test

# Üretim derlemesi oluşturun
npm run build
```
