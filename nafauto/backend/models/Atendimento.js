// /backend/model/Atendimento.js

import mongoose from 'mongoose';

// Define a estrutura (Schema) dos dados que serão salvos no MongoDB
const AtendimentoSchema = new mongoose.Schema({
    // ... (restante do seu código do Schema aqui)
    nome_contribuinte: {
        type: String,
        required: true,
        trim: true
    },
    cpf: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // NOVO CAMPO: Para o tipo de dúvida (Múltipla Escolha)
    tipo_duvida: { 
        type: String,
        required: true,
        trim: true
    },
    // Dados do serviço prestado (o texto completo da dúvida)
    duvida_principal: { 
        type: String,
        required: true,
        trim: true
    },
    atendente_responsavel: {
        type: String,
        default: 'NAF UNIFOR'
    },
    data_registro: {
        type: Date,
        default: Date.now
    },
     processado: {
        type: Boolean,
        default: false  // Todos os novos registros começam como não processados
    }
}, { 
    timestamps: true
});

// Cria o modelo e o exporta usando export default
export default mongoose.model('Atendimento', AtendimentoSchema);