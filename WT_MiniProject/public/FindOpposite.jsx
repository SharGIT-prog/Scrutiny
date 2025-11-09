const { useState, useEffect, useCallback, useMemo } = React;

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

const useThemeStyle = (styleProps) => styleProps;

const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};


// --- PART 2: Universal Back Button Component ---
const BackButton = ({ onClick }) => (
    <div style={{ 
        position: 'absolute', 
        top: '30px', 
        left: '20px', 
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 6px ${theme.primaryMuted}`;
                e.currentTarget.style.background = theme.primaryMuted;
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.background = theme.primary;
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            &larr;
        </button>
    </div>
);


// --- Profile View Component ---
const ProfileView = ({ userId, onBack }) => {
    const [profile, setProfile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requestStatus, setRequestStatus] = useState(null); // null, 'sending', 'sent', 'error'
    const [requestMessage, setRequestMessage] = useState('');

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const user = JSON.parse(userString);
                setCurrentUser(user);
            } catch (e) {
                console.error("Failed to parse current user from localStorage:", e);
            }
        }
    }, []);

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
                setError("Could not load user profile. Check server connection (http://localhost:5000) and MongoDB.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    const handleSendRequest = async () => {
        if (!currentUser || !profile || requestStatus === 'sending' || !requestMessage.trim()) {
            alert('Please ensure you are logged in and have entered a message.');
            return;
        }

        setRequestStatus('sending');

        const isAnalystSender = currentUser.role && currentUser.role.toLowerCase().includes('analyst');

        const payload = {
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderEmail: currentUser.email,
            targetId: profile._id,
            targetRole: profile.role,

            service: isAnalystSender ? 'Analyst Service Inquiry' : 'Enterprise Project Proposal',
            budget: '', 
            data_size: '',
            message: requestMessage.trim(),
        };

        try {
            const res = await fetch('http://localhost:5000/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                localStorage.setItem('lastSentRequest', JSON.stringify(payload));
                setRequestStatus('sent');
                setTimeout(() => window.location.href = 'requestion.html', 1000);
            } else {
                const err = await res.json();
                setRequestStatus('error');
                console.error("Request submission failed:", err.message);
            }
        } catch (err) {
            setRequestStatus('error');
            console.error("Network error sending request:", err);
        }
    };

    const Card = useThemeStyle({
        background: theme.card,
        borderRadius: theme.round,
        padding: '30px',
        border: `1px solid rgba(0,0,0,0.04)`,
        boxShadow: `0 10px 30px ${theme.shadow}`,
        maxWidth: '700px',
        margin: '30px auto',
    });

    const DetailRow = useThemeStyle({
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px dashed rgba(0,0,0,0.1)',
        alignItems: 'center',
    });

    const DetailLabel = useThemeStyle({
        color: theme.muted,
        fontWeight: '400',
        flexBasis: '40%',
    });

    const DetailValue = useThemeStyle({
        color: theme.text,
        fontWeight: '600',
        textAlign: 'right',
        flexBasis: '60%',
    });

    const SectionTitle = useThemeStyle({
        color: theme.primary,
        fontSize: '1.5rem',
        borderBottom: `2px solid ${theme.primaryMuted}`,
        paddingBottom: '8px',
        marginBottom: '20px',
        marginTop: '30px',
        fontWeight: '700',
    });

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: theme.muted, fontSize: '1.1rem' }}>Loading profile details...</div>;
    }

    if (error || !profile) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#d04545', fontWeight: 'bold' }}>{error || "Profile not found."}</div>;
    }

    const formatValue = (value, prefix = '', suffix = '') => {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            return 'N/A';
        }
        return `${prefix}${value}${suffix}`;
    };
    
    const getRatingDisplay = (rating, count) => {
        if (rating === undefined || rating === null || isNaN(rating) || rating === 0 && count === 0) {
            return 'N/A';
        }
        return `${rating.toFixed(1)} / 10 (${count || 0} reviews)`;
    };


    // MAPPING LOGIC FOR PROFILE VIEW (defined here for completeness)
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
    })[(profile.role || '').toLowerCase()] || [];

    const renderDetails = (profileData) => {
        const userRoleKey = (profileData.role || '').toLowerCase();
        const specificDetails = getRoleConfig(userRoleKey);

        let details = [
            { label: 'Role Type', value: profileData.role },
            { label: 'Email', value: profileData.email },
            { label: 'Contact Phone', value: formatValue(profileData.contact) },
            { label: 'Average Rating', value: getRatingDisplay(profileData.rating, profileData.ratingCount) }, 
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
    }

    let buttonText = 'Send Project Request';
    if (requestStatus === 'sending') buttonText = 'Sending...';
    if (requestStatus === 'sent') buttonText = 'Request Sent!';
    if (requestStatus === 'error') buttonText = 'Retry Request';

    const buttonDisabled = !currentUser || requestStatus === 'sent' || requestStatus === 'sending' || !requestMessage.trim();

    return (
        <div style={{ padding: '20px', position: 'relative' }}>
            {/* PART 2 FIX: Back button integration */}
            <BackButton onClick={onBack} />
            
            <div style={Card}>
                <h1 style={{ color: theme.primary, fontSize: '2.2rem', marginBottom: '8px', textAlign: 'center' }}>
                    {profile.name}
                </h1>
                <p style={{ color: theme.muted, fontSize: '1.1rem', marginBottom: '30px', textAlign: 'center' }}>
                    {profile.role}
                </p>

                <div style={SectionTitle}>Key Details</div>
                {renderDetails(profile)}

                <div style={SectionTitle}>About</div>
                <p style={{ color: theme.text, lineHeight: '1.6' }}>
                    {profile.about || "No detailed 'About' section provided."}
                </p>

                <div style={SectionTitle}>Send Collaboration Request</div>
                <textarea
                    placeholder="Enter a brief message about the project or collaboration opportunity (Required)"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}
                    required
                ></textarea>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                        onClick={handleSendRequest}
                        className="btn-primary"
                        disabled={buttonDisabled}
                        style={{ minWidth: '250px' }}
                    >
                        {buttonText}
                    </button>
                    <p style={{ color: theme.muted, fontSize: '0.9rem', marginTop: '10px' }}>
                        {requestStatus === 'sent' ? 'Request saved! Redirecting to your requests page...' : 'This saves the request in the database.'}
                    </p>
                    {requestStatus === 'error' && <p style={{ color: '#ff4d4f', fontWeight: '600', fontSize: '0.9rem' }}>Failed to send request. Check console/server logs.</p>}
                </div>
            </div>
        </div>
    );
};


// --- PART 4: Rating Sort Component ---
const RatingSort = ({ sortByRating, handleSortChange }) => {
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
    
    return (
        <div style={{ padding: '20px', background: theme.card, borderRadius: theme.round, boxShadow: `0 8px 20px ${theme.shadow}`, marginBottom: '30px', marginTop: '30px' }}>
            <h3 style={{ color: theme.primary, marginBottom: '15px' }}>Sort Results</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label style={{ fontWeight: '600', color: theme.text }}>Sort by Average Rating (Highest First):</label>
                <button
                    onClick={() => handleSortChange(!sortByRating)}
                    style={{
                        padding: '8px 15px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: sortByRating ? theme.primary : theme.muted,
                        background: sortByRating ? theme.primaryMuted : 'transparent',
                        color: sortByRating ? theme.card : theme.text,
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(33,145,123,0.18)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    {sortByRating ? 'Rating Applied' : 'Apply Rating Sort'}
                </button>
            </div>
        </div>
    );
};

// --- Main Find Opposites Component (Part of PART 4) ---
const FindOpposite = () => {
    const [oppositeUsers, setOppositeUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [view, setView] = useState('list');
    const [selectedUserId, setSelectedUserId] = useState(null);

    const [filterQuery, setFilterQuery] = useState('');
    const [sortByRating, setSortByRating] = useState(false); 

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const user = JSON.parse(userString);
            if (!user || !user.role || !user.id) throw new Error("Invalid session data");

            setCurrentUser(user);
        } catch (err) {
            console.error("Session error:", err);
            window.location.href = 'login.html';
        }
    }, []);

    const getOppositeRole = (role) => {
        if (!role) return null;
        return role.toLowerCase().includes('analyst') ? 'Enterprise' : 'Analyst';
    };

    const handleFilterChange = useCallback((query) => {
        setFilterQuery(query);
    }, []);

    const handleSortChange = useCallback((isSorted) => {
        setSortByRating(isSorted);
    }, []);

    useEffect(() => {
        if (view !== 'list' || !currentUser) return;

        const fetchOppositeUsers = async () => {
            setLoading(true);
            setError(null);

            const requiredRole = getOppositeRole(currentUser.role);

            if (!requiredRole) {
                setError("Invalid current user role detected.");
                setLoading(false);
                return;
            }

            setUserRole(requiredRole);

            let apiUrl = `http://localhost:5000/api/users/${requiredRole}`;
            let fullQuery = filterQuery;

            // Apply rating sort to the query
            if (sortByRating) {
                const sortParam = `sort_by_rating=desc`;
                fullQuery = fullQuery ? `${fullQuery}&${sortParam}` : sortParam;
            }

            if (fullQuery) {
                apiUrl = `${apiUrl}?${fullQuery}`;
            }

            try {
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`Failed to fetch ${requiredRole} list. Status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success && data.users) {
                    setOppositeUsers(data.users);
                } else {
                    setError(data.message || 'Failed to retrieve user list.');
                }

            } catch (err) {
                console.error("Fetch or session error:", err);
                setError("Could not load users. Please ensure the Express server is running on port 5000.");
            } finally {
                setLoading(false);
            }
        };

        fetchOppositeUsers();
    }, [view, currentUser, filterQuery, sortByRating]);

    const handleViewProfile = (user) => {
        setSelectedUserId(user._id);
        setView('profile');
    };
    
    const getRatingDisplay = (rating, count) => {
        if (rating === undefined || rating === null || isNaN(rating) || rating === 0 && count === 0) {
            return 'N/A';
        }
        return `${rating.toFixed(1)} / 10`;
    };


    const OppositeList = () => {
        if (loading) {
            return <div style={{ textAlign: 'center', padding: '40px', color: theme.muted, fontSize: '1.1rem' }}>Loading available {userRole}s...</div>;
        }

        if (error) {
            return <div style={{ textAlign: 'center', padding: '40px', color: '#d04545', fontWeight: 'bold' }}>Error: {error}</div>;
        }

        if (oppositeUsers.length === 0) {
            return <div style={{ textAlign: 'center', padding: '40px', color: theme.muted, fontSize: '1.1rem' }}>No {userRole}s currently registered matching your criteria.</div>;
        }

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
                {oppositeUsers.map((user, index) => (
                    <div
                        key={user._id || index}
                        style={{
                            background: theme.card,
                            borderRadius: theme.round,
                            padding: '20px',
                            border: `1px solid rgba(0,0,0,0.04)`,
                            boxShadow: `0 10px 30px ${theme.shadow}`,
                            transition: 'transform 0.1s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h3 style={{ color: theme.primary, fontSize: '1.4rem', marginBottom: '8px' }}>{user.name}</h3>
                        <p style={{ color: theme.muted, fontSize: '0.95rem', marginBottom: '4px' }}>Role: {user.role}</p>

                        <p style={{ color: theme.muted, fontSize: '0.95rem', marginBottom: '15px', fontWeight: 'bold' }}>
                            Rating: {getRatingDisplay(user.rating, user.ratingCount)}
                        </p>

                        <p style={{ color: theme.text, fontSize: '0.9rem', borderLeft: `3px solid ${theme.primaryMuted}`, paddingLeft: '10px' }}>
                            {user.role && user.role.toLowerCase().includes('analyst') ?
                                `Specialization: ${user.specialization || 'N/A'}` :
                                `Industry: ${user.industry || 'N/A'}`
                            }
                        </p>

                        <button
                            style={{
                                padding: '8px 16px',
                                marginTop: '15px',
                                borderRadius: '8px',
                                border: 'none',
                                background: theme.primaryMuted,
                                color: theme.card,
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                            }}
                            onClick={() => handleViewProfile(user)}
                            onMouseOver={(e) => e.currentTarget.style.background = theme.primary}
                            onMouseOut={(e) => e.currentTarget.style.background = theme.primaryMuted}
                        >
                            View Profile
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    const renderContent = () => {
        if (view === 'list') {
            return (
                <React.Fragment>
                    <h1 style={{ textAlign: 'center', fontSize: '2.5rem', color: theme.primary, marginBottom: '10px' }}>
                        Available {userRole}s
                    </h1>
                    <p style={{ textAlign: 'center', color: theme.muted, marginBottom: '30px', fontSize: '1.1rem' }}>
                        {currentUser ? `Currently browsing the network as ${currentUser.name}` : ''}
                    </p>

                    {typeof AdvancedSearchFilter !== 'undefined' && userRole && (
                        <AdvancedSearchFilter
                            onFilterChange={handleFilterChange}
                            oppositeRole={userRole}
                        />
                    )}

                    <RatingSort 
                        sortByRating={sortByRating} 
                        handleSortChange={handleSortChange}
                    />

                    <OppositeList />
                </React.Fragment>
            );
        } else if (view === 'profile') {
            // ProfileView handles its own layout, but we need to pass a valid onBack function
            // The back button is integrated into ProfileView via the BackButton component above
            return <ProfileView userId={selectedUserId} onBack={() => setView('list')} />;
        }
        return null;
    }

    return (
        <div style={{ minHeight: '100vh', background: theme.background, fontFamily: 'Poppins, sans-serif' }}>
            <nav style={{ background: theme.card, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: `0 6px 18px ${theme.shadow}` }}>
                <div style={{ fontWeight: '700', color: theme.primaryMuted, fontSize: '20px' }}>Scrutiny</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => window.location.href = 'homepage2.html'}
                        style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', color: theme.text, transition: 'all 0.2s ease' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = theme.primary; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.text; }}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{ padding: '8px 12px', borderRadius: '8px', background: '#ff4d4f', border: 'none', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
                {renderContent()}
            </main>

            <footer style={{ textAlign: 'center', padding: '18px 10px', color: theme.muted, marginTop: '40px' }}>
                <p>© Team Scrutiny | 2025</p>
            </footer>
        </div>
    );
};