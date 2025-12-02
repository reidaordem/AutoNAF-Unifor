// 1. Importa os módulos necessários usando a sintaxe ES Module (import)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import atendimentoRoutes from './routes/atendimentoRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Carrega variáveis de ambiente do .env
dotenv.config(); 

// 2. Inicializa o Express
const app = express();
const PORT = process.env.PORT || 3001; 

// 3. Middlewares
// CORS: Permite que o frontend (Vite) acesse o backend
const corsOptions = {
    origin: process.env.FRONTEND_URL, 
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Express.json: Permite que o servidor entenda JSON
app.use(express.json());

// 4. Conexão com o MongoDB
console.log(`URI carregada: ${process.env.MONGO_URI ? 'Sim' : 'Não'}`); // LOG DE VERIFICAÇÃO

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Conectado com sucesso!');
    } catch (error) {
        console.error('❌ ERRO CRÍTICO NA CONEXÃO COM O MONGODB:', error.message);
        // Garante que o processo seja encerrado se a conexão falhar
        process.exit(1); 
    }
};

// 5. Chamada de Conexão
connectDB();

// 6. Configuração de Rotas
app.use('/api/auth', authRoutes);
// Rotas de Atendimento (CRUD: GET, POST, PUT, DELETE)
app.use('/api/atendimentos', atendimentoRoutes); 

app.use('/relatorios', express.static('relatorios'));

console.log('🔄 Rotas registradas:');
atendimentoRoutes.stack.forEach((layer) => {
    if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        console.log(`${methods} ${layer.route.path}`);
    }
});

// ❌ LINHA REMOVIDA: app.use('/api/forms/preencher', atendimentoRoutes); 

// Rota de teste simples
app.get('/', (req, res) => {
    res.send('API está rodando...');
});

// 7. Inicia o Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});