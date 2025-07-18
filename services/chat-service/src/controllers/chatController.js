import OpenAI from "openai";
import chatModel from '../models/chatModel.js';
import logger from '../utils/logger.js';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Hàm trích xuất từ khóa/tên sự kiện bằng GPT
async function extractEventQueryWithGPT(message) {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const prompt = `Hãy trích xuất từ khóa hoặc tên sự kiện cần tìm từ câu hỏi sau, chỉ trả về đúng từ khóa/tên sự kiện, không giải thích gì thêm. Nếu không có thì trả về chuỗi rỗng.\nCâu hỏi: "${message}"`;
    const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini-2024-07-18',
        messages: [
            { role: 'system', content: 'Bạn là trợ lý trích xuất từ khóa sự kiện.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 20,
        temperature: 0.2
    });
    return res.choices[0].message.content.trim();
}

// Hàm nhận diện chat giao lưu (greeting, hỏi thăm, cảm ơn, v.v.)
function isConversationMessage(message) {
    message = message.toLowerCase();
    const greetingPatterns = [
        /^(xin\s+)?chào/, /^hi\b/, /^hello\b/, /^hey\b/, /^hola\b/,
        /^(chào\s+)?bạn/, /^chào\s+buổi/, /^good\s+(morning|afternoon|evening)/,
        /^\s*\?\s*$/, // chỉ có dấu hỏi
        /^bạn\s+(là\s+ai|tên\s+gì|có\s+thể\s+làm\s+gì|giúp\s+(được\s+)?gì)/,
        /^(bạn|mày)\s+(khỏe|có khỏe|thế nào|khoẻ)\s+(không|chứ|ko|k)\s*\??/,
        /^(cảm\s+ơn|thank|thanks)/, /^(tạm\s+biệt|bye|goodbye)/,
        /^(bạn|mày)\s+(có|được)\s+(tạo|phát triển|làm)\s+(như thế nào|ra sao|bởi ai)/,
        /^(bạn|mày)\s+giỏi\s+(thế|quá|nhỉ)/,
        /^ai\s+tạo\s+(ra\s+)?(bạn|mày)/
    ];
    for (const pattern of greetingPatterns) {
        if (pattern.test(message)) return true;
    }
    // Có thể bổ sung kiểm tra keyword, độ dài, v.v. như Python nếu muốn
    return false;
}

const createChat = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user?.id;
        if (!message || !userId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin người dùng hoặc nội dung chat.' });
        }

        let events = [];
        let eventText = '';
        let prompt = message;
        const isGreeting = isConversationMessage(message);
        let aiResponse = '';

        if (!isGreeting) {
            // Sử dụng GPT để trích xuất từ khóa/tên sự kiện
            const eventQuery = await extractEventQueryWithGPT(message);
            if (eventQuery) {
                const eventRes = await axios.get(`${process.env.EVENT_SERVICE_URL}/api/events/search?query=${eventQuery}`);
                events = eventRes.data?.events || [];
                if (events.length > 0) {
                    eventText = `Các sự kiện liên quan đến \"${eventQuery}\":\n` + events.map(e => `- ${e.name}`).join('\n');
                } else {
                    eventText = `Không tìm thấy sự kiện nào liên quan đến \"${eventQuery}\".`;
                }
                prompt += `\n${eventText}`;
            }
        }
        // Nếu là chat giao lưu thì chỉ gửi message gốc cho AI, events = []

        // Gọi OpenAI API
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        const openaiRes = await openai.chat.completions.create({
            model: 'gpt-4o-mini-2024-07-18',
            messages: [
                { role: 'system', content: 'Bạn là trợ lý sự kiện, hãy trả lời ngắn gọn, thân thiện, ưu tiên trả về danh sách sự kiện nếu có.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 500,
        });
        aiResponse = openaiRes.choices[0].message.content;

        // Save chat history
        const chatDoc = await chatModel.create({
            userId,
            message,
            response: aiResponse,
            events: events.map(e => ({ eventId: e._id, name: e.name })),
        });

        return res.status(200).json({
            success: true,
            message: 'Chat thành công',
            data: {
                response: aiResponse,
                events, // luôn trả về mảng (có thể rỗng)
                chat: chatDoc,
            },
        });
    } catch (error) {
        logger.error('Create chat error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi xử lý chat.' });
    }
};

export default {
    createChat,
};
