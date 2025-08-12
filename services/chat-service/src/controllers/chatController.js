import OpenAI from 'openai';
import chatModel from '../models/chatModel.js';
import logger from '../utils/logger.js';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const modelOpenai = 'gpt-4.1-nano';

// Hàm kiểm tra query có phải là từ khóa thực sự không (loại bỏ các từ như 'sự kiện', 'event', 'show', 'chương trình', ...)
function isGenericQuery(query) {
    if (!query) return true;
    const genericWords = [
        'sự kiện',
        'event',
        'show',
        'chương trình',
        'concert',
        'liveshow',
        'sự kiện nào',
        'event nào',
        'show nào',
        'chương trình nào',
        'concert nào',
        'liveshow nào',
        'các sự kiện',
        'các event',
        'các show',
        'các chương trình',
        'các concert',
        'các liveshow',
    ];
    const q = query.trim().toLowerCase();
    return genericWords.some((w) => q === w || q.includes(w));
}

// Hàm trích xuất từ khóa/tên sự kiện và địa điểm bằng GPT
async function extractEventQueryAndLocationWithGPT(message) {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const prompt = `Hãy trích xuất từ câu hỏi sau:\n- Từ khóa hoặc tên sự kiện cần tìm (nếu có)\n- Địa điểm (nếu có)\n- Thời gian (nếu có): "sắp diễn ra", "trong tương lai", "sắp tới", "từ ngày", "đến ngày", v.v.\nTrả về kết quả dạng JSON: { "query": "...", "location": "...", "timeFilter": "..." }\n- timeFilter có thể là: "upcoming", "future", "past", "all"\n- Nếu không có thông tin thì để rỗng\nKhông giải thích gì thêm, chỉ trả về JSON.\nCâu hỏi: "${message}"`;
    const res = await openai.chat.completions.create({
        model: modelOpenai,
        messages: [
            {
                role: 'system',
                content:
                    'Bạn là trợ lý trích xuất từ khóa, địa điểm và thời gian sự kiện.',
            },
            { role: 'user', content: prompt },
        ],
        max_tokens: 80,
        temperature: 0.2,
    });
    const content = res.choices[0].message.content.trim();
    // console.log('extractEventQueryAndLocationWithGPT ->', content);
    try {
        const obj = JSON.parse(content);
        let query = obj.query || '';
        // Nếu query là các từ chung chung thì bỏ qua, chỉ tìm theo location
        if (isGenericQuery(query)) query = '';
        return {
            query,
            location: obj.location || '',
            timeFilter: obj.timeFilter || 'all',
        };
    } catch (e) {
        // fallback: nếu không parse được thì trả về query là toàn bộ content, location rỗng
        return { query: '', location: '', timeFilter: 'all' };
    }
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
            // Phân tích lịch sử chat để cải thiện tìm kiếm (nếu có userId)
            if (userId) {
                const previousChats = await chatModel
                    .find({ userId })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean();

                if (previousChats.length > 0) {
                    const previousKeywords = [];
                    previousChats.forEach((chat) => {
                        if (chat.events && chat.events.length > 0) {
                            chat.events.forEach((event) => {
                                if (event.name) {
                                    previousKeywords.push(event.name);
                                }
                            });
                        }
                    });

                    if (previousKeywords.length > 0) {
                        const uniqueKeywords = [...new Set(previousKeywords)];
                        chatHistoryAnalysis = `
                        PHÂN TÍCH LỊCH SỬ TÌM KIẾM:
                        Người dùng đã tìm kiếm các sự kiện: ${uniqueKeywords.join(
                            ', ',
                        )}
                        
                        DỰA VÀO LỊCH SỬ CHAT để cải thiện tìm kiếm:
                        1. Nếu tin nhắn hiện tại liên quan đến chủ đề đã tìm kiếm trước đó, hãy sử dụng các từ khóa cụ thể hơn.
                        2. Nếu tin nhắn hiện tại yêu cầu thông tin khác, hãy sử dụng từ khóa mới và phù hợp.
                        3. KẾT HỢP lịch sử và tin nhắn hiện tại để tạo từ khóa tìm kiếm tốt hơn.
                        `;
                    }
                }
            }

            // Sử dụng GPT để trích xuất từ khóa/tên sự kiện, địa điểm và thời gian
            const {
                query: eventQuery,
                location,
                timeFilter,
            } = await extractEventQueryAndLocationWithGPT(message);
            // console.log(
            //     'createChat -> eventQuery',
            //     eventQuery,
            //     'location',
            //     location,
            //     'timeFilter',
            //     timeFilter,
            // );
            if (eventQuery || location || timeFilter !== 'all') {
                // Gọi event-service với query, location và timeFilter
                const params = new URLSearchParams();
                if (eventQuery) params.append('query', eventQuery);
                if (location) params.append('location', location);
                if (timeFilter && timeFilter !== 'all') {
                    params.append('timeFilter', timeFilter);
                }
                const eventRes = await axios.get(
                    `${
                        process.env.EVENT_SERVICE_URL
                    }/api/events/search?${params.toString()}`,
                );
                events = eventRes.data?.events || [];
                // console.log('createChat -> events', events);

                // Nếu không tìm thấy sự kiện với timeFilter cụ thể, thử tìm kiếm tất cả sự kiện
                if (events.length === 0 && timeFilter !== 'all') {
                    // console.log(
                    //     'Không tìm thấy sự kiện với timeFilter:',
                    //     timeFilter,
                    //     '- thử tìm kiếm tất cả sự kiện',
                    // );
                    const allParams = new URLSearchParams();
                    if (eventQuery) allParams.append('query', eventQuery);
                    if (location) allParams.append('location', location);

                    const allEventRes = await axios.get(
                        `${
                            process.env.EVENT_SERVICE_URL
                        }/api/events/search?${allParams.toString()}`,
                    );
                    const allEvents = allEventRes.data?.events || [];

                    if (allEvents.length > 0) {
                        events = allEvents;
                        // console.log(
                        //     'Tìm thấy',
                        //     allEvents.length,
                        //     'sự kiện khi tìm kiếm tất cả',
                        // );
                    }
                }
                if (events.length > 0) {
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
                '\n\nKhông có sự kiện nào phù hợp trong database. Hãy trả lời rằng không tìm thấy sự kiện nào phù hợp với yêu cầu.';
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
            aiResponse =
                'Xin lỗi, hiện tại không có sự kiện nào phù hợp với yêu cầu của bạn. Vui lòng thử lại với từ khóa khác hoặc địa điểm khác.';
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

            aiResponse = `Tôi đã tìm thấy ${events.length} sự kiện phù hợp với yêu cầu của bạn:\n\n${eventList}`;
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
