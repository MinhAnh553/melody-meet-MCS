import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Rate,
    Input,
    Button,
    Space,
    Typography,
    Divider,
    Card,
    Avatar,
    notification,
    Spin,
} from 'antd';
import {
    StarOutlined,
    StarFilled,
    SendOutlined,
    EditOutlined,
    UserOutlined,
    MessageOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import api from '../../util/api';
import styles from './ReviewForm.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ReviewForm = ({ show, onHide, eventId, review = null, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (review) {
            setRating(review.rating);
            setComment(review.comment || '');
            form.setFieldsValue({
                rating: review.rating,
                comment: review.comment || '',
            });
        } else {
            setRating(5);
            setComment('');
            form.setFieldsValue({
                rating: 5,
                comment: '',
            });
        }
    }, [review, show, form]);

    const handleRatingChange = (value) => {
        setRating(value);
    };

    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

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

    const handleSubmit = async (values) => {
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('eventId', eventId);
            formData.append('rating', values.rating);
            formData.append('comment', values.comment || '');

            if (review) {
                // Cập nhật đánh giá
                await api.updateReview(review._id, formData);
                showNotification(
                    'success',
                    'Cập nhật thành công!',
                    'Đánh giá của bạn đã được cập nhật.',
                );
            } else {
                // Tạo đánh giá mới
                await api.createReview(formData);
                showNotification(
                    'success',
                    'Đánh giá thành công!',
                    'Cảm ơn bạn đã chia sẻ trải nghiệm.',
                );
            }

            onSuccess && onSuccess();
            onHide();
        } catch (error) {
            console.error('Review error:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra';
            showNotification('error', 'Lỗi', message);
        } finally {
            setLoading(false);
        }
    };

    const getRatingText = (rating) => {
        const ratingTexts = {
            1: 'Rất không hài lòng',
            2: 'Không hài lòng',
            3: 'Bình thường',
            4: 'Hài lòng',
            5: 'Rất hài lòng',
        };
        return ratingTexts[rating] || '';
    };

    const getRatingColor = (rating) => {
        const colors = {
            1: '#ff4d4f',
            2: '#ff7a45',
            3: '#faad14',
            4: '#52c41a',
            5: '#1890ff',
        };
        return colors[rating] || '#faad14';
    };

    return (
        <Modal
            open={show}
            onCancel={onHide}
            footer={null}
            width={800}
            centered
            className={styles.reviewModal}
            title={
                <div className={styles.modalHeader}>
                    <div className={styles.headerIcon}>
                        {review ? <EditOutlined /> : <StarOutlined />}
                    </div>
                    <div>
                        <Title level={4} className={styles.modalTitle}>
                            {review ? 'Chỉnh sửa đánh giá' : 'Đánh giá sự kiện'}
                        </Title>
                    </div>
                </div>
            }
        >
            <div className={styles.modalContent}>
                <Form
                    form={form}
                    layout="horizontal"
                    onFinish={handleSubmit}
                    className={styles.reviewForm}
                    initialValues={{
                        rating: 5,
                        comment: '',
                    }}
                >
                    {/* Main Content - Side by Side Layout */}
                    <div className={styles.mainContent}>
                        {/* Rating Section */}
                        <div className={styles.ratingSection}>
                            <div className={styles.sectionHeader}>
                                <StarFilled
                                    style={{
                                        color: getRatingColor(rating),
                                        fontSize: '16px',
                                    }}
                                />
                                <Text strong>Đánh giá: </Text>
                                <Text
                                    style={{
                                        color: getRatingColor(rating),
                                        fontWeight: 600,
                                    }}
                                >
                                    {getRatingText(rating)}
                                </Text>
                            </div>

                            <Form.Item
                                name="rating"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng chọn đánh giá!',
                                    },
                                ]}
                                className={styles.ratingFormItem}
                            >
                                <Rate
                                    character={<StarFilled />}
                                    value={rating}
                                    onChange={handleRatingChange}
                                    className={styles.ratingStars}
                                    style={{ fontSize: '24px' }}
                                />
                            </Form.Item>

                            <div className={styles.ratingDisplay}>
                                <Text
                                    strong
                                    style={{
                                        fontSize: '18px',
                                        color: getRatingColor(rating),
                                    }}
                                >
                                    {rating}/5
                                </Text>
                            </div>
                        </div>

                        {/* Comment Section */}
                        <div className={styles.commentSection}>
                            <div className={styles.sectionHeader}>
                                <MessageOutlined
                                    style={{
                                        color: '#52c41a',
                                        fontSize: '16px',
                                    }}
                                />
                                <Text strong>Bình luận (tùy chọn)</Text>
                            </div>

                            <Form.Item
                                name="comment"
                                rules={[
                                    {
                                        max: 1000,
                                        message: 'Không được quá 1000 ký tự!',
                                    },
                                ]}
                                className={styles.commentFormItem}
                            >
                                <TextArea
                                    placeholder="Chia sẻ trải nghiệm của bạn..."
                                    autoSize={{ minRows: 3, maxRows: 4 }}
                                    value={comment}
                                    onChange={handleCommentChange}
                                    className={styles.commentTextarea}
                                    showCount
                                    maxLength={1000}
                                />
                            </Form.Item>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        <Space>
                            <Button onClick={onHide} disabled={loading}>
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={
                                    review ? <EditOutlined /> : <SendOutlined />
                                }
                                className={styles.submitButton}
                            >
                                {review ? 'Cập nhật' : 'Gửi đánh giá'}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </div>
        </Modal>
    );
};

export default ReviewForm;
