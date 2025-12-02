// frontend/src/services/backendService.js

// ⚠️ URLs BASE: Ajustadas para as rotas que o backend está esperando (porta 3001)
const ATENDIMENTOS_BASE_URL = 'http://localhost:3001/api/atendimentos';
const AUTH_BASE_URL = 'http://localhost:3001/api/auth'; 
const AUTOMATION_URL = 'http://localhost:3001/api/atendimentos/forms/preencher'; // Endpoint dedicado para a automação

const headers = {
    'Content-Type': 'application/json',
};

// Função de utilidade para lidar com erros de resposta
const handleResponse = async (response) => {
    if (!response.ok) {
        // Tenta ler a mensagem de erro do corpo da resposta, se disponível
        const errorData = await response.json().catch(() => ({ message: 'Erro de servidor desconhecido' }));
        throw new Error(errorData.message || `Erro na API: Status ${response.status}`);
    }
    // Retorna o JSON da resposta para consumo pelo frontend
    return response.json();
};

// ====================================================================
//                            FUNÇÕES DE AUTENTICAÇÃO
// ====================================================================

/**
 * Registra um novo usuário.
 */
export const registrarUsuario = async (email, senha) => {
    try {
        const response = await fetch(`${AUTH_BASE_URL}/register`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ email, senha }),
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erro em registrarUsuario:', error);
        throw error;
    }
};

/**
 * Realiza o login do usuário e armazena o token.
 */
export const logarUsuario = async (email, senha) => {
    try {
        const response = await fetch(`${AUTH_BASE_URL}/login`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ email, senha }),
        });
        
        const data = await handleResponse(response);

        if (data.token) {
            localStorage.setItem('naf_auth_token', data.token); 
        }
        
        return data;
    } catch (error) {
        console.error('Erro em logarUsuario:', error);
        throw error;
    }
};


// ====================================================================
//                            FUNÇÕES DE ATENDIMENTO (CRUD)
// ====================================================================

/**
 * Busca todos os atendimentos no MongoDB.
 */
export const buscarAtendimentos = async () => {
    try {
        const response = await fetch(ATENDIMENTOS_BASE_URL, {
            method: 'GET',
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erro em buscarAtendimentos:', error);
        throw error;
    }
};

/**
 * Salva um array de atendimentos no MongoDB (POST /atendimentos).
 */
export const salvarAtendimentos = async (dadosArray) => {
    try {
        const response = await fetch(ATENDIMENTOS_BASE_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(dadosArray),
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erro em salvarAtendimentos:', error);
        throw error;
    }
};

/**
 * Dispara o processo de automação Puppeteer no backend (POST /forms/preencher).
 */
export const automatizarForms = async (formsUrl, atendimentosSelecionados = []) => {
    try {
        console.log('🚀 Enviando para automação:', {
            formsUrl,
            atendimentosSelecionados,
            count: atendimentosSelecionados.length
        });

        const response = await fetch(AUTOMATION_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ 
                formsUrl, 
                atendimentosSelecionados // 🔥 ENVIA OS IDs SELECIONADOS
            }),
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erro em automatizarForms:', error);
        throw error;
    }
};
/**
 * Atualiza um atendimento existente (PUT /atendimentos/:id).
 */
export const atualizarAtendimento = async (id, updateData) => {
    try {
        // Usa ATENDIMENTOS_BASE_URL com o ID no final
        const response = await fetch(`${ATENDIMENTOS_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(updateData),
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erro em atualizarAtendimento:', error);
        throw error;
    }
};

/**
 * Deleta um atendimento pelo ID (DELETE /atendimentos/:id).
 */
export const deletarAtendimento = async (id) => {
    try {
        // Usa ATENDIMENTOS_BASE_URL com o ID no final
        const response = await fetch(`${ATENDIMENTOS_BASE_URL}/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erro em deletarAtendimento:', error);
        throw error;
    }
};
export const gerarRelatorioPDF = async (options = {}) => {
    try {
        const response = await fetch(`${ATENDIMENTOS_BASE_URL}/relatorios/gerar`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(options),
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erro em gerarRelatorioPDF:', error);
        throw error;
    }
};

/**
 * Download do relatório PDF
 */
export const downloadRelatorio = async (filename) => {
    try {
        const response = await fetch(`${ATENDIMENTOS_BASE_URL}/relatorios/download/${filename}`);
        
        if (!response.ok) {
            throw new Error('Erro ao baixar relatório');
        }
        
        // Cria blob e faz download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'Download iniciado' };
    } catch (error) {
        console.error('Erro em downloadRelatorio:', error);
        throw error;
    }
};
