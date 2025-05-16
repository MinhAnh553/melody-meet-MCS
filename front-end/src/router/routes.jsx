import React, { useEffect } from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import ClientLayout from '../client/layout/ClientLayout.jsx';
import HomePage from '../client/pages/home/HomePage.jsx';
import EventManagementLayout from '../client/layout/EventManagementLayout.jsx';
import ProtectedRoute from '../client/components/ProtectedRoute';
import EventCreateWizard from '../client/pages/event/EventCreateWizard.jsx';
import EventDetail from '../client/pages/event/EventDetail.jsx';
import PaymentSuccess from '../client/pages/payment/PaymentSuccess.jsx';
import OrderPage from '../client/pages/payment/OrderPage.jsx';
import PurchasedTickets from '../client/pages/PurchasedTickets.jsx';
import EventManagement from '../client/pages/event/EventManagement.jsx';
import OrderList from '../client/pages/event/OrderList.jsx';
import EventSummary from '../client/pages/event/EventSummary.jsx';
import Layout from '../admin/components/layouts/Layout.jsx';
import Dashboard from '../admin/components/Dashboard/Dashboard.jsx';
import EventsList from '../admin/components/Events/EventsList.jsx';
import OrdersList from '../admin/components/Orders/OrdersList.jsx';
import TicketsList from '../admin/components/Tickets/TicketsList.jsx';
import UsersList from '../admin/components/Users/UsersList.jsx';
import ProtectedAdminRoute from '../admin/components/ProtectedAdminRoute.jsx';
import AllEvents from '../client/pages/home/AllEvents.jsx';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

const AnimatedRoutes = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant',
        });
    }, [location.pathname]);

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<ClientLayout />}>
                    <Route index element={<HomePage />} />
                    <Route
                        path="all-events"
                        element={
                            <motion.div
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.5 }}
                            >
                                <AllEvents />
                            </motion.div>
                        }
                    />
                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="my-tickets"
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <PurchasedTickets />
                                </motion.div>
                            }
                        />
                    </Route>
                </Route>
                <Route path="event" element={<ProtectedRoute />}>
                    <Route element={<EventManagementLayout />}>
                        <Route
                            index
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <EventManagement />
                                </motion.div>
                            }
                        />
                        <Route
                            path="create"
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <EventCreateWizard />
                                </motion.div>
                            }
                        />
                        <Route
                            path=":eventId/edit"
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <EventCreateWizard />
                                </motion.div>
                            }
                        />
                        <Route
                            path=":eventId/orders"
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <OrderList />
                                </motion.div>
                            }
                        />
                        <Route
                            path=":eventId/summary"
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <EventSummary />
                                </motion.div>
                            }
                        />
                    </Route>
                </Route>
                <Route path="/event/:eventId" element={<ClientLayout />}>
                    <Route
                        index
                        element={
                            <motion.div
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.5 }}
                            >
                                <EventDetail />
                            </motion.div>
                        }
                    />
                </Route>
                <Route path="/order">
                    <Route
                        path="payment-success"
                        element={
                            <motion.div
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.5 }}
                            >
                                <PaymentSuccess />
                            </motion.div>
                        }
                    />
                    <Route
                        path=":orderId"
                        element={
                            <motion.div
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.5 }}
                            >
                                <OrderPage />
                            </motion.div>
                        }
                    />
                </Route>
                <Route path="/admin" element={<ProtectedAdminRoute />}>
                    <Route element={<Layout />}>
                        <Route
                            index
                            element={<Navigate to="dashboard" replace />}
                        />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="events" element={<EventsList />} />
                        <Route path="orders" element={<OrdersList />} />
                        <Route path="tickets" element={<TicketsList />} />
                        <Route path="users" element={<UsersList />} />
                    </Route>
                </Route>
            </Routes>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
