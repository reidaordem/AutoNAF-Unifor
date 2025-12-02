// /frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { logarUsuario, registrarUsuario } from '../services/backendService';

// O login deve receber uma função para mudar o estado de autenticação no App.jsx
const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [isRegistering, setIsRegistering] = useState(false); // Alterna entre Login/Cadastro
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (isRegistering) {
            // Lógica de Cadastro
            try {
                const result = await registrarUsuario(email, senha);
                setMessage(result.message);
                setIsRegistering(false); // Volta para login após sucesso
            } catch (err) {
                setError(err.message || 'Falha no cadastro.');
            }
        } else {
            // Lógica de Login
            try {
                await logarUsuario(email, senha);
                onLoginSuccess(true); // Chama a função para autenticar no App.jsx
            } catch (err) {
                setError(err.message || 'E-mail ou senha inválidos.');
            }
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: '100px auto', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>{isRegistering ? 'Cadastrar Usuário' : 'Acesso ao Sistema NAF'}</h2>
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>E-mail:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Senha:</label>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {loading ? 'Carregando...' : (isRegistering ? 'Cadastrar' : 'Entrar')}
                </button>
            </form>

            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <a href="#" onClick={() => {setIsRegistering(!isRegistering); setError(''); setMessage('');}}>
                    {isRegistering ? 'Já tenho uma conta (Login)' : 'Não tenho conta (Cadastro Inicial)'}
                </a>
            </div>
        </div>
    );
};

export default LoginPage;