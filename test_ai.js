// test_ai.js
import fetch from "node-fetch"; // kalau Node.js <18, install dulu: npm install node-fetch

async function testAI() {
  try {
    const response = await fetch("http://localhost:1234/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemma-3n-e4b",
        messages: [
          { role: "system", content: "Kamu adalah teman bermain Minecraft, jawab dengan bahasa Indonesia santai." },
          { role: "user", content: "Halo AI, bisa kenalan dulu?" }
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false
      }),
    });

    const data = await response.json();
    console.log("💬 Jawaban AI:");
    console.log(data.choices[0].message.content);

  } catch (err) {
    console.error("❌ Error:", err);
  }
}

testAI();
