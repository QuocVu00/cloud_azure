const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

// Initialize Gemini
const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

/**
 * AI Controller
 * Handles AI chat with plan-based rate limits.
 * Free: 10 queries / 20 mins
 * Plus: 50 queries / 10 mins
 * Pro: Unlimited
 */
class AIController {
    async chat(req, res) {
        try {
            const userId = req.user.id;
            const { prompt } = req.body;

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }

            // 1. Fetch user plan and AI usage
            const userResult = await db.query(
                'SELECT plan, ai_usage_count, ai_last_reset FROM users WHERE id = $1',
                [userId]
            );
            
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = userResult.rows[0];
            const plan = user.plan || 'free';
            let aiCount = user.ai_usage_count || 0;
            let lastReset = new Date(user.ai_last_reset);
            const now = new Date();

            // 2. Define limits based on plan
            let limit = 10;
            let cooldownMinutes = 20;

            if (plan === 'pro') {
                // Unlimited for Pro
                return await this.generateResponse(prompt, res, userId, true);
            } else if (plan === 'plus') {
                limit = 50;
                cooldownMinutes = 10;
            }

            // 3. Check for reset
            const diffMinutes = (now - lastReset) / (1000 * 60);
            if (diffMinutes >= cooldownMinutes) {
                // Reset usage
                aiCount = 0;
                lastReset = now;
                await db.query(
                    'UPDATE users SET ai_usage_count = 0, ai_last_reset = $1 WHERE id = $2',
                    [now, userId]
                );
            }

            // 4. Check limit
            if (aiCount >= limit) {
                const waitTime = Math.ceil(cooldownMinutes - diffMinutes);
                return res.status(429).json({ 
                    error: `Bạn đã hết lượt sử dụng AI. Vui lòng quay lại sau ${waitTime} phút.`,
                    remainingMinutes: waitTime,
                    limit: limit
                });
            }

            // 5. Generate Response & Increment Count
            const responseText = await this.generateResponse(prompt, res, userId, false, aiCount + 1, lastReset, limit);
            
        } catch (error) {
            console.error('AI Chat Error:', error);
            res.status(500).json({ error: 'Lỗi hệ thống khi gọi AI.' });
        }
    }

    async generateResponse(prompt, res, userId, isPro, nextCount = 0, lastReset = null, limit = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 2000; // 2 seconds

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                if (!isPro) {
                    await db.query(
                        'UPDATE users SET ai_usage_count = $1 WHERE id = $2',
                        [nextCount, userId]
                    );
                }

                return res.json({
                    reply: text,
                    usage: isPro ? null : {
                        count: nextCount,
                        limit: limit,
                        remaining: limit - nextCount,
                        lastReset: lastReset
                    }
                });
            } catch (error) {
                const is503 = error.status === 503 || (error.message && error.message.includes('503'));
                if (is503 && attempt < MAX_RETRIES) {
                    console.warn(`[AI] Model quá tải (503), thử lại lần ${attempt}/${MAX_RETRIES - 1}...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
                    continue;
                }
                console.error('Gemini API Error:', error);
                throw error;
            }
        }
    }

    /**
     * GET /api/ai/usage
     * Returns current AI usage for the user
     */
    async getUsage(req, res) {
        try {
            const userId = req.user.id;
            const result = await db.query(
                'SELECT plan, ai_usage_count, ai_last_reset FROM users WHERE id = $1',
                [userId]
            );
            const user = result.rows[0];
            
            // Logic for reset check
            const plan = user.plan || 'free';
            const now = new Date();
            const lastReset = new Date(user.ai_last_reset);
            const diffMinutes = (now - lastReset) / (1000 * 60);
            
            let cooldownMinutes = 20;
            let limit = 10;
            if (plan === 'plus') {
                cooldownMinutes = 10;
                limit = 50;
            } else if (plan === 'pro') {
                return res.json({ plan: 'pro', unlimited: true });
            }

            let currentCount = user.ai_usage_count;
            if (diffMinutes >= cooldownMinutes) {
                currentCount = 0;
            }

            res.json({
                plan,
                count: currentCount,
                limit,
                remaining: limit - currentCount,
                nextResetIn: Math.max(0, Math.ceil(cooldownMinutes - diffMinutes))
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch usage' });
        }
    }
}

module.exports = new AIController();
