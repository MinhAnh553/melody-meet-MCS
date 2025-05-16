import React from 'react';
import styles from '../../styles/EventManagement.module.css';
import DescriptionEditor from '../../components/DescriptionEditor';
import AddressSelector from '../../components/AddressSelector';
import UploadImage from '../../components/UploadImage';
import swalCustomize from '../../../util/swalCustomize';

const Step1 = ({
    onSuccess,
    onLoadingChange,
    data,
    updateData,
    isEditMode,
}) => {
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!data.eventName.trim()) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập tên sự kiện',
            });
        }

        if (
            !data.addressData.venueName ||
            !data.addressData.province ||
            !data.addressData.district ||
            !data.addressData.ward ||
            !data.addressData.address
        ) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập đầy đủ địa chỉ sự kiện',
            });
        }

        if (!data.description.trim()) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập thông tin sự kiện',
            });
        }

        if (!data.organizerName.trim() || !data.organizerInfo.trim()) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập thông tin ban tổ chức',
            });
        }

        if (!isEditMode && (!data.eventBackground || !data.organizerLogo)) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng tải lên đầy đủ hình ảnh',
            });
        }

        swalCustomize.Toast.fire({
            icon: 'success',
            title: 'Lưu thông tin sự kiện thành công',
        });
        onSuccess();
    };

    return (
        <form
            className={styles.form}
            id="eventForm"
            onSubmit={handleSubmit}
            encType="multipart/form-data"
        >
            <div className="card-dark">
                <div className="row align-items-center">
                    <div className="col-md-7 mb-3">
                        <label
                            className={`${styles.formTitle} form-label form-item-required`}
                            htmlFor="eventName"
                        >
                            Tên sự kiện
                        </label>
                        <input
                            className="form-control text-dark"
                            type="text"
                            id="eventName"
                            name="eventName"
                            placeholder="Tên sự kiện"
                            maxLength={100}
                            value={data.eventName}
                            onChange={(e) =>
                                updateData({ eventName: e.target.value })
                            }
                        />
                    </div>
                    <div className="col-md-5">
                        <UploadImage
                            id="uploadBackground"
                            iconClass="fas fa-upload fa-2x text-success"
                            defaultText="Thêm ảnh nền sự kiện"
                            inputName="eventBackground"
                            defaultPreview={data.eventBackgroundPreview}
                            onFileSelect={(file, previewUrl) =>
                                updateData({
                                    eventBackground: file,
                                    eventBackgroundPreview: previewUrl,
                                })
                            }
                        />
                    </div>
                </div>
            </div>
            <div className="card-dark mt-4">
                <h6 className={`${styles.formTitle} form-item-required`}>
                    Địa chỉ sự kiện
                </h6>
                <AddressSelector
                    onAddressChange={(addr) =>
                        updateData({ addressData: addr })
                    }
                    initialAddress={data.addressData}
                />
            </div>
            <div className="card-dark mt-4">
                <label
                    className={`${styles.formTitle} form-label form-item-required`}
                >
                    Thông tin sự kiện
                </label>
                <DescriptionEditor
                    initialValue={
                        data.description || 'Nhập các thông tin cần thiết'
                    }
                    onEditorChange={(newContent) =>
                        updateData({ description: newContent })
                    }
                />
            </div>
            <div className="card-dark mt-4 mb-5">
                <div className="row align-items-center">
                    <div className="col-md-2">
                        <UploadImage
                            id="uploadOrganizer"
                            iconClass="fas fa-upload fa-2x text-success"
                            defaultText="Thêm logo ban tổ chức"
                            inputName="organizerLogo"
                            defaultPreview={data.organizerLogoPreview}
                            onFileSelect={(file, previewUrl) =>
                                updateData({
                                    organizerLogo: file,
                                    organizerLogoPreview: previewUrl,
                                })
                            }
                        />
                    </div>
                    <div className="col-md-10">
                        <div className="mb-3">
                            <label
                                className={`${styles.formTitle} form-label form-item-required`}
                                htmlFor="eventName"
                            >
                                Tên ban tổ chức
                            </label>
                            <input
                                className="form-control text-dark"
                                type="text"
                                name="organizerName"
                                id="eventName"
                                placeholder="Tên ban tổ chức"
                                maxLength={100}
                                value={data.organizerName}
                                onChange={(e) =>
                                    updateData({
                                        organizerName: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="mb-3">
                            <label
                                className={`${styles.formTitle} form-label form-item-required`}
                                htmlFor="eventName"
                            >
                                Thông tin ban tổ chức
                            </label>
                            <input
                                className="form-control text-dark"
                                type="text"
                                name="organizerInfo"
                                id="eventName"
                                placeholder="Thông tin ban tổ chức"
                                value={data.organizerInfo}
                                onChange={(e) =>
                                    updateData({
                                        organizerInfo: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default Step1;
