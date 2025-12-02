// /frontend/src/App.jsx


import React, { useState, useEffect } from 'react';
import UploadPage from './pages/UploadPage';
import LoginPage from './pages/LoginPage';


const App = () => {
    // 🆕 Estado para controlar se o usuário está logado
    const [isAuthenticated, setIsAuthenticated] = useState(false); 
    // 🆕 Estado para verificar o carregamento inicial (ex: checar token)
    const [loadingAuth, setLoadingAuth] = useState(true); 

    // Função para verificar se o token existe ao carregar a aplicação
    useEffect(() => {
        const token = localStorage.getItem('naf_auth_token');
        if (token) {
            // 💡 Em uma aplicação real, você faria uma chamada API para validar o token
            setIsAuthenticated(true); 
        }
        setLoadingAuth(false);
    }, []);

    // 🆕 Função de Logout
    const handleLogout = () => {
        localStorage.removeItem('naf_auth_token');
        setIsAuthenticated(false);
    };

    if (loadingAuth) {
        return <div style={{padding: '50px', textAlign: 'center'}}>Carregando...</div>;
    }

    // Renderiza a página de Login se não estiver autenticado
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={setIsAuthenticated} />;
    }

    // Renderiza a página principal se estiver autenticado
    return (
        <div>
            <div style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                <button onClick={handleLogout} style={{ padding: '5px 15px' }}>Sair</button>
            </div>
            <UploadPage />
        </div>
    );
};

export default App;