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
                    model: "openai/gpt-oss-120b", // Tetap pakai model andalanmu bro!
                    messages: [
                        {
                            role: "system",
                            content: `Kamu adalah ARGUMIND AI, lawan debat yang sangat kritis, rasional, dan bermulut tajam (savage).`
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

// Wajib diexport supaya dibaca sebagai Serverless Function oleh Vercel
module.exports = app;

// Tetap aman dijalankan di localhost laptop kamu
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log("Server running on http://localhost:3000");
    });
}