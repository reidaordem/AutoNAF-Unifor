// /backend/controller/atendimentoController.js

import Atendimento from '../models/Atendimento.js';
import { automatizarForms } from '../service/puppeteerService.js';
import { gerarRelatorioPDF, gerarRelatorioBase64 } from '../service/pdfService.js';
import fs from 'fs'; // 🔥 ADICIONE ESTA LINHA
import path from 'path'; // 🔥 ADICIONE ESTA LINHA
import { fileURLToPath } from 'url';
import mongoose from 'mongoose'; // Importado para validar IDs


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Função para LISTAR todos os atendimentos (READ)
export const listarAtendimentos = async (req, res) => {
    try {
        // Busca todos os documentos na coleção Atendimento e ordena pelo mais recente
        const atendimentos = await Atendimento.find().sort({ data_registro: -1 });

        res.status(200).json(atendimentos);

    } catch (error) {
        console.error('Erro ao listar atendimentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao listar dados.' });
    }
};

// Função para CRIAR (salvar) um ou mais atendimentos no MongoDB (CREATE)
export const criarAtendimentos = async (req, res) => {
    try {
        // req.body deve ser um array de objetos JSON (vindos do Excel)
        const atendimentos = req.body; 

        if (!Array.isArray(atendimentos) || atendimentos.length === 0) {
            return res.status(400).json({ message: 'Corpo da requisição deve ser um array de atendimentos.' });
        }

        // Insere todos de uma vez
        const novosAtendimentos = await Atendimento.insertMany(atendimentos);

        res.status(201).json({ 
            message: 'Dados do Excel salvos com sucesso no MongoDB.',
            count: novosAtendimentos.length,
            data: novosAtendimentos 
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação dos dados: ' + messages.join(', ') });
        }
        console.error('Erro ao salvar atendimentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao salvar dados.' });
    }
};

// 💡 FUNÇÃO NECESSÁRIA PARA O PUT (UPDATE) 💡
export const atualizarAtendimento = async (req, res) => {
    const { id } = req.params;

    // 1. Verifica se o ID é válido (ObjectId do MongoDB)
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID de atendimento inválido.' });
    }

    try {
        // Usa findByIdAndUpdate para atualizar o documento e rodar validações
        const atendimentoAtualizado = await Atendimento.findByIdAndUpdate(
            id,
            req.body,
            { 
                new: true, // Retorna o documento APÓS a atualização
                runValidators: true // Roda as validações do Schema
            }
        );

        if (!atendimentoAtualizado) {
            return res.status(404).json({ message: 'Atendimento não encontrado.' });
        }

        console.log(`✅ Atendimento ${id} atualizado com sucesso.`);
        res.status(200).json(atendimentoAtualizado);

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Erro de validação ao atualizar: ' + messages.join(', ') });
        }
        console.error('Erro ao atualizar atendimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar dados.' });
    }
};

// 💡 FUNÇÃO NECESSÁRIA PARA O DELETE 💡
export const deletarAtendimento = async (req, res) => {
    const { id } = req.params;

    // 1. Verifica se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID de atendimento inválido.' });
    }

    try {
        const resultado = await Atendimento.findByIdAndDelete(id);

        if (!resultado) {
            return res.status(404).json({ message: 'Atendimento não encontrado.' });
        }

        console.log(`🗑️ Atendimento ${id} deletado com sucesso.`);
        // 204 No Content indica sucesso em deleção
        res.status(204).send(); 

    } catch (error) {
        console.error('Erro ao deletar atendimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao deletar dados.' });
    }
};

// Função para gerenciar a automação do Forms (usado pelo frontend em POST /api/forms/preencher)
// Foi renomeada de 'preencherForms' para 'gerenciarAutomacao' no arquivo anterior para maior clareza, mas mantemos o código aqui.
export const preencherForms = async (req, res) => {
    console.log('🔔 Rota de automação ACIONADA'); 
    
    try {
        const { formsUrl, atendimentosSelecionados } = req.body;
        console.log('📝 URL recebida:', formsUrl); 
        console.log('🎯 IDs selecionados:', atendimentosSelecionados);

        if (!formsUrl) {
            return res.status(400).json({ message: 'A URL do Google Forms é obrigatória.' });
        }
         
        let atendimentosParaProcessar;
        
        // 🔥 CORREÇÃO: Se há IDs selecionados, busca APENAS esses
        if (atendimentosSelecionados && atendimentosSelecionados.length > 0) {
            console.log('🎯 Buscando apenas atendimentos selecionados...');
            atendimentosParaProcessar = await Atendimento.find({ 
                _id: { $in: atendimentosSelecionados } 
            }).sort({ data_registro: 1 });
        } else {
            // Comportamento original: busca todos não processados
            console.log('🔍 Buscando todos os não processados...');
            atendimentosParaProcessar = await Atendimento.find({ 
                processado: false 
            }).sort({ data_registro: 1 });
        }
        
        console.log(`📊 ${atendimentosParaProcessar.length} atendimentos para processar`); 
        
        if (atendimentosParaProcessar.length === 0) {
            return res.status(404).json({ message: 'Nenhum atendimento encontrado para automatizar.' });
        }

        // 🔥 DEBUG: Mostra quais atendimentos serão processados
        console.log('📋 Atendimentos que serão processados:');
        atendimentosParaProcessar.forEach((atendimento, index) => {
            console.log(`   ${index + 1}. ${atendimento.nome_contribuinte} (ID: ${atendimento._id})`);
        });

        console.log(`[Controller] Enviando ${atendimentosParaProcessar.length} registros para o Puppeteer.`);
       
        const resultadoAutomacao = await automatizarForms(atendimentosParaProcessar, formsUrl);

        console.log('✅ Resultado da automação:', resultadoAutomacao);
        
        if (resultadoAutomacao.status === 'Sucesso') {
            res.status(200).json(resultadoAutomacao);
        } else {
            res.status(resultadoAutomacao.totalProcessado > 0 ? 200 : 500).json(resultadoAutomacao);
        }

    } catch (error) {
        console.error('❌ Erro ao disparar automação:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao iniciar a automação.' });
    }
};

