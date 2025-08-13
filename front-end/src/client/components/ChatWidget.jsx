import { useState, useRef, useEffect } from 'react';
import {
    FaComments,
    FaTimes,
    FaPaperPlane,
    FaChevronDown,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { chatWithAssistant, getChatHistory } from '../../util/api';
import React from 'react';
import styles from './ChatWidget.module.css';

const ChatWidget = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const { user } = useAuth();
    const chatAreaRef = useRef(null);

    // Danh sách câu hỏi gợi ý
    const suggestionQuestions = [
        'Sự kiện sắp diễn ra?',
        'Sự kiện ở Cần Thơ?',
        'Gợi ý cho tôi những sự kiện trending!',
    ];

    // Lấy lịch sử chat khi mở khung chat
    useEffect(() => {
        if (open && user) {
            // console.log('Loading chat history for user:', user._id);
            getChatHistory(user._id)
                .then((response) => {
                    // console.log('Chat history response:', response);
                    if (response.success && response.data) {
                        const chats = response.data;
                        // console.log(
                        //     'Chat history loaded:',
                        //     chats.length,
                        //     'chats',
                        // );

                        // Đảo ngược để tin cũ lên trước, tin mới xuống dưới
                        const historyMessages = chats
                            .reverse()
                            .flatMap((chat) => [
                                { sender: 'user', text: chat.message },
                                {
                                    sender: 'bot',
                                    text: chat.response,
                                    events: chat.events || [],
                                },
                            ]);

                        // console.log(
                        //     'Mapped messages:',
                        //     historyMessages.length,
                        //     'messages',
                        // );
                        setMessages(historyMessages);

                        // Hiển thị gợi ý nếu không có lịch sử chat
                        setShowSuggestions(
                            chats.length === 0 && historyMessages.length === 0,
                        );

                        // Scroll to bottom sau khi load lịch sử
                        setTimeout(() => {
                            if (chatAreaRef.current) {
                                chatAreaRef.current.scrollTop =
                                    chatAreaRef.current.scrollHeight;
                            }
                        }, 200);
                    }
                })
                .catch((err) => {
                    console.error('Error loading chat history:', err);
                    // Nếu có lỗi, vẫn hiển thị gợi ý
                    setShowSuggestions(true);
                });
        } else if (open && !user) {
            console.log('No user logged in, starting fresh chat');
            setMessages([]);
            setShowSuggestions(true);

            // Scroll to bottom khi mở chat mới
            setTimeout(() => {
                if (chatAreaRef.current) {
                    chatAreaRef.current.scrollTop =
                        chatAreaRef.current.scrollHeight;
                }
            }, 100);
        }
    }, [open, user]);

    // Scroll to bottom khi chat được mở
    useEffect(() => {
        if (open && chatAreaRef.current) {
            setTimeout(() => {
                chatAreaRef.current.scrollTop =
                    chatAreaRef.current.scrollHeight;
                // Ẩn nút scroll khi mở chat
                setShowScrollButton(false);
            }, 300);
        }
    }, [open]);

    // Auto scroll to bottom khi có tin nhắn mới - Chỉ scroll khi có 1 tin nhắn đơn lẻ
    useEffect(() => {
        if (chatAreaRef.current) {
            // Chỉ scroll khi có tin nhắn mới và không phải là tin nhắn có events
            const lastMessage = messages[messages.length - 1];
            const hasEvents =
                lastMessage &&
                lastMessage.events &&
                lastMessage.events.length > 0;

            // Chỉ scroll nếu tin nhắn cuối không có events (chỉ có text)
            if (!hasEvents) {
                setTimeout(() => {
                    chatAreaRef.current.scrollTop =
                        chatAreaRef.current.scrollHeight;
                }, 100);
            }

            // Ẩn nút scroll nếu user đang ở bottom
            setTimeout(() => {
                if (chatAreaRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } =
                        chatAreaRef.current;
                    const isNearBottom =
                        scrollTop + clientHeight >= scrollHeight - 100;
                    setShowScrollButton(!isNearBottom);
                }
            }, 150);
        }
    }, [messages]);

    // Scroll khi user gửi tin nhắn
    useEffect(() => {
        if (chatAreaRef.current) {
            const lastMessage = messages[messages.length - 1];
            // Chỉ scroll nếu tin nhắn cuối là từ user
            if (lastMessage && lastMessage.sender === 'user') {
                setTimeout(() => {
                    chatAreaRef.current.scrollTop =
                        chatAreaRef.current.scrollHeight;
                }, 50);
            }
        }
    }, [messages]);

    // Kiểm tra vị trí scroll để hiển thị/ẩn nút scroll down
    useEffect(() => {
        const handleScroll = () => {
            if (chatAreaRef.current) {
                const { scrollTop, scrollHeight, clientHeight } =
                    chatAreaRef.current;
                const isNearBottom =
                    scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
                setShowScrollButton(!isNearBottom);
            }
        };

        const chatArea = chatAreaRef.current;
        if (chatArea) {
            chatArea.addEventListener('scroll', handleScroll);
            // Kiểm tra ngay khi component mount
            handleScroll();

            return () => {
                chatArea.removeEventListener('scroll', handleScroll);
            };
        }
    }, [messages, open]); // Thêm open để kiểm tra lại khi chat được mở

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setShowSuggestions(false); // Ẩn gợi ý khi người dùng gửi tin nhắn

        // Scroll to bottom ngay khi user gửi tin nhắn
        setTimeout(() => {
            if (chatAreaRef.current) {
                chatAreaRef.current.scrollTop =
                    chatAreaRef.current.scrollHeight;
            }
        }, 50);

        try {
            let response;
            if (user) {
                response = await chatWithAssistant(input, user._id, user.role);
            } else {
                response = await chatWithAssistant(input);
            }

            // console.log('Chat API response:', response);

            if (response?.success) {
                const botResponse = response?.data?.response;
                const events = response?.data?.events || [];

                // Nếu có response text và events
                if (
                    typeof botResponse === 'string' &&
                    botResponse.trim().length > 0 &&
                    events.length > 0
                ) {
                    setMessages((prev) => [
                        ...prev,
                        { sender: 'bot', text: botResponse, events },
                    ]);
                }
                // Nếu chỉ có response text
                else if (
                    typeof botResponse === 'string' &&
                    botResponse.trim().length > 0
                ) {
                    setMessages((prev) => [
                        ...prev,
                        { sender: 'bot', text: botResponse },
                    ]);
                }
                // Nếu chỉ có events
                else if (events.length > 0) {
                    setMessages((prev) => [
                        ...prev,
                        { sender: 'bot', text: '', events },
                    ]);
                }
                // Không có gì
                else {
                    setMessages((prev) => [
                        ...prev,
                        {
                            sender: 'bot',
                            text: 'Xin lỗi, tôi không tìm thấy thông tin phù hợp.',
                        },
                    ]);
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: 'bot',
                        text:
                            response?.message ||
                            'Có lỗi xảy ra khi xử lý yêu cầu.',
                    },
                ]);
            }
        } catch (err) {
            console.error('Chat error:', err);
            setMessages((prev) => [
                ...prev,
                { sender: 'bot', text: 'Lỗi kết nối chat-service.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Scroll khi AI trả lời xong (chỉ nếu không có events)
    useEffect(() => {
        if (!loading && chatAreaRef.current) {
            const lastMessage = messages[messages.length - 1];
            const hasEvents =
                lastMessage &&
                lastMessage.events &&
                lastMessage.events.length > 0;

            // Chỉ scroll nếu tin nhắn cuối không có events
            if (!hasEvents) {
                setTimeout(() => {
                    chatAreaRef.current.scrollTop =
                        chatAreaRef.current.scrollHeight;
                }, 100);
            }

            // Kiểm tra lại vị trí scroll sau khi AI trả lời
            setTimeout(() => {
                if (chatAreaRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } =
                        chatAreaRef.current;
                    const isNearBottom =
                        scrollTop + clientHeight >= scrollHeight - 100;
                    setShowScrollButton(!isNearBottom);
                }
            }, 150);
        }
    }, [loading, messages]);

    // Function xử lý khi click vào câu hỏi gợi ý
    const handleSuggestionClick = (question) => {
        setInput(question);
        // Tự động gửi câu hỏi gợi ý
        const userMsg = { sender: 'user', text: question };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setShowSuggestions(false);

        // Scroll to bottom ngay khi click suggestion
        setTimeout(() => {
            if (chatAreaRef.current) {
                chatAreaRef.current.scrollTop =
                    chatAreaRef.current.scrollHeight;
            }
        }, 50);

        // Gọi API với câu hỏi gợi ý
        const sendSuggestionMessage = async () => {
            try {
                let response;
                if (user) {
                    response = await chatWithAssistant(
                        question,
                        user._id,
                        user.role,
                    );
                } else {
                    response = await chatWithAssistant(question);
                }

                if (response?.success) {
                    const botResponse = response?.data?.response;
                    const events = response?.data?.events || [];

                    if (
                        typeof botResponse === 'string' &&
                        botResponse.trim().length > 0 &&
                        events.length > 0
                    ) {
                        setMessages((prev) => [
                            ...prev,
                            { sender: 'bot', text: botResponse, events },
                        ]);
                    } else if (
                        typeof botResponse === 'string' &&
                        botResponse.trim().length > 0
                    ) {
                        setMessages((prev) => [
                            ...prev,
                            { sender: 'bot', text: botResponse },
                        ]);
                    } else if (events.length > 0) {
                        setMessages((prev) => [
                            ...prev,
                            { sender: 'bot', text: '', events },
                        ]);
                    } else {
                        setMessages((prev) => [
                            ...prev,
                            {
                                sender: 'bot',
                                text: 'Xin lỗi, tôi không tìm thấy thông tin phù hợp.',
                            },
                        ]);
                    }
                } else {
                    setMessages((prev) => [
                        ...prev,
                        {
                            sender: 'bot',
                            text:
                                response?.message ||
                                'Có lỗi xảy ra khi xử lý yêu cầu.',
                        },
                    ]);
                }
            } catch (err) {
                setMessages((prev) => [
                    ...prev,
                    { sender: 'bot', text: 'Lỗi kết nối chat-service.' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        sendSuggestionMessage();
    };

    // Function scroll to bottom
    const scrollToBottom = () => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTo({
                top: chatAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    // Component typing indicator
    const TypingIndicator = () => (
        <div className={styles.typingIndicator}>
            <div className={styles.typingDots}>
                {[0, 1, 2].map((i) => (
                    <div key={i} className={styles.typingDot} />
                ))}
            </div>
        </div>
    );

    return (
        <>
            {/* Icon chat nổi */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className={styles.chatIcon}
                    title="Chat hỗ trợ"
                >
                    <FaComments />
                </button>
            )}

            {/* Khung chat */}
            {open && (
                <div className={styles.chatContainer}>
                    {/* Header */}
                    <div className={styles.chatHeader}>
                        <div className={styles.headerContent}>
                            <div className={styles.onlineStatus} />
                            <span className={styles.headerTitle}>
                                Hỗ trợ trực tuyến
                            </span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className={styles.closeButton}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Chat area */}
                    <div ref={chatAreaRef} className={styles.chatArea}>
                        {messages.length === 0 && (
                            <div className={styles.welcomeMessage}>
                                <div className={styles.welcomeTitle}>
                                    👋 Chào bạn!
                                </div>
                                <div>
                                    Tôi có thể giúp bạn tìm kiếm sự kiện và trả
                                    lời các câu hỏi.
                                </div>
                            </div>
                        )}

                        {/* Hiển thị gợi ý câu hỏi khi không có lịch sử chat */}
                        {showSuggestions && (
                            <div className={styles.suggestionsContainer}>
                                {/* <div className={styles.suggestionsTitle}>
                                    Gợi ý:
                                </div> */}
                                <div className={styles.suggestionsList}>
                                    {suggestionQuestions.map(
                                        (question, index) => (
                                            <button
                                                key={index}
                                                className={
                                                    styles.suggestionButton
                                                }
                                                onClick={() =>
                                                    handleSuggestionClick(
                                                        question,
                                                    )
                                                }
                                                disabled={loading}
                                            >
                                                {question}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={styles.messageContainer}>
                                <div
                                    className={`${styles.messageWrapper} ${
                                        msg.sender === 'user'
                                            ? styles.messageWrapperUser
                                            : styles.messageWrapperBot
                                    }`}
                                >
                                    {msg.sender === 'bot' && (
                                        <div className={styles.botAvatar}>
                                            AI
                                        </div>
                                    )}

                                    {msg.text && (
                                        <div
                                            className={`${
                                                styles.messageBubble
                                            } ${
                                                msg.sender === 'user'
                                                    ? styles.messageBubbleUser
                                                    : styles.messageBubbleBot
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: msg.text.replace(
                                                    /\*\*(.*?)\*\*/g,
                                                    '<strong>$1</strong>',
                                                ),
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Hiển thị sự kiện nếu có */}
                                {msg.sender === 'bot' &&
                                    msg.events &&
                                    msg.events.length > 0 && (
                                        <div className={styles.eventsSection}>
                                            <div className={styles.eventsList}>
                                                {msg.events.map((ev, i) => (
                                                    <div
                                                        key={i}
                                                        className={
                                                            styles.eventCard
                                                        }
                                                        onClick={() => {
                                                            window.open(
                                                                `/event/${ev.id}`,
                                                                '_blank',
                                                            );
                                                        }}
                                                    >
                                                        <div
                                                            className={
                                                                styles.eventContent
                                                            }
                                                        >
                                                            {ev.background && (
                                                                <div
                                                                    className={
                                                                        styles.eventImage
                                                                    }
                                                                >
                                                                    <img
                                                                        src={
                                                                            ev.background
                                                                        }
                                                                        alt={
                                                                            ev.name
                                                                        }
                                                                        className={
                                                                            styles.eventImageImg
                                                                        }
                                                                    />
                                                                    <div
                                                                        className={
                                                                            styles.eventImageOverlay
                                                                        }
                                                                    />
                                                                </div>
                                                            )}

                                                            <div
                                                                className={
                                                                    styles.eventInfo
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.eventName
                                                                    }
                                                                >
                                                                    {ev.name}
                                                                </div>

                                                                <div
                                                                    className={
                                                                        styles.eventDetail
                                                                    }
                                                                >
                                                                    <span>
                                                                        📍
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            styles.eventDetailLocation
                                                                        }
                                                                    >
                                                                        {[
                                                                            ev
                                                                                .location
                                                                                ?.venueName,
                                                                            ev
                                                                                .location
                                                                                ?.district,
                                                                            ev
                                                                                .location
                                                                                ?.province,
                                                                        ]
                                                                            .filter(
                                                                                Boolean,
                                                                            )
                                                                            .join(
                                                                                ', ',
                                                                            )}
                                                                    </span>
                                                                </div>

                                                                <div
                                                                    className={
                                                                        styles.eventDetail
                                                                    }
                                                                >
                                                                    <span>
                                                                        🕐
                                                                    </span>
                                                                    <span>
                                                                        {ev.startTime &&
                                                                            new Date(
                                                                                ev.startTime,
                                                                            ).toLocaleDateString(
                                                                                'vi-VN',
                                                                                {
                                                                                    day: '2-digit',
                                                                                    month: '2-digit',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                },
                                                                            )}
                                                                    </span>
                                                                </div>

                                                                <div
                                                                    className={
                                                                        styles.eventFooter
                                                                    }
                                                                >
                                                                    <div
                                                                        className={`${
                                                                            styles.eventStatus
                                                                        } ${
                                                                            ev.status ===
                                                                            'approved'
                                                                                ? styles.eventStatusApproved
                                                                                : ev.status ===
                                                                                  'event_over'
                                                                                ? styles.eventStatusOver
                                                                                : styles.eventStatusOther
                                                                        }`}
                                                                    >
                                                                        {ev.status ===
                                                                        'approved'
                                                                            ? '✓ Có sẵn'
                                                                            : ev.status ===
                                                                              'event_over'
                                                                            ? '⏰ Đã kết thúc'
                                                                            : ev.status}
                                                                    </div>

                                                                    <div
                                                                        className={
                                                                            styles.eventLink
                                                                        }
                                                                    >
                                                                        Xem chi
                                                                        tiết →
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        ))}

                        {loading && <TypingIndicator />}
                    </div>

                    {/* Input area */}
                    <form onSubmit={handleSend} className={styles.inputForm}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={
                                user
                                    ? 'Nhập tin nhắn...'
                                    : 'Bạn cần đăng nhập để chat'
                            }
                            className={`${styles.inputField} ${
                                !user ? styles.inputFieldDisabled : ''
                            }`}
                            disabled={loading || !user}
                        />
                        <button
                            type="submit"
                            className={`${styles.sendButton} ${
                                input.trim() && !loading && user
                                    ? styles.sendButtonActive
                                    : styles.sendButtonDisabled
                            }`}
                            disabled={loading || !input.trim() || !user}
                        >
                            <FaPaperPlane />
                        </button>
                    </form>

                    {!user && (
                        <div className={styles.loginWarning}>
                            <span>⚠️</span>
                            <span>
                                Vui lòng đăng nhập để sử dụng chat hỗ trợ
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Scroll to bottom button - Fixed position */}
            {open && showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className={styles.scrollToBottomButton}
                    title="Cuộn xuống tin nhắn mới nhất"
                >
                    <FaChevronDown />
                </button>
            )}
        </>
    );
};

export default ChatWidget;
