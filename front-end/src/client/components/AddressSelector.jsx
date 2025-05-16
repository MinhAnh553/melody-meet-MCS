import React, { useEffect, useState } from 'react';
import provincesData from '../../util/provinces.json';
import styles from '../styles/EventManagement.module.css';

const AddressSelector = ({ onAddressChange, initialAddress }) => {
    const [provinces, setProvinces] = useState([]);

    // Khởi tạo state với giá trị từ initialAddress (nếu có)
    const [venueName, setVenueName] = useState(initialAddress?.venueName || '');
    const [selectedProvinceCode, setSelectedProvinceCode] = useState(
        initialAddress?.selectedProvinceCode || null,
    );
    const [selectedDistrictCode, setSelectedDistrictCode] = useState(
        initialAddress?.selectedDistrictCode || null,
    );
    const [selectedWardCode, setSelectedWardCode] = useState(
        initialAddress?.selectedWardCode || null,
    );
    const [address, setAddress] = useState(initialAddress?.address || '');

    // Load provinces từ JSON khi component mount
    useEffect(() => {
        setProvinces(provincesData);
    }, []);

    useEffect(() => {
        if (initialAddress) {
            setVenueName(initialAddress.venueName || '');
            setSelectedProvinceCode(
                initialAddress.selectedProvinceCode || null,
            );
            setSelectedDistrictCode(
                initialAddress.selectedDistrictCode || null,
            );
            setSelectedWardCode(initialAddress.selectedWardCode || null);
            setAddress(initialAddress.address || '');
        }
    }, [initialAddress]);

    // Nếu không có mã (code) trong initialAddress, chuyển đổi dựa trên tên
    useEffect(() => {
        if (initialAddress && provinces.length > 0) {
            // Nếu không có mã, thử tìm theo tên (so sánh chữ thường)
            if (
                !initialAddress.selectedProvinceCode &&
                initialAddress.province
            ) {
                const prov = provinces.find(
                    (p) =>
                        p.name.toLowerCase() ===
                        initialAddress.province.toLowerCase(),
                );
                if (prov) {
                    setSelectedProvinceCode(prov.code);
                    if (initialAddress.district) {
                        const district = prov.districts.find(
                            (d) =>
                                d.name.toLowerCase() ===
                                initialAddress.district.toLowerCase(),
                        );
                        if (district) {
                            setSelectedDistrictCode(district.code);
                            if (initialAddress.ward) {
                                const ward = district.wards.find(
                                    (w) =>
                                        w.name.toLowerCase() ===
                                        initialAddress.ward.toLowerCase(),
                                );
                                if (ward) {
                                    setSelectedWardCode(ward.code);
                                }
                            }
                        }
                    }
                }
            }
        }
    }, [initialAddress, provinces]);

    const handleProvinceChange = (e) => {
        const code = e.target.value ? Number(e.target.value) : null;
        setSelectedProvinceCode(code);
        // Reset quận và phường khi tỉnh thay đổi
        setSelectedDistrictCode(null);
        setSelectedWardCode(null);
    };

    const handleDistrictChange = (e) => {
        const code = e.target.value ? Number(e.target.value) : null;
        setSelectedDistrictCode(code);
        // Reset phường khi quận thay đổi
        setSelectedWardCode(null);
    };

    const handleWardChange = (e) => {
        const code = e.target.value ? Number(e.target.value) : null;
        setSelectedWardCode(code);
    };

    const handleVenueNameChange = (value) => {
        setVenueName(value);
    };

    const handleAddressChange = (value) => {
        setAddress(value);
    };

    const getDistricts = () => {
        const province = provinces.find((p) => p.code === selectedProvinceCode);
        return province ? province.districts : [];
    };

    const getWards = () => {
        const province = provinces.find((p) => p.code === selectedProvinceCode);
        if (province) {
            const district = province.districts.find(
                (d) => d.code === selectedDistrictCode,
            );
            return district ? district.wards : [];
        }
        return [];
    };

    useEffect(() => {
        if (onAddressChange) {
            const province = provinces.find(
                (p) => p.code === selectedProvinceCode,
            );
            if (province === undefined) return;

            const district = province
                ? province.districts.find(
                      (d) => d.code === selectedDistrictCode,
                  )
                : null;
            const ward = district
                ? district.wards.find((w) => w.code === selectedWardCode)
                : null;

            onAddressChange({
                venueName: venueName || '',
                province: province ? province.name : selectedWardCode,
                district: district ? district.name : selectedDistrictCode,
                ward: ward ? ward.name : selectedWardCode,
                address: address || '',
            });
        }
    }, [
        venueName,
        selectedProvinceCode,
        selectedDistrictCode,
        selectedWardCode,
        provinces,
        address,
    ]);

    return (
        <div className="row mt-3">
            <div className="col-md-6 mb-3">
                <label
                    className={`${styles.formTitle} form-label form-item-required`}
                >
                    Tên địa điểm
                </label>
                <input
                    className="form-control text-dark"
                    type="text"
                    name="venueName"
                    placeholder="Tên địa điểm"
                    value={venueName}
                    onChange={(e) => handleVenueNameChange(e.target.value)}
                />
            </div>

            <div className="col-md-6 mb-3">
                <label
                    className={`${styles.formTitle} form-label form-item-required`}
                    htmlFor="province"
                >
                    Chọn tỉnh/thành
                </label>
                <select
                    id="province"
                    name="province"
                    className={`${styles.formSelect} form-select`}
                    value={selectedProvinceCode || ''}
                    onChange={handleProvinceChange}
                >
                    <option value="">Chọn tỉnh/thành</option>
                    {provinces.map((province) => (
                        <option key={province.code} value={province.code}>
                            {province.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="col-md-6 mb-3">
                <label
                    className={`${styles.formTitle} form-label form-item-required`}
                    htmlFor="district"
                >
                    Chọn quận/huyện
                </label>
                <select
                    id="district"
                    name="district"
                    className={`${styles.formSelect} form-select`}
                    value={selectedDistrictCode || ''}
                    onChange={handleDistrictChange}
                >
                    <option value="">Chọn quận/huyện</option>
                    {getDistricts().map((district) => (
                        <option key={district.code} value={district.code}>
                            {district.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="col-md-6 mb-3">
                <label
                    className={`${styles.formTitle} form-label form-item-required`}
                    htmlFor="ward"
                >
                    Chọn phường/xã
                </label>
                <select
                    id="ward"
                    name="ward"
                    className={`${styles.formSelect} form-select`}
                    value={selectedWardCode || ''}
                    onChange={handleWardChange}
                >
                    <option value="">Chọn phường/xã</option>
                    {getWards().map((ward) => (
                        <option key={ward.code} value={ward.code}>
                            {ward.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="col-md-12 mb-3">
                <label
                    className={`${styles.formTitle} form-label form-item-required`}
                >
                    Số nhà, đường
                </label>
                <input
                    className="form-control text-dark"
                    type="text"
                    name="address"
                    placeholder="Số nhà, đường"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                />
            </div>
        </div>
    );
};

export default AddressSelector;
