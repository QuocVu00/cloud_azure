const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyDvKHMtLfoiyGG14CVaxkASTMtXdL7YcQI");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

async function test() {
    try {
        const result = await model.generateContent("Xin chào! Bạn là ai?");
        const response = await result.response;
        console.log("✅ SUCCESS:", response.text());
    } catch(e) {
        console.error("❌ ERROR:", e.status, e.message?.substring(0, 200));
    }
}

test();