// No atendimentoController.js, na função gerarRelatorio:

export const gerarRelatorio = async (req, res) => {
    try {
        console.log('📊 Solicitando geração de relatório PDF...');
        
        const { tipo, incluirNaoProcessados } = req.body;
        
        // Busca todos os atendimentos
        const atendimentos = await Atendimento.find().sort({ data_registro: -1 });
        
        if (atendimentos.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Nenhum atendimento encontrado para gerar relatório.' 
            });
        }

        console.log(`📋 Encontrados ${atendimentos.length} atendimentos para relatório`);

        const options = {
            titulo: 'Relatório Completo de Atendimentos - NAF UNIFOR',
            periodo: `De ${new Date().toLocaleDateString('pt-BR')}`,
            incluirNaoProcessados: incluirNaoProcessados || false
        };

        let filepath;
        
        if (tipo === 'base64') {
            // Relatório rápido em base64
            console.log('🔄 Gerando relatório base64...');
            const base64PDF = await gerarRelatorioBase64(atendimentos, options);
            
            return res.json({
                success: true,
                message: 'Relatório gerado com sucesso.',
                data: base64PDF,
                filename: `relatorio-${Date.now()}.pdf`,
                totalAtendimentos: atendimentos.length
            });
        } else {
            // Relatório completo em arquivo
            console.log('🔄 Gerando relatório completo...');
            filepath = await gerarRelatorioPDF(atendimentos, options);
            const filename = path.basename(filepath);
            
            console.log(`✅ Relatório gerado: ${filename}`);
            
            return res.json({
                success: true,
                message: 'Relatório PDF gerado com sucesso.',
                filepath: filename,
                downloadUrl: `/api/atendimentos/relatorios/download/${filename}`,
                totalAtendimentos: atendimentos.length,
                fileSize: fs.statSync(filepath).size
            });
        }

    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao gerar relatório PDF.',
            error: error.message 
        });
    }
};
export const downloadRelatorio = async (req, res) => {
    try {
        const { filename } = req.params;
        
        // 🔥 USE __dirname CORRETAMENTE
        const relatoriosDir = path.join(__dirname, '../../relatorios');
        const filepath = path.join(relatoriosDir, filename);
        
        console.log(`📥 Tentando fazer download do arquivo: ${filepath}`);
        
        if (!fs.existsSync(filepath)) {
            console.log('❌ Arquivo não encontrado:', filepath);
            return res.status(404).json({ 
                success: false,
                message: 'Arquivo de relatório não encontrado.' 
            });
        }

        // Configura headers para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', fs.statSync(filepath).size);
        
        // Stream do arquivo
        const fileStream = fs.createReadStream(filepath);
        
        fileStream.on('error', (error) => {
            console.error('❌ Erro ao ler arquivo:', error);
            res.status(500).json({ 
                success: false,
                message: 'Erro ao ler arquivo do relatório.' 
            });
        });
        
        fileStream.pipe(res);
        
        console.log('✅ Download iniciado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao fazer download do relatório:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao fazer download do relatório.',
            error: error.message 
        });
    }
};




// Exportamos todas as funções para serem usadas nas rotas
// Note que 'preencherForms' deve ser 'gerenciarAutomacao' para funcionar com as rotas que mandei na resposta anterior.
// Se você está usando o nome 'preencherForms' no seu arquivo de rotas, troque o nome no import do routes.js.
// Para garantir a compatibilidade, usarei o nome 'gerenciarAutomacao' aqui.
// Lembre-se de corrigir o import no atendimentoRoutes.js se você usava 'preencherForms'.
// Mantendo o nome antigo (preencherForms) como alias para não quebrar rotas antigas
 
