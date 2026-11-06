# remotion-uz-reels

O'zbek tilidagi vertikal (9:16) Reels/Shorts uchun **Remotion** bilan kodda yozilgan uchta montaj shabloni: so'zma-so'z subtitrlar, motion-dizayn kartalari va jim SFX.

> **Bu repoda faqat kod bor.** Asl videolar, tayyor montajlar, spikerlarning ovozi va transkriptlari yuklanmagan. `captions.json` fayllarida namuna matn turibdi: loyiha darhol ishga tushadi, lekin o'z videongiz uchun subtitrlarni qaytadan yaratishingiz kerak. API kalitlari kerak emas, hammasi kompyuteringizda (CPU'da ham) ishlaydi.

## Shablonlar

| Papka | Uslub | Qanday yig'iladi |
|---|---|---|
| [`01-miya-motion-card`](01-miya-motion-card) | Katta Anton sarlavhalar va Playfair kursivi, to'q sariq chiplar. Spiker to'q bordo to'rli fonda kichik kartaga aylanadi, o'ng tomonda oq UI karta chiqadi. | Bitta `Edit` kompozitsiyasi, SFX Remotion ichida |
| [`02-umurtqa-greenscreen`](02-umurtqa-greenscreen) | Poppins subtitrlar blur bilan so'zma-so'z chiqadi. Muzli shisha kartalar (ba'zilari bosh orqasida), "#1" glitch markerlar, xrom sarlavhali ro'yxat, "keyingi video" kartasi. | Yashil fon: `Behind` (shaffof emas) va `Front` (ProRes 4444, shaffof) qatlamlari, keyin `composite.py` ffmpeg chromakey bilan yig'adi |
| [`03-neyro-neon`](03-neyro-neon) | Oq Montserrat subtitrlar, kalit so'zlar qiya neon Oswald'da. Qora changli sahnalar: hisoblagichli shisha karta, ①②③ yoyi, olmos belgi, Instagram/Telegram tugmalari. | Bitta `Edit` kompozitsiyasi ovozsiz render qilinadi, keyin `mix.py` ovoz va SFX qo'shadi |

Sarlavhalar, kartalar va vaqt belgilari (soniyalar) asl videolarga moslab yozilgan. Ularni o'z videongizga moslab `Edit.tsx` / `Front.tsx` ichida o'zgartirasiz. Bu tayyor "bosib ishlatiladigan" dastur emas, montaj uchun boshlang'ich shablon.

## Kerakli dasturlar

- [Node.js](https://nodejs.org) 18+
- [FFmpeg](https://ffmpeg.org) (`PATH`'da bo'lishi kerak). `02` uchun 6.1+, `-/filter_complex` tufayli 9.x tavsiya qilinadi
- Python 3.10+ (subtitr va ovoz skriptlari uchun)
- Subtitr uchun: [faster-whisper](https://github.com/SYSTRAN/faster-whisper) va o'zbekcha model, masalan [`abduaziz/navaistt_v2_medium_ct2`](https://huggingface.co/abduaziz/navaistt_v2_medium_ct2). Tekshirish uchun [whisper.cpp](https://github.com/ggml-org/whisper.cpp) ham foydali

```bash
pip install faster-whisper "av<19"
```

`av` 19 versiyasi faster-whisper 1.2.1 bilan ishlamaydi (`metadata_errors` xatosi), shuning uchun 18.x qoldiring.

## Ishlatish tartibi

Quyidagi misol `03-neyro-neon` uchun. Qolgan ikkitasi ham shunga o'xshaydi, farqlari pastda.

**1. Videoni tayyorlang.** Kesilgan va rangi to'g'rilangan klipni `03-neyro-neon/edit/public/base.mp4` qilib qo'ying (1080×1920, 30 fps).

**2. SFX yarating.** Barcha tovushlar FFmpeg bilan sintez qilinadi, hech qanday litsenziya talab qilmaydi:

```bash
python common/make_sfx.py 03-neyro-neon/edit/public
```

**3. Subtitr yarating:**

```bash
ffmpeg -i 03-neyro-neon/edit/public/base.mp4 -ar 16000 -ac 1 audio.wav
python common/stt.py <model papkasi> audio.wav 03-neyro-neon/navai.json
python 03-neyro-neon/build_words.py 03-neyro-neon/navai.json 03-neyro-neon/edit/src/captions.json
```

`build_words.py` ichida asl videoga xos imlo tuzatishlari va kesish vaqtlari bor. Ularni o'z matningizga moslang. NavaiSTT ilmiy atamalarni ba'zan noto'g'ri eshitadi, shuning uchun natijani whisper.cpp bilan solishtirib, qo'lda tuzating.

**4. Ko'rish va render:**

```bash
cd 03-neyro-neon/edit
npm install
npm run studio                       # brauzerda jonli ko'rish
npx remotion render src/index.ts Edit out/video.mp4 --muted
```

**5. Ovoz va SFX:**

```bash
python 03-neyro-neon/mix.py 03-neyro-neon/edit/out/video.mp4 03-neyro-neon/edit/public/base.mp4 03-neyro-neon/edit/public final.mp4
```

### 01-miya-motion-card

1–4-qadamlar xuddi shunday. SFX `Edit.tsx` ichida `<Audio>` orqali qo'shiladi, shuning uchun oddiy render yetarli:

```bash
npx remotion render src/index.ts Edit out/edit.mp4
```

`mix_sfx.py` esa SFX'ni ffmpeg orqali alohida qo'shish uchun muqobil yo'l.

### 02-umurtqa-greenscreen

Yashil fonda (≈`#9CCF48`) suratga olingan 4K klip uchun:

```bash
cd 02-umurtqa-greenscreen/edit && npm install
npx remotion render src/index.ts Behind out/behind.mp4
npx remotion render src/index.ts Front out/front.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
cd .. && python composite.py <raw.MOV> edit/out/behind.mp4 edit/out/front.mov final.mp4
```

Zoom, siljish va marker vaqtlari `edit/src/layout.json` faylida turadi. `composite.py --test 5,12.5` buyrug'i faqat shu soniyalardagi kadrlarni chiqarib, natijani tez tekshirish imkonini beradi.

## Foydali saboqlar

- **Video:** `OffthreadVideo` ba'zi kliplarda "No frame found" xatosini berdi. `@remotion/media` ichidagi `Video` ishonchliroq ishlaydi.
- **Shriftlar:** `fonts.ts` ichida woff2 shriftlar data URI ko'rinishida turadi va oddiy CSS `@font-face` bilan yuklanadi. `delayRender` ichida `FontFace` promise'ini kutish uzun renderlarda timeout'ga olib keldi (`02` va `03` dagi usulga qarang; `01` hali eski usulda).
- **Kamera zonasi:** telefon kamerasi va status bar tepadagi taxminan 200 px'ni yopadi. Yuqoridagi sarlavha va kartalarni 1080×1920 kadrda kamida 200 px pastdan boshlang (kichik matn uchun ≈250 px).
- **Ovoz:** oxirida `loudnorm=I=-15` qo'llaniladi, SFX esa past balandlikda (0.12–0.35) qo'shiladi.

## Litsenziya

Kod: [MIT](LICENSE). `fonts.ts` ichidagi shriftlar (Anton, Playfair Display, Manrope, Poppins, Montserrat, Oswald, monospace) Google Fonts'dan olingan va o'z litsenziyasida qoladi (SIL OFL 1.1 / Apache 2.0).

---

### English summary

Three code-only Remotion templates for vertical Uzbek-language reels: word-by-word captions, motion-design cards and quiet synthesized SFX. No footage, renders or transcripts are included: `captions.json` holds placeholder text. Steps: put your clip in `edit/public/base.mp4`, run `common/make_sfx.py`, transcribe with `common/stt.py` (faster-whisper + an Uzbek CT2 model), shape captions with `build_words.py`, then `npm install` and render. Template `02` is a green-screen pipeline: two Remotion layers composited by `composite.py`.
