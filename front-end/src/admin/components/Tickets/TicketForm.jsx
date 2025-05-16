import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { FaImage } from 'react-icons/fa';
import styles from './Tickets.module.css';

const TicketForm = ({ ticket, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        eventId: '',
        type: '',
        price: '',
        description: '',
        quantity: '',
        sold: 0,
        available: 0,
        image: '',
    });

    const [errors, setErrors] = useState({});

    // If editing an existing ticket, populate the form
    useEffect(() => {
        if (ticket) {
            setFormData({
                ...ticket,
                eventId: ticket.eventId.toString(),
                price: ticket.price.toString(),
                quantity: ticket.quantity.toString(),
                sold: ticket.sold.toString(),
                available: ticket.available.toString(),
            });
        }
    }, [ticket]);

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null,
            });
        }

        // Recalculate available tickets if quantity or sold changes
        if (name === 'quantity' || name === 'sold') {
            const quantity =
                name === 'quantity'
                    ? parseInt(value) || 0
                    : parseInt(formData.quantity) || 0;
            const sold =
                name === 'sold'
                    ? parseInt(value) || 0
                    : parseInt(formData.sold) || 0;

            setFormData((prev) => ({
                ...prev,
                available: Math.max(0, quantity - sold).toString(),
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.eventId) {
            newErrors.eventId = 'Vui lòng chọn sự kiện';
        }

        if (!formData.type.trim()) {
            newErrors.type = 'Loại vé là bắt buộc';
        }

        if (!formData.price) {
            newErrors.price = 'Giá vé là bắt buộc';
        } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Giá vé phải là số dương';
        }

        if (!formData.quantity) {
            newErrors.quantity = 'Số lượng vé là bắt buộc';
        } else if (
            isNaN(formData.quantity) ||
            parseInt(formData.quantity) <= 0
        ) {
            newErrors.quantity = 'Số lượng vé phải là số dương';
        }

        if (isNaN(formData.sold) || parseInt(formData.sold) < 0) {
            newErrors.sold = 'Số vé đã bán phải là số không âm';
        }

        if (parseInt(formData.sold) > parseInt(formData.quantity)) {
            newErrors.sold = 'Số vé đã bán không thể lớn hơn tổng số vé';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Convert string values to numbers
        const ticketData = {
            ...formData,
            eventId: parseInt(formData.eventId),
            price: parseInt(formData.price),
            quantity: parseInt(formData.quantity),
            sold: parseInt(formData.sold),
            available: parseInt(formData.available),
        };

        onSubmit(ticketData);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <div className={styles.ticketFormGrid}>
                {/* Left Column */}
                <div>
                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Sự kiện
                        </Form.Label>
                        <Form.Select
                            name="eventId"
                            value={formData.eventId}
                            onChange={handleChange}
                            isInvalid={!!errors.eventId}
                            disabled={ticket !== null} // Disable if editing
                        >
                            <option value="">Chọn sự kiện</option>
                            {events.map((event) => (
                                <option
                                    key={event.id}
                                    value={event.id.toString()}
                                >
                                    {event.title}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.eventId}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Loại vé
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            placeholder="Nhập loại vé (VIP, Regular, ...)"
                            isInvalid={!!errors.type}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.type}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Giá vé (VNĐ)
                        </Form.Label>
                        <Form.Control
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Nhập giá vé"
                            min="0"
                            isInvalid={!!errors.price}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.price}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Mô tả
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Nhập mô tả về loại vé này"
                            isInvalid={!!errors.description}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.description}
                        </Form.Control.Feedback>
                    </Form.Group>
                </div>

                {/* Right Column */}
                <div>
                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Tổng số vé
                        </Form.Label>
                        <Form.Control
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            placeholder="Nhập tổng số vé"
                            min="0"
                            isInvalid={!!errors.quantity}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.quantity}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Số vé đã bán
                        </Form.Label>
                        <Form.Control
                            type="number"
                            name="sold"
                            value={formData.sold}
                            onChange={handleChange}
                            placeholder="Nhập số vé đã bán"
                            min="0"
                            isInvalid={!!errors.sold}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.sold}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Số vé còn lại
                        </Form.Label>
                        <Form.Control
                            type="number"
                            name="available"
                            value={formData.available}
                            readOnly
                            disabled
                        />
                        <Form.Text className="text-muted">
                            Được tính tự động (Tổng số vé - Số vé đã bán)
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Hình ảnh
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="Nhập URL hình ảnh"
                        />

                        {formData.image ? (
                            <img
                                src={formData.image}
                                alt="Preview"
                                className={styles.imagePreview}
                            />
                        ) : (
                            <div className={styles.imagePreview}>
                                <div className={styles.imagePreviewLabel}>
                                    <FaImage size={40} />
                                    <p>Chưa có hình ảnh</p>
                                </div>
                            </div>
                        )}
                    </Form.Group>
                </div>
            </div>

            <div className={styles.formActions}>
                <Button variant="secondary" onClick={onCancel}>
                    Hủy
                </Button>
                <Button variant="primary" type="submit">
                    {ticket ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </div>
        </Form>
    );
};

export default TicketForm;
