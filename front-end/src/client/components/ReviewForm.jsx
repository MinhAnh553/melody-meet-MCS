import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import api from '../../util/api';
import swalCustomize from '../../util/swalCustomize';

const ReviewForm = ({ show, onHide, eventId, review = null, onSuccess }) => {
    const [formData, setFormData] = useState({
        rating: 5,
        comment: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (review) {
            setFormData({
                rating: review.rating,
                comment: review.comment || '',
            });
        } else {
            setFormData({
                rating: 5,
                comment: '',
            });
        }
        setErrors({});
    }, [review, show]);

    const handleRatingChange = (rating) => {
        setFormData((prev) => ({ ...prev, rating }));
        if (errors.rating) {
            setErrors((prev) => ({ ...prev, rating: null }));
        }
    };

    const handleCommentChange = (e) => {
        const comment = e.target.value;
        setFormData((prev) => ({ ...prev, comment }));
        if (errors.comment) {
            setErrors((prev) => ({ ...prev, comment: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
            newErrors.rating = 'Vui lòng chọn đánh giá từ 1 đến 5 sao';
        }

        if (formData.comment && formData.comment.length > 1000) {
            newErrors.comment = 'Bình luận không được quá 1000 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const newFormData = new FormData();
            newFormData.append('eventId', eventId);
            newFormData.append('rating', formData.rating);
            newFormData.append('comment', formData.comment);

            if (review) {
                // Cập nhật đánh giá
                await api.updateReview(review._id, newFormData);
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Cập nhật đánh giá thành công!',
                });
            } else {
                // Tạo đánh giá mới
                await api.createReview(newFormData);
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Đánh giá thành công!',
                });
            }

            onSuccess && onSuccess();
            onHide();
        } catch (error) {
            console.error('Review error:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra';
            swalCustomize.Toast.fire({
                icon: 'error',
                title: message,
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return (
            <div className="d-flex align-items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        className={`star-icon ${
                            star <= formData.rating
                                ? 'text-warning'
                                : 'text-light'
                        }`}
                        style={{
                            cursor: 'pointer',
                            fontSize: '24px',
                            transition: 'color 0.2s ease',
                        }}
                        onClick={() => handleRatingChange(star)}
                    />
                ))}
                <span className="ms-2 text-light">({formData.rating}/5)</span>
            </div>
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {review ? 'Chỉnh sửa đánh giá' : 'Đánh giá sự kiện'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">
                                    Đánh giá của bạn{' '}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                {renderStars()}
                                {errors.rating && (
                                    <div className="text-danger mt-1 small">
                                        {errors.rating}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">
                                    Bình luận (tùy chọn)
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    className="text-dark"
                                    rows={4}
                                    value={formData.comment}
                                    onChange={handleCommentChange}
                                    placeholder="Chia sẻ trải nghiệm của bạn về sự kiện này..."
                                    isInvalid={!!errors.comment}
                                />
                                <Form.Text className="text-muted">
                                    {formData.comment.length}/1000 ký tự
                                </Form.Text>
                                {errors.comment && (
                                    <Form.Control.Feedback type="invalid">
                                        {errors.comment}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={onHide}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="success"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Đang xử lý...
                                </>
                            ) : review ? (
                                'Cập nhật'
                            ) : (
                                'Gửi đánh giá'
                            )}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default ReviewForm;
