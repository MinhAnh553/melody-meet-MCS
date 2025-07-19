import React from 'react';
import styles from '../../pages/home/HomePage.module.css';

const HeroCarouselSkeleton = () => (
    <div className={styles.eventSlide}>
        {/* Desktop Layout */}
        <div className={styles.desktopLayout}>
            <div className={styles.eventInfo}>
                <div
                    className={`${styles.skeleton} ${styles.skeletonTitle}`}
                ></div>
                <div
                    className={`${styles.skeleton} ${styles.skeletonDate}`}
                ></div>
                <div
                    className={`${styles.skeleton} ${styles.skeletonLocation}`}
                ></div>
            </div>
            <div className={styles.eventImage}>
                <div
                    className={`${styles.skeleton} ${styles.skeletonImage}`}
                ></div>
            </div>
        </div>
        {/* Mobile Layout */}
        <div className={styles.mobileLayout}>
            <div className={styles.mobileBgContainer}>
                <div
                    className={`${styles.skeleton} ${styles.skeletonMobileBg}`}
                ></div>
                <div className={styles.mobileOverlay}></div>
            </div>
            <div className={styles.mobileContent}>
                <div
                    className={`${styles.skeleton} ${styles.skeletonMobileTitle}`}
                ></div>
                <div className={styles.mobileEventDetails}>
                    <div
                        className={`${styles.skeleton} ${styles.skeletonMobileDate}`}
                    ></div>
                    <div
                        className={`${styles.skeleton} ${styles.skeletonMobileLocation}`}
                    ></div>
                </div>
            </div>
        </div>
    </div>
);

export default HeroCarouselSkeleton;
