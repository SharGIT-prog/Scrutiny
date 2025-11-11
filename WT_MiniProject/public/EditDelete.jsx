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

// Card style
const Card = {
    background: theme.card,
    borderRadius: theme.round,
    padding: '30px',
    border: `1px solid rgba(0,0,0,0.05)`,
    boxShadow: `0 10px 30px ${theme.shadow}`,
    maxWidth: '900px',
    margin: '30px auto',
};

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

const ActionButton = ({ onClick, children, type = "button", style = {}, disabled }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
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
            minWidth: '180px',
            height: '50px',
            textAlign: 'center',
            border: 'none',
            transition: '0.25s ease',
        }}
    >
        {children}
    </button>
);

const formatValue = (value, prefix = '', suffix = '') =>
    value ? `${prefix}${value}${suffix}` : 'N/A';

// Field display config (unchanged)
const getRoleConfig = (role) => ({
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
        { label: 'Budget Estimate', key: 'budget', format: val => formatValue(val, '$', ' USD') },
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
}[role] || []);

const editableFieldsByRole = {
    "analyst - agency": ["name", "contact", "email", "website", "service", "specialization", "pricing", "legal", "credibility", "years", "about", "password"],
    "analyst - startup": ["name", "contact", "email", "website", "service", "specialization", "pricing", "legal", "credibility", "team", "about", "password"],
    "analyst - expert": ["name", "contact", "email", "portfolio", "service", "specialization", "pricing", "legal", "credibility", "timing", "about", "password"],
    "enterprise - established": ["name", "contact", "email", "industry", "service", "budget", "legal", "data_size", "about", "password"],
    "enterprise - growth-stage": ["name", "contact", "email", "industry", "service", "budget", "legal", "data_size", "about", "password"],
};

// ------------------ VIEW PROFILE ------------------
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

                <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginTop: '40px' }}>
                    <ActionButton onClick={() => onEdit(profile)} style={{ background: theme.primary, color: 'white' }}>
                        Edit Profile
                    </ActionButton>

                    <ActionButton
                        onClick={() =>
                            confirm("Delete profile?") &&
                            fetch(`http://localhost:5000/api/user/${userId}`, { method: 'DELETE' })
                                .then(() => window.location.href = 'index.html')
                        }
                        style={{ background: '#ff4d4f', color: 'white' }}
                    >
                        Delete Profile
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

// ------------------ EDIT PROFILE ------------------
const UserProfileEdit = ({ profile, onSave, onCancel, onBack }) => {
    const BackButton = window.BackButton;
    const [formData, setFormData] = useState({ ...profile });
    const [confirmPassword, setConfirmPassword] = useState("");

    const allowedFields = editableFieldsByRole[profile.role.toLowerCase()] || [];

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const passwordValid = (password) =>
        /^(?=.*\d).{8,}$/.test(password); // >=8 chars + at least 1 number

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password) {
            if (!passwordValid(formData.password)) {
                alert("Password must be at least 8 characters long and include at least one number.");
                return;
            }
            if (formData.password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }
        }

        await fetch(`http://localhost:5000/api/user/${profile._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        alert("Profile updated!");
        onSave();
    };

    const labelCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    return (
        <div style={{ padding: '20px' }}>
            {BackButton && <BackButton onClick={onBack} />}

            <div style={Card}>
                <h2 style={{ textAlign: 'center', color: theme.primary }}>Edit Profile</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {allowedFields.map((key) => (
                            key !== "password" ? (
                                <div key={key}>
                                    <label>{labelCase(key)}</label>
                                    <input name={key} value={formData[key] || ''} onChange={handleChange} />
                                </div>
                            ) : (
                                <div key={key}>
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Enter new password"
                                        value={formData.password || ''}
                                        onChange={handleChange}
                                    />
                                    <small style={{ color: 'red' }}>Must be ≥ 8 characters and include at least one number.</small>

                                    <label style={{ marginTop: '10px', display: 'block' }}>Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            )
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginTop: '40px' }}>
                        <ActionButton type="submit" style={{ background: theme.primary, color: 'white' }}>
                            Save Changes
                        </ActionButton>

                        <ActionButton onClick={onCancel} style={{ background: '#bfbfbf', color: '#000' }}>
                            Cancel
                        </ActionButton>
                    </div>
                </form>
            </div>
        </div>
    );
};
    