# Aqlli sinf — prototip

## Fayllar
- `index.html` — **bosh sahifa** (vositalar ro'yxati). Saytni shu fayldan oching.
- `kim-chiqadi.html` — kamera orqali tasodifiy o'quvchi tanlash.
- `qiziqarli-matematika.html` — ikki jamoaning matematik bellashuvi.
- `baraban.html` — savollar barabani (geografiya).
- `sinf-daftari.html` — o'quvchilarga yulduz berish, sinf va o'quvchilarni boshqarish.
- `reyting.html` — sinflar reytingi (doska va koridor televizori uchun: `reyting.html?tv`).
- `js/` — umumiy kod: `config.js` (Supabase kalitlari), `store.js` (ma'lumotlar), `ui.js` (oynalar).
- `img/` — rasmlar.
- `ishga-tushirish.bat` — kamera fayldan ochilmasa, saytni `http://localhost:8000` manzilida ochadi (kompyuterda Python bo'lishi kerak).

Birinchi ochilishda internet kerak (shriftlar va "Kim chiqadi?" uchun yuzni topish modeli yuklanadi).

## Kim chiqadi?
- **📸 Boshlash** (yoki klaviaturada **Probel**) — 3-2-1 sanaladi, rasm olinadi, yuzlar topiladi.
- **🎲 Tanlash** — barabanli animatsiya. "Avtomatik tanlash" yoqilgan bo'lsa, o'zi boshlanadi.
- Noto'g'ri topilgan ramkani bosib o'chirish mumkin (tanlashdan oldin).
- **🖼️** — kamerasiz sinash uchun sinf rasmini yuklash.
- **⚙️** — sozlamalar: nechta o'quvchi (1–4), takrorlanmaslik, sezgirlik, ishonch chegarasi, sinov rejimi.
- Rasm faqat xotirada turadi, hech qayerga yuborilmaydi va 2 daqiqadan keyin o'chiriladi.

**Sinovda yozib olish kerak:** yuqoridagi `Topildi: N · X ms · Y bo'lak · GPU/CPU` yozuvi, sinfdagi haqiqiy o'quvchilar soni, xato ramkalar soni, kamera turi va joylashuvi.

## Qiziqarli matematika
1. Jamoa nomlari, amallar, daraja, vaqt va g'alaba uchun qadamlar sonini tanlang → **▶ Boshlash**.
2. Har bir jamoa o'z tomonidagi klaviaturada javobni yozadi va **✓** ni bosadi.
3. To'g'ri javob arqonni o'z tomonga 1 qadam tortadi. Belgilangan chiziqqa birinchi yetgan jamoa yutadi. Vaqt tugasa, arqon qaysi tomonda bo'lsa, o'sha jamoa g'olib.
4. ⏸ — pauza, 🔊 — ovozni o'chirish/yoqish.

## Savollar barabani
1. **🎡 Aylantirish** tugmasini (yoki baraban markazini, yoki **Probel**ni) bosing.
2. Ko'rsatkich to'xtagan bo'limdan savol chiqadi. Javob variantini bosing yoki "👁️ Javobni ko'rsatish" ni tanlang.
3. **🎡 Keyingi savol** — barabanga qaytish. **🔄 Qaytadan** — barcha savollarni qayta tiklash.

Savollar `baraban.html` ichidagi `SUBJECT` ro'yxatida turadi: `["savol", "to'g'ri javob", "xato1", "xato2", "xato3"]`.

## Sinf daftari va reyting (F9)
- **DEMO rejim:** `js/config.js` bo'sh bo'lsa, ma'lumotlar shu brauzerda saqlanadi va namunaviy 5 ta sinf bilan ochiladi (chap pastda sariq "DEMO" belgisi turadi).
- **Supabase rejimi:** `../supabase/SUPABASE.md` dagi qadamlarni bajaring.
- **Sinf daftari:** sinfni tanlang → o'quvchini bosing → sababni bosing (✅ To'g'ri javob, 🙋 Faollik, 🤝 Yordam, 📚 Uy vazifasi, 🧹 Tartib) → +1 ⭐. 10 soniya ichida "↩ Bekor qilish" mumkin. **📅 Davomat** — "bugun hamma keldi" (+5 ball, kuniga bir marta). **👥 O'quvchilar** — qo'shish, tahrirlash, ro'yxatni birdaniga qo'shish, yangi sinf.
- **O'yinlardan ball:** Qiziqarli matematika → "🏫 Sinfga yozish"; Savollar barabani → "⭐ Kim javob berdi?"; Kim chiqadi? → "⭐ To'g'ri javob berdi".
- **Reyting:** har bir parallel uchun shohsupa va nominatsiyalar, oxirida maktab bo'yicha jami. Har 12 soniyada aylanadi, ekranni bosib keyingisiga o'tish mumkin.
