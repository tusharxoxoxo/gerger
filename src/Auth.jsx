import { useState } from 'react'
import { supabase } from './supabaseClient'
export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleLogin = async (event) => {
        event.preventDefault()
        setLoading(true)
        setMessage('')
        setError('')

        const { error: authError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/material-requests`,
                data: {
                    company_name: companyName
                }
            }
        })

        if (authError) {
            // Handle rate limiting specifically (429 Too Many Requests)
            const errorMessage = authError.message || authError.error_description || ''
            if (authError.status === 429 || errorMessage.includes('429') || errorMessage.toLowerCase().includes('too many requests')) {
                setError('Too many requests. Please wait a few minutes before requesting another magic link.')
            } else {
                setError(errorMessage || 'Failed to send magic link. Please try again.')
            }
        } else {
            setMessage('Check your email for the login link!')
        }
        setLoading(false)
    }
    return (
        <div className="row flex flex-center">
            <div className="col-6 form-widget">
                <h1 className="header">Supabase + React</h1>
                <p className="description">Sign in via magic link with your email below</p>
                <form className="form-widget" onSubmit={handleLogin}>
                    <div>
                        <input
                            className="inputField"
                            type="text"
                            placeholder="Company name"
                            value={companyName}
                            onChange={(e) => {
                                setCompanyName(e.target.value)
                                setError('')
                                setMessage('')
                            }}
                        />
                    </div>
                    <div>
                        <input
                            className="inputField"
                            type="email"
                            placeholder="Your email"
                            value={email}
                            required={true}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setError('')
                                setMessage('')
                            }}
                        />
                    </div>
                    {error && (
                        <div style={{
                            color: 'red',
                            marginTop: '10px',
                            marginBottom: '10px',
                            padding: '10px',
                            backgroundColor: '#fee',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}
                    {message && (
                        <div style={{
                            color: 'green',
                            marginTop: '10px',
                            marginBottom: '10px',
                            padding: '10px',
                            backgroundColor: '#efe',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}>
                            {message}
                        </div>
                    )}
                    <div>
                        <button className={'button block'} disabled={loading}>
                            {loading ? <span>Loading</span> : <span>Send magic link</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
