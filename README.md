# Turkish Nuvio

[Nuvio](https://github.com/yoruix/nuvio) için Türkçe film, dizi ve anime kaynakları. TMDB id ile arama yapar, doğrudan oynatılabilir stream (m3u8/mp4) döndürür.

**Lisans:** [GPL-3.0](LICENSE)

## Nuvio'ya ekle

Nuvio → **Eklentiler** → **Plugin manifest URL** alanına yapıştır:

```
https://raw.githubusercontent.com/fmustafayaman/turkish-nuvio/main/manifest.json
```

Repo public olduktan sonra bu URL doğrudan çalışır; ek sunucu veya deploy gerekmez.

> GitHub Raw CDN bazen manifest'i birkaç dakika cache'ler. Güncelleme sonrası Nuvio'da eklentiyi yenile veya bir süre bekle.

## Kaynaklar

| Provider | Site | İçerik | Format |
|----------|------|--------|--------|
| **Animecix** | animecix.tv | Anime (film + dizi) | mp4 |
| **FullHDFilmizlesene** | fullhdfilmizlesene.life | Film | m3u8 |
| **Dizifilm** | dizifilm.life | Film + dizi | m3u8 |
| **Dizibal** | dizibal.com | Film + dizi | m3u8 |

## Geliştirme

```bash
npm install
npm run build          # tüm provider'lar → providers/
node build.js dizibal # tek provider
npm start             # yerel test: http://localhost:3000/manifest.json
```

Tek provider testi:

```bash
node -e "require('./providers/dizibal').getStreams('115678','tv',1,1).then(s=>console.log(s.length, s[0]?.title))"
```

## Proje yapısı

```
src/           # kaynak kod (provider başına klasör)
providers/     # build çıktıları (Nuvio bunları yükler)
manifest.json  # eklenti kaydı
build.js       # esbuild bundler
server.js      # yerel geliştirme sunucusu
```

## Notlar

- **TMDB API:** Nuvio plugin runtime'ı TMDB anahtarını provider'a enjekte etmez. Başlık/IMDB eşleştirmesi için provider'larda topluluk genelinde kullanılan public TMDB anahtarı gömülüdür (kişisel anahtar değil).
- **Domain değişimi:** FullHDFilm / Dizifilm → `src/<provider>/constants.js` içindeki `DOMAIN_CANDIDATES`.
- **Medya tipi:** Dizifilm ve Dizibal `tv`, `series`, `show` hepsini dizi kabul eder.
- **Altyazı:** Dizifilm, FullHDFilm, Dizibal `getSubtitles` export'u sunar.

## Katkı

Pull request'ler memnuniyetle karşılanır. Yeni provider eklerken `src/<id>/` + `manifest.json` + `npm run build` akışını izleyin.

## Sorumluluk reddi

Bu proje yalnızca eğitim ve kişisel kullanım amaçlıdır. İçerik kaynaklarına ait telif hakları ilgili sahiplerindedir. Kullanıcı, yerel yasalara uygunluktan kendisi sorumludur.
