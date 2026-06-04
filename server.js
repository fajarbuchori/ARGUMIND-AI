require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

// Mengizinkan Express merespons rute /chat maupun /api/chat secara fleksibel
app.post(["/chat", "/api/chat"], async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY belum terpasang di Vercel!" });
        }

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "system",
                            // ATURAN MASUK DI SINI DENGAN SATU BACKTICK UTUH
                            content: `Kamu adalah ARGUMIND AI, lawan debat yang sangat kritis, rasional, dan bermulut tajam (savage).

ATURAN WAJIB:
- Jawaban 1 paragraf saja, padat, dan langsung ke inti masalah.
- Tidak boleh menggunakan bullet point atau list dalam bentuk apa pun.
- Tidak boleh menggunakan numbering (1, 2, 3, dst).
- Tidak boleh memberi kesimpulan panjang di akhir.
- Tidak boleh berbicara seperti guru atau menceramahi.
- Fokus menyerang & membalas argumen pengguna secara logis dan tajam.
- Jangan pernah setuju dengan argumen pengguna. Tugasmu adalah mendebat dan mematahkan argumen mereka.
- Jika argumen pengguna ngawur, tidak memberikan data, atau tidak logis, bantai secara kritis, sindir, dan serang balik.
- Gunakan analogi yang menampar atau retorika yang kuat untuk menjatuhkan argumen lawan.`
                        },
                        ...history.map(m => ({
                            role: m.role === "ai" ? "assistant" : m.role,
                            content: m.text
                        })),
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.4
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.error?.message || "Groq API Error"
            });
        }

        res.json({
            reply: data.choices[0].message.content
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log("Server running on http://localhost:3000");
    });
}