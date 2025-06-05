import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const NotFound = () => {
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
                                    <FaSearch
                                        className="text-primary"
                                        style={{ fontSize: '5rem' }}
                                    />
                                </div>

                                <h1 className="display-1 fw-bold text-primary mb-3">
                                    404
                                </h1>

                                <h2 className="h3 text-light mb-4">
                                    Không Tìm Thấy Trang
                                </h2>

                                <p className="text-light mb-4">
                                    Xin lỗi! Trang bạn đang tìm kiếm không tồn
                                    tại hoặc đã bị di chuyển.
                                </p>

                                <Button
                                    as={Link}
                                    to="/"
                                    variant="primary"
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

export default NotFound;
