const { useState, useEffect } = React;

// Dark mode pre-load
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

const theme = {
    primary: '#21917b',
    primaryMuted: '#5eb1a0',
    card: '#ffffff',
    text: '#000000',
    muted: '#536a66',
    background: '#d8eeeb',
    round: '12px',
    shadow: 'rgba(33,145,123,0.12)',
};

// Main card styling
const Card = {
    background: theme.card,
    borderRadius: theme.round,
    padding: '30px',
    border: `1px solid rgba(0,0,0,0.05)`,
    boxShadow: `0 10px 30px ${theme.shadow}`,
    maxWidth: '900px',
    margin: '30px auto',
};

// Row for key-value fields
const DetailRow = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px dashed rgba(0,0,0,0.1)',
    alignItems: 'center',
};

const DetailLabel = { color: theme.muted, fontWeight: '400', flexBasis: '40%' };
const DetailValue = { color: theme.text, fontWeight: '600', textAlign: 'right', flexBasis: '60%' };

const SectionTitle = {
    color: theme.primary,
    fontSize: '1.5rem',
    borderBottom: `2px solid ${theme.primaryMuted}`,
    paddingBottom: '8px',
    marginBottom: '20px',
    marginTop: '30px',
    fontWeight: '700',
};

// --- NEW FIXED BUTTON COMPONENT ---
const ActionButton = ({ onClick, children, className, style = {}, type = "button", disabled }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={className}
        style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            fontWeight: '600',
            padding: '14px 28px',
            borderRadius: theme.round,
            cursor: 'pointer',
            minWidth: '170px',
            textAlign: 'center',
            border: 'none',
        }}
    >
        {children}
    </button>
);
// -------------------------------------------------------------

const formatValue = (value, prefix = '', suffix = '') =>
    value ? `${prefix}${value}${suffix}` : 'N/A';

// Role → Fields list
const getRoleConfig = (userRoleKey) => ({
    'analyst - agency': [
        { label: 'Agency Name', key: 'name' },
        { label: 'Website', key: 'website' },
        { label: 'Service Offered', key: 'service' },
        { label: 'Specialisation', key: 'specialization' },
        { label: 'Pricing Model', key: 'pricing' },
        { label: 'Legal Entity', key: 'legal' },
        { label: 'Credibility/Portfolio', key: 'credibility' },
        { label: 'Years in operation', key: 'years' },
    ],
    'analyst - startup': [
        { label: 'Company Name', key: 'name' },
        { label: 'Website', key: 'website' },
        { label: 'Service Offered', key: 'service' },
        { label: 'Specialisation', key: 'specialization' },
        { label: 'Pricing Model', key: 'pricing' },
        { label: 'Legal Status', key: 'legal' },
        { label: 'Credibility/Portfolio', key: 'credibility' },
        { label: 'Team Size', key: 'team' },
    ],
    'analyst - expert': [
        { label: 'Full Name', key: 'name' },
        { label: 'Portfolio/GitHub', key: 'portfolio' },
        { label: 'Service Offered', key: 'service' },
        { label: 'Specialisation', key: 'specialization' },
        { label: 'Pricing Model', key: 'pricing' },
        { label: 'Legal/Contract Status', key: 'legal' },
        { label: 'Credibility/Testimonials', key: 'credibility' },
        { label: 'Available Timings', key: 'timing' },
    ],
    'enterprise - established': [
        { label: 'Organization Name', key: 'name' },
        { label: 'Industry', key: 'industry' },
        { label: 'Service Required', key: 'service' },
        { label: 'Budget Estimate', key: 'budget', format: (val) => formatValue(val, '$', ' USD') },
        { label: 'Legal/Compliance Notes', key: 'legal' },
        { label: 'Estimated Data Size', key: 'data_size' },
    ],
    'enterprise - growth-stage': [
        { label: 'Company Name', key: 'name' },
        { label: 'Industry', key: 'industry' },
        { label: 'Service Required', key: 'service' },
        { label: 'Budget Estimate', key: 'budget' },
        { label: 'Legal', key: 'legal' },
        { label: 'Estimated Data Size', key: 'data_size' },
    ],
}[userRoleKey] || []);

// ---------------------------------------------------------
// PROFILE VIEW
// ---------------------------------------------------------
const UserProfileView = ({ user, onEdit, onProfileUpdate, onBack }) => {
    const BackButton = window.BackButton;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const userId = user.id;

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const res = await fetch(`http://localhost:5000/api/user/${userId}`);
            const data = await res.json();
            setProfile(data.user);
            setLoading(false);
        };
        fetchProfile();
    }, [userId, onProfileUpdate]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
    if (!profile) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Profile not found.</div>;

    const details = [
        { label: 'Role Type', value: profile.role },
        { label: 'Email', value: profile.email },
        { label: 'Contact Phone', value: formatValue(profile.contact) },
    ].concat(
        getRoleConfig(profile.role.toLowerCase()).map(cfg => ({
            label: cfg.label,
            value: cfg.format ? cfg.format(profile[cfg.key]) : formatValue(profile[cfg.key]),
        }))
    );

    return (
        <div style={{ padding: '20px' }}>
            {BackButton && <BackButton onClick={onBack} />}

            <div style={Card}>
                <h2 style={{ textAlign: 'center', color: theme.primary, fontSize: '2rem' }}>{profile.name}'s Profile</h2>

                <div style={SectionTitle}>Key Details</div>

                {details.map((d, i) => (
                    <div key={i} style={DetailRow}>
                        <span style={DetailLabel}>{d.label}</span>
                        <span style={DetailValue}>{d.value}</span>
                    </div>
                ))}

                <div style={SectionTitle}>About</div>
                <p>{profile.about || "No About section added."}</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
                    <ActionButton onClick={() => onEdit(profile)} style={{ background: theme.primary, color: 'white' }}>
                        Edit Profile
                    </ActionButton>
                    <ActionButton onClick={() => confirm("Delete profile?") && fetch(`http://localhost:5000/api/user/${userId}`, { method: 'DELETE' }).then(() => window.location.href = 'index.html')}
                        style={{ background: '#ff4d4f', color: 'white' }}>
                        Delete Profile
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------
// PROFILE EDIT FORM
// ---------------------------------------------------------
const UserProfileEdit = ({ profile, onSave, onCancel, onBack }) => {
    const BackButton = window.BackButton;
    const [formData, setFormData] = useState({ ...profile });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch(`http://localhost:5000/api/user/${profile._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        alert("Profile updated!");
        onSave();
    };

    return (
        <div style={{ padding: '20px' }}>
            {BackButton && <BackButton onClick={onBack} />}

            <div style={Card}>
                <h2 style={{ textAlign: 'center', color: theme.primary }}>Edit Profile</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {Object.keys(formData).map((key) => (
                            key !== "_id" && key !== "__v" && (
                                <div key={key}>
                                    <label>{key}</label>
                                    <input name={key} value={formData[key] || ''} onChange={handleChange} />
                                </div>
                            )
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
                        <ActionButton type="submit" style={{ background: theme.primary, color: 'white' }}>
                            Save Changes
                        </ActionButton>
                        <ActionButton onClick={onCancel} style={{ background: '#cccccc' }}>
                            Cancel
                        </ActionButton>
                    </div>
                </form>
            </div>
        </div>
    );
};
