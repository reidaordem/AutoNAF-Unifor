import express from 'express';
import { 
    criarAtendimentos, 
    listarAtendimentos,
    atualizarAtendimento, 
    deletarAtendimento,
    preencherForms,
    gerarRelatorio,          // 🔥 NOVA IMPORT
    downloadRelatorio 
} from '../controller/atendimentoController.js';

const router = express.Router();

// -----------------------------------------------------------------------
// Rotas de CRUD para a coleção de Atendimentos
// Rota base assumida (montada em app.js/server.js): /api/atendimentos
// -----------------------------------------------------------------------


// Rota 1: Listar todos os dados (GET - Read)
// URL: GET /
router.get('/', listarAtendimentos);
router.get('/relatorios/download/:filename', downloadRelatorio);

// Rota 2: Recebe o array de dados do Excel (POST - Create)
// URL: POST /
router.post('/', criarAtendimentos);
router.post('/relatorios/gerar', gerarRelatorio);

// 💡 Rota 3: Atualizar um atendimento específico (PUT - Update)
// CORREÇÃO 1: Trocado de PATCH para PUT para combinar com o Frontend.
// CORREÇÃO 2: Rota definida como '/:id' (correto e consistente com o DELETE).
// URL: PUT /:id
router.put('/:id', atualizarAtendimento);

// 💡 Rota 4: Deletar um atendimento específico (DELETE - Delete)
// Rota definida como '/:id'
// URL: DELETE /:id
router.delete('/:id', deletarAtendimento);

// -----------------------------------------------------------------------
// Rota de Automação (MANTENDO O CAMINHO ORIGINAL DO FRONTEND)
// URL: POST /forms/preencher
// -----------------------------------------------------------------------
// Note: Essa rota está fora da rota base de CRUD para manter o nome anterior
router.post('/forms/preencher', preencherForms);

export default router;