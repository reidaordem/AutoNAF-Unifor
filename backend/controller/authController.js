// /backend/controller/authController.js

import Usuario from '../models/Usuario.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Defina sua chave secreta para JWT (MUITO IMPORTANTE!)
// Mude 'SEGREDO_SUPER_SECRETO' para algo complexo e armazene em .env na produção!
const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_DE_BACKUP'; 

// 1. Cadastro (Register)
export const register = async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        // 1. Verifica se o usuário já existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }

        // 2. Criptografa a senha antes de salvar (SALT = 10)
        const hashedPassword = await bcrypt.hash(senha, 10);

        // 3. Cria e salva o novo usuário
        const novoUsuario = new Usuario({
            email,
            senha: hashedPassword,
        });

        await novoUsuario.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: 'Erro interno ao registrar usuário.' });
    }
};

// 2. Login
export const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        // 1. Busca o usuário pelo email
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // 2. Compara a senha fornecida com a senha criptografada
        const isMatch = await bcrypt.compare(senha, usuario.senha);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // 3. Cria um token JWT
        // O token expira em 1 hora
        const token = jwt.sign(
            { id: usuario._id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Retorna o token para o cliente
        res.status(200).json({ token, message: 'Login efetuado com sucesso!' });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro interno no login.' });
    }
};