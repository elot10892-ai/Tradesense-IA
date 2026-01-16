import React from 'react';

const Button = ({ children, onClick, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded bg-primary text-black font-bold hover:opacity-90 transition ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
