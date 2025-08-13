import OpenAI from 'openai';
import chatModel from '../models/chatModel.js';
import logger from '../utils/logger.js';
import axios from 'axios';

// Helper functions for date calculations
function getDayName(dayIndex) {
    const days = [
        'Chủ nhật',
        'Thứ 2',
        'Thứ 3',
        'Thứ 4',
        'Thứ 5',
        'Thứ 6',
        'Thứ 7',
    ];
    return days[dayIndex];
}

function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Hàm chuyển đổi ngày tháng từ format DD/MM hoặc DD/MM/YYYY sang YYYY-MM-DD
function parseDateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    const trimmed = dateStr.trim();

    // Xử lý format DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const [day, month, year] = trimmed.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Xử lý format DD/MM (tự động xác định năm)
    if (/^\d{1,2}\/\d{1,2}$/.test(trimmed)) {
        const [day, month] = trimmed.split('/');
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // getMonth() trả về 0-11

        // Tạo ngày để kiểm tra
        const testDate = new Date(
            currentYear,
            parseInt(month) - 1,
            parseInt(day),
        );

        // Nếu ngày đã qua trong năm hiện tại, tính cho năm tiếp theo
        if (testDate < new Date()) {
            return `${currentYear + 1}-${month.padStart(2, '0')}-${day.padStart(
                2,
                '0',
            )}`;
        } else {
            return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(
                2,
                '0',
            )}`;
        }
    }

    // Xử lý format YYYY-MM-DD (đã đúng format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }

    return null;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const modelOpenai = 'gpt-4.1-nano';

// Hàm kiểm tra query có phải là từ khóa thực sự không - Tối ưu hóa
function isGenericQuery(query) {
    if (!query || !query.trim()) return true;

    const trimmedQuery = query.trim().toLowerCase();

    // Danh sách từ chung chung cần loại bỏ
    const genericWords = [
        'sự kiện',
        'event',
        'show',
        'chương trình',
        'concert',
        'liveshow',
        'festival',
        'party',
        'hội thảo',
        'seminar',
        'workshop',
        'triển lãm',
        'exhibition',
        'hội chợ',
        'fair',
        'meeting',
        'gặp gỡ',
        'gathering',
        'diễn ra',
        'diễn',
        'ra',
        'ở',
        'tại',
    ];

    // Danh sách cụm từ chung chung
    const genericPhrases = [
        'sự kiện nào',
        'event nào',
        'show nào',
        'chương trình nào',
        'concert nào',
        'liveshow nào',
        'festival nào',
        'party nào',
        'hội thảo nào',
        'seminar nào',
        'workshop nào',
        'triển lãm nào',
        'exhibition nào',
        'hội chợ nào',
        'fair nào',
        'meeting nào',
        'gặp gỡ nào',
        'gathering nào',
        'các sự kiện',
        'các event',
        'các show',
        'các chương trình',
        'các concert',
        'các liveshow',
        'các festival',
        'các party',
        'các hội thảo',
        'các seminar',
        'các workshop',
        'các triển lãm',
        'các exhibition',
        'các hội chợ',
        'các fair',
        'các meeting',
        'các gặp gỡ',
        'các gathering',
        'những sự kiện',
        'những event',
        'những show',
        'những chương trình',
        'những concert',
        'những liveshow',
        'những festival',
        'những party',
        'những hội thảo',
        'những seminar',
        'những workshop',
        'những triển lãm',
        'những exhibition',
        'những hội chợ',
        'những fair',
        'những meeting',
        'những gặp gỡ',
        'những gathering',
        'ở hà nội',
        'ở hà nội',
        'ở tp hcm',
        'ở tp.hcm',
        'ở thành phố hồ chí minh',
        'ở cần thơ',
        'ở đà nẵng',
        'ở huế',
        'ở nha trang',
        'ở vũng tàu',
        'tại hà nội',
        'tại hà nội',
        'tại tp hcm',
        'tại tp.hcm',
        'tại thành phố hồ chí minh',
        'tại cần thơ',
        'tại đà nẵng',
        'tại huế',
        'tại nha trang',
        'tại vũng tàu',
    ];

    // Kiểm tra từ chung chung
    if (genericWords.some((word) => trimmedQuery === word)) {
        return true;
    }

    // Kiểm tra cụm từ chung chung
    if (genericPhrases.some((phrase) => trimmedQuery === phrase)) {
        return true;
    }

    // Kiểm tra nếu query chỉ chứa các từ chung chung
    const words = trimmedQuery.split(/\s+/);
    const hasSpecificWords = words.some(
        (word) =>
            !genericWords.includes(word) &&
            word.length > 2 && // Loại bỏ từ quá ngắn
            ![
                'có',
                'ở',
                'tại',
                'vào',
                'ngày',
                'thứ',
                'tuần',
                'tháng',
                'năm',
            ].includes(word),
    );

    return !hasSpecificWords;
}

// Hàm trích xuất từ khóa/tên sự kiện và địa điểm bằng GPT - Tối ưu hóa
async function extractEventQueryAndLocationWithGPT(message) {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    // Tính toán ngày hiện tại để làm tham chiếu
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentDay = now.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7

    const prompt = `Hãy trích xuất thông tin từ câu hỏi sau một cách chính xác:

THÔNG TIN CẦN TRÍCH XUẤT:
1. Từ khóa/tên sự kiện cần tìm (nếu có) - BỎ QUA các từ chung chung như "sự kiện", "event", "diễn ra", "có", "nào", "ở", "tại"
2. Địa điểm cụ thể (nếu có) - CHỈ lấy tên địa điểm, BỎ QUA các từ như "ở", "tại"
3. Thời gian tương đối: "sắp diễn ra", "trong tương lai", "sắp tới", "đã diễn ra", v.v.
4. Ngày cụ thể: "thứ 7 tuần sau", "ngày 15/12", "25 tháng 12", "24/08", "tết", "noel", v.v.

QUY TẮC TÍNH TOÁN NGÀY CHÍNH XÁC (dựa trên ngày hiện tại: ${currentDate} - ${getDayName(
        currentDay,
    )}):

1. NGÀY THEO FORMAT DD/MM hoặc DD/MM/YYYY:
   - "ngày 24/08" = 2025-08-24 (vì 24/08/2024 đã qua)
   - "24/08" = 2025-08-24 (vì 24/08/2024 đã qua)
   - "24/08/2024" = 2024-08-24
   - "24/08/2025" = 2025-08-24
   - Nếu chỉ có DD/MM và đã qua trong năm hiện tại, thì tính cho năm tiếp theo

2. "thứ X tuần sau" = thứ X của tuần tiếp theo (KHÔNG phải tuần này)
   - Ví dụ: Hôm nay thứ 3, "thứ 7 tuần sau" = thứ 7 của tuần tiếp theo
   
3. "thứ X tuần này" = thứ X của tuần hiện tại
   - Ví dụ: Hôm nay thứ 3, "thứ 7 tuần này" = thứ 7 của tuần này

4. "ngày mai" = ngày hôm sau
5. "tuần sau" = 7 ngày từ hôm nay
6. "tháng sau" = tháng tiếp theo
7. "cuối tuần" = thứ 7 hoặc chủ nhật của tuần này
8. "đầu tuần" = thứ 2 của tuần này

VÍ DỤ CỤ THỂ:
- Hôm nay: ${currentDate} (${getDayName(currentDay)})
- "ngày 24/08" = 2025-08-24 (vì 24/08/2024 đã qua)
- "24/08" = 2025-08-24 (vì 24/08/2024 đã qua)
- "thứ 7 tuần sau": thứ 7 của tuần tiếp theo
- "ngày mai": ${getTomorrowDate()}
- "thứ 2 tuần sau": thứ 2 của tuần tiếp theo

VÍ DỤ TRÍCH XUẤT:
- "sự kiện ở Hà Nội" → query: "", location: "Hà Nội"
- "sự kiện tại TP.HCM" → query: "", location: "TP.HCM"
- "concert ở Cần Thơ" → query: "concert", location: "Cần Thơ"
- "festival âm nhạc ở Đà Nẵng" → query: "festival âm nhạc", location: "Đà Nẵng"

LƯU Ý QUAN TRỌNG:
- Với format DD/MM: nếu ngày đã qua trong năm hiện tại, tính cho năm tiếp theo
- Phân biệt rõ "tuần này" vs "tuần sau"
- Tính toán chính xác ngày dựa trên ngày hiện tại
- Không được nhầm lẫn giữa các tuần
- Với địa điểm: CHỈ lấy tên địa điểm, BỎ QUA các từ "ở", "tại"
- Với query: BỎ QUA các từ chung chung như "sự kiện", "event", "ở", "tại"

Trả về JSON chính xác: { "query": "...", "location": "...", "timeFilter": "...", "specificDate": "..." }
- timeFilter: "upcoming", "future", "past", "all"
- specificDate: YYYY-MM-DD hoặc rỗng
- query: tên sự kiện cụ thể (bỏ qua từ chung chung như "sự kiện", "event")
- location: địa điểm cụ thể

Chỉ trả về JSON, không giải thích.
Câu hỏi: "${message}"`;

    try {
        const res = await openai.chat.completions.create({
            model: modelOpenai,
            messages: [
                {
                    role: 'system',
                    content:
                        'Bạn là trợ lý AI chuyên nghiệp trong việc trích xuất thông tin sự kiện. Bạn có khả năng hiểu và chuyển đổi chính xác các cách nói về ngày tháng thành format YYYY-MM-DD. Luôn tính toán ngày một cách chính xác dựa trên ngày hiện tại.',
                },
                { role: 'user', content: prompt },
            ],
            max_tokens: 150,
            temperature: 0.1, // Giảm temperature để có kết quả ổn định hơn
        });

        const content = res.choices[0].message.content.trim();
        logger.info(`GPT extraction response: ${content}`);

        const obj = JSON.parse(content);
        let query = obj.query || '';

        // Tối ưu: loại bỏ các từ chung chung, chỉ giữ lại tên sự kiện cụ thể
        if (isGenericQuery(query)) {
            query = '';
        }

        // Thêm log để debug
        logger.info(
            `GPT extracted query: "${obj.query}" -> processed: "${query}"`,
        );

        // Xử lý specificDate: chuyển đổi từ format DD/MM hoặc DD/MM/YYYY sang YYYY-MM-DD
        let specificDate = obj.specificDate || '';
        if (specificDate && specificDate.trim()) {
            const parsedDate = parseDateString(specificDate.trim());
            if (parsedDate) {
                specificDate = parsedDate;
                logger.info(
                    `Parsed date: ${obj.specificDate} -> ${parsedDate}`,
                );
            } else {
                logger.warn(`Could not parse date: ${specificDate}`);
                specificDate = '';
            }
        }

        const result = {
            query: query.trim(),
            location: (obj.location || '').trim(),
            timeFilter: obj.timeFilter || 'all',
            specificDate: specificDate,
        };

        logger.info(`Extracted parameters:`, result);
        return result;
    } catch (error) {
        logger.error('Error in GPT extraction:', error);

        // Fallback: tự động phát hiện ngày tháng trong câu hỏi
        const fallbackResult = extractDateFromMessage(message);
        logger.info(`Using fallback date extraction:`, fallbackResult);

        return fallbackResult;
    }
}

// Hàm fallback để tự động phát hiện ngày tháng trong câu hỏi
function extractDateFromMessage(message) {
    if (!message || typeof message !== 'string') {
        return { query: '', location: '', timeFilter: 'all', specificDate: '' };
    }

    const lowerMessage = message.toLowerCase();
    let specificDate = '';
    let query = '';
    let location = '';

    // Tìm kiếm pattern ngày tháng
    const datePatterns = [
        /ngày\s+(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/gi,
        /(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/g,
        /(\d{1,2})\s+tháng\s+(\d{1,2})/gi,
        /(\d{1,2})\/(\d{1,2})/g,
    ];

    for (const pattern of datePatterns) {
        const matches = message.match(pattern);
        if (matches && matches.length > 0) {
            const dateMatch = matches[0];
            // Loại bỏ từ "ngày" nếu có
            const cleanDate = dateMatch.replace(/^ngày\s+/i, '');
            const parsedDate = parseDateString(cleanDate);
            if (parsedDate) {
                specificDate = parsedDate;
                logger.info(
                    `Fallback extracted date: ${cleanDate} -> ${parsedDate}`,
                );
                break;
            }
        }
    }

    // Tìm kiếm địa điểm (sau từ "ở", "tại")
    const locationPatterns = [
        /ở\s+([^,\s]+(?:\s+[^,\s]+)*)/gi,
        /tại\s+([^,\s]+(?:\s+[^,\s]+)*)/gi,
    ];

    for (const pattern of locationPatterns) {
        const matches = message.match(pattern);
        if (matches && matches.length > 0) {
            location = matches[1].trim();
            break;
        }
    }

    // Loại bỏ các từ chung chung để tạo query
    const words = message.split(/\s+/);
    const filteredWords = words.filter((word) => {
        const lowerWord = word.toLowerCase();
        return ![
            'sự',
            'kiện',
            'diễn',
            'ra',
            'vào',
            'ngày',
            'ở',
            'tại',
            'có',
            'nào',
            'gì',
        ].includes(lowerWord);
    });

    if (filteredWords.length > 0) {
        query = filteredWords.join(' ').trim();
        if (isGenericQuery(query)) {
            query = '';
        }
    }

    return {
        query: query,
        location: location,
        timeFilter: specificDate ? 'upcoming' : 'all',
        specificDate: specificDate,
    };
}

// Thêm function để phân biệt tin nhắn giao lưu và tin nhắn tìm kiếm
function isConversationMessage(message) {
    // Chuyển message về chữ thường để dễ so sánh
    const lowerMessage = message.toLowerCase();

    // Các pattern của tin nhắn giao lưu
    const greetingPatterns = [
        /^(xin\s+)?chào/i,
        /^hi\b/i,
        /^hello\b/i,
        /^hey\b/i,
        /^hola\b/i,
        /^(chào\s+)?bạn/i,
        /^chào\s+buổi/i,
        /^good\s+(morning|afternoon|evening)/i,
        /^\s*\?\s*$/, // Chỉ có dấu hỏi
        /^bạn\s+(là\s+ai|tên\s+gì|có\s+thể\s+làm\s+gì|giúp\s+(được\s+)?gì)/i,
        /^(bạn|mày)\s+(khỏe|có khỏe|thế nào|khoẻ)\s+(không|chứ|ko|k)\s*\??/i,
        /^(cảm\s+ơn|thank|thanks)/i,
        /^(tạm\s+biệt|bye|goodbye)/i,
        /^(bạn|mày)\s+(có|được)\s+(tạo|phát triển|làm)\s+(như thế nào|ra sao|bởi ai)/i,
        /^(bạn|mày)\s+giỏi\s+(thế|quá|nhỉ)/i,
        /^ai\s+tạo\s+(ra\s+)?(bạn|mày)/i,
    ];

    // Kiểm tra từng pattern
    for (const pattern of greetingPatterns) {
        if (pattern.test(lowerMessage)) {
            return true;
        }
    }

    // Các từ khóa thường xuất hiện trong tin nhắn giao lưu
    const conversationKeywords = [
        'chào',
        'hi',
        'hello',
        'hey',
        'tạm biệt',
        'bye',
        'goodbye',
        'khỏe không',
        'khoẻ không',
        'khỏe ko',
        'khoẻ ko',
        'khỏe k',
        'cảm ơn',
        'thanks',
        'thank you',
        'nice',
        'bạn tên gì',
        'bạn là ai',
        'ai tạo ra bạn',
        'ai làm ra bạn',
        'bạn được tạo',
        'bạn giúp được gì',
        'bạn có thể làm gì',
        'bạn biết làm gì',
        'giúp đỡ',
        'hướng dẫn',
        'bạn hoạt động',
        'tạo ra',
        'ai phát triển',
        'đội ngũ phát triển',
        'công ty',
    ];

    // Nếu tin nhắn ngắn (ít hơn 4 từ) và chứa từ khóa giao lưu
    const words = lowerMessage.split(/\s+/);
    if (words.length < 4) {
        for (const keyword of conversationKeywords) {
            if (lowerMessage.includes(keyword)) {
                return true;
            }
        }
    }

    // Nếu tin nhắn quá ngắn (1-2 từ) và không có từ khóa tìm kiếm phổ biến
    const searchKeywords = [
        'sự kiện',
        'event',
        'tìm',
        'kiếm',
        'tìm kiếm',
        'ở đâu',
        'khi nào',
        'diễn ra',
    ];
    if (words.length <= 2) {
        const hasSearchKeyword = searchKeywords.some((keyword) =>
            lowerMessage.includes(keyword),
        );
        if (!hasSearchKeyword) {
            return true;
        }
    }

    // Nếu tin nhắn là câu hỏi đơn giản không liên quan đến tìm kiếm
    if (
        lowerMessage.endsWith('?') &&
        words.length < 6 &&
        !searchKeywords.some((keyword) => lowerMessage.includes(keyword))
    ) {
        return true;
    }

    return false;
}

// Function phân loại loại câu hỏi
function classifyQuestionType(message) {
    const lowerMessage = message.toLowerCase();

    // Các từ khóa liên quan đến mua vé
    const ticketKeywords = [
        'mua vé',
        'đặt vé',
        'mua ticket',
        'đặt ticket',
        'mua ticket',
        'đặt ticket',
        'cách mua',
        'làm sao mua',
        'hướng dẫn mua',
        'quy trình mua',
        'giá vé',
        'giá ticket',
        'bao nhiêu tiền',
        'chi phí',
    ];

    // Các từ khóa liên quan đến thanh toán
    const paymentKeywords = [
        'thanh toán',
        'payment',
        'trả tiền',
        'nộp tiền',
        'chuyển khoản',
        'tiền mặt',
        'cash',
        'thẻ tín dụng',
        'credit card',
        'debit card',
        'momo',
        'zalopay',
        'vnpay',
        'paypal',
        'stripe',
    ];

    // Các từ khóa liên quan đến tài khoản
    const accountKeywords = [
        'đăng ký',
        'đăng nhập',
        'tài khoản',
        'account',
        'profile',
        'thông tin cá nhân',
        'cập nhật thông tin',
        'đổi mật khẩu',
    ];

    // Các từ khóa liên quan đến sự kiện
    const eventKeywords = [
        'sự kiện',
        'event',
        'tìm kiếm',
        'tìm',
        'kiếm',
        'ở đâu',
        'khi nào',
        'diễn ra',
        'tổ chức',
        'organizer',
        'địa điểm',
        'location',
    ];

    // Các từ khóa gợi ý sự kiện (không cần tìm kiếm cụ thể)
    const suggestionKeywords = [
        'gợi ý',
        'gợi ý cho tôi',
        'đề xuất',
        'giới thiệu',
        'cho tôi xem',
        'show me',
        'recommend',
        'suggest',
        'nổi bật',
        'hot',
        'trending',
        'phổ biến',
        'popular',
        'mới nhất',
        'latest',
        'gần đây',
        'recent',
    ];

    // Kiểm tra từng loại
    if (ticketKeywords.some((keyword) => lowerMessage.includes(keyword))) {
        return 'ticket';
    }

    if (paymentKeywords.some((keyword) => lowerMessage.includes(keyword))) {
        return 'payment';
    }

    if (accountKeywords.some((keyword) => lowerMessage.includes(keyword))) {
        return 'account';
    }

    if (eventKeywords.some((keyword) => lowerMessage.includes(keyword))) {
        // Kiểm tra xem có phải là câu hỏi gợi ý không
        if (
            suggestionKeywords.some((keyword) => lowerMessage.includes(keyword))
        ) {
            return 'suggestion';
        }
        return 'event';
    }

    return 'general';
}

// Function tạo phản hồi giao lưu thân thiện
async function generateConversationResponse(message) {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const conversationPrompt = `Bạn là trợ lý AI thân thiện đang hỗ trợ khách hàng cho website Melody Meet (1 website quản lý sự kiện và bán vé). Người dùng đã gửi tin nhắn giao lưu: "${message}"

Hãy trả lời một cách thân thiện, ngắn gọn và nhắc nhở người dùng về chức năng chính của bạn là tìm kiếm sự kiện.

Phong cách: Thân thiện, vui vẻ, ngắn gọn.`;

    const response = await openai.chat.completions.create({
        model: modelOpenai,
        messages: [
            {
                role: 'system',
                content: conversationPrompt,
            },
            { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.7,
    });

    return response.choices[0].message.content;
}

// Function trả lời câu hỏi FAQ
async function generateFAQResponse(message, questionType) {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    let systemPrompt = '';

    switch (questionType) {
        case 'ticket':
            systemPrompt = `Bạn là trợ lý AI của website Melody Meet - nền tảng quản lý sự kiện và bán vé trực tuyến.

Người dùng hỏi về việc mua vé: "${message}"

Hãy trả lời với thông tin sau:
1. Cách mua vé: Chọn sự kiện → Bấm "Mua vé ngay" → Chọn loại vé, số lượng → Điền thông tin, phương thức thanh toán → Thanh toán
2. Giá vé: Tùy theo loại vé và sự kiện
3. Có thể mua vé trực tuyến 24/7
4. Vé sẽ được gửi qua email sau khi thanh toán thành công

Phong cách: Thân thiện, hữu ích, rõ ràng.`;
            break;

        case 'payment':
            systemPrompt = `Bạn là trợ lý AI của website Melody Meet.

Người dùng hỏi về phương thức thanh toán: "${message}"

Hãy trả lời với thông tin sau:
1. Các phương thức thanh toán: Thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng, ví điện tử (ZaloPay, VNPay)
2. Thanh toán an toàn với SSL encryption
3. Xác nhận thanh toán ngay lập tức
4. Hỗ trợ thanh toán quốc tế

Phong cách: Thân thiện, hữu ích, rõ ràng.`;
            break;

        case 'account':
            systemPrompt = `Bạn là trợ lý AI của website Melody Meet.

Người dùng hỏi về tài khoản: "${message}"

Hãy trả lời với thông tin sau:
1. Đăng ký: Nhấn "Đăng ký" → Điền thông tin → Xác nhận email
2. Đăng nhập: Email/Username + Mật khẩu
3. Quản lý thông tin cá nhân trong phần Profile
4. Đổi mật khẩu trong Settings
5. Lưu lịch sử mua vé và sự kiện yêu thích

Phong cách: Thân thiện, hữu ích, rõ ràng.`;
            break;

        default:
            systemPrompt = `Bạn là trợ lý AI thân thiện của website Melody Meet - nền tảng quản lý sự kiện và bán vé trực tuyến.

Người dùng hỏi: "${message}"

Hãy trả lời một cách thân thiện và hữu ích, giới thiệu về các chức năng chính của website:
- Tìm kiếm và đăng ký sự kiện
- Mua vé trực tuyến
- Quản lý tài khoản cá nhân
- Hỗ trợ khách hàng 24/7

Phong cách: Thân thiện, vui vẻ, ngắn gọn.`;
    }

    const response = await openai.chat.completions.create({
        model: modelOpenai,
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
    });

    return response.choices[0].message.content;
}

// Function format sự kiện để hiển thị đơn giản
function formatEvent(event) {
    return {
        id: event._id,
        name: event.name,
        background: event.background,
        location: {
            venueName: event.location?.venueName || '',
            district: event.location?.district || '',
            province: event.location?.province || '',
        },
        startTime: event.startTime,
        organizer: {
            name: event.organizer?.name || '',
        },
        status: event.status,
    };
}

const createChat = async (req, res) => {
    try {
        const { message, userId, userRole } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu nội dung chat.',
            });
        }

        let events = [];
        let eventText = '';
        let prompt = message;
        const isGreeting = isConversationMessage(message);
        let aiResponse = '';
        let chatHistoryAnalysis = ''; // Khai báo ở ngoài để có thể sử dụng ở mọi nơi

        // Phân loại loại câu hỏi
        const questionType = classifyQuestionType(message);

        // Xử lý tin nhắn giao lưu
        if (isGreeting) {
            aiResponse = await generateConversationResponse(message);

            // Lưu vào database nếu có userId
            if (userId) {
                await chatModel.create({
                    userId,
                    message,
                    response: aiResponse,
                    events: [],
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Chat thành công',
                data: {
                    response: aiResponse,
                    events: [],
                },
            });
        }

        // Xử lý câu hỏi FAQ (không phải tìm kiếm sự kiện)
        if (
            questionType !== 'event' &&
            questionType !== 'general' &&
            questionType !== 'suggestion'
        ) {
            aiResponse = await generateFAQResponse(message, questionType);

            // Lưu vào database nếu có userId
            if (userId) {
                await chatModel.create({
                    userId,
                    message,
                    response: aiResponse,
                    events: [],
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Chat thành công',
                data: {
                    response: aiResponse,
                    events: [],
                },
            });
        }

        // Xử lý tin nhắn gợi ý sự kiện
        if (!isGreeting && questionType === 'suggestion') {
            try {
                // Gọi API để lấy sự kiện trending
                const trendingRes = await axios.get(
                    `${process.env.EVENT_SERVICE_URL}/api/events?type=trending&status=approved`,
                );

                events = trendingRes.data?.events || [];
                // console.log('createChat -> trending events', events);

                if (events.length > 0) {
                    aiResponse = `Đây là những sự kiện nổi bật và được đề xuất cho bạn:\n\n${events
                        .map(
                            (e, i) =>
                                `${i + 1}. ${e.name} - ${
                                    e.location?.venueName || ''
                                } ${e.location?.district || ''} ${
                                    e.location?.province || ''
                                } - ${
                                    e.startTime
                                        ? new Date(
                                              e.startTime,
                                          ).toLocaleDateString('vi-VN')
                                        : ''
                                }`,
                        )
                        .join('\n')}`;
                } else {
                    aiResponse =
                        'Hiện tại chưa có sự kiện nổi bật nào. Bạn có thể tìm kiếm sự kiện theo từ khóa hoặc địa điểm cụ thể.';
                }

                // Lưu vào database nếu có userId
                if (userId) {
                    await chatModel.create({
                        userId,
                        message,
                        response: aiResponse,
                        events: events.map((e) => ({
                            eventId: e._id,
                            name: e.name,
                            background: e.background,
                            location: e.location,
                            startTime: e.startTime,
                            organizer: e.organizer,
                            status: e.status,
                        })),
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Chat thành công',
                    data: {
                        response: aiResponse,
                        events: events.map(formatEvent),
                    },
                });
            } catch (error) {
                console.error('Error fetching trending events:', error);
                aiResponse =
                    'Xin lỗi, có lỗi khi tải sự kiện nổi bật. Vui lòng thử lại sau.';

                if (userId) {
                    await chatModel.create({
                        userId,
                        message,
                        response: aiResponse,
                        events: [],
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Chat thành công',
                    data: {
                        response: aiResponse,
                        events: [],
                    },
                });
            }
        }

        // Xử lý tin nhắn tìm kiếm sự kiện
        if (
            !isGreeting &&
            (questionType === 'event' || questionType === 'general')
        ) {
            // Sử dụng GPT để trích xuất từ khóa/tên sự kiện, địa điểm và thời gian
            const {
                query: eventQuery,
                location,
                timeFilter,
                specificDate,
            } = await extractEventQueryAndLocationWithGPT(message);

            // Log để debug
            logger.info(`AI Parameter Extraction:`, {
                originalMessage: message,
                eventQuery,
                location,
                timeFilter,
                specificDate,
            });

            if (
                eventQuery ||
                location ||
                timeFilter !== 'all' ||
                specificDate
            ) {
                // Tối ưu: Ưu tiên sử dụng API AI với startTime nếu có specificDate
                if (specificDate) {
                    const aiParams = new URLSearchParams();
                    aiParams.append('startTime', specificDate);

                    // Chỉ thêm query nếu có và không phải từ chung chung
                    if (
                        eventQuery &&
                        eventQuery.trim() &&
                        !isGenericQuery(eventQuery.trim())
                    ) {
                        aiParams.append('query', eventQuery.trim());
                    }

                    // Thêm location nếu có
                    if (location && location.trim()) {
                        aiParams.append('location', location.trim());
                    }

                    // Tối ưu limit dựa trên loại tìm kiếm
                    const searchLimit = specificDate ? '15' : '10'; // Nếu có ngày cụ thể thì lấy nhiều hơn
                    aiParams.append('limit', searchLimit);

                    const aiUrl = `${
                        process.env.EVENT_SERVICE_URL
                    }/api/events/search/ai?${aiParams.toString()}`;
                    logger.info(`Calling AI search API: ${aiUrl}`);

                    try {
                        const eventRes = await axios.get(aiUrl, {
                            timeout: 10000, // Timeout 10 giây
                        });
                        events = eventRes.data?.events || [];
                        logger.info(
                            `AI search result: ${events.length} events found for date ${specificDate}`,
                        );
                    } catch (error) {
                        logger.error('AI search API error:', error.message);
                        events = [];
                    }
                } else {
                    // Fallback: Gọi event-service thông thường
                    const params = new URLSearchParams();

                    // Chỉ thêm query nếu có và không phải từ chung chung
                    if (
                        eventQuery &&
                        eventQuery.trim() &&
                        !isGenericQuery(eventQuery.trim())
                    ) {
                        params.append('query', eventQuery.trim());
                    }

                    if (location && location.trim()) {
                        params.append('location', location.trim());
                    }

                    if (timeFilter && timeFilter !== 'all') {
                        params.append('timeFilter', timeFilter);
                    }

                    try {
                        const eventRes = await axios.get(
                            `${
                                process.env.EVENT_SERVICE_URL
                            }/api/events/search/ai?${params.toString()}`,
                            {
                                timeout: 10000, // Timeout 10 giây
                            },
                        );
                        events = eventRes.data?.events || [];
                        logger.info(
                            `Regular search result: ${events.length} events found`,
                        );
                    } catch (error) {
                        logger.error(
                            'Regular search API error:',
                            error.message,
                        );
                        events = [];
                    }
                }
                // console.log('createChat -> events', events);

                // Tối ưu fallback: Chỉ thực hiện fallback khi KHÔNG có specificDate
                if (events.length === 0 && !specificDate) {
                    logger.info(
                        'No events found with specific criteria, trying broader search',
                    );

                    // Thử tìm kiếm rộng hơn: bỏ qua timeFilter, chỉ giữ query và location
                    const fallbackParams = new URLSearchParams();

                    if (
                        eventQuery &&
                        eventQuery.trim() &&
                        !isGenericQuery(eventQuery.trim())
                    ) {
                        fallbackParams.append('query', eventQuery.trim());
                    }

                    if (location && location.trim()) {
                        fallbackParams.append('location', location.trim());
                    }

                    // Tăng limit cho tìm kiếm fallback
                    fallbackParams.append('limit', '10');

                    try {
                        const fallbackUrl = `${
                            process.env.EVENT_SERVICE_URL
                        }/api/events/search/ai?${fallbackParams.toString()}`;

                        logger.info(`Trying fallback search: ${fallbackUrl}`);

                        const fallbackRes = await axios.get(fallbackUrl, {
                            timeout: 10000,
                        });

                        const fallbackEvents = fallbackRes.data?.events || [];

                        if (fallbackEvents.length > 0) {
                            events = fallbackEvents;
                            logger.info(
                                `Fallback search found ${fallbackEvents.length} events`,
                            );
                        }
                    } catch (error) {
                        logger.error('Fallback search error:', error.message);
                    }
                } else if (events.length === 0 && specificDate) {
                    // Nếu có specificDate nhưng không tìm thấy sự kiện, log để debug
                    logger.info(
                        `No events found for specific date: ${specificDate}`,
                    );
                }
                if (events.length > 0) {
                    // Tạo eventText dựa trên loại tìm kiếm
                    if (specificDate) {
                        eventText =
                            `Các sự kiện diễn ra vào ngày ${specificDate}${
                                eventQuery
                                    ? ` liên quan đến "${eventQuery}"`
                                    : ''
                            }${location ? ' tại ' + location : ''}:
` + events.map((e) => `- ${e.name}`).join('\n');
                    } else {
                        eventText =
                            `Các sự kiện liên quan đến "${eventQuery}"${
                                location ? ' tại ' + location : ''
                            }${
                                timeFilter === 'upcoming'
                                    ? ' sắp diễn ra'
                                    : timeFilter === 'future'
                                    ? ' trong tương lai'
                                    : timeFilter === 'past'
                                    ? ' đã diễn ra'
                                    : ''
                            }:
` + events.map((e) => `- ${e.name}`).join('\n');
                    }
                } else {
                    // Tạo thông báo không tìm thấy dựa trên loại tìm kiếm
                    if (specificDate) {
                        eventText = `Không tìm thấy sự kiện nào diễn ra vào ngày ${specificDate}${
                            eventQuery ? ` liên quan đến "${eventQuery}"` : ''
                        }${location ? ' tại ' + location : ''}.`;
                    } else {
                        eventText = `Không tìm thấy sự kiện nào liên quan đến "${eventQuery}"${
                            location ? ' tại ' + location : ''
                        }${
                            timeFilter === 'upcoming'
                                ? ' sắp diễn ra'
                                : timeFilter === 'future'
                                ? ' trong tương lai'
                                : timeFilter === 'past'
                                ? ' đã diễn ra'
                                : ''
                        }.`;
                    }
                }
                prompt += `\n${eventText}`;
            }
        }
        // Nếu là chat giao lưu thì chỉ gửi message gốc cho AI, events = []

        // Gọi OpenAI API với context rõ ràng về dữ liệu thực
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

        let systemPrompt =
            'Bạn là trợ lý AI của website Melody Meet - nền tảng quản lý sự kiện và bán vé trực tuyến. QUAN TRỌNG: Chỉ trả lời dựa trên dữ liệu sự kiện thực tế được cung cấp. KHÔNG được tạo ra sự kiện giả hoặc thông tin không có trong dữ liệu.';

        // Thêm phân tích lịch sử nếu có
        if (chatHistoryAnalysis) {
            systemPrompt += `\n\n${chatHistoryAnalysis}`;
        }

        if (events.length > 0) {
            systemPrompt += `\n\nDữ liệu sự kiện thực tế:\n${events
                .map(
                    (e, i) =>
                        `${i + 1}. ${e.name} - ${e.location?.venueName || ''} ${
                            e.location?.district || ''
                        } ${e.location?.province || ''} - ${
                            e.startTime
                                ? new Date(e.startTime).toLocaleDateString(
                                      'vi-VN',
                                  )
                                : ''
                        }`,
                )
                .join('\n')}`;
            systemPrompt +=
                '\n\nHướng dẫn: Nếu có sự kiện được liệt kê ở trên, hãy giới thiệu chúng một cách rõ ràng và thân thiện. KHÔNG được nói "không tìm thấy" khi có sự kiện được cung cấp.';
        } else {
            systemPrompt +=
                '\n\nKhông có sự kiện nào phù hợp. Hãy trả lời rằng không tìm thấy sự kiện nào phù hợp với yêu cầu.';
        }

        // Xác định xem đây có phải là tin nhắn đầu tiên của người dùng không
        let isFirstMessage = false;
        if (userId) {
            const previousChats = await chatModel
                .find({ userId })
                .countDocuments();
            isFirstMessage = previousChats === 0;
        }

        // Nhiệt độ thấp hơn cho tin nhắn đầu tiên để tăng khả năng tìm kiếm chính xác
        const temperature = isFirstMessage ? 0.4 : 0.6;

        const openaiRes = await openai.chat.completions.create({
            model: modelOpenai,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                { role: 'user', content: message },
            ],
            max_tokens: 500,
            temperature: temperature,
        });
        aiResponse = openaiRes.choices[0].message.content;
        // console.log('createChat -> aiResponse', aiResponse);

        // Đảm bảo AI không tạo ra sự kiện giả
        if (
            events.length === 0 &&
            aiResponse.toLowerCase().includes('sự kiện') &&
            !aiResponse.toLowerCase().includes('không tìm thấy') &&
            !aiResponse.toLowerCase().includes('không có')
        ) {
            // Tạo thông báo phù hợp dựa trên loại tìm kiếm
            if (specificDate) {
                aiResponse = `Xin lỗi, hiện tại không có sự kiện nào diễn ra vào ngày ${specificDate}${
                    eventQuery ? ` liên quan đến "${eventQuery}"` : ''
                }${
                    location ? ' tại ' + location : ''
                }. Bạn có thể thử tìm kiếm với ngày khác hoặc địa điểm khác.`;
            } else {
                aiResponse =
                    'Xin lỗi, hiện tại không có sự kiện nào phù hợp với yêu cầu của bạn. Vui lòng thử lại với từ khóa khác hoặc địa điểm khác.';
            }
        }

        // Nếu có sự kiện được tìm thấy nhưng AI vẫn nói "không tìm thấy", hãy sửa lại phản hồi
        if (
            events.length > 0 &&
            (aiResponse.toLowerCase().includes('không tìm thấy') ||
                aiResponse.toLowerCase().includes('không có sự kiện'))
        ) {
            // Tạo phản hồi mới dựa trên sự kiện thực tế
            const eventList = events
                .map(
                    (e, i) =>
                        `${i + 1}. ${e.name} - ${e.location?.venueName || ''} ${
                            e.location?.district || ''
                        } ${e.location?.province || ''} - ${
                            e.startTime
                                ? new Date(e.startTime).toLocaleDateString(
                                      'vi-VN',
                                  )
                                : ''
                        }`,
                )
                .join('\n');

            // Tạo tiêu đề phù hợp dựa trên loại tìm kiếm
            let title = '';
            if (specificDate) {
                title = `Tôi đã tìm thấy ${
                    events.length
                } sự kiện diễn ra vào ngày ${specificDate}${
                    eventQuery ? ` liên quan đến "${eventQuery}"` : ''
                }${location ? ' tại ' + location : ''}:\n\n`;
            } else {
                title = `Tôi đã tìm thấy ${events.length} sự kiện phù hợp với yêu cầu của bạn:\n\n`;
            }

            aiResponse = title + eventList;
        }

        // Save chat history nếu có userId
        let chatDoc = null;
        if (userId) {
            chatDoc = await chatModel.create({
                userId,
                message,
                response: aiResponse,
                events: events.map((e) => ({
                    id: e._id,
                    name: e.name,
                    background: e.background,
                    location: e.location,
                    startTime: e.startTime,
                    organizer: e.organizer,
                    status: e.status,
                })),
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Chat thành công',
            data: {
                response: aiResponse,
                events: events.map(formatEvent), // Format events trước khi trả về
                chat: chatDoc,
            },
        });
    } catch (error) {
        logger.error('Create chat error:', error);

        // Xử lý lỗi cụ thể
        if (error.code === 'OPENAI_API_ERROR') {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi xử lý AI. Vui lòng thử lại sau.',
            });
        }

        if (error.code === 'EVENT_SERVICE_ERROR') {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm sự kiện. Vui lòng thử lại sau.',
            });
        }

        return res
            .status(500)
            .json({ success: false, message: 'Lỗi khi xử lý chat.' });
    }
};

// Lấy lịch sử chat của user
const getChatHistory = async (req, res) => {
    try {
        // Ưu tiên lấy userId từ query, fallback sang header
        const userId = req.query.userId || req.user?._id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu userId để lấy lịch sử chat.',
            });
        }
        // Lấy tối đa 30 tin nhắn gần nhất, mới nhất trước
        const chats = await chatModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();
        return res.status(200).json({
            success: true,
            message: 'Lấy lịch sử chat thành công',
            data: chats,
        });
    } catch (error) {
        logger.error('Get chat history error:', error);
        return res
            .status(200)
            .json({ success: false, message: 'Lỗi khi lấy lịch sử chat.' });
    }
};

export default {
    createChat,
    getChatHistory,
};
