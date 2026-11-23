import { useState } from 'react';
import { Sparkles, Compass, ArrowRight, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import './AuthScreen.css';

const interestsList = [
    'Scholarships & Education',
    'Healthcare',
    'Employment & Skill Development',
    'Agriculture',
    'Housing',
    'Pension & Senior Citizen Benefits',
    'Business & Self-employment',
    'General Financial Assistance',
];

const initialForm = {
    name: '',
    age: '',
    state: 'Punjab',
    occupation: 'Student',
    education: 'Undergraduate',
    income: 'Below ₹1 lakh',
    interests: ['Scholarships & Education'],
    email: '',
    password: '',
};

export default function AuthScreen({ onComplete }) {
    const [mode, setMode] = useState('signup');
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const toggleInterest = interest => {
        setForm(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(item => item !== interest)
                : [...prev.interests, interest],
        }));
    };

    const fillDemoUser = () => {
        setForm(prev => ({
            ...prev,
            email: 'aarav@jansetu.in',
            password: 'password123',
        }));
        setError('');
    };

    async function submit(event) {
        event.preventDefault();
        setError('');

        const normalizedEmail = (form.email || '').trim().toLowerCase();
        const rawPassword = form.password || '';

        // 1. Validate Email
        if (!normalizedEmail) {
            setError('Please enter your email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            setError('Please enter a valid email address (e.g. name@example.com).');
            return;
        }

        // 2. Validate Password
        if (!rawPassword) {
            setError('Please enter your password.');
            return;
        }

        if (rawPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        // ==========================
        // SIGNUP FLOW
        // ==========================
        if (mode === 'signup') {
            if (!form.name.trim() || !form.age || !form.state) {
                setError('Please complete your name, age and state.');
                return;
            }

            if (Number(form.age) < 1 || Number(form.age) > 120) {
                setError('Enter a valid age between 1 and 120.');
                return;
            }

            if (form.interests.length === 0) {
                setError('Choose at least one benefit area.');
                return;
            }

            const account = {
                name: form.name.trim(),
                email: normalizedEmail,
                password: rawPassword,
                profile: {
                    age: String(form.age),
                    state: form.state,
                    occupation: form.occupation,
                    income: form.income,
                    education: form.occupation === 'Student' ? form.education : '',
                    interests: form.interests,
                },
            };

            const accounts = JSON.parse(
                localStorage.getItem('jansetu-demo-accounts') || '{}'
            );

            if (accounts[account.email]) {
                setError('An account with this email already exists. Try logging in.');
                return;
            }

            accounts[account.email] = account;
            localStorage.setItem('jansetu-demo-accounts', JSON.stringify(accounts));

            // Sync to JDBC backend if available
            try {
                await ApiClient.createUser({
                    name: account.name,
                    email: account.email,
                    password: account.password,
                    age: Number(account.profile.age) || 20,
                    state: account.profile.state,
                    occupation: account.profile.occupation,
                    annualIncome: account.profile.income,
                    education: account.profile.education,
                });
            } catch {
                // Backend offline: local account already stored safely
            }

            onComplete({
                name: account.name,
                email: account.email,
                profile: account.profile,
            });
            return;
        }

        // ==========================
        // LOGIN FLOW
        // ==========================
        setLoading(true);

        try {
            // First attempt authentication via Java backend (MySQL JDBC)
            const backendRes = await ApiClient.login(normalizedEmail, rawPassword);
            if (backendRes && backendRes.user) {
                const u = backendRes.user;
                const profile = {
                    age: String(u.age || '20'),
                    state: u.state || 'Punjab',
                    occupation: u.occupation || 'Student',
                    income: u.annualIncome || 'Below ₹1 lakh',
                    education: u.education || '',
                    interests: ['Scholarships & Education', 'General Financial Assistance'],
                };

                // Cache in local accounts
                const accounts = JSON.parse(
                    localStorage.getItem('jansetu-demo-accounts') || '{}'
                );
                accounts[normalizedEmail] = {
                    name: u.name,
                    email: u.email,
                    password: rawPassword,
                    profile,
                };
                localStorage.setItem('jansetu-demo-accounts', JSON.stringify(accounts));

                setLoading(false);
                onComplete({
                    name: u.name,
                    email: u.email,
                    profile,
                });
                return;
            }
        } catch (err) {
            // Check specific backend validation errors
            if (err.status === 404 || err.data?.error === 'USER_NOT_FOUND') {
                setLoading(false);
                setError(err.data?.message || `No account found with email: ${normalizedEmail}. Please sign up first.`);
                return;
            }
            if (err.status === 401 || err.data?.error === 'INVALID_PASSWORD') {
                setLoading(false);
                setError(err.data?.message || 'Incorrect password. Please check your password and try again.');
                return;
            }
            if (err.status === 400 && err.data?.message) {
                setLoading(false);
                setError(err.data.message);
                return;
            }
            // If connection failed / backend offline, proceed to fallback local storage
        }

        // Fallback local storage accounts
        const defaultAccounts = {
            'aarav@jansetu.in': {
                name: 'Aarav Sharma',
                email: 'aarav@jansetu.in',
                password: 'password123',
                profile: {
                    age: '20',
                    state: 'Punjab',
                    occupation: 'Student',
                    income: '₹2.5–5 lakh',
                    education: 'Undergraduate',
                    interests: ['Scholarships & Education', 'General Financial Assistance'],
                },
            },
        };

        const localAccounts = JSON.parse(
            localStorage.getItem('jansetu-demo-accounts') || '{}'
        );
        const accounts = { ...defaultAccounts, ...localAccounts };
        const account = accounts[normalizedEmail];

        setLoading(false);

        // Specific, proper password and account validation
        if (!account) {
            setError(`No account found with email "${normalizedEmail}". Please check your email address or sign up.`);
            return;
        }

        if (account.password !== rawPassword) {
            setError('Incorrect password. Please check your password and try again.');
            return;
        }

        onComplete({
            name: account.name,
            email: account.email,
            profile: account.profile,
        });
    }

    return (
        <div className="auth-page">
            <section className="auth-visual">
                <div className="auth-brand">
                    <span className="auth-logo">J</span>
                    <span>JANSETU</span>
                </div>

                <div className="auth-hero">
                    <span className="auth-eyebrow">YOUR BENEFITS. YOUR FUTURE.</span>
                    <h1>
                        Support that's
                        <br />
                        <span>meant for you.</span>
                    </h1>
                    <p>
                        Discover government schemes, scholarships and public benefits
                        relevant to your life — all in one place.
                    </p>

                    <div className="auth-feature">
                        <span className="auth-feature-icon">
                            <Sparkles size={18} strokeWidth={1.75} />
                        </span>
                        <div>
                            <b>Personalized discovery</b>
                            <small>Recommendations based on your profile</small>
                        </div>
                    </div>

                    <div className="auth-feature">
                        <span className="auth-feature-icon">
                            <Compass size={18} strokeWidth={1.75} />
                        </span>
                        <div>
                            <b>One simple starting point</b>
                            <small>Explore benefits without the confusion</small>
                        </div>
                    </div>
                </div>

                <div className="auth-visual-footer">
                    JANSETU © 2026 · Student project demo
                </div>
            </section>

            <section className="auth-form-side">
                <div className="auth-form-wrap">
                    <div className="auth-mobile-brand">
                        <span className="auth-logo">J</span> JANSETU
                    </div>

                    <div className="auth-heading">
                        <span className="auth-eyebrow">
                            {mode === 'signup' ? 'GET STARTED' : 'WELCOME BACK'}
                        </span>
                        <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
                        <p>
                            {mode === 'signup'
                                ? 'Tell us a little about yourself to discover relevant benefits.'
                                : 'Log in to continue to your personalized dashboard.'}
                        </p>
                    </div>

                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={mode === 'signup' ? 'selected' : ''}
                            onClick={() => {
                                setMode('signup');
                                setError('');
                            }}
                        >
                            Sign Up
                        </button>
                        <button
                            type="button"
                            className={mode === 'login' ? 'selected' : ''}
                            onClick={() => {
                                setMode('login');
                                setError('');
                            }}
                        >
                            Log In
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={submit}>
                        {mode === 'signup' && (
                            <>
                                <label>
                                    Full name
                                    <input
                                        value={form.name}
                                        onChange={e => update('name', e.target.value)}
                                        placeholder="Enter your full name"
                                        autoComplete="name"
                                        required
                                    />
                                </label>

                                <div className="auth-two-col">
                                    <label>
                                        Age
                                        <input
                                            type="number"
                                            min="1"
                                            max="120"
                                            value={form.age}
                                            onChange={e => update('age', e.target.value)}
                                            placeholder="Your age"
                                            required
                                        />
                                    </label>

                                    <label>
                                        State / UT
                                        <select
                                            value={form.state}
                                            onChange={e => update('state', e.target.value)}
                                        >
                                            {[
                                                'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
                                                'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
                                                'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
                                                'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
                                                'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
                                                'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
                                                'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
                                                'Andaman and Nicobar Islands', 'Chandigarh',
                                                'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
                                                'Jammu and Kashmir', 'Ladakh', 'Lakshadweep',
                                                'Puducherry',
                                            ].map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div className="auth-two-col">
                                    <label>
                                        Occupation
                                        <select
                                            value={form.occupation}
                                            onChange={e => update('occupation', e.target.value)}
                                        >
                                            {[
                                                'Student',
                                                'Employed',
                                                'Farmer',
                                                'Self-employed/business',
                                                'Unemployed',
                                                'Other',
                                            ].map(item => (
                                                <option key={item} value={item}>{item}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Annual household income
                                        <select
                                            value={form.income}
                                            onChange={e => update('income', e.target.value)}
                                        >
                                            {[
                                                'Below ₹1 lakh',
                                                '₹1–2.5 lakh',
                                                '₹2.5–5 lakh',
                                                '₹5–10 lakh',
                                                'Above ₹10 lakh',
                                                'Prefer not to say',
                                            ].map(item => (
                                                <option key={item} value={item}>{item}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                {form.occupation === 'Student' && (
                                    <label>
                                        Education level
                                        <select
                                            value={form.education}
                                            onChange={e => update('education', e.target.value)}
                                        >
                                            {[
                                                'School',
                                                'Undergraduate',
                                                'Postgraduate',
                                                'PhD / Research',
                                                'Other',
                                            ].map(item => (
                                                <option key={item} value={item}>{item}</option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                <fieldset className="auth-interests">
                                    <legend>What benefits interest you?</legend>
                                    <p>Select all that apply.</p>
                                    <div className="interest-grid">
                                        {interestsList.map(interest => (
                                            <label
                                                key={interest}
                                                className={`interest-option ${form.interests.includes(interest) ? 'checked' : ''
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.interests.includes(interest)}
                                                    onChange={() => toggleInterest(interest)}
                                                />
                                                <span>{interest}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            </>
                        )}

                        <label>
                            Email address
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => update('email', e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                        </label>

                        <label>
                            Password
                            <div className="auth-password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => update('password', e.target.value)}
                                    placeholder={mode === 'signup' ? 'Create a secure password (min 6 chars)' : 'Enter your password'}
                                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                </button>
                            </div>
                        </label>

                        {mode === 'login' && (
                            <div className="auth-demo-hint-box">
                                <div>
                                    <b>Demo Account:</b> <code>aarav@jansetu.in</code> &middot; <code>password123</code>
                                </div>
                                <button
                                    type="button"
                                    className="auth-demo-fill-btn"
                                    onClick={fillDemoUser}
                                    title="Pre-fill demo account details for testing"
                                >
                                    Use Demo Account
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="auth-error-box" role="alert">
                                <AlertCircle size={16} strokeWidth={2} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button className="auth-submit" type="submit" disabled={loading}>
                            <span>{loading ? 'Verifying password...' : mode === 'signup' ? 'Create account' : 'Log in'}</span>
                            <ArrowRight size={18} strokeWidth={2} />
                        </button>
                    </form>

                    <p className="auth-disclaimer">
                        Your profile helps JanSetu suggest potentially relevant schemes.
                        Eligibility is indicative; always verify requirements on official portals.
                    </p>
                </div>
            </section>
        </div>
    );
}