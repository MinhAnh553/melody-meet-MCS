import React from 'react';
import { Oval } from 'react-loader-spinner';

const InlineLoadingSpinner = ({ style = {} }) => {
    return (
        <div style={{ display: 'inline-block', ...style }}>
            <Oval
                height={30}
                width={30}
                color="#2c44a7"
                secondaryColor="#4fa94d"
                strokeWidth={2}
                strokeWidthSecondary={2}
                visible={true}
                ariaLabel="inline-loading"
            />
        </div>
    );
};

export default InlineLoadingSpinner;
