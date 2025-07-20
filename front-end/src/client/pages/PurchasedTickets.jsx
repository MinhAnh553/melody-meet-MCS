export default PurchasedTickets;
import React, { useEffect, useState, useRef } from 'react';
import {
    Container,
    Row,
    Col,
    Button,
    Nav,
    Pagination,
    Modal,
    Card,
    Form,
    InputGroup,
} from 'react-bootstrap';
import {
    BsTicket,
    BsCalendar,
    BsChevronRight,
    BsSearch,
    BsFilter,
    BsDownload,
    BsEye,
    BsStar,
    BsStarFill,
} from 'react-icons/bs';
import {
    Table,
    Space,
    Tag,
    Tooltip,
    Empty,
    Input,
    Select,
    Modal as AntModal,
    Card as AntCard,
    Row as AntRow,
    Col as AntCol,
    Button as AntButton,
    Typography,
    Divider,
    Badge,
    Avatar,
    Statistic,
    Progress,
    Timeline,
    notification,
    Spin,
} from 'antd';
import {
    EyeOutlined,
    DownloadOutlined,
    CalendarOutlined,
    UserOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    StarOutlined,
    StarFilled,
    ThunderboltOutlined,
    TrophyOutlined,
    HeartOutlined,
    GiftOutlined,
    CrownOutlined,
    FireOutlined,
} from '@ant-design/icons';
import QRCode from 'react-qr-code';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import noTicket from '../../assets/images/no-ticket.png';
import api from '../../util/api';
import TimeText from '../components/providers/TimeText';
import { usePermission } from '../../hooks/usePermission';
import { permissions } from '../../config/rbacConfig';
import ReviewForm from '../components/ReviewForm';
import styles from './PurchasedTickets.module.css';
import LoadingSpinner from '../components/loading/LoadingSpinner';
import html2canvas from 'html2canvas';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

