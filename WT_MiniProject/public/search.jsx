const { useState, useCallback, useMemo } = React;

const AdvancedSearchFilter = ({ onFilterChange, oppositeRole }) => {
    const [subRoleFilter, setSubRoleFilter] = useState('');
    const [specificFilters, setSpecificFilters] = useState({});

    // Replicate theme vars locally for non-CSS styling
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
    
    // Define the full set of filter configurations, matching signup.html
    const ALL_FILTERS = useMemo(() => {
        const isSearchingForAnalyst = oppositeRole === 'Analyst';
        
        // --- Analyst Sub-Role Options (What Enterprise searches for) ---
        const AnalystSubRoles = [
            { key: 'Analyst - Agency', label: 'Data Solutions Agency', fields: [
                { key: 'legal', label: 'Legal Entity', type: 'dropdown', options: ['LLC', 'Pvt', 'Pvt Ltd'] },
                { key: 'years', label: 'Min Years in Operation', type: 'number_min' }, // Key is 'years', type is 'number_min'
                { key: 'pricing', label: 'Pricing Model', type: 'dropdown', options: ['Hourly', 'Fixed', 'Project-Based'] },
                { key: 'specialization', label: 'Specialization Field', type: 'text' },
            ]},
            { key: 'Analyst - Startup', label: 'Growth-stage Startup', fields: [
                { key: 'team', label: 'Min Team Size', type: 'number_min' }, // Key is 'team', type is 'number_min'
                { key: 'legal', label: 'Legal Status', type: 'dropdown', options: ['LLC', 'Pvt', 'Pvt Ltd'] },
                { key: 'pricing', label: 'Pricing Model', type: 'dropdown', options: ['Hourly', 'Fixed', 'Subscription'] },
                { key: 'specialization', label: 'Specialization Field', type: 'text' },
            ]},
            { key: 'Analyst - Expert', label: 'Independent Expert', fields: [
                { key: 'timing', label: 'Available Timings', type: 'dropdown', options: ['Full-time', 'Part-time', 'As-needed'] },
                { key: 'pricing', label: 'Pricing Model', type: 'dropdown', options: ['Hourly', 'Fixed'] },
                { key: 'specialization', label: 'Specialization Field', type: 'text' },
            ]},
        ];

        // --- Enterprise Sub-Role Options (What Analyst searches for) ---
        const EnterpriseSubRoles = [
            { key: 'Enterprise - Established', label: 'Established Enterprise', fields: [
                { key: 'industry', label: 'Industry', type: 'text' },
                { key: 'budget', label: 'Min Budget ($)', type: 'number_min' }, // Key is 'budget', type is 'number_min'
                { key: 'data_size', label: 'Data Size/Volume', type: 'dropdown', options: ['Large', 'Medium', 'Small'] },
                { key: 'legal', label: 'Legal/Compliance Notes', type: 'text' },
            ]},
            { key: 'Enterprise - Growth-stage', label: 'Growth-stage Company', fields: [
                { key: 'industry', label: 'Industry', type: 'text' },
                { key: 'budget', label: 'Min Budget ($)', type: 'number_min' }, // Key is 'budget', type is 'number_min'
                { key: 'legal', label: 'Legal Status', type: 'text' },
            ]},
        ];

        return isSearchingForAnalyst ? AnalystSubRoles : EnterpriseSubRoles;
    }, [oppositeRole]);


    const currentSubRoleConfig = useMemo(() => {
        if (!subRoleFilter) return null;
        return ALL_FILTERS.find(config => config.key === subRoleFilter);
    }, [subRoleFilter, ALL_FILTERS]);


    const handleSubRoleChange = useCallback((key) => {
        setSubRoleFilter(key);
        setSpecificFilters({}); // Reset specific filters when sub-role changes
        if (key === '') {
            onFilterChange(''); // Clear filters if 'All' is selected
        }
    }, [onFilterChange]);

    const handleSpecificChange = useCallback((key, value) => {
        setSpecificFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const applyFilters = useCallback(() => {
        // If no sub-role is selected, we can't filter, so revert to viewing all
        if (!subRoleFilter) return onFilterChange(''); 

        const queryParts = [`role=${encodeURIComponent(subRoleFilter)}`];
        
        const fields = currentSubRoleConfig ? currentSubRoleConfig.fields : [];

        for (const key in specificFilters) {
            const value = specificFilters[key];
            if (value && value.toString().trim() !== '') {
                // Find the field configuration to check its type
                const fieldConfig = fields.find(f => f.key === key);
                
                // --- FIX APPLIED HERE ---
                // The correct check is whether the field type is 'number_min'
                if (fieldConfig && fieldConfig.type === 'number_min') {
                    // Mongoose filter keys used in server.js: years, team, budget
                    // The keys are already correct ('years', 'team', 'budget')
                    // We just need to append '_min' to the key for the server
                    queryParts.push(`${key}_min=${encodeURIComponent(value)}`);
                } else {
                    queryParts.push(`${key}=${encodeURIComponent(value)}`);
                }
            }
        }
        
        onFilterChange(queryParts.join('&'));
    }, [subRoleFilter, specificFilters, onFilterChange, currentSubRoleConfig]); // Added currentSubRoleConfig to dependencies

    const handleClear = useCallback(() => {
        setSubRoleFilter('');
        setSpecificFilters({});
        onFilterChange('');
    }, [onFilterChange]);


    const renderSpecificFilters = () => {
        if (!currentSubRoleConfig) return null;

        return (
            <div style={{ marginTop: '20px', padding: '15px 0', borderTop: '1px solid #eee' }}>
                <h4 style={{ color: theme.muted, marginBottom: '15px', fontSize: '1.1rem' }}>
                    Criteria for {currentSubRoleConfig.label}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {currentSubRoleConfig.fields.map(option => {
                        const value = specificFilters[option.key] || '';
                        
                        let InputComponent;
                        if (option.type === 'dropdown') {
                            InputComponent = (
                                <select
                                    key={option.key}
                                    value={value}
                                    onChange={(e) => handleSpecificChange(option.key, e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)' }}
                                >
                                    <option value="">-- Select --</option>
                                    {option.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            );
                        } else {
                            InputComponent = (
                                <input
                                    key={option.key}
                                    type={option.type.includes('number') ? 'number' : 'text'}
                                    placeholder={option.label}
                                    value={value}
                                    onChange={(e) => handleSpecificChange(option.key, e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)' }}
                                />
                            );
                        }
                        
                        return (
                            <div key={option.key}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: theme.muted }}>
                                    {option.label}
                                </label>
                                {InputComponent}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', background: theme.card, borderRadius: theme.round, boxShadow: `0 8px 20px ${theme.shadow}`, marginBottom: '30px' }}>
            <h3 style={{ color: theme.primary, marginBottom: '20px' }}>Filter {oppositeRole}s by Sub-Role</h3>
            
            {/* --- 1. Sub-Role Selection Dropdown --- */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: theme.text }}>
                    Select Type of {oppositeRole}
                </label>
                <select
                    value={subRoleFilter}
                    onChange={(e) => handleSubRoleChange(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.primaryMuted}` }}
                >
                    <option value="">-- View All {oppositeRole}s --</option>
                    {ALL_FILTERS.map(config => (
                        <option key={config.key} value={config.key}>{config.label}</option>
                    ))}
                </select>
            </div>

            {/* --- 2. Dynamic Specific Criteria --- */}
            {renderSpecificFilters()}

            <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={applyFilters} 
                    className="btn-primary"
                    disabled={!subRoleFilter}
                    style={{ padding: '10px 20px', fontSize: '1rem' }}
                >
                    Apply Filters
                </button>
                <button 
                    onClick={handleClear} 
                    className="btn-outline"
                    style={{ padding: '10px 20px', fontSize: '1rem' }}
                >
                    Clear All Filters
                </button>
            </div>
        </div>
    );
};