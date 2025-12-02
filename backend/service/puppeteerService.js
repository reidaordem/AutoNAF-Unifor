// /backend/service/puppeteerService.js

import puppeteer from 'puppeteer-extra'; // 🔥 MUDE PARA puppeteer-extra
import StealthPlugin from 'puppeteer-extra-plugin-stealth'; // 🔥 IMPORTE O PLUGIN
import Atendimento from '../models/Atendimento.js';

// 🔥 ADICIONE O PLUGIN STEALTH
puppeteer.use(StealthPlugin());

const SELECTORS = {
    // 1. Nome (Seletor fornecido)
    NOME: '#mG61Hd > div.RH5hzf.RLS9Fe > div > div.o3Dpx > div:nth-child(1) > div > div > div.AgroKb > div > div.aCsJod.oJeWuf > div > div.Xb9hP > input:nth-child(1)', 
    
    // 2. CPF - MUITO PROVAVELMENTE NOVO SELETOR:
    CPF: '#mG61Hd > div.RH5hzf.RLS9Fe > div > div.o3Dpx > div:nth-child(2) > div > div > div.AgroKb > div > div.aCsJod.oJeWuf > div > div.Xb9hP > input', 
    
    // 3. Múltipla Escolha - Tipo Dúvida (Seletor da OPÇÃO que você quer marcar)
    TIPO_DUVIDA_OPCAO: '#i22 > div.vd3tt > div', // Seletor da opção "Imposto de Renda"
    
    // 4. Dúvida - O texto da dúvida (Pode ser um <textarea> ou <input> diferente)
    DUVIDA_TEXTO: '#mG61Hd > div.RH5hzf.RLS9Fe > div > div.o3Dpx > div:nth-child(4) > div > div > div.AgroKb > div > div.RpC4Ne.oJeWuf > div.Pc9Gce.Wic03c > textarea',
    
    // 5. Botão de Envio
    BOTAO_ENVIAR: '#mG61Hd > div.RH5hzf.RLS9Fe > div > div.ThHDze > div.DE3NNc.CekdCb > div.lRwqcd > div > span', 
    
    // 6. Link para ENVIAR OUTRA RESPOSTA
    ENVIAR_OUTRA_RESPOSTA:'body > div.Uc2NEf > div:nth-child(2) > div.RH5hzf.RLS9Fe > div > div.c2gzEf > a'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Automatiza o preenchimento e envio do Google Forms para uma lista de atendimentos.
 * @param {Array<Object>} atendimentos - Lista de atendimentos a serem processados.
 * @param {string} formsUrl - URL do Google Forms.
 * @returns {Object} Resultado do processamento em lote.
 */
export const automatizarForms = async (atendimentos, formsUrl) => {
    let browser;
    let contagemSucesso = 0;
    
    if (!atendimentos || atendimentos.length === 0) {
        return {
            status: 'Sucesso',
            mensagem: 'Nenhum atendimento para processar.',
            totalProcessado: 0
        };
    }

    try {
        console.log(`🚀 INICIANDO AUTOMAÇÃO STEALTH para ${atendimentos.length} atendimentos`);
        
        // 🔥 DEBUG: Mostra exatamente quais atendimentos serão processados
        atendimentos.forEach((atendimento, index) => {
            console.log(`   ${index + 1}. ${atendimento.nome_contribuinte} (CPF: ${atendimento.cpf})`);
        });

        // 🔥 CONFIGURAÇÃO STEALTH - NAVEGADOR INVISÍVEL
        browser = await puppeteer.launch({ 
            headless: true, // 🔥 MUDE PARA true - NAVEGADOR INVISÍVEL
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=site-per-process',
                '--disable-blink-features=AutomationControlled', // 🔥 ESCONDE AUTOMAÇÃO
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-zygote',
                '--disable-extensions',
                '--disable-default-apps',
                '--window-size=1920,1080'
            ],
            ignoreDefaultArgs: ['--enable-automation'], // 🔥 REMOVE SINALIZADORES DE AUTOMAÇÃO
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH // 🔥 OPICIONAL: caminho customizado
        });
        
        const page = await browser.newPage();
        
        // 🔥 CONFIGURAÇÕES AVANÇADAS STEALTH
        await page.setDefaultNavigationTimeout(120000); // 2 minutos timeout
        
        // 🔥 ESCONDE INDÍCIOS DE AUTOMAÇÃO
        await page.evaluateOnNewDocument(() => {
            // Remove webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Remove languages property
            Object.defineProperty(navigator, 'languages', {
                get: () => ['pt-BR', 'pt', 'en-US', 'en'],
            });
            
            // Remove plugins property
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
        });

        // 🔥 CONFIGURA USER AGENT REALISTA
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // 🔥 CONFIGURA OUTRAS PROPRIEDADES PARA PARECER HUMANO
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setJavaScriptEnabled(true);

        console.log('🌐 Navegando para o Google Forms (modo stealth)...');
        
        // 🔥 NAVEGAÇÃO COM COMPORTAMENTO MAIS HUMANO
        await page.goto(formsUrl, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

        console.log('✅ Página carregada. Iniciando preenchimento...');

        // Itera sobre cada atendimento na lista
        for (const [index, atendimento] of atendimentos.entries()) {
            
            console.log(`\n📝 [${index + 1}/${atendimentos.length}] Processando: ${atendimento.nome_contribuinte}`);
            
            // 🔥 AGUARDA DE FORMA MAIS NATURAL
            await page.waitForSelector(SELECTORS.NOME, { 
                timeout: 15000,
                visible: true 
            });
            
            console.log('⌨️ Preenchendo campos...');
            
            // 🔥 PREENCHIMENTO COM DELAYS MAIS HUMANOS
            await page.type(SELECTORS.NOME, atendimento.nome_contribuinte || '', { 
                delay: Math.random() * 50 + 50 // 🔥 DELAY ALEATÓRIO ENTRE 50-100ms
            });
            
            await delay(Math.random() * 200 + 100); // 🔥 PAUSA ALEATÓRIA
            
            await page.type(SELECTORS.CPF, atendimento.cpf || '', { 
                delay: Math.random() * 50 + 50 
            });

            await delay(Math.random() * 200 + 100);

            // Seleciona a Opção de Múltipla Escolha
            try {
                await page.waitForSelector(SELECTORS.TIPO_DUVIDA_OPCAO, { 
                    timeout: 5000,
                    visible: true 
                });
                await page.click(SELECTORS.TIPO_DUVIDA_OPCAO, {
                    delay: Math.random() * 50 + 50 // 🔥 CLIQUE COM DELAY
                }); 
            } catch (clickError) {
                 console.warn(`⚠️ Falha ao clicar na opção para ${atendimento.nome_contribuinte}.`);
            }
            
            await delay(Math.random() * 200 + 100);

            // Preenche a Dúvida
            await page.type(SELECTORS.DUVIDA_TEXTO, atendimento.duvida_principal || 'Sem descrição.', { 
                delay: Math.random() * 50 + 50 
            });

            await delay(Math.random() * 300 + 200); // 🔥 PAUSA MAIS LONGA ANTES DE ENVIAR

            // Clica no botão de Enviar
            console.log('📤 Enviando formulário...');
            const submitButton = await page.waitForSelector(SELECTORS.BOTAO_ENVIAR, { 
                timeout: 8000,
                visible: true 
            });
            
            // 🔥 CLIQUE MAIS NATURAL NO BOTÃO
            await submitButton.click({ 
                delay: Math.random() * 100 + 50 
            });
            
            // 🔥 AGUARDA NAVEGAÇÃO COM TIMEOUT MAIOR
            await page.waitForNavigation({ 
                waitUntil: 'networkidle0',
                timeout: 15000 
            }).catch(() => {
                console.log('⚠️ Navegação lenta, continuando...');
            });
            
            console.log(`✅ ${atendimento.nome_contribuinte} enviado com sucesso.`);
            
            // ATUALIZA O MONGODB
            try {
                await Atendimento.findByIdAndUpdate(
                    atendimento._id, 
                    { processado: true },
                    { new: true }
                );
                console.log(`💾 MongoDB: ${atendimento.nome_contribuinte} → PROCESSADO`);
            } catch (dbError) {
                console.error(`❌ Erro ao atualizar MongoDB:`, dbError);
            }
            
            contagemSucesso++;

            // CLICA EM ENVIAR OUTRA RESPOSTA (Se não for o último registro)
            if (contagemSucesso < atendimentos.length) {
                console.log('🔄 Preparando próximo formulário...');
                
                // 🔥 AGUARDA O LINK APARECER
                await page.waitForSelector(SELECTORS.ENVIAR_OUTRA_RESPOSTA, { 
                    timeout: 10000,
                    visible: true 
                });
                
                // 🔥 CLIQUE NATURAL NO LINK
                await page.click(SELECTORS.ENVIAR_OUTRA_RESPOSTA, {
                    delay: Math.random() * 100 + 50
                });
                
                // 🔥 AGUARDA NOVA PÁGINA CARREGAR
                await page.waitForNavigation({ 
                    waitUntil: 'networkidle0',
                    timeout: 15000 
                }).catch(() => {
                    console.log('⚠️ Navegação lenta para próximo formulário, continuando...');
                });
                
                // 🔥 PAUSA ALEATÓRIA ENTRE FORMULÁRIOS
                await delay(Math.random() * 1000 + 500);
            }
        }

        console.log(`\n🎉 PROCESSAMENTO STEALTH CONCLUÍDO: ${contagemSucesso}/${atendimentos.length} registros`);
        
        return {
            status: 'Sucesso',
            mensagem: `Processamento concluído: ${contagemSucesso} de ${atendimentos.length} registros enviados.`,
            totalProcessado: contagemSucesso,
            totalSolicitado: atendimentos.length
        };

    } catch (error) {
        console.error('❌ Erro CRÍTICO na automação stealth:', error);
        
        return {
            status: 'Erro',
            mensagem: `Falha na automação. ${contagemSucesso} registros enviados antes do erro.`,
            totalProcessado: contagemSucesso,
            erro_detalhes: error.message
        };
    } finally {
        // 🔥 SEMPRE FECHA O NAVEGADOR
        if (browser) {
            await browser.close();
            console.log('🔒 Navegador stealth fechado.');
        }
    }
};