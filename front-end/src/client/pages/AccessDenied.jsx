import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaLock } from 'react-icons/fa';

const AccessDenied = () => {
    return (
        <div className="bg-dark min-vh-100 d-flex align-items-center">
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5}>
                        <Card
                            className="border-0 bg-dark text-light shadow-lg"
                            style={{
                                boxShadow: '0 0 20px rgba(255,255,255,0.1)',
                            }}
                        >
                            <Card.Body className="p-5 text-center">
                                <div className="mb-4">
                                    <FaLock
                                        className="text-danger"
                                        style={{ fontSize: '5rem' }}
                                    />
                                </div>

                                <h1 className="fw-bold text-light mb-3">
                                    Truy Cập Bị Từ Chối
                                </h1>

                                <p className="text-light mb-4">
                                    Xin lỗi, bạn không có quyền truy cập vào
                                    trang này. Vui lòng liên hệ với quản trị
                                    viên nếu bạn cho rằng đây là một sai sót.
                                </p>

                                <Button
                                    as={Link}
                                    to="/"
                                    variant="danger"
                                    size="lg"
                                    className="px-4 py-2 rounded-pill"
                                >
                                    Quay Về Trang Chủ
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default AccessDenied;
