// PART A FIX: Helper to apply dark mode class before React loads
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

const { useState, useEffect } = React;

// Replicating theme variables for consistent styling
const theme = {
    primary: '#21917b',
    primaryMuted: '#5eb1a0',
    round: '12px',
    shadow: 'rgba(33,145,123,0.12)',
    focusRing: 'rgba(94,177,160,0.4)', // Slightly stronger ring for visibility
    card: '#ffffff',
};

const BackButton = ({ onClick }) => {
    return (
        <div style={{ 
            position: 'absolute', 
            top: '40px', // Adjusted for placement below the header nav
            left: '30px', 
            zIndex: 10,
        }}>
            <button 
                onClick={onClick} 
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: theme.primary,
                    color: 'white',
                    fontSize: '1.5rem',
                    lineHeight: '40px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 6px ${theme.focusRing}`; // Circular shadow around circumference
                    e.currentTarget.style.background = theme.primaryMuted;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    e.currentTarget.style.background = theme.primary;
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                &larr;
            </button>
        </div>
    );
};

// Make the component globally accessible since we are loading it via script tags
window.BackButton = BackButton;