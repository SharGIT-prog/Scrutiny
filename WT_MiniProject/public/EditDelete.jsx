const { useState, useEffect } = React;

// PART A FIX: Helper to apply dark mode class before React loads
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

const Card = {
    background: theme.card,
    borderRadius: theme.round,
    padding: '30px',
    border: `1px solid rgba(0,0,0,0.04)`,
    boxShadow: `0 10px 30px ${theme.shadow}`,
    maxWidth: '700px',
    margin: '30px auto',
};

const DetailRow = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px dashed rgba(0,0,0,0.1)',
    alignItems: 'center',
};

const DetailLabel = {
    color: theme.muted,
    fontWeight: '400',
    flexBasis: '40%',
};

const DetailValue = {
    color: theme.text,
    fontWeight: '600',
    textAlign: 'right',
    flexBasis: '60%',
};

const SectionTitle = {
    color: theme.primary,
    fontSize: '1.5rem',
    borderBottom: `2px solid ${theme.primaryMuted}`,
    paddingBottom: '8px',
    marginBottom: '20px',
    marginTop: '30px',
    fontWeight: '700',
};

const formatValue = (value, prefix = '', suffix = '') => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return 'N/A';
    }
    return `${prefix}${value}${suffix}`;
};

// MAPPING LOGIC FOR DYNAMIC FIELDS
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
            { label: 'Budget Estimate', key: 'budget', format: (val) => formatValue(val) },
            { label: 'Legal', key: 'legal' },
            { label: 'Estimated Data Size', key: 'data_size' },
        ],
    })[(userRoleKey || '').toLowerCase()] || [];

