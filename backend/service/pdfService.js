// /backend/service/pdfService.js

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * Gera um relatório PDF com os atendimentos processados
 * @param {Array} atendimentos - Lista de atendimentos processados
 * @param {Object} options - Opções do relatório
 * @returns {Promise<string>} - Caminho do arquivo PDF gerado
 */
export const gerarRelatorioPDF = async (atendimentos, options = {}) => {
    return new Promise((resolve, reject) => {
        try {
            // Configurações do relatório
            const {
                titulo = 'Relatório de Atendimentos Processados - NAF UNIFOR',
                periodo = new Date().toLocaleDateString('pt-BR'),
                incluirNaoProcessados = false
            } = options;

            // Filtra atendimentos
            const atendimentosFiltrados = incluirNaoProcessados 
                ? atendimentos 
                : atendimentos.filter(item => item.processado);

            if (atendimentosFiltrados.length === 0) {
                throw new Error('Nenhum atendimento processado encontrado para gerar relatório.');
            }

            // Cria diretório de relatórios se não existir
            const relatoriosDir = path.join(__dirname, '../../relatorios');
            if (!fs.existsSync(relatoriosDir)) {
                fs.mkdirSync(relatoriosDir, { recursive: true });
            }

            // Nome do arquivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `relatorio-atendimentos-${timestamp}.pdf`;
            const filepath = path.join(relatoriosDir, filename);

            // Cria o documento PDF
            const doc = new PDFDocument({ 
                margin: 50,
                size: 'A4',
                info: {
                    Title: titulo,
                    Author: 'Sistema NAF UNIFOR',
                    Subject: 'Relatório de Atendimentos Processados',
                    Keywords: 'NAF, atendimentos, relatório',
                    CreationDate: new Date()
                }
            });

            // Pipe para arquivo
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // ==================== CABEÇALHO ====================
            doc.fillColor('#2c3e50')
               .fontSize(20)
               .font('Helvetica-Bold')
               .text('NAF - NÚCLEO DE ATENDIMENTO FISCAL', 50, 50, { align: 'center' });

            doc.fillColor('#34495e')
               .fontSize(16)
               .font('Helvetica')
               .text('UNIFOR - Universidade de Fortaleza', 50, 75, { align: 'center' });

            doc.fillColor('#7f8c8d')
               .fontSize(12)
               .text(titulo, 50, 100, { align: 'center' });

            // Linha divisória
            doc.moveTo(50, 120)
               .lineTo(545, 120)
               .strokeColor('#bdc3c7')
               .lineWidth(1)
               .stroke();

            // ==================== INFORMAÇÕES DO RELATÓRIO ====================
            let yPosition = 140;

            doc.fillColor('#2c3e50')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('PERÍODO DO RELATÓRIO:', 50, yPosition);

            doc.fillColor('#34495e')
               .font('Helvetica')
               .text(periodo, 180, yPosition);

            yPosition += 20;

            doc.fillColor('#2c3e50')
               .font('Helvetica-Bold')
               .text('TOTAL DE ATENDIMENTOS:', 50, yPosition);

            doc.fillColor('#34495e')
               .font('Helvetica')
               .text(atendimentosFiltrados.length.toString(), 180, yPosition);

            yPosition += 20;

            doc.fillColor('#2c3e50')
               .font('Helvetica-Bold')
               .text('DATA DE GERAÇÃO:', 50, yPosition);

            doc.fillColor('#34495e')
               .font('Helvetica')
               .text(new Date().toLocaleString('pt-BR'), 180, yPosition);

            yPosition += 30;

            // ==================== TABELA DE ATENDIMENTOS ====================
            // Cabeçalho da tabela
            doc.fillColor('#ffffff')
               .rect(50, yPosition, 495, 25)
               .fill();

            doc.fillColor('#2c3e50')
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('NOME', 55, yPosition + 8);
            
            doc.text('CPF', 200, yPosition + 8);
            doc.text('TIPO DÚVIDA', 280, yPosition + 8);
            doc.text('DATA', 380, yPosition + 8);
            doc.text('STATUS', 450, yPosition + 8);

            yPosition += 25;

            // Dados dos atendimentos
            atendimentosFiltrados.forEach((atendimento, index) => {
                // Fundo alternado para linhas
                if (index % 2 === 0) {
                    doc.fillColor('#f8f9fa')
                       .rect(50, yPosition, 495, 20)
                       .fill();
                }

                // Dados
                doc.fillColor('#2c3e50')
                   .fontSize(8)
                   .font('Helvetica');

                // Nome (truncado se necessário)
                const nome = atendimento.nome_contribuinte.length > 25 
                    ? atendimento.nome_contribuinte.substring(0, 25) + '...' 
                    : atendimento.nome_contribuinte;
                doc.text(nome, 55, yPosition + 6);

                // CPF formatado
                const cpf = atendimento.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                doc.text(cpf, 200, yPosition + 6);

                // Tipo de dúvida (truncado)
                const duvida = atendimento.tipo_duvida.length > 20 
                    ? atendimento.tipo_duvida.substring(0, 20) + '...' 
                    : atendimento.tipo_duvida;
                doc.text(duvida, 280, yPosition + 6);

                // Data formatada
                const data = new Date(atendimento.data_registro).toLocaleDateString('pt-BR');
                doc.text(data, 380, yPosition + 6);

                // Status com cor
                if (atendimento.processado) {
                    doc.fillColor('#27ae60')
                       .text('PROCESSADO', 450, yPosition + 6);
                } else {
                    doc.fillColor('#e74c3c')
                       .text('PENDENTE', 450, yPosition + 6);
                }

                yPosition += 20;

                // Quebra de página se necessário
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50;
                    
                    // Cabeçalho da tabela na nova página
                    doc.fillColor('#ffffff')
                       .rect(50, yPosition, 495, 25)
                       .fill();

                    doc.fillColor('#2c3e50')
                       .fontSize(9)
                       .font('Helvetica-Bold')
                       .text('NOME', 55, yPosition + 8);
                    
                    doc.text('CPF', 200, yPosition + 8);
                    doc.text('TIPO DÚVIDA', 280, yPosition + 8);
                    doc.text('DATA', 380, yPosition + 8);
                    doc.text('STATUS', 450, yPosition + 8);

                    yPosition += 25;
                }
            });

            // ==================== RESUMO ESTATÍSTICO ====================
            yPosition += 30;

            doc.fillColor('#2c3e50')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('RESUMO ESTATÍSTICO', 50, yPosition);

            yPosition += 20;

            const totalProcessados = atendimentosFiltrados.filter(a => a.processado).length;
            const totalPendentes = atendimentosFiltrados.filter(a => !a.processado).length;
            const percentualProcessado = ((totalProcessados / atendimentosFiltrados.length) * 100).toFixed(1);

            doc.fillColor('#34495e')
               .fontSize(10)
               .font('Helvetica')
               .text(`• Total de atendimentos: ${atendimentosFiltrados.length}`, 70, yPosition);
            
            yPosition += 15;
            doc.fillColor('#27ae60')
               .text(`• Atendimentos processados: ${totalProcessados}`, 70, yPosition);
            
            yPosition += 15;
            doc.fillColor(totalPendentes > 0 ? '#e74c3c' : '#34495e')
               .text(`• Atendimentos pendentes: ${totalPendentes}`, 70, yPosition);
            
            yPosition += 15;
            doc.fillColor('#3498db')
               .text(`• Percentual de conclusão: ${percentualProcessado}%`, 70, yPosition);

            // ==================== RODAPÉ ====================
            const pageHeight = doc.page.height;
            doc.fillColor('#7f8c8d')
               .fontSize(8)
               .text(`Relatório gerado automaticamente pelo Sistema NAF UNIFOR - Página ${doc.page.number}`, 
                     50, pageHeight - 40, { align: 'center' });

            // Finaliza o documento
            doc.end();

            stream.on('finish', () => {
                console.log(`📊 Relatório PDF gerado: ${filepath}`);
                resolve(filepath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Gera um relatório simples em base64 (para download direto)
 */
export const gerarRelatorioBase64 = async (atendimentos, options = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const chunks = [];
            const doc = new PDFDocument();
            
            // Configuração básica do PDF
            doc.font('Helvetica');
            
            // Título
            doc.fontSize(16)
               .text('RELATÓRIO DE ATENDIMENTOS - NAF UNIFOR', 50, 50);
            
            doc.fontSize(10)
               .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, 80);
            
            // Lista de atendimentos
            let y = 120;
            atendimentos.forEach((atendimento, index) => {
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
                
                doc.text(`${index + 1}. ${atendimento.nome_contribuinte} - ${atendimento.cpf} - ${atendimento.processado ? 'PROCESSADO' : 'PENDENTE'}`, 50, y);
                y += 20;
            });
            
            doc.end();
            
            // Coleta os chunks em base64
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64 = pdfBuffer.toString('base64');
                resolve(base64);
            });
            
        } catch (error) {
            reject(error);
        }
    });
};