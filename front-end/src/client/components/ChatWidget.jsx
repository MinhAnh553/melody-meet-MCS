import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { chatWithAssistant, getChatHistory } from '../../util/api';
import React from 'react';
import styles from './ChatWidget.module.css';

const ChatWidget = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const chatAreaRef = useRef(null);

    // Lấy lịch sử chat khi mở khung chat
    useEffect(() => {
        if (open && user) {
            // console.log('Loading chat history for user:', user._id);
            getChatHistory(user._id || user.id)
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

                        console.log(
                            'Mapped messages:',
                            historyMessages.length,
                            'messages',
                        );
                        setMessages(historyMessages);
                    }
                })
                .catch((err) => {
                    console.error('Error loading chat history:', err);
                });
        } else if (open && !user) {
            console.log('No user logged in, starting fresh chat');
            setMessages([]);
        }
    }, [open, user]);

    // Auto scroll to bottom khi có tin nhắn mới
    useEffect(() => {
        if (chatAreaRef.current) {
            setTimeout(() => {
                chatAreaRef.current.scrollTop =
                    chatAreaRef.current.scrollHeight;
            }, 100);
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

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
                                <div className={styles.welcomeEmoji}>👋</div>
                                <div className={styles.welcomeTitle}>
                                    Chào bạn!
                                </div>
                                <div>
                                    Tôi có thể giúp bạn tìm kiếm sự kiện và trả
                                    lời các câu hỏi.
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
                                                                `/event/${ev.eventId}`,
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
        </>
    );
};

export default ChatWidget;
