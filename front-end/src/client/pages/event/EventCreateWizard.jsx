import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EventFormProvider } from '../../context/EventFormContext';
import Step1 from './Step1';
import Step2 from './Step2';
import { AnimatePresence, motion } from 'framer-motion';
import HeaderEvent from '../../components/HeaderEvent';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import { useLoading } from '../../context/LoadingContext';

const EventForm = () => {
    const [loadingLocal, setLoadingLocal] = useState(true);
    const { eventId } = useParams(); // Lấy eventId từ URL
    const isEditMode = Boolean(eventId); // Kiểm tra xem có đang chỉnh sửa không
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [stepLoading, setStepLoading] = useState(false);
    const [formData, setFormData] = useState({
        eventName: '',
        eventBackground: null,
        eventBackgroundPreview: null,
        addressData: '',
        description: '',
        organizerLogo: null,
        organizerLogoPreview: '',
        organizerName: '',
        organizerInfo: '',
        startTime: '',
        endTime: '',
        ticketTypes: [],
    });

    useEffect(() => {
        window.scrollTo(0, 0);

        // Nếu là chỉnh sửa, fetch dữ liệu sự kiện
        if (isEditMode) {
            fetchEventData();
        }
    }, []);

    const fetchEventData = async () => {
        try {
            setStepLoading(true);
            setLoadingLocal(true);
            const response = await api.getEventByIdToEdit(eventId);
            if (response.success) {
                const eventData = response.event;

                if (eventData.status === 'event_over') {
                    navigate(`/event`);
                }

                // Cập nhật dữ liệu vào form
                setFormData({
                    eventName: eventData.name || '',
                    eventBackground: null,
                    eventBackgroundPreview: eventData.background || null,
                    addressData: eventData.location || '',
                    description: eventData.description || '',
                    organizerLogo: null,
                    organizerLogoPreview: eventData.organizer.logo || '',
                    organizerName: eventData.organizer.name || '',
                    organizerInfo: eventData.organizer.info || '',
                    startTime: eventData.startTime || '',
                    endTime: eventData.endTime || '',
                    ticketTypes: eventData.ticketTypes || [],
                });

                setStepLoading(false);
            } else {
                navigate('/event');
                swalCustomize.Toast.fire({
                    icon: 'error',
                    title: 'Không đủ quyền hạn!',
                });
            }
        } catch (error) {
            // console.error('Lỗi khi tải dữ liệu sự kiện:', error);
            setStepLoading(false);
        } finally {
            setLoadingLocal(false);
        }
    };

    const handleStep1Success = () => {
        setStep(2);
    };

    const updateFormData = (newData) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    };

    // Animation cho các bước
    const variants = {
        initial: { x: 100, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -100, opacity: 0 },
    };

    return (
        <div style={{ position: 'relative' }}>
            <HeaderEvent
                loading={stepLoading}
                currentStep={step}
                onStepClick={setStep}
            />
            {loadingLocal && isEditMode ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải...</p>
                </div>
            ) : (
                <EventFormProvider>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={variants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.5 }}
                            >
                                <Step1
                                    onSuccess={handleStep1Success}
                                    onLoadingChange={setStepLoading}
                                    data={formData}
                                    updateData={updateFormData}
                                    isEditMode={isEditMode}
                                />
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={variants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 1 }}
                            >
                                <Step2
                                    onLoadingChange={setStepLoading}
                                    data={formData}
                                    updateData={updateFormData}
                                    isEditMode={isEditMode}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* {stepLoading && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 10000,
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        }}
                    />
                )} */}
                </EventFormProvider>
            )}
        </div>
    );
};

export default EventForm;