const UserProfileView = ({ user, onEdit, onProfileUpdate, onBack }) => {
    // Access BackButton globally
    const BackButton = window.BackButton;
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = user.id;

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`http://localhost:5000/api/user/${userId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch profile. Status: ${response.status}`);
                }

                const data = await response.json();
                if (data.success && data.user) {
                    setProfile(data.user);
                } else {
                    setError(data.message || "User profile not found.");
                }

            } catch (err) {
                console.error("Profile fetch error:", err);
                setError("Could not load user profile. Check server connection (http://localhost:5000).");
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchProfile();
    }, [userId, onProfileUpdate]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/user/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert("Profile deleted successfully. Redirecting to homepage.");
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            } else {
                const errorData = await response.json();
                alert("Failed to delete profile: " + (errorData.message || response.statusText));
            }
        } catch (err) {
            alert("Network error: Could not delete profile.");
        }
    };

    const renderDetails = (profileData) => {
        const userRoleKey = (profileData.role || '').toLowerCase();
        const specificDetails = getRoleConfig(userRoleKey);
        
        const ratingValue = (profileData.rating !== undefined && profileData.rating !== null && !isNaN(profileData.rating)) ? 
                              `${profileData.rating.toFixed(1)} / 10 (${profileData.ratingCount || 0} reviews)` : 
                              'N/A';

        let details = [
            { label: 'Role Type', value: profileData.role },
            { label: 'Email', value: profileData.email },
            { label: 'Contact Phone', value: formatValue(profileData.contact) },
            { label: 'Average Rating', value: ratingValue }, 
        ];

        details = details.concat(
            specificDetails.map(config => ({
                label: config.label,
                value: config.format 
                    ? config.format(profileData[config.key]) 
                    : formatValue(profileData[config.key])
            }))
        );
        
        return details.map((d, i) => (
            <div key={i} style={DetailRow}>
                <span style={DetailLabel}>{d.label}</span>
                <span style={DetailValue}>{d.value}</span>
            </div>
        ));
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: theme.muted, fontSize: '1.1rem' }}>Loading profile details...</div>;
    }

    if (error || !profile) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#d04545', fontWeight: 'bold' }}>{error || "Profile not found."}</div>;
    }

    return (
        <div style={{ padding: '20px', position: 'relative' }}>
            {BackButton && <BackButton onClick={onBack} />}
            
            <div style={Card}>
                <h2 style={{ color: theme.primary, fontSize: '2.0rem', marginBottom: '8px', textAlign: 'center' }}>
                    {profile.name}'s Profile
                </h2>
                <p style={{ color: theme.muted, fontSize: '1.0rem', marginBottom: '30px', textAlign: 'center' }}>
                    {profile.role}
                </p>

                <div style={SectionTitle}>Key Details</div>
                {renderDetails(profile)}

                <div style={SectionTitle}>About</div>
                <p style={{ color: theme.text, lineHeight: '1.6', marginBottom: '40px' }}>
                    {profile.about || "No detailed 'About' section provided."}
                </p>
                
                {/* PART C FIX: Image Placeholder */}



                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={() => onEdit(profile)} className="btn-primary" style={{ background: theme.primaryMuted }}>
                        Edit Profile
                    </button>
                    <button onClick={handleDelete} className="btn-outline" style={{ background: '#ff4d4f', color: theme.card, border: 'none' }}>
                        Delete Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserProfileEdit = ({ profile, onSave, onCancel, onBack }) => {
    // Access BackButton globally
    const BackButton = window.BackButton;
    
    const [formData, setFormData] = useState({ ...profile, password: '' });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (type === 'number' && value) ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        const dataToSubmit = { ...formData };
        delete dataToSubmit._id; 
        
        if (!dataToSubmit.password || dataToSubmit.password.trim() === '') {
            delete dataToSubmit.password;
        } else if (dataToSubmit.password.length < 8) {
            alert("New password must be at least 8 characters long.");
            setSaving(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/user/${profile._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit)
            });

            if (response.ok) {
                alert("Profile updated successfully!");
                localStorage.setItem('user', JSON.stringify({
                    id: profile._id,
                    name: formData.name,
                    email: formData.email,
                    role: formData.role
                }));
                onSave();
            } else {
                const errorData = await response.json();
                alert("Failed to save changes: " + (errorData.message || response.statusText));
            }
        } catch (err) {
            alert("Network error: Could not save profile.");
        } finally {
            setSaving(false);
        }
    };

    const fields = [];
    const userRoleKey = (profile.role || '').toLowerCase();
    
    // --- EDIT FORM FIELDS (Reusing Configuration) ---
    const formConfigKeys = {
        'analyst - agency': ['name', 'contact', 'email', 'website', 'service', 'specialization', 'pricing', 'legal', 'credibility', 'years', 'about'],
        'analyst - startup': ['name', 'contact', 'email', 'website', 'service', 'specialization', 'pricing', 'legal', 'credibility', 'team', 'about'],
        'analyst - expert': ['name', 'contact', 'email', 'portfolio', 'service', 'specialization', 'pricing', 'legal', 'credibility', 'timing', 'about'],
        'enterprise - established': ['name', 'contact', 'email', 'industry', 'service', 'budget', 'legal', 'data_size', 'about'],
        'enterprise - growth-stage': ['name', 'contact', 'email', 'industry', 'service', 'budget', 'legal', 'data_size', 'about'],
    };
    
    const fieldLabels = {
        name: userRoleKey.includes('analyst') ? 'Agency/Full Name *' : 'Organization/Company Name *',
        contact: 'Contact Phone', email: 'Email *',
        website: 'Website', portfolio: 'Portfolio / GitHub',
        service: 'Service Offered/Required', specialization: 'Specialisation',
        pricing: 'Pricing Model (e.g., hourly / fixed)', legal: 'Legal Status/Compliance',
        credibility: 'Credibility / Portfolio Link', years: 'Years in operation',
        team: 'Team Size', timing: 'Available Timings',
        industry: 'Industry', budget: 'Budget Estimate (Number)', data_size: 'Estimated Data Size',
        about: 'About / Additional Info',
    };
    
    const currentFields = formConfigKeys[userRoleKey] || [];
    
    // Loop through relevant fields to generate form inputs
    currentFields.forEach(key => {
        const label = fieldLabels[key];
        let type = 'text';
        if (key === 'email') type = 'email';
        if (key === 'years' || key === 'team' || key === 'budget') type = 'number';
        
        fields.push(
            <div key={key} style={{ gridColumn: (key === 'about') ? '1 / -1' : 'auto' }}>
                <label htmlFor={`edit-${key}`}>{label}</label>
                {key === 'about' ? (
                    <textarea 
                        id={`edit-${key}`} 
                        name={key} 
                        value={formData[key] || ''} 
                        onChange={handleChange} 
                    />
                ) : (
                    <input 
                        id={`edit-${key}`} 
                        name={key} 
                        type={type} 
                        value={formData[key] === null ? '' : formData[key]}
                        onChange={handleChange} 
                        required={key === 'name' || key === 'email'}
                    />
                )}
            </div>
        );
    });

    // Add password field separately
    fields.push(
        <div key="password-field" style={{ gridColumn: '1 / -1', marginTop: '15px' }}>
            <label htmlFor="edit-password">New Password (Leave blank to keep old)</label>
            <input 
                id="edit-password" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Min 8 characters, letters and numbers"
                minlength="8"
            />
        </div>
    );

    return (
        <div style={{ padding: '20px', position: 'relative' }}>
            {BackButton && <BackButton onClick={onBack} />}
            
            <div style={{ ...Card, maxWidth: '900px' }}>
                <h2 style={{ color: theme.primary, fontSize: '2.0rem', marginBottom: '8px', textAlign: 'center' }}>
                    Edit Profile: {profile.role}
                </h2>
                <p style={{ color: theme.muted, fontSize: '1.0rem', marginBottom: '30px', textAlign: 'center' }}>
                    Only fields relevant to your current role are shown.
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {fields}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={onCancel} className="btn-outline">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};