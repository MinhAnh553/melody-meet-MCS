import React, { useEffect } from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import ClientLayout from '../client/layout/ClientLayout.jsx';
import HomePage from '../client/pages/home/HomePage.jsx';
import EventManagementLayout from '../client/layout/EventManagementLayout.jsx';
import ProtectedRoutes from '../client/components/ProtectedRoutes';
import EventCreateWizard from '../client/pages/event/EventCreateWizard.jsx';
import EventDetail from '../client/pages/event/EventDetail.jsx';
import OrganizerReviews from '../client/pages/OrganizerReviews.jsx';
import SelectTicket from '../client/pages/payment/SelectTicket.jsx';
import PaymentInfo from '../client/pages/payment/PaymentInfo.jsx';
import PaymentVerify from '../client/pages/payment/PaymentVerify.jsx';
import PaymentSuccess from '../client/pages/payment/PaymentSuccess.jsx';
import PurchasedTickets from '../client/pages/PurchasedTickets.jsx';
import EventManagement from '../client/pages/event/EventManagement.jsx';
import OrderList from '../client/pages/event/OrderList.jsx';
import EventSummary from '../client/pages/event/EventSummary.jsx';
import EventParticipants from '../client/pages/event/EventParticipants.jsx';
import EventComparison from '../client/pages/event/EventComparison.jsx';
import Layout from '../admin/components/layouts/Layout.jsx';
import Dashboard from '../admin/components/Dashboard/Dashboard.jsx';
import EventsList from '../admin/components/Events/EventsList.jsx';
import OrdersList from '../admin/components/Orders/OrdersList.jsx';
import TicketsList from '../admin/components/Tickets/TicketsList.jsx';
import UsersList from '../admin/components/Users/UsersList.jsx';
import AccessDenied from '../client/pages/AccessDenied.jsx';
import NotFound from '../client/pages/NotFound.jsx';
import RbacRoute from './RbacRoute.jsx';
import { permissions } from '../config/rbacConfig';
import Search from '../client/pages/Search.jsx';
import OrganizerInfo from '../client/pages/organizer/OrganizerInfo.jsx';
import UpgradeRequestPage from '../client/pages/organizer/UpgradeRequestPage.jsx';
import UpgradeRequestsList from '../admin/components/UpgradeRequests/UpgradeRequestsList.jsx';

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
                    <Route element={<ProtectedRoutes />}>
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
                <Route element={<ProtectedRoutes />}>
                    <Route
                        path="/organizer"
                        element={
                            <RbacRoute
                                requiredPermission={permissions.VIEW_ORGANIZERS}
                            />
                        }
                    >
                        <Route
                            index
                            element={<Navigate to="event" replace />}
                        />
                        <Route path="event" element={<EventManagementLayout />}>
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
                            <Route
                                path=":eventId/participants"
                                element={
                                    <motion.div
                                        variants={pageVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        transition={{ duration: 0.5 }}
                                    >
                                        <EventParticipants />
                                    </motion.div>
                                }
                            />
                        </Route>
                        <Route
                            path="comparison"
                            element={<EventComparison />}
                        />
                        <Route
                            path="infomation"
                            element={<EventManagementLayout />}
                        >
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
                                        <OrganizerInfo />
                                    </motion.div>
                                }
                            />
                        </Route>
                    </Route>

                    <Route
                        path="/user/upgrade"
                        element={
                            <RbacRoute
                                requiredPermission={permissions.UPGRADE_USER}
                            />
                        }
                    >
                        <Route element={<ClientLayout />}>
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
                                        <UpgradeRequestPage />
                                    </motion.div>
                                }
                            />
                        </Route>
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
                    <Route element={<ProtectedRoutes />}>
                        <Route
                            path="bookings/select-ticket"
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <SelectTicket />
                                </motion.div>
                            }
                        />
                        <Route
                            path="bookings/:orderId/payment-info"
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <PaymentInfo />
                                </motion.div>
                            }
                        />
                        <Route
                            path="bookings/:orderId/payment-verify"
                            element={
                                <motion.div
                                    variants={pageVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.5 }}
                                >
                                    <PaymentVerify />
                                </motion.div>
                            }
                        />
                        <Route
                            path="bookings/:orderId/payment-success"
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
                    </Route>
                </Route>
                <Route
                    path="/organizer/:organizerId/reviews"
                    element={<ClientLayout />}
                >
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
                                <OrganizerReviews />
                            </motion.div>
                        }
                    />
                </Route>

                <Route element={<ProtectedRoutes />}>
                    <Route
                        path="/admin"
                        element={
                            <RbacRoute
                                requiredPermission={permissions.VIEW_ADMIN}
                            />
                        }
                    >
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
                            <Route
                                path="upgrade-requests"
                                element={<UpgradeRequestsList />}
                            />
                        </Route>
                    </Route>
                </Route>

                <Route path="/search" element={<ClientLayout />}>
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
                                <Search />
                            </motion.div>
                        }
                    />
                </Route>

                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
