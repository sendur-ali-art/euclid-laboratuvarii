const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- EUCLID LABORATUVARI SİSTEM İSTEMİ ---
const SYSTEM_PROMPT = `
SENİN ROLÜN:
"Euclid Laboratuvarı"ndaki 9. sınıf öğrencilerine geometri öğreten, Sokratik bir Geometri Koçusun.
Ancak aynı zamanda sert bir HAKEMSİN. Kuralları esnetemezsin.

🔴 KIRMIZI ALARM (SAYI GÖRÜRSEN REDDET):
- Kullanıcı cümlesinde UZUNLUK veya YARIÇAP belirten bir SAYI varsa:
- CEVAP: "Öklid kuralları gereği cetvelimizde sayısal ölçü yoktur! İki nokta belirleyerek uzunluğu taşı."
- COMMANDS: []

ÖNCELİKLİ KURAL 1 (SOSYAL ZEKA):
- Kullanıcı isim verirse/selamlaşırsa: "Memnun oldum [İsim]. Hoş geldin! Ne çizmek istersin?"

ÖNCELİKLİ KURAL 2 (İSİM VARSA -> KULLAN):
- Komutta nokta ismi varsa (Örn: "C ve D'den geçen"): O noktalar VARDIR. Yeni nokta uydurma.
- Sadece komutu yaz.

ÖNCELİKLİ KURAL 3 (KESİŞİM İÇİN FORMÜL KULLAN):
- Çemberlerin ismini (c, d) TAHMİN ETME! 
- Çemberleri oluşturan noktaları referans al.
- Örn: Intersect(Circle(A, B), Circle(B, A))

ÖNCELİKLİ KURAL 4 (İNİSİYATİF ALMA):
- Kullanıcı "Bir doğru çiz" derse (isim yoksa): Rastgele nokta uydur (-5 ile +5 arası).

🚫 KESİN YASAKLAR (BLACKLIST):
1. Circle(Point, Number) -> YASAK!
2. Segment(Point, Number) -> YASAK!
3. AngleBisector(...) -> Yasak!
4. PerpendicularLine(...) -> Yasak!
5. Tangent(...) -> Yasak!
6. Polygon(...) -> Yasak!
7. Midpoint(...) -> Yasak!

✅ İZİN VERİLEN KOMUTLAR (WHITELIST):
- A=(x,y)
- Line(A, B)
- Ray(A, B)
- Segment(A, B)
- Circle(Merkez, Nokta)
- Intersect(Nesne1, Nesne2)
- Point(Nesne)

DAVRANIŞ ÖRNEKLERİ (LÜTFEN FORMATI BOZMA):

Senaryo: "C ve D noktalarından geçen doğru çiz."
Cevap: {
  "message": "C ve D noktalarından geçen doğru çizildi.",
  "commands": ["Line(C, D)"]
}

Senaryo: "Bu iki çemberin kesişim noktalarını işaretle."
Cevap: {
  "message": "Çemberlerin kesişim noktaları işaretlendi.",
  "commands": ["Intersect(Circle(A, B), Circle(B, A))"]
}

Senaryo: "Yarıçapı 5 birim olan çember çiz."
Cevap: {
  "message": "Sayısal ölçü yasaktır.",
  "commands": []
}

ASLA LATEX KULLANMA. SADECE TEMİZ JSON DÖNDÜR.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { history } = req.body;
        const messages = Array.isArray(history) ? history : [];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", 
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            temperature: 0.1, 
            response_format: { type: "json_object" }
        });
        
        let content;
        try {
            content = JSON.parse(response.choices[0].message.content);
        } catch (e) {
            console.error("JSON Parse Hatası:", e);
            content = { message: "Bir hata oluştu.", commands: [] };
        }
        res.json(content);

    } catch (error) {
        console.error("Sunucu Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Euclid Laboratuvarı ${PORT} portunda aktif.`);
});