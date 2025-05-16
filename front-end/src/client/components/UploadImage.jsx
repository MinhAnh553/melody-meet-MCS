import React, { useRef, useState, useEffect } from 'react';
import styles from '../styles/EventManagement.module.css';

const UploadImage = ({
    id,
    iconClass,
    defaultText,
    inputName,
    onFileSelect,
    defaultPreview, // Nhận ảnh đã lưu trong formData để hiển thị lại
}) => {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(defaultPreview || null); // Nếu có ảnh đã lưu, hiển thị luôn

    const handleBoxClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreviewUrl(imageUrl);
            if (onFileSelect) {
                onFileSelect(file, imageUrl);
            }
        }
    };

    useEffect(() => {
        if (defaultPreview) {
            setPreviewUrl(defaultPreview);
        }
    }, [defaultPreview]);

    return (
        <div id={id} className="upload-box" onClick={handleBoxClick}>
            {previewUrl ? (
                <div>
                    <img
                        id={`preview-${id}`}
                        src={previewUrl}
                        alt="Xem trước"
                        style={{
                            width: 'calc(100% - 10px)',
                            maxHeight: '240px',
                            objectFit: 'cover',
                        }}
                    />
                </div>
            ) : (
                <>
                    <i id={`icon-${id}`} className={iconClass} />
                    <p id={`text-${id}`} className={`${styles.formTitle} mt-1`}>
                        {defaultText}
                    </p>
                </>
            )}
            <input
                type="file"
                name={inputName}
                id={`input-${id}`}
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default UploadImage;