function PurchasedTickets() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { hasPermission } = usePermission(user?.role);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('tickets');
    const [searchTerm, setSearchTerm] = useState('');
    const [downloadingTickets, setDownloadingTickets] = useState(new Set());

    // State cho review
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [eventReviews, setEventReviews] = useState({});

    // State cho modal chi tiết
    const [showTicketDetails, setShowTicketDetails] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const itemsPerPage = 10;

    // Refs cho việc tải xuống
    const ticketCardRefs = useRef({});

    // Enhanced notification system
    const showNotification = (type, message, description) => {
        notification[type]({
            message,
            description,
            placement: 'topRight',
            duration: 3,
            style: {
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            },
        });
    };

    // Hàm format location với enhancement
    const formatLocation = (location) => {
        if (!location) return 'Chưa cập nhật';
        if (typeof location === 'string') return location;
        if (typeof location === 'object') {
            const parts = [];
            if (location.venueName) parts.push(location.venueName);
            if (location.address) parts.push(location.address);
            if (location.ward) parts.push(location.ward);
            if (location.district) parts.push(location.district);
            if (location.province) parts.push(location.province);
            return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật';
        }
        return 'Chưa cập nhật';
    };

    // Hàm tải tất cả vé trong modal chi tiết
    const handleDownloadAllTicketsInModal = async (order) => {
        showNotification(
            'info',
            'Bắt đầu tải',
            'Đang tải tất cả vé trong modal...',
        );

        let successCount = 0;
        let errorCount = 0;
        const totalTickets = order.tickets.reduce(
            (sum, ticket) => sum + ticket.quantity,
            0,
        );

        for (
            let ticketIndex = 0;
            ticketIndex < order.tickets.length;
            ticketIndex++
        ) {
            const ticket = order.tickets[ticketIndex];
            for (let qtyIndex = 0; qtyIndex < ticket.quantity; qtyIndex++) {
                try {
                    const ticketIdentifier = `${ticketIndex}_${qtyIndex}`;
                    await handleDownloadTicketCard(order._id, ticketIdentifier);
                    successCount++;

                    // Show progress
                    const progress = Math.round(
                        (successCount / totalTickets) * 100,
                    );
                    notification.open({
                        message: `Đang tải vé... ${successCount}/${totalTickets}`,
                        description: `Tiến độ: ${progress}%`,
                        duration: 1,
                        key: 'download-progress',
                    });

                    // Delay between downloads
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(
                        `Lỗi tải vé ${ticketIndex}_${qtyIndex}:`,
                        error,
                    );
                    errorCount++;
                }
            }
        }

        // Close progress notification
        notification.destroy('download-progress');

        if (errorCount === 0) {
            showNotification(
                'success',
                'Hoàn thành!',
                `Đã tải xong tất cả ${successCount} vé từ modal chi tiết!`,
            );
        } else {
            showNotification(
                'warning',
                'Hoàn thành với lỗi',
                `Đã tải ${successCount} vé, ${errorCount} vé lỗi`,
            );
        }
    };

    // Hàm tải tất cả vé của một đơn hàng
    const handleDownloadAllTickets = async (order) => {
        if (order.status !== 'PAID') {
            showNotification(
                'warning',
                'Không thể tải vé',
                'Chỉ có thể tải vé đã thanh toán',
            );
            return;
        }

        // Mở modal chi tiết trước để render QR codes
        if (!showTicketDetails) {
            showNotification(
                'info',
                'Đang chuẩn bị',
                'Vui lòng mở chi tiết vé trước khi tải',
            );
            handleViewTicketDetails(order.tickets[0], order);
            return;
        }

        showNotification('info', 'Bắt đầu tải', 'Đang tải tất cả vé...');

        let successCount = 0;
        let errorCount = 0;

        for (
            let ticketIndex = 0;
            ticketIndex < order.tickets.length;
            ticketIndex++
        ) {
            const ticket = order.tickets[ticketIndex];
            for (let qtyIndex = 0; qtyIndex < ticket.quantity; qtyIndex++) {
                try {
                    const ticketIdentifier = `${ticketIndex}_${qtyIndex}`;
                    await handleDownloadTicketCard(order._id, ticketIdentifier);
                    successCount++;
                    // Delay between downloads to avoid overwhelming
                    await new Promise((resolve) => setTimeout(resolve, 800));
                } catch (error) {
                    console.error(
                        `Lỗi tải vé ${ticketIndex}_${qtyIndex}:`,
                        error,
                    );
                    errorCount++;
                }
            }
        }

        if (errorCount === 0) {
            showNotification(
                'success',
                'Hoàn thành',
                `Đã tải xong ${successCount} vé!`,
            );
        } else {
            showNotification(
                'warning',
                'Hoàn thành với lỗi',
                `Đã tải ${successCount} vé, ${errorCount} vé lỗi`,
            );
        }
    };

    // Enhanced download function
    const handleDownloadTicketCard = async (orderId, ticketIdentifier) => {
        const ticketKey = `${orderId}_${ticketIdentifier}`;
        const ref = ticketCardRefs.current[ticketKey];

        if (!ref) {
            showNotification('error', 'Lỗi', 'Không tìm thấy vé để tải xuống');
            return Promise.reject(new Error('Không tìm thấy vé'));
        }

        // Prevent multiple downloads
        if (downloadingTickets.has(ticketKey)) {
            showNotification(
                'warning',
                'Đang tải',
                'Vé đang được tải xuống, vui lòng đợi...',
            );
            return Promise.reject(new Error('Vé đang được tải'));
        }

        setDownloadingTickets((prev) => new Set(prev).add(ticketKey));

        try {
            // Show loading notification
            const hideLoading = notification.open({
                message: 'Đang tạo vé...',
                description: 'Vui lòng đợi trong giây lát',
                duration: 0,
                key: `download-${ticketKey}`,
            });

            // Add capturing class
            ref.classList.add('capturing');

            // Wait for DOM update and ensure element is visible
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Check if element is visible
            const rect = ref.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                throw new Error('Element không hiển thị hoặc có kích thước 0');
            }

            // Enhanced canvas configuration to avoid gradient issues
            const canvas = await html2canvas(ref, {
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                scale: 2, // Reduced scale to avoid memory issues
                logging: false,
                letterRendering: true,
                removeContainer: false,
                imageTimeout: 10000,
                width: rect.width,
                height: rect.height,
                onclone: (clonedDoc) => {
                    try {
                        // Hide download elements
                        const elementsToHide = clonedDoc.querySelectorAll(
                            '.hide-when-download',
                        );
                        elementsToHide.forEach((element) => {
                            element.style.display = 'none';
                            element.style.visibility = 'hidden';
                            element.style.opacity = '0';
                        });

                        // Remove problematic CSS properties that might cause gradient issues
                        const allElements = clonedDoc.querySelectorAll('*');
                        allElements.forEach((element) => {
                            // Remove complex gradients and effects that might cause issues
                            const computedStyle =
                                window.getComputedStyle(element);

                            // Replace gradients with solid colors
                            if (
                                computedStyle.background &&
                                computedStyle.background.includes('gradient')
                            ) {
                                element.style.background = '#ffffff';
                            }
                            if (
                                computedStyle.backgroundImage &&
                                computedStyle.backgroundImage.includes(
                                    'gradient',
                                )
                            ) {
                                element.style.backgroundImage = 'none';
                                element.style.backgroundColor = '#ffffff';
                            }

                            // Enhance font rendering
                            element.style.fontSmooth = 'always';
                            element.style.webkitFontSmoothing = 'antialiased';
                            element.style.mozOsxFontSmoothing = 'grayscale';
                            element.style.textRendering = 'optimizeLegibility';

                            // Remove transform that might cause issues
                            element.style.transform = 'none';
                            element.style.filter = 'none';
                            element.style.boxShadow = 'none';
                        });

                        // Ensure the cloned element has proper dimensions
                        const clonedElement =
                            clonedDoc.querySelector(
                                `[data-ticket-key="${ticketKey}"]`,
                            ) || clonedDoc.querySelector('.ticketCard');
                        if (clonedElement) {
                            clonedElement.style.width = rect.width + 'px';
                            clonedElement.style.height = rect.height + 'px';
                            clonedElement.style.position = 'relative';
                            clonedElement.style.display = 'block';
                        }
                    } catch (cloneError) {
                        console.warn('Lỗi khi xử lý clone:', cloneError);
                    }
                },
            });

            // Validate canvas
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error('Canvas không hợp lệ');
            }

            // Generate filename with better format
            const timestamp = new Date()
                .toISOString()
                .slice(0, 19)
                .replace(/:/g, '-');
            const orderCode = orderId.slice(-6);
            const filename = `ticket_${orderCode}_${ticketIdentifier}_${timestamp}.png`;

            // Create and trigger download
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png', 0.95); // Slightly compressed
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Close loading notification
            notification.destroy(`download-${ticketKey}`);

            // Show success notification
            showNotification(
                'success',
                'Tải vé thành công!',
                `Vé đã được lưu với tên: ${filename}`,
            );

            return Promise.resolve();
        } catch (error) {
            console.error('❌ Lỗi khi tải vé:', error);
            notification.destroy(`download-${ticketKey}`);

            let errorMessage = 'Có lỗi xảy ra khi tải vé. Vui lòng thử lại!';
            if (error.message.includes('gradient')) {
                errorMessage = 'Lỗi render CSS. Vui lòng thử lại!';
            } else if (error.message.includes('Element không hiển thị')) {
                errorMessage =
                    'Vé chưa được hiển thị. Vui lòng mở chi tiết vé trước!';
            }

            showNotification('error', 'Lỗi tải vé', errorMessage);

            return Promise.reject(error);
        } finally {
            // Clean up
            ref.classList.remove('capturing');
            setDownloadingTickets((prev) => {
                const newSet = new Set(prev);
                newSet.delete(ticketKey);
                return newSet;
            });
        }
    };

    const handleNavigation = (tab, path) => {
        setActiveTab(tab);
        navigate(path);
    };

    const handleViewTicketDetails = (ticket, order) => {
        setSelectedTicket({ ...ticket, order });
        setShowTicketDetails(true);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        const checkReviewsForEvents = async () => {
            const reviewPromises = [];

            orders.forEach((order) => {
                if (canReviewEvent(order)) {
                    const reviewId = generateReviewId(order.eventId, user.id);
                    reviewPromises.push(
                        checkEventReview(order.eventId).then((review) => {
                            if (review) {
                                setEventReviews((prev) => ({
                                    ...prev,
                                    [reviewId]: review,
                                }));
                            }
                        }),
                    );
                }
            });

            await Promise.all(reviewPromises);
        };

        if (orders.length > 0 && user) {
            checkReviewsForEvents();
        }
    }, [orders, user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.getMyOrders();
            if (res.success) {
                setOrders(res.orders);
                // showNotification(
                //     'success',
                //     'Tải dữ liệu thành công',
                //     `Đã tải ${res.orders.length} đơn hàng`,
                // );
            }
        } catch (error) {
            console.error('fetchOrders -> error', error);
            showNotification(
                'error',
                'Lỗi tải dữ liệu',
                'Không thể tải danh sách vé. Vui lòng thử lại!',
            );
        } finally {
            setLoading(false);
        }
    };

    const checkEventReview = async (eventId) => {
        try {
            const res = await api.checkEventReview(eventId);
            if (res.success) {
                const reviewId = generateReviewId(eventId, user.id);
                setEventReviews((prev) => ({
                    ...prev,
                    [reviewId]: res.review,
                }));
                return res.review;
            }
        } catch (error) {
            console.error('checkEventReview error:', error);
        }
        return null;
    };

    const handleOpenReviewForm = async (eventId) => {
        const existingReview = await checkEventReview(eventId);
        setSelectedEvent({ eventId });
        setSelectedReview(existingReview);
        setShowReviewForm(true);
    };

    const handleReviewSuccess = () => {
        if (selectedEvent) {
            const reviewId = generateReviewId(selectedEvent.eventId, user.id);
            checkEventReview(selectedEvent.eventId).then((review) => {
                if (review) {
                    setEventReviews((prev) => ({
                        ...prev,
                        [reviewId]: review,
                    }));
                }
            });
        }
        fetchOrders();
    };

    const canReviewEvent = (order) => {
        return new Date(order.endTime) < new Date() && order.status === 'PAID';
    };

    const generateReviewId = (eventId, userId) => {
        return `${eventId}_${userId}`;
    };

    // Enhanced filtering with event status instead of payment status
    const filteredOrders = orders.filter((order) => {
        const now = new Date();
        const eventEndTime = new Date(order.endTime);

        let matchesStatus = true;
        if (statusFilter === 'upcoming') {
            matchesStatus = eventEndTime > now;
        } else if (statusFilter === 'completed') {
            matchesStatus = eventEndTime <= now;
        }
        // 'all' doesn't filter anything

        const matchesSearch =
            !searchTerm ||
            order.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formatLocation(order.location)
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Enhanced pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredOrders.slice(
        startIndex,
        startIndex + itemsPerPage,
    );

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getEventStatus = (order) => {
        const now = new Date();
        const eventEndTime = new Date(order.endTime);
        const eventStartTime = new Date(order.startTime);

        if (eventEndTime < now) {
            return {
                status: 'ended',
                text: 'Đã kết thúc',
                color: 'default',
                icon: <CheckCircleOutlined />,
            };
        } else if (eventStartTime <= now && eventEndTime > now) {
            return {
                status: 'ongoing',
                text: 'Đang diễn ra',
                color: 'processing',
                icon: <FireOutlined />,
            };
        } else {
            return {
                status: 'upcoming',
                text: 'Sắp diễn ra',
                color: 'success',
                icon: <ThunderboltOutlined />,
            };
        }
    };

    const getStatusTag = (status) => {
        const statusConfig = {
            PAID: {
                color: 'success',
                icon: <CheckCircleOutlined />,
                text: 'Đã thanh toán',
            },
            PENDING: {
                color: 'processing',
                icon: <ClockCircleOutlined />,
                text: 'Chờ thanh toán',
            },
            CANCELED: {
                color: 'error',
                icon: <CloseOutlined />,
                text: 'Đã hủy',
            },
        };

        const config = statusConfig[status] || {
            color: 'default',
            icon: null,
            text: status,
        };

        return (
            <Tag
                color={config.color}
                icon={config.icon}
                className={styles.statusTag}
            >
                {config.text}
            </Tag>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Enhanced statistics with event status
    const getOrderStats = () => {
        const totalOrders = orders.length;
        const paidOrders = orders.filter((o) => o.status === 'PAID').length;
        const totalRevenue = orders
            .filter((o) => o.status === 'PAID')
            .reduce((sum, o) => sum + o.totalPrice, 0);
        const now = new Date();
        const upcomingEvents = orders.filter(
            (o) => new Date(o.endTime) > now,
        ).length;
        const completedEvents = orders.filter(
            (o) => new Date(o.endTime) <= now,
        ).length;

        return {
            totalOrders,
            paidOrders,
            totalRevenue,
            upcomingEvents,
            completedEvents,
        };
    };

    const stats = getOrderStats();

    // Enhanced table columns
    const columns = [
        {
            title: (
                <Space>
                    <ShoppingCartOutlined style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 600 }}>Mã đơn hàng</span>
                </Space>
            ),
            dataIndex: 'orderCode',
            key: 'orderCode',
            render: (orderCode, record) => (
                <div
                    className={styles.orderCode}
                    onClick={() =>
                        handleViewTicketDetails(record.tickets[0], record)
                    }
                    style={{ cursor: 'pointer' }}
                    title="Click để xem chi tiết vé"
                >
                    {orderCode}
                </div>
            ),
            width: 130,
        },
        {
            title: (
                <Space>
                    <CalendarOutlined style={{ color: '#10b981' }} />
                    <span style={{ fontWeight: 600 }}>Sự kiện</span>
                </Space>
            ),
            dataIndex: 'eventName',
            key: 'eventName',
            render: (eventName, record) => {
                const eventStatus = getEventStatus(record);
                return (
                    <div>
                        <div style={{ marginBottom: 4 }}>
                            <Text
                                strong
                                style={{ fontSize: 14, cursor: 'pointer' }}
                                onClick={() =>
                                    handleViewTicketDetails(
                                        record.tickets[0],
                                        record,
                                    )
                                }
                            >
                                {eventName}
                            </Text>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 4,
                            }}
                        >
                            <CalendarOutlined
                                style={{ fontSize: 12, color: '#6b7280' }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {formatDateTime(record.startTime)}
                            </Text>
                        </div>
                        <Tag
                            color={eventStatus.color}
                            icon={eventStatus.icon}
                            style={{ fontSize: 11, padding: '2px 6px' }}
                        >
                            {eventStatus.text}
                        </Tag>
                    </div>
                );
            },
            width: 250,
        },
        {
            title: (
                <Space>
                    <UserOutlined style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: 600 }}>Ngày mua</span>
                </Space>
            ),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt) => (
                <Space>
                    <Avatar
                        size="small"
                        icon={<CalendarOutlined />}
                        style={{ backgroundColor: '#f59e0b' }}
                    />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {formatDateTime(createdAt)}
                        </div>
                    </div>
                </Space>
            ),
            width: 180,
        },
        {
            title: (
                <Space>
                    <DollarOutlined style={{ color: '#10b981' }} />
                    <span style={{ fontWeight: 600 }}>Tổng tiền</span>
                </Space>
            ),
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (totalPrice) => (
                <div style={{ textAlign: 'left' }}>
                    <Text strong style={{ color: '#10b981', fontSize: 15 }}>
                        {formatCurrency(totalPrice)}
                    </Text>
                </div>
            ),
            width: 150,
        },
        {
            title: (
                <Space>
                    <GiftOutlined style={{ color: '#ef4444' }} />
                    <span style={{ fontWeight: 600 }}>Thao tác</span>
                </Space>
            ),
            key: 'actions',
            render: (_, record) => {
                const totalTickets = record.tickets.reduce(
                    (sum, ticket) => sum + ticket.quantity,
                    0,
                );

                return (
                    <Space size="small">
                        <Tooltip title="Xem chi tiết vé">
                            <AntButton
                                type="primary"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() =>
                                    handleViewTicketDetails(
                                        record.tickets[0],
                                        record,
                                    )
                                }
                                className={styles.actionButton}
                            >
                                Xem ({totalTickets} vé)
                            </AntButton>
                        </Tooltip>
                        {canReviewEvent(record) && (
                            <Tooltip
                                title={
                                    eventReviews[
                                        generateReviewId(
                                            record.eventId,
                                            user?.id,
                                        )
                                    ]
                                        ? 'Chỉnh sửa đánh giá'
                                        : 'Đánh giá sự kiện'
                                }
                            >
                                <AntButton
                                    type={
                                        eventReviews[
                                            generateReviewId(
                                                record.eventId,
                                                user?.id,
                                            )
                                        ]
                                            ? 'default'
                                            : 'dashed'
                                    }
                                    size="small"
                                    icon={
                                        eventReviews[
                                            generateReviewId(
                                                record.eventId,
                                                user?.id,
                                            )
                                        ] ? (
                                            <StarFilled
                                                style={{ color: '#faad14' }}
                                            />
                                        ) : (
                                            <StarOutlined />
                                        )
                                    }
                                    onClick={() =>
                                        handleOpenReviewForm(record.eventId)
                                    }
                                    className={styles.actionButton}
                                    style={
                                        eventReviews[
                                            generateReviewId(
                                                record.eventId,
                                                user?.id,
                                            )
                                        ]
                                            ? {
                                                  backgroundColor: '#fff7e6',
                                                  borderColor: '#faad14',
                                                  color: '#d48806',
                                              }
                                            : {}
                                    }
                                >
                                    {eventReviews[
                                        generateReviewId(
                                            record.eventId,
                                            user?.id,
                                        )
                                    ]
                                        ? 'Đã đánh giá'
                                        : 'Đánh giá'}
                                </AntButton>
                            </Tooltip>
                        )}
                    </Space>
                );
            },
            width: 200,
        },
    ];

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                <Spin size="large" />
                <Text>Đang tải danh sách vé...</Text>
            </div>
        );
    }

    return (
        <Container fluid className={styles.ordersContainer}>
            {/* Enhanced Header Card with Stats */}
            <AntCard className={styles.headerCard}>
                <AntRow
                    align="middle"
                    justify="space-between"
                    gutter={[24, 24]}
                >
                    <AntCol xs={24} lg={12}>
                        <div className={styles.titleSection}>
                            <div className={styles.titleIcon}>
                                <BsTicket />
                            </div>
                            <div>
                                <Title level={2} className={styles.pageTitle}>
                                    Vé đã mua
                                    <BsTicket
                                        className={styles.titleIconSmall}
                                    />
                                </Title>
                                <Text
                                    type="secondary"
                                    className={styles.pageSubtitle}
                                >
                                    <span className={styles.subtitleIcon}>
                                        ✓
                                    </span>
                                    Quản lý và xem chi tiết vé đã mua
                                </Text>

                                {/* Quick Stats */}
                                <div
                                    style={{
                                        marginTop: 16,
                                        display: 'flex',
                                        gap: 16,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <div>
                                        <Text
                                            strong
                                            style={{ color: '#3b82f6' }}
                                        >
                                            {stats.totalOrders}
                                        </Text>
                                        <Text
                                            type="secondary"
                                            style={{
                                                marginLeft: 4,
                                                fontSize: 12,
                                            }}
                                        >
                                            đơn hàng
                                        </Text>
                                    </div>
                                    <div>
                                        <Text
                                            strong
                                            style={{ color: '#f59e0b' }}
                                        >
                                            {stats.upcomingEvents}
                                        </Text>
                                        <Text
                                            type="secondary"
                                            style={{
                                                marginLeft: 4,
                                                fontSize: 12,
                                            }}
                                        >
                                            sắp diễn ra
                                        </Text>
                                    </div>
                                    <div>
                                        <Text
                                            strong
                                            style={{ color: '#6b7280' }}
                                        >
                                            {stats.completedEvents}
                                        </Text>
                                        <Text
                                            type="secondary"
                                            style={{
                                                marginLeft: 4,
                                                fontSize: 12,
                                            }}
                                        >
                                            đã diễn ra
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AntCol>
                    <AntCol xs={24} lg={12}>
                        <div className={styles.searchFilter}>
                            <Search
                                placeholder="Tìm kiếm theo tên sự kiện, mã đơn hàng hoặc địa điểm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', maxWidth: 400 }}
                                allowClear
                                enterButton={<BsSearch />}
                                size="large"
                            />
                            <Select
                                value={statusFilter}
                                onChange={setStatusFilter}
                                style={{ width: 200 }}
                                size="large"
                                suffixIcon={<BsFilter />}
                            >
                                <Option value="all">
                                    <Space>
                                        <CrownOutlined />
                                        Tất cả
                                    </Space>
                                </Option>
                                <Option value="upcoming">
                                    <Space>
                                        <ThunderboltOutlined />
                                        Sắp diễn ra
                                    </Space>
                                </Option>
                                <Option value="completed">
                                    <Space>
                                        <CheckCircleOutlined />
                                        Đã diễn ra
                                    </Space>
                                </Option>
                            </Select>
                        </div>
                    </AntCol>
                </AntRow>
            </AntCard>

            {/* Enhanced Table Card */}
            <AntCard className={styles.tableCard}>
                {filteredOrders.length === 0 ? (
                    <Empty
                        image={noTicket}
                        imageStyle={{ height: 180 }}
                        description={
                            <div className={styles.emptyState}>
                                <Title level={4}>
                                    {searchTerm
                                        ? 'Không tìm thấy kết quả'
                                        : 'Chưa có vé nào'}
                                </Title>
                                <Text type="secondary">
                                    {searchTerm
                                        ? `Không có vé nào phù hợp với từ khóa "${searchTerm}"`
                                        : 'Bạn chưa mua vé nào hoặc không có vé phù hợp với bộ lọc hiện tại.'}
                                </Text>
                            </div>
                        }
                    >
                        <Space>
                            <AntButton
                                type="primary"
                                icon={<HeartOutlined />}
                                onClick={() => navigate('/')}
                                size="large"
                            >
                                Khám phá sự kiện
                            </AntButton>
                            {searchTerm && (
                                <AntButton
                                    onClick={() => setSearchTerm('')}
                                    size="large"
                                >
                                    Xóa bộ lọc
                                </AntButton>
                            )}
                        </Space>
                    </Empty>
                ) : (
                    <>
                        <Table
                            columns={columns}
                            dataSource={paginatedOrders}
                            rowKey="_id"
                            pagination={false}
                            loading={loading}
                            className={styles.orderTable}
                            scroll={{ x: 1000 }}
                            size="middle"
                        />

                        {/* Enhanced Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.paginationContainer}>
                                <Pagination
                                    current={currentPage}
                                    total={filteredOrders.length}
                                    pageSize={itemsPerPage}
                                    onChange={handlePageChange}
                                    showSizeChanger={false}
                                    showQuickJumper
                                    showTotal={(total, range) =>
                                        `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} vé`
                                    }
                                    size="default"
                                />
                            </div>
                        )}
                    </>
                )}
            </AntCard>

            {/* Enhanced Modal Chi tiết vé */}
            <AntModal
                open={showTicketDetails}
                onCancel={() => setShowTicketDetails(false)}
                width={1200}
                footer={null}
                title={
                    <Space>
                        <Avatar
                            icon={<BsTicket />}
                            style={{ backgroundColor: '#3b82f6' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: 18 }}>
                            Chi tiết vé
                        </span>
                    </Space>
                }
                styles={{
                    body: { padding: 0 },
                    header: {
                        // background:
                        //     'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        borderRadius: '8px 8px 0 0',
                    },
                }}
            >
                {selectedTicket && (
                    <div className={styles.orderDetailsGridContainer}>
                        {/* Enhanced Header */}
                        <div className={styles.orderDetailsGridHeader}>
                            <div>
                                <Space align="center">
                                    <Avatar
                                        icon={<ShoppingCartOutlined />}
                                        style={{ backgroundColor: '#10b981' }}
                                    />
                                    <div>
                                        <Text
                                            strong
                                            className={
                                                styles.orderDetailsOrderCodeLink
                                            }
                                        >
                                            Đơn hàng:{' '}
                                            {selectedTicket.order.orderCode}
                                        </Text>
                                        <br />
                                        <Text
                                            type="secondary"
                                            className={
                                                styles.orderDetailsOrderDate
                                            }
                                        >
                                            <CalendarOutlined
                                                style={{ marginRight: 4 }}
                                            />
                                            {formatDateTime(
                                                selectedTicket.order.createdAt,
                                            )}
                                        </Text>
                                    </div>
                                </Space>

                                {/* Review Button in Header */}
                                {canReviewEvent(selectedTicket.order) && (
                                    <AntButton
                                        type={
                                            eventReviews[
                                                generateReviewId(
                                                    selectedTicket.order
                                                        .eventId,
                                                    user?.id,
                                                )
                                            ]
                                                ? 'default'
                                                : 'primary'
                                        }
                                        size="small"
                                        icon={
                                            eventReviews[
                                                generateReviewId(
                                                    selectedTicket.order
                                                        .eventId,
                                                    user?.id,
                                                )
                                            ] ? (
                                                <StarFilled
                                                    style={{ color: '#faad14' }}
                                                />
                                            ) : (
                                                <StarOutlined />
                                            )
                                        }
                                        onClick={() => {
                                            setShowTicketDetails(false);
                                            handleOpenReviewForm(
                                                selectedTicket.order.eventId,
                                            );
                                        }}
                                        className={styles.headerReviewButton}
                                        style={
                                            eventReviews[
                                                generateReviewId(
                                                    selectedTicket.order
                                                        .eventId,
                                                    user?.id,
                                                )
                                            ]
                                                ? {
                                                      backgroundColor:
                                                          '#fff7e6',
                                                      borderColor: '#faad14',
                                                      color: '#d48806',
                                                  }
                                                : {}
                                        }
                                    >
                                        {eventReviews[
                                            generateReviewId(
                                                selectedTicket.order.eventId,
                                                user?.id,
                                            )
                                        ]
                                            ? 'Đã đánh giá'
                                            : 'Đánh giá'}
                                    </AntButton>
                                )}
                            </div>
                            <div>
                                {getStatusTag(selectedTicket.order.status)}
                            </div>
                        </div>

                        <div className={styles.orderDetailsGridContent}>
                            {/* Enhanced Left Column */}
                            <div className={styles.orderDetailsGridLeft}>
                                {/* Event Info */}
                                <AntCard
                                    title={
                                        <Space>
                                            <CalendarOutlined
                                                style={{ color: '#3b82f6' }}
                                            />
                                            THÔNG TIN SỰ KIỆN
                                        </Space>
                                    }
                                    size="small"
                                >
                                    <Timeline
                                        items={[
                                            {
                                                key: 'event-name',
                                                dot: (
                                                    <FireOutlined
                                                        style={{
                                                            color: '#3b82f6',
                                                        }}
                                                    />
                                                ),
                                                children: (
                                                    <div>
                                                        <Text
                                                            strong
                                                            style={{
                                                                fontSize: 16,
                                                            }}
                                                        >
                                                            {
                                                                selectedTicket
                                                                    .order
                                                                    .eventName
                                                            }
                                                        </Text>
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: 'start-time',
                                                dot: (
                                                    <CalendarOutlined
                                                        style={{
                                                            color: '#10b981',
                                                        }}
                                                    />
                                                ),
                                                children: (
                                                    <div>
                                                        <Text>Bắt đầu: </Text>
                                                        <Text strong>
                                                            {formatDateTime(
                                                                selectedTicket
                                                                    .order
                                                                    .startTime,
                                                            )}
                                                        </Text>
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: 'end-time',
                                                dot: (
                                                    <ClockCircleOutlined
                                                        style={{
                                                            color: '#f59e0b',
                                                        }}
                                                    />
                                                ),
                                                children: (
                                                    <div>
                                                        <Text>Kết thúc: </Text>
                                                        <Text strong>
                                                            {formatDateTime(
                                                                selectedTicket
                                                                    .order
                                                                    .endTime,
                                                            )}
                                                        </Text>
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: 'location',
                                                dot: (
                                                    <UserOutlined
                                                        style={{
                                                            color: '#ef4444',
                                                        }}
                                                    />
                                                ),
                                                children: (
                                                    <div>
                                                        <Text>Địa điểm: </Text>
                                                        <Text strong>
                                                            {formatLocation(
                                                                selectedTicket
                                                                    .order
                                                                    .location,
                                                            )}
                                                        </Text>
                                                    </div>
                                                ),
                                            },
                                        ]}
                                    />
                                </AntCard>

                                {/* Ticket Info */}
                                <AntCard
                                    title={
                                        <Space>
                                            <TrophyOutlined
                                                style={{ color: '#8b5cf6' }}
                                            />
                                            THÔNG TIN VÉ
                                        </Space>
                                    }
                                    size="small"
                                >
                                    <Table
                                        columns={[
                                            {
                                                title: 'Tên vé',
                                                dataIndex: 'name',
                                                key: 'name',
                                                render: (name) => (
                                                    <Text strong>{name}</Text>
                                                ),
                                            },
                                            {
                                                title: 'Số lượng',
                                                dataIndex: 'quantity',
                                                key: 'quantity',
                                                render: (qty) => (
                                                    <Badge
                                                        count={qty}
                                                        style={{
                                                            backgroundColor:
                                                                '#3b82f6',
                                                        }}
                                                        showZero
                                                    />
                                                ),
                                            },
                                            {
                                                title: 'Đơn giá',
                                                dataIndex: 'price',
                                                key: 'price',
                                                render: (price) => (
                                                    <Text
                                                        style={{
                                                            color: '#10b981',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {formatCurrency(price)}
                                                    </Text>
                                                ),
                                            },
                                            {
                                                title: 'Tổng tiền',
                                                key: 'total',
                                                render: (_, record) => (
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: '#ef4444',
                                                            fontSize: 15,
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            record.price *
                                                                record.quantity,
                                                        )}
                                                    </Text>
                                                ),
                                            },
                                        ]}
                                        dataSource={
                                            selectedTicket.order.tickets?.map(
                                                (ticket, index) => ({
                                                    ...ticket,
                                                    key: `ticket-info-${
                                                        selectedTicket.order._id
                                                    }-${
                                                        ticket.ticketId || index
                                                    }`,
                                                }),
                                            ) || []
                                        }
                                        pagination={false}
                                        size="small"
                                    />
                                </AntCard>

                                {/* Payment Info */}
                                <AntCard
                                    title={
                                        <Space>
                                            <DollarOutlined
                                                style={{ color: '#10b981' }}
                                            />
                                            THÔNG TIN THANH TOÁN
                                        </Space>
                                    }
                                    size="small"
                                >
                                    <Space
                                        direction="vertical"
                                        style={{ width: '100%' }}
                                        size="middle"
                                    >
                                        <div>
                                            <Text type="secondary">
                                                Phương thức thanh toán:
                                            </Text>
                                            <br />
                                            <Text
                                                strong
                                                style={{ fontSize: 15 }}
                                            >
                                                {
                                                    selectedTicket.order.payment
                                                        .method
                                                }
                                            </Text>
                                        </div>
                                        <div>
                                            <Text type="secondary">
                                                Trạng thái thanh toán:
                                            </Text>
                                            <br />
                                            {getStatusTag(
                                                selectedTicket.order.status,
                                            )}
                                        </div>
                                        <div>
                                            <Text type="secondary">
                                                Ngày thanh toán:
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {formatDateTime(
                                                    selectedTicket.order
                                                        .createdAt,
                                                )}
                                            </Text>
                                        </div>
                                    </Space>
                                </AntCard>
                            </div>

                            {/* Enhanced Right Column */}
                            <div className={styles.orderDetailsGridRight}>
                                {/* QR Codes for all tickets */}
                                {selectedTicket.order.status === 'PAID' && (
                                    <AntCard
                                        title={
                                            <Space>
                                                <GiftOutlined
                                                    style={{ color: '#f59e0b' }}
                                                />
                                                MÃ QR VÉ
                                            </Space>
                                        }
                                        size="small"
                                        extra={
                                            selectedTicket.order.tickets.reduce(
                                                (sum, ticket) =>
                                                    sum + ticket.quantity,
                                                0,
                                            ) >= 2 ? (
                                                <AntButton
                                                    type="primary"
                                                    size="small"
                                                    icon={<DownloadOutlined />}
                                                    onClick={() =>
                                                        handleDownloadAllTicketsInModal(
                                                            selectedTicket.order,
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            'linear-gradient(135deg, #10b981, #059669)',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Tải tất cả
                                                </AntButton>
                                            ) : null
                                        }
                                    >
                                        <Space
                                            direction="vertical"
                                            size="large"
                                            style={{ width: '100%' }}
                                        >
                                            {selectedTicket.order.tickets.map(
                                                (ticket, ticketIndex) => {
                                                    // Tạo quantity cards cho mỗi loại vé
                                                    return Array.from(
                                                        {
                                                            length: ticket.quantity,
                                                        },
                                                        (_, qtyIndex) => {
                                                            // Format: orderCode + ticketTypeIndex (1-based) + ticketSequence (1-based)
                                                            const ticketTypeNumber =
                                                                (
                                                                    ticketIndex +
                                                                    1
                                                                )
                                                                    .toString()
                                                                    .padStart(
                                                                        2,
                                                                        '0',
                                                                    ); // 01, 02, 03...
                                                            const ticketSequence =
                                                                (qtyIndex + 1)
                                                                    .toString()
                                                                    .padStart(
                                                                        2,
                                                                        '0',
                                                                    ); // 01, 02, 03...
                                                            const qrValue = `${selectedTicket.order.orderCode}${ticketTypeNumber}${ticketSequence}`;
                                                            const ticketKey = `${selectedTicket.order._id}_${ticketIndex}_${qtyIndex}`;
                                                            const displayTicketNumber = `${ticketSequence}`;

                                                            return (
                                                                <div
                                                                    key={`ticket-${selectedTicket.order._id}-${ticketIndex}-${qtyIndex}`}
                                                                    ref={(
                                                                        el,
                                                                    ) => {
                                                                        if (
                                                                            el
                                                                        ) {
                                                                            ticketCardRefs.current[
                                                                                ticketKey
                                                                            ] =
                                                                                el;
                                                                        }
                                                                    }}
                                                                    data-ticket-key={
                                                                        ticketKey
                                                                    }
                                                                    className={
                                                                        styles.ticketCard
                                                                    }
                                                                    style={{
                                                                        marginBottom:
                                                                            '20px',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.ticketHeader
                                                                        }
                                                                    >
                                                                        <Title
                                                                            level={
                                                                                5
                                                                            }
                                                                            style={{
                                                                                color: '#1f2937',
                                                                                marginBottom: 8,
                                                                            }}
                                                                        >
                                                                            {
                                                                                selectedTicket
                                                                                    .order
                                                                                    .eventName
                                                                            }
                                                                        </Title>
                                                                        <div>
                                                                            <Text
                                                                                type="secondary"
                                                                                style={{
                                                                                    fontSize: 13,
                                                                                    display:
                                                                                        'block',
                                                                                }}
                                                                            >
                                                                                Mã
                                                                                vé:{' '}
                                                                                {
                                                                                    qrValue
                                                                                }
                                                                            </Text>
                                                                            <Text
                                                                                strong
                                                                                style={{
                                                                                    fontSize: 14,
                                                                                    color: '#3b82f6',
                                                                                    display:
                                                                                        'block',
                                                                                    marginTop: 4,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    ticket.name
                                                                                }{' '}
                                                                                -
                                                                                Vé{' '}
                                                                                {
                                                                                    displayTicketNumber
                                                                                }
                                                                            </Text>
                                                                            <Text
                                                                                style={{
                                                                                    fontSize: 13,
                                                                                    color: '#10b981',
                                                                                    display:
                                                                                        'block',
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            >
                                                                                {formatCurrency(
                                                                                    ticket.price,
                                                                                )}
                                                                            </Text>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        className={
                                                                            styles.qrCodeContainer
                                                                        }
                                                                    >
                                                                        <QRCode
                                                                            value={
                                                                                qrValue
                                                                            }
                                                                            size={
                                                                                180
                                                                            }
                                                                            level="H"
                                                                            style={{
                                                                                border: '4px solid #f3f4f6',
                                                                                borderRadius: 8,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div
                                                                        className={
                                                                            styles.ticketFooter
                                                                        }
                                                                    ></div>
                                                                    <AntButton
                                                                        type="primary"
                                                                        icon={
                                                                            <DownloadOutlined />
                                                                        }
                                                                        className="hide-when-download"
                                                                        onClick={() =>
                                                                            handleDownloadTicketCard(
                                                                                selectedTicket
                                                                                    .order
                                                                                    ._id,
                                                                                `${ticketIndex}_${qtyIndex}`,
                                                                            )
                                                                        }
                                                                        style={{
                                                                            width: '100%',
                                                                            marginTop: 16,
                                                                            background:
                                                                                'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                                            border: 'none',
                                                                            borderRadius: 8,
                                                                            fontWeight: 600,
                                                                            height: 36,
                                                                            fontSize:
                                                                                '12px',
                                                                        }}
                                                                        size="small"
                                                                    >
                                                                        Tải vé
                                                                    </AntButton>
                                                                </div>
                                                            );
                                                        },
                                                    );
                                                },
                                            )}
                                        </Space>
                                    </AntCard>
                                )}

                                {/* Action Buttons */}
                                <div className={styles.orderDetailsActionRow}>
                                    <Space
                                        style={{ width: '100%' }}
                                        direction="vertical"
                                        size="middle"
                                    >
                                        {/* Download All Button - Only show if >= 2 tickets */}
                                        {selectedTicket.order.status ===
                                            'PAID' &&
                                            selectedTicket.order.tickets.reduce(
                                                (sum, ticket) =>
                                                    sum + ticket.quantity,
                                                0,
                                            ) >= 2 && (
                                                <AntButton
                                                    type="default"
                                                    icon={<DownloadOutlined />}
                                                    onClick={() =>
                                                        handleDownloadAllTicketsInModal(
                                                            selectedTicket.order,
                                                        )
                                                    }
                                                    size="large"
                                                    style={{
                                                        width: '100%',
                                                        background:
                                                            'linear-gradient(135deg, #10b981, #059669)',
                                                        color: 'white',
                                                        border: 'none',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Tải tất cả{' '}
                                                    {selectedTicket.order.tickets.reduce(
                                                        (sum, ticket) =>
                                                            sum +
                                                            ticket.quantity,
                                                        0,
                                                    )}{' '}
                                                    vé
                                                </AntButton>
                                            )}

                                        {canReviewEvent(
                                            selectedTicket.order,
                                        ) && (
                                            <AntButton
                                                type={
                                                    eventReviews[
                                                        generateReviewId(
                                                            selectedTicket.order
                                                                .eventId,
                                                            user?.id,
                                                        )
                                                    ]
                                                        ? 'default'
                                                        : 'primary'
                                                }
                                                icon={
                                                    eventReviews[
                                                        generateReviewId(
                                                            selectedTicket.order
                                                                .eventId,
                                                            user?.id,
                                                        )
                                                    ] ? (
                                                        <StarFilled
                                                            style={{
                                                                color: '#faad14',
                                                            }}
                                                        />
                                                    ) : (
                                                        <StarOutlined />
                                                    )
                                                }
                                                onClick={() => {
                                                    setShowTicketDetails(false);
                                                    handleOpenReviewForm(
                                                        selectedTicket.order
                                                            .eventId,
                                                    );
                                                }}
                                                size="large"
                                                style={
                                                    eventReviews[
                                                        generateReviewId(
                                                            selectedTicket.order
                                                                .eventId,
                                                            user?.id,
                                                        )
                                                    ]
                                                        ? {
                                                              width: '100%',
                                                              backgroundColor:
                                                                  '#fff7e6',
                                                              borderColor:
                                                                  '#faad14',
                                                              color: '#d48806',
                                                          }
                                                        : { width: '100%' }
                                                }
                                            >
                                                {eventReviews[
                                                    generateReviewId(
                                                        selectedTicket.order
                                                            .eventId,
                                                        user?.id,
                                                    )
                                                ]
                                                    ? 'Chỉnh sửa đánh giá'
                                                    : 'Đánh giá sự kiện'}
                                            </AntButton>
                                        )}
                                        <AntButton
                                            type="default"
                                            onClick={() =>
                                                setShowTicketDetails(false)
                                            }
                                            size="large"
                                            style={{ width: '100%' }}
                                        >
                                            Đóng
                                        </AntButton>
                                    </Space>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AntModal>

            {/* Enhanced Review Form Modal */}
            {showReviewForm && (
                <ReviewForm
                    show={showReviewForm}
                    onHide={() => {
                        setShowReviewForm(false);
                        setSelectedEvent(null);
                        setSelectedReview(null);
                    }}
                    eventId={selectedEvent?.eventId}
                    review={selectedReview}
                    onSuccess={handleReviewSuccess}
                />
            )}
        </Container>
    );
}
