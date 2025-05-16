import React, { useRef, useEffect } from 'react';

const OTPInput = ({ otp, onOtpChange }) => {
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);
    const OTP_LENGTH = otp.length;
    const inputRefs = useRef([]);

    const handleChange = (e, index) => {
        const val = e.target.value;
        const newVal = val.replace(/[^0-9]/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = newVal;
        onOtpChange(newOtp);

        // Nếu có giá trị và không phải ô cuối, chuyển focus
        if (newVal && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="verification-box mb-4">
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <input
                    key={index}
                    type="text"
                    maxLength={1}
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp[index]}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="verification-input"
                />
            ))}
        </div>
    );
};

export default OTPInput;
