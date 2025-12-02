// /backend/model/Usuario.js

import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    senha: {
        type: String,
        required: true,
    },
    data_registro: {
        type: Date,
        default: Date.now,
    },
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);
export default Usuario;