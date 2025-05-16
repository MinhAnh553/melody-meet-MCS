import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import styles from '../../styles/EventManagement.module.css';
import swalCustomize from '../../../util/swalCustomize';
import api from '../../../util/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../../context/LoadingContext';

const Step2 = ({ onLoadingChange, data, updateData, isEditMode }) => {
    const { showLoading, hideLoading } = useLoading();
    const { eventId } = useParams();
    const navigate = useNavigate();
    // State cho ticket hiện tại (dùng cho tạo mới hoặc chỉnh sửa)
    const [ticket, setTicket] = useState({
        name: '',
        price: '',
        totalQuantity: '',
        maxPerUser: '',
        // startTime: '',
        // endTime: '',
        description: '',
        // image: null,
        // imagePreview: '',
    });
    // Nếu không null thì đang ở chế độ chỉnh sửa (giá trị là chỉ số của vé cần chỉnh sửa)
    const [editingTicketIndex, setEditingTicketIndex] = useState(null);
    // State điều khiển hiển thị modal
    const [showTicketModal, setShowTicketModal] = useState(false);

    const formatDateTimeLocal = (isoString) => {
        if (!isoString) return ''; // Nếu dữ liệu rỗng, trả về ""
        const date = new Date(isoString);
        return (
            date.getFullYear() +
            '-' +
            String(date.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(date.getDate()).padStart(2, '0') +
            'T' +
            String(date.getHours()).padStart(2, '0') +
            ':' +
            String(date.getMinutes()).padStart(2, '0')
        );
    };

    const handleTicketChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = value;
        if (type === 'checkbox' && name === 'price') {
            newValue = checked ? 0 : ticket.price;
        }
        setTicket((prevTicket) => ({
            ...prevTicket,
            [name]: newValue,
        }));
    };

    const validateTicket = () => {
        // Kiểm tra tên vé
        if (!ticket.name.trim()) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập tên vé',
            });
            return false;
        }
        // Kiểm tra giá vé (nếu không free, giá phải có giá trị hợp lệ)
        if (ticket.price === '' || isNaN(ticket.price)) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập giá vé hợp lệ',
            });
            return false;
        }
        // Kiểm tra tổng số lượng vé
        if (
            !ticket.totalQuantity ||
            isNaN(ticket.totalQuantity) ||
            Number(ticket.totalQuantity) <= 0
        ) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập tổng số lượng vé hợp lệ',
            });
            return false;
        }
        // Kiểm tra số vé tối đa trong một đơn hàng
        if (
            !ticket.maxPerUser ||
            isNaN(ticket.maxPerUser) ||
            Number(ticket.maxPerUser) <= 0
        ) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập số vé tối đa trong một đơn hàng hợp lệ',
            });
            return false;
        }

        // Kiểm tra thời gian bắt đầu và kết thúc bán vé
        // if (!ticket.startTime) {
        //     swalCustomize.Toast.fire({
        //         icon: 'error',
        //         title: 'Vui lòng nhập thời gian bắt đầu bán vé',
        //     });
        //     return false;
        // }

        // if (!ticket.endTime) {
        //     swalCustomize.Toast.fire({
        //         icon: 'error',
        //         title: 'Vui lòng nhập thời gian kết thúc bán vé',
        //     });
        //     return false;
        // }

        // if (new Date(ticket.startTime) <= new Date()) {
        //     swalCustomize.Toast.fire({
        //         icon: 'error',
        //         title: 'Thời gian bắt đầu bán vé phải lớn hơn thời gian hiện tại',
        //     });
        //     return false;
        // }

        // if (
        //     new Date(ticket.startTime) >=
        //     new Date(
        //         data.startTime ||
        //             new Date(ticket.endTime) >= new Date(data.startTime),
        //     )
        // ) {
        //     swalCustomize.Toast.fire({
        //         icon: 'error',
        //         title: 'Phải nhỏ thời gian bắt đầu sự kiện',
        //     });
        //     return false;
        // }

        // if (new Date(ticket.endTime) <= new Date(ticket.startTime)) {
        //     swalCustomize.Toast.fire({
        //         icon: 'error',
        //         title: 'Thời gian kết thúc bán vé phải lớn hơn thời gian bắt đầu bán vé',
        //     });
        //     return false;
        // }

        return true;
    };

    const validateEvent = () => {
        // Thời gian sự kiện
        if (!data.startTime) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập thời gian bắt đầu sự kiện',
            });
            return false;
        }

        if (!data.endTime) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập thời gian kết thúc sự kiện',
            });
            return false;
        }

        if (new Date(data.startTime) <= new Date()) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Thời gian bắt đầu phải lớn hơn thời gian hiện tại',
            });
            return false;
        }

        if (new Date(data.endTime) <= new Date(data.startTime)) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu',
            });
            return false;
        }

        // Kiểm tra có ít nhất 1 loại vé
        if (!data.ticketTypes || data.ticketTypes.length === 0) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng tạo ít nhất 1 loại vé',
            });
            return false;
        }

        return true;
    };

    // Hàm lưu vé (thêm mới hoặc chỉnh sửa)
    const handleSaveTicket = () => {
        if (!validateTicket()) return;

        if (editingTicketIndex !== null) {
            // Chế độ chỉnh sửa: cập nhật vé tại vị trí editingTicketIndex
            const updatedTickets = [...data.ticketTypes];
            const oldTicket = updatedTickets[editingTicketIndex];
            // Nếu có imagePreview cũ và hình ảnh mới khác, giải phóng URL của hình cũ
            if (
                oldTicket.imagePreview &&
                oldTicket.imagePreview !== ticket.imagePreview
            ) {
                URL.revokeObjectURL(oldTicket.imagePreview);
            }
            updatedTickets[editingTicketIndex] = ticket;
            updateData({ ticketTypes: updatedTickets });
            setEditingTicketIndex(null);
        } else {
            // Chế độ thêm mới vé: thêm vé mới vào mảng
            updateData({ ticketTypes: [...data.ticketTypes, ticket] });
        }
        // Reset state ticket sau khi lưu
        setTicket({
            name: '',
            price: '',
            totalQuantity: '',
            maxPerUser: '',
            // startTime: '',
            // endTime: '',
            description: '',
            // image: null,
            // imagePreview: '',
        });
        setShowTicketModal(false);
    };

    // Hàm chỉnh sửa vé: load dữ liệu vé (bao gồm imagePreview) vào state ticket và mở modal
    const handleEditTicket = (index) => {
        const ticketToEdit = data.ticketTypes[index];
        setTicket(ticketToEdit);
        setEditingTicketIndex(index);
        setShowTicketModal(true);
    };

    // Hàm xóa vé: nếu có imagePreview, giải phóng URL, sau đó xóa vé khỏi mảng
    const handleDeleteTicket = (index) => {
        const ticketToDelete = data.ticketTypes[index];
        if (ticketToDelete.imagePreview) {
            URL.revokeObjectURL(ticketToDelete.imagePreview);
        }
        const updatedTickets = data.ticketTypes.filter((_, i) => i !== index);
        updateData({ ticketTypes: updatedTickets });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEvent()) return;

        const formData = new FormData();
        formData.append('eventName', data.eventName);
        if (data.eventBackground !== null) {
            formData.append('eventBackground', data.eventBackground);
        }
        formData.append('description', data.description);
        formData.append('venueName', data.addressData.venueName);
        formData.append('province', data.addressData.province);
        formData.append('district', data.addressData.district);
        formData.append('ward', data.addressData.ward);
        formData.append('address', data.addressData.address);
        if (data.organizerLogo !== null) {
            formData.append('organizerLogo', data.organizerLogo);
        }
        formData.append('organizerName', data.organizerName);
        formData.append('organizerInfo', data.organizerInfo);
        formData.append('startTime', data.startTime);
        formData.append('endTime', data.endTime);
        formData.append('ticketTypes', JSON.stringify(data.ticketTypes));

        try {
            onLoadingChange(true);
            showLoading();
            let res;
            if (isEditMode) {
                res = await api.updateEvent(eventId, formData);
            } else {
                res = await api.createEvent(formData);
            }

            if (res.success) {
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: res.message,
                });
                navigate('/event', { state: { createSuccess: true } });
            } else {
                return swalCustomize.Toast.fire({
                    icon: 'error',
                    title: res.message,
                });
            }
        } catch (error) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
            });
        } finally {
            onLoadingChange(false);
            hideLoading();
        }
    };

    return (
        <>
            <form
                className={styles.form}
                id="eventForm"
                onSubmit={handleSubmit}
                encType="multipart/form-data"
            >
                <div className="card card-dark text-white border-light p-4">
                    <h5 className="mb-3">Thời gian sự kiện</h5>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label">
                                Thời gian bắt đầu
                            </label>
                            <input
                                type="datetime-local"
                                className="form-control text-black"
                                name="startTime"
                                value={formatDateTimeLocal(data.startTime)}
                                onChange={(e) =>
                                    updateData({
                                        startTime: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">
                                Thời gian kết thúc
                            </label>
                            <input
                                type="datetime-local"
                                className="form-control text-black"
                                name="endTime"
                                value={formatDateTimeLocal(data.endTime)}
                                onChange={(e) =>
                                    updateData({
                                        endTime: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <h5 className="mb-3 form-item-required">Loại vé</h5>
                    {data.ticketTypes.map((ticket, index) => (
                        <div
                            key={index}
                            className="mb-3 d-flex justify-content-between align-items-center"
                            style={{
                                background: 'rgb(65, 70, 82)',
                                padding: '15px',
                                borderRadius: '10px',
                            }}
                        >
                            <div>
                                <i className="bi bi-ticket-fill"></i>{' '}
                                <strong>{ticket.name}</strong>
                            </div>
                            <div className="d-flex">
                                <Button
                                    variant="light"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleEditTicket(index)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteTicket(index)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <i className="bi bi-trash"></i>
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button
                        variant="success"
                        className="d-flex align-items-center mx-auto"
                        onClick={() => {
                            setEditingTicketIndex(null);
                            setTicket({
                                name: '',
                                price: '',
                                totalQuantity: '',
                                maxPerUser: '',
                                // startTime: '',
                                // endTime: '',
                                description: '',
                                // image: null,
                                // imagePreview: '',
                            });
                            setShowTicketModal(true);
                        }}
                        style={{ width: '160px' }}
                    >
                        <span className="me-2">+</span> Tạo loại vé mới
                    </Button>
                </div>
            </form>

            <Modal
                show={showTicketModal}
                onHide={() => setShowTicketModal(false)}
                size="lg"
                centered
            >
                <Modal.Header
                    closeButton
                    style={{ backgroundColor: '#343a40' }}
                >
                    <Modal.Title style={{ color: '#fff' }}>
                        {editingTicketIndex !== null
                            ? 'Chỉnh sửa loại vé'
                            : 'Tạo loại vé mới'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#343a40' }}>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label
                                className="form-item-required"
                                style={{ color: '#fff' }}
                            >
                                Tên vé
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Tên vé"
                                name="name"
                                value={ticket.name}
                                onChange={handleTicketChange}
                                style={{ color: 'black' }}
                            />
                        </Form.Group>
                        <div className="row">
                            <div className="col-md-3">
                                <Form.Group className="mb-3">
                                    <Form.Label
                                        className="form-item-required"
                                        style={{ color: '#fff' }}
                                    >
                                        Giá vé
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="price"
                                        placeholder="Giá vé"
                                        value={ticket.price}
                                        onChange={handleTicketChange}
                                        style={{ color: 'black' }}
                                    />
                                </Form.Group>
                                <Form.Check
                                    type="checkbox"
                                    label="Miễn phí"
                                    id="freeTicket"
                                    name="price"
                                    checked={ticket.price === 0}
                                    onChange={(e) =>
                                        setTicket((prev) => ({
                                            ...prev,
                                            price: e.target.checked ? 0 : '',
                                        }))
                                    }
                                    style={{ color: '#fff' }}
                                />
                            </div>
                            <div className="col-md-3">
                                <Form.Group className="mb-3">
                                    <Form.Label
                                        className="form-item-required"
                                        style={{ color: '#fff' }}
                                    >
                                        Tổng số lượng vé
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="totalQuantity"
                                        placeholder="Tổng số lượng vé"
                                        value={ticket.totalQuantity}
                                        onChange={handleTicketChange}
                                        style={{ color: 'black' }}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label
                                        className="form-item-required"
                                        style={{ color: '#fff' }}
                                    >
                                        Số vé tối đa trong một đơn hàng
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="maxPerUser"
                                        placeholder="Số vé tối đa trong một đơn hàng"
                                        value={ticket.maxPerUser}
                                        onChange={handleTicketChange}
                                        style={{ color: 'black' }}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        {/* <div className="row mt-3">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label
                                        className="form-item-required"
                                        style={{ color: '#fff' }}
                                    >
                                        Thời gian bắt đầu bán vé
                                    </Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="startTime"
                                        value={ticket.startTime}
                                        onChange={handleTicketChange}
                                        style={{ color: 'black' }}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label
                                        className="form-item-required"
                                        style={{ color: '#fff' }}
                                    >
                                        Thời gian kết thúc bán vé
                                    </Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="endTime"
                                        value={ticket.endTime}
                                        onChange={handleTicketChange}
                                        style={{ color: 'black' }}
                                    />
                                </Form.Group>
                            </div>
                        </div> */}
                        <div className="row mt-3  align-items-center">
                            <div className="col-md-8">
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: '#fff' }}>
                                        Thông tin vé
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Nội dung..."
                                        name="description"
                                        value={ticket.description}
                                        onChange={handleTicketChange}
                                        style={{ color: 'black' }}
                                    />
                                </Form.Group>
                            </div>
                            {/* <div
                                className="col-md-4 text-center"
                                style={{ minHeight: '100px !important' }}
                            >
                                <UploadImage
                                    id="imageTicket"
                                    iconClass="fas fa-upload fa-2x text-success"
                                    defaultText="Hình ảnh vé"
                                    inputName="imageTicket"
                                    defaultPreview={ticket.imagePreview}
                                    onFileSelect={(file, previewUrl) =>
                                        setTicket((prev) => ({
                                            ...prev,
                                            image: file,
                                            imagePreview: previewUrl,
                                        }))
                                    }
                                />
                            </div> */}
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#343a40' }}>
                    <Button variant="success" onClick={handleSaveTicket}>
                        Lưu
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Step2;
