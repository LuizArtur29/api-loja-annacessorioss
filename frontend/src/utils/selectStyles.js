/**
 * Estilos centralizados para o react-select.
 * Utiliza as CSS custom properties definidas em App.css para
 * manter consistência visual em todos os formulários da aplicação.
 */
const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: 'var(--surface-secondary)',
        borderColor: state.isFocused ? 'var(--accent-color)' : 'var(--border-color)',
        borderRadius: '10px',
        minHeight: '42px',
        boxShadow: 'none',
        '&:hover': { borderColor: state.isFocused ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.15)' },
        cursor: 'pointer'
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: 'var(--surface-primary)',
        border: `1px solid var(--border-color)`,
        borderRadius: '8px',
        zIndex: 9999
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? 'var(--surface-hover)' : 'transparent',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        '&:active': { backgroundColor: 'var(--accent-alpha)' }
    }),
    singleValue: (provided) => ({ ...provided, color: 'var(--text-primary)' }),
    input: (provided) => ({ ...provided, color: 'var(--text-primary)' }),
    placeholder: (provided) => ({ ...provided, color: 'var(--text-muted)' })
};

export default customSelectStyles;
