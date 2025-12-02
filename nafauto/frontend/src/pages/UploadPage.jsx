import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
    salvarAtendimentos, 
    buscarAtendimentos,
    automatizarForms, 
    atualizarAtendimento, 
    deletarAtendimento,
    gerarRelatorioPDF,
    downloadRelatorio    
} from '../services/backendService.js';

const UploadPage = () => {
    // Estados principais
    const [file, setFile] = useState(null);
    const [formsUrl, setFormsUrl] = useState('');
    const [atendimentos, setAtendimentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [statusAutomacao, setStatusAutomacao] = useState('');
    const [error, setError] = useState('');
    const [termoPesquisa, setTermoPesquisa] = useState('');
    const [atendimentosFiltrados, setAtendimentosFiltrados] = useState([]);
    const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
    const [relatorioOptions, setRelatorioOptions] = useState({
    incluirNaoProcessados: false
    });

    
    // Estados para edição
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditItem, setCurrentEditItem] = useState(null);
    
    // Novos estados para seleção individual
    const [atendimentosSelecionados, setAtendimentosSelecionados] = useState([]);
    const [modoSelecao, setModoSelecao] = useState(false);
    
    // Estados para modal de processamento
    const [mostrarModalProcessamento, setMostrarModalProcessamento] = useState(false);
    const [progressoProcessamento, setProgressoProcessamento] = useState(0);

    // Carregar atendimentos ao iniciar
    useEffect(() => {
        fetchAtendimentos();
    }, []);

   // 🔥 NOVO: Efeito para filtrar atendimentos quando o termo de pesquisa mudar
    useEffect(() => {
        if (termoPesquisa.trim() === '') {
            setAtendimentosFiltrados(atendimentos);
        } else {
            const filtrados = atendimentos.filter(atendimento =>
                atendimento.nome_contribuinte.toLowerCase().includes(termoPesquisa.toLowerCase())
            );
            setAtendimentosFiltrados(filtrados);
        }
    }, [termoPesquisa, atendimentos]);

    const fetchAtendimentos = async () => {
        setLoadingList(true);
        try {
            const data = await buscarAtendimentos(); 
            setAtendimentos(data);
            setAtendimentosFiltrados(data); // 🔥 INICIALIZA OS FILTRADOS
            setError('');
        } catch (err) {
            console.error("Erro ao buscar atendimentos:", err);
            setError('Falha ao carregar a lista de atendimentos do MongoDB.');
        } finally {
            setLoadingList(false);
        }
    };

    const limparPesquisa = () => {
        setTermoPesquisa('');
    };


    // ==================== FUNÇÕES DE SELEÇÃO ====================
    const toggleSelecaoAtendimento = (id) => {
        setAtendimentosSelecionados(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

   const selecionarTodos = () => {
    if (atendimentosSelecionados.length === atendimentos.length) {
        setAtendimentosSelecionados([]);
        console.log('❌ Todos desmarcados');
    } else {
        const todosIds = atendimentos.map(item => item._id);
        setAtendimentosSelecionados(todosIds);
        console.log('✅ Todos selecionados:', todosIds); // DEBUG
    }
};

    // ==================== UPLOAD DE ARQUIVO ====================
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!file) {
            setError('Por favor, selecione um arquivo Excel (.xlsx) para continuar.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0]; 
            const worksheet = workbook.Sheets[sheetName];
            const rawJson = XLSX.utils.sheet_to_json(worksheet);

            const dadosParaSalvar = rawJson.map(item => ({
                nome_contribuinte: item.NOME_COMPLETO || 'N/A', 
                cpf: (item.CPF_CLIENTE || '').toString().replace(/\D/g, ''), 
                tipo_duvida: item.TIPO_DUVIDA || 'Outros', 
                duvida_principal: item.DUVIDA_PRINCIPAL || 'Sem detalhes', 
                processado: false, 
                data_registro: new Date(),
            }));

            if (dadosParaSalvar.length === 0) {
                 setError('O arquivo Excel está vazio ou não possui dados válidos.');
                 setLoading(false);
                 return;
            }

            const resultado = await salvarAtendimentos(dadosParaSalvar);
            setStatusAutomacao(`Upload concluído: ${dadosParaSalvar.length} registros salvos.`);
            
            await fetchAtendimentos();

        } catch (err) {
            console.error('Erro no processamento:', err);
            setError(`Erro ao processar o arquivo: ${err.message}`);
        } finally {
            setLoading(false);
            setFile(null); 
        }
    };

    // ==================== AUTOMAÇÃO COM SELEÇÃO ====================
    // No UploadPage.jsx, na função handleAutomatizar, CORRIJA:

const handleAutomatizar = async () => {
    if (!formsUrl) {
        setError('A URL do Google Forms é obrigatória.');
        return;
    }

    let atendimentosParaProcessar;
    let idsParaEnviar = []; // 🔥 CRIA UM ARRAY PARA OS IDs
    
    if (modoSelecao && atendimentosSelecionados.length > 0) {
        // Envia apenas os selecionados
        atendimentosParaProcessar = atendimentos.filter(item => 
            atendimentosSelecionados.includes(item._id)
        );
        idsParaEnviar = atendimentosSelecionados; // 🔥 USA OS IDs SELECIONADOS
    } else {
        // Envia todos não processados (comportamento original)
        atendimentosParaProcessar = atendimentos.filter(item => !item.processado);
        // 🔥 Neste caso, idsParaEnviar fica vazio = processa todos não processados
    }

    // 🔥 DEBUG MELHORADO
    console.log('🎯 DEBUG - Seleção:');
    console.log('  - Modo seleção ativo:', modoSelecao);
    console.log('  - IDs selecionados no estado:', atendimentosSelecionados);
    console.log('  - IDs que serão enviados:', idsParaEnviar);
    console.log('  - Atendimentos para processar:', atendimentosParaProcessar.map(a => a.nome_contribuinte));

    if (atendimentosParaProcessar.length === 0) {
        setError('Nenhum atendimento selecionado para processar.');
        return;
    }

    setStatusAutomacao(`Iniciando automação para ${atendimentosParaProcessar.length} registros...`);
    setLoading(true);
    setError('');
    setMostrarModalProcessamento(true);
    setProgressoProcessamento(0);

    try {
        // Simula progresso
        const intervalo = setInterval(() => {
            setProgressoProcessamento(prev => {
                if (prev >= 90) {
                    clearInterval(intervalo);
                    return prev;
                }
                return prev + 10;
            });
        }, 1000);

        // 🔥 CORREÇÃO: Agora envia os IDs selecionados
        const resultado = await automatizarForms(formsUrl, idsParaEnviar);
        
        clearInterval(intervalo);
        setProgressoProcessamento(100);
        
        setStatusAutomacao(`Status: ${resultado.status}. ${resultado.mensagem}`);
        
        // Atualiza a lista após processamento
        setTimeout(() => {
            fetchAtendimentos();
            setAtendimentosSelecionados([]);
            setModoSelecao(false);
            setMostrarModalProcessamento(false);
            setProgressoProcessamento(0);
        }, 2000);

    } catch (err) {
        console.error('Erro na automação:', err);
        setError(`Falha na automação: ${err.message}`);
        setMostrarModalProcessamento(false);
        setProgressoProcessamento(0);
    } finally {
        setLoading(false);
    }
};

    // ==================== CRUD - EDIÇÃO E EXCLUSÃO ====================
    const handleEdit = (item) => {
        setCurrentEditItem({ 
            ...item, 
            data_registro: new Date(item.data_registro).toISOString().substring(0, 10) 
        });
        setIsEditing(true);
        setError('');
        setStatusAutomacao('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este registro?')) {
             return;
        }

        setLoadingList(true);
        try {
            await deletarAtendimento(id);
            setStatusAutomacao('Registro excluído com sucesso!');
            setAtendimentos(prev => prev.filter(item => item._id !== id));
        } catch (err) {
            setError(`Falha ao excluir: ${err.message}`);
        } finally {
            setLoadingList(false);
        }
    };

    const handleSaveEdit = async () => {
        setLoading(true);
        try {
            const {_id, ...updateData} = currentEditItem;
            const resultado = await atualizarAtendimento(_id, updateData);
            const updatedItem = resultado.data || currentEditItem; 

            setStatusAutomacao(`Edição salva: ${resultado.message}`);
            setAtendimentos(prev => prev.map(item => 
                item._id === _id ? updatedItem : item
            ));

            setIsEditing(false);
            setCurrentEditItem(null);
        } catch (err) {
            setError(`Falha ao salvar a edição: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGerarRelatorio = async () => {
    setGerandoRelatorio(true);
    setError('');
    
    try {
        console.log('📊 Iniciando geração de relatório...');
        const resultado = await gerarRelatorioPDF(relatorioOptions);
        
        console.log('📄 Resposta do relatório:', resultado);
        
        if (resultado.success === false) {
            throw new Error(resultado.message || 'Erro ao gerar relatório');
        }
        
        // Se tem URL de download, faz o download
        if (resultado.downloadUrl && resultado.filepath) {
            setStatusAutomacao('📊 Baixando relatório...');
            await downloadRelatorio(resultado.filepath);
            setStatusAutomacao('✅ Relatório baixado com sucesso!');
        } 
        // Se tem dados base64, faz download via data URL
        else if (resultado.data) {
            setStatusAutomacao('📊 Preparando download...');
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${resultado.data}`;
            link.download = resultado.filename || `relatorio-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setStatusAutomacao('✅ Relatório baixado com sucesso!');
        }
        // Se não tem método de download específico, apenas mostra sucesso
        else {
            setStatusAutomacao('✅ Relatório gerado com sucesso!');
        }
        
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        setError(`Falha ao gerar relatório: ${err.message}`);
    } finally {
        setGerandoRelatorio(false);
    }
};

    // ==================== COMPONENTE MODAL DE PROCESSAMENTO ====================
    const ModalProcessamento = () => {
        if (!mostrarModalProcessamento) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
                color: 'white'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    color: 'black',
                    minWidth: '400px'
                }}>
                    <h2>🔄 Processando Formulários</h2>
                    <p>O Puppeteer está preenchendo os formulários automaticamente...</p>
                    
                    {/* Barra de progresso */}
                    <div style={{
                        width: '100%',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '10px',
                        margin: '20px 0'
                    }}>
                        <div style={{
                            width: `${progressoProcessamento}%`,
                            backgroundColor: progressoProcessamento === 100 ? '#28a745' : '#007bff',
                            height: '20px',
                            borderRadius: '10px',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                    
                    <p>{progressoProcessamento}% concluído</p>
                    
                    {progressoProcessamento === 100 && (
                        <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                            ✅ Processamento concluído!
                        </p>
                    )}
                    
                    <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
                        <p>💡 Dica: Não feche esta janela enquanto o processo está em andamento.</p>
                    </div>
                </div>
            </div>
        );
    };

    // ==================== MODAL DE EDIÇÃO ====================
    const renderEditModal = () => {
        if (!isEditing || !currentEditItem) return null;

        return (
            <div style={modalOverlayStyle}>
                <div style={modalContentStyle}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                        Editar Atendimento
                    </h2>
                    <div style={formGridStyle}>
                        <label style={labelStyle}>Nome Contribuinte:</label>
                        <input 
                            type="text" 
                            value={currentEditItem.nome_contribuinte} 
                            onChange={(e) => setCurrentEditItem({...currentEditItem, nome_contribuinte: e.target.value})} 
                            style={inputStyle}
                        />

                        <label style={labelStyle}>CPF:</label>
                        <input 
                            type="text" 
                            value={currentEditItem.cpf} 
                            onChange={(e) => setCurrentEditItem({...currentEditItem, cpf: e.target.value})} 
                            style={inputStyle}
                        />

                        <label style={labelStyle}>Tipo Dúvida:</label>
                        <input 
                            type="text" 
                            value={currentEditItem.tipo_duvida} 
                            onChange={(e) => setCurrentEditItem({...currentEditItem, tipo_duvida: e.target.value})} 
                            style={inputStyle}
                        />
                        
                        <label style={labelStyle}>Data Registro:</label>
                        <input 
                            type="date" 
                            value={currentEditItem.data_registro} 
                            onChange={(e) => setCurrentEditItem({...currentEditItem, data_registro: e.target.value})} 
                            style={inputStyle}
                        />

                        <label style={labelStyle}>Status (Processado?):</label>
                        <select 
                            value={currentEditItem.processado ? 'true' : 'false'}
                            onChange={(e) => setCurrentEditItem({
                                ...currentEditItem, 
                                processado: e.target.value === 'true'
                            })} 
                            style={inputStyle}
                        >
                            <option value="false">Não Processado</option>
                            <option value="true">Processado</option>
                        </select>

                        <label style={{...labelStyle, gridColumn: 'span 2'}}>Dúvida Principal:</label>
                        <textarea 
                            value={currentEditItem.duvida_principal || ''} 
                            onChange={(e) => setCurrentEditItem({...currentEditItem, duvida_principal: e.target.value})} 
                            rows="3"
                            style={{ ...inputStyle, resize: 'vertical', gridColumn: 'span 2' }}
                        />
                    </div>

                    <div style={buttonContainerStyle}>
                        <button 
                            onClick={handleSaveEdit} 
                            disabled={loading}
                            style={{ ...buttonStyle, backgroundColor: '#007bff', color: 'white' }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)} 
                            disabled={loading}
                            style={{ ...buttonStyle, backgroundColor: '#6c757d', color: 'white', marginLeft: '10px' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==================== ESTILOS ====================
    const containerStyle = {
        padding: '20px', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        fontFamily: 'Arial, sans-serif'
    };
    const titleStyle = { 
        borderBottom: '2px solid #333', 
        paddingBottom: '10px', 
        marginBottom: '20px', 
        fontSize: '2rem' 
    };
    const formGroupStyle = { 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px', 
        alignItems: 'center' 
    };
    const inputStyleMain = { 
        padding: '10px', 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        flexGrow: 1 
    };
    const buttonStyleMain = { 
        padding: '10px 20px', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer', 
        fontWeight: 'bold',
        transition: 'background-color 0.3s'
    };
    const tableContainerStyle = { 
        marginTop: '30px', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    };
    const tableStyle = { 
        width: '100%', 
        borderCollapse: 'collapse',
    };
    const thStyle = {
        padding: '12px',
        backgroundColor: '#333',
        color: 'white',
        textAlign: 'left',
    };
    const tdStyle = {
        padding: '10px',
        borderBottom: '1px solid #eee',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '150px' 
    };
    const statusSuccessStyle = { color: 'green', fontWeight: 'bold' };
    const statusErrorStyle = { color: 'red', fontWeight: 'bold' };
    
    // Estilos do Modal
    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    };
    const modalContentStyle = {
        backgroundColor: 'rgba(21, 24, 24, 0.97)',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        width: '90%',
        maxWidth: '600px',
    };
    const formGridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '15px 10px',
    };
    const labelStyle = {
        fontWeight: 'bold',
        alignSelf: 'center',
        textAlign: 'right',
    };
    const inputStyle = {
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: '100%',
    };
    const buttonContainerStyle = {
        marginTop: '25px',
        textAlign: 'right',
    };
    const buttonStyle = {
        padding: '10px 20px', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer', 
        fontWeight: 'bold',
        transition: 'background-color 0.3s',
    };

return (
    <>
        <ModalProcessamento />
        {renderEditModal()} 
        <div style={containerStyle}>
            <h1 style={titleStyle}>🤖 Automatizador de Formulários NAF</h1>
            
            {/* Seção de Upload */}
            <section style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>1. Upload de Dados (Excel)</h2>
                <div style={formGroupStyle}>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleFileChange} 
                    />
                    <button 
                        onClick={handleFileUpload} 
                        disabled={loading || !file}
                        style={{ ...buttonStyleMain, backgroundColor: '#28a745', color: 'white' }}
                    >
                        {loading ? 'Processando...' : 'Enviar Dados'}
                    </button>
                </div>
            </section>

            {/* Seção de Automação */}
            <section style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>2. Disparar Automação</h2>
                <div style={formGroupStyle}>
                    <input 
                        type="url" 
                        placeholder="Cole a URL do Google Forms aqui" 
                        value={formsUrl}
                        onChange={(e) => setFormsUrl(e.target.value)}
                        style={inputStyleMain}
                    />
                    <button 
                        onClick={handleAutomatizar} 
                        disabled={!formsUrl || loading || loadingList || atendimentos.length === 0}
                        style={{ ...buttonStyleMain, backgroundColor: '#007bff', color: 'white' }}
                    >
                        {loading ? 'Executando...' : 'Iniciar Preenchimento Automático'}
                    </button>
                </div>
            </section>
            <section style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
    <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>4. Relatórios</h2>
    
    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
                type="checkbox"
                id="incluirNaoProcessados"
                checked={relatorioOptions.incluirNaoProcessados}
                onChange={(e) => setRelatorioOptions({
                    ...relatorioOptions,
                    incluirNaoProcessados: e.target.checked
                })}
                style={{ cursor: 'pointer' }}
            />
            <label htmlFor="incluirNaoProcessados" style={{ cursor: 'pointer' }}>
                Incluir atendimentos não processados
            </label>
        </div>
        
        <button 
            onClick={handleGerarRelatorio}
            disabled={gerandoRelatorio || atendimentos.length === 0}
            style={{ 
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}
        >
            {gerandoRelatorio ? '🔄 Gerando PDF...' : '📊 Gerar Relatório PDF'}
        </button>
    </div>
    
    <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>
        Gere um relatório completo em PDF com todos os atendimentos processados.
    </p>
</section>


            {/* Controles de Seleção */}
            <div style={{ marginBottom: '15px' }}>
                <button 
                    onClick={() => setModoSelecao(!modoSelecao)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: modoSelecao ? '#dc3545' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    {modoSelecao ? 'Cancelar Seleção' : 'Selecionar Atendimentos'}
                </button>
                
                {modoSelecao && (
                    <button 
                        onClick={selecionarTodos}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        {atendimentosSelecionados.length === atendimentos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                )}
                
                {modoSelecao && atendimentosSelecionados.length > 0 && (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                        {atendimentosSelecionados.length} atendimento(s) selecionado(s)
                    </span>
                )}
            </div>

            {/* Mensagens de Status */}
            {(error || statusAutomacao) && (
                <div style={{ 
                    padding: '15px', 
                    borderRadius: '4px', 
                    marginBottom: '20px', 
                    backgroundColor: error ? '#f8d7da' : '#d4edda', 
                    color: error ? '#721c24' : '#155724' 
                }}>
                    {error ? 
                        <p style={statusErrorStyle}>Erro: {error}</p> : 
                        <p style={statusSuccessStyle}>Status: {statusAutomacao}</p>
                    }
                </div>
            )}
            
            {/* Lista de Atendimentos */}
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>3. Registros no Banco de Dados</h2>

            {/* 🔥 BARRA DE PESQUISA */}
            <div style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                gap: '10px', 
                alignItems: 'center',
                maxWidth: '500px'
            }}>
                <div style={{ position: 'relative', flexGrow: 1 }}>
                    <input
                        type="text"
                        placeholder="🔍 Pesquisar por nome..."
                        value={termoPesquisa}
                        onChange={(e) => setTermoPesquisa(e.target.value)}
                        style={{
                            padding: '10px 40px 10px 15px',
                            border: '1px solid #ccc',
                            borderRadius: '25px',
                            width: '100%',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#007bff';
                            e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#ccc';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    {termoPesquisa && (
                        <button
                            onClick={limparPesquisa}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                color: '#999'
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>
                
                {/* 🔥 CONTADOR DE RESULTADOS */}
                <div style={{
                    padding: '5px 12px',
                    backgroundColor: termoPesquisa ? '#007bff' : '#6c757d',
                    color: 'white',
                    borderRadius: '15px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    minWidth: '80px',
                    textAlign: 'center',
                    marginLeft: '50px'
                }}>
                    {termoPesquisa ? (
                        <>📋 {atendimentosFiltrados.length} de {atendimentos.length}</>
                    ) : (
                        <>📊 {atendimentos.length} total</>
                    )}
                </div>
            </div>

            {/* 🔥 MENSAGEM DE PESQUISA SEM RESULTADOS */}
            {termoPesquisa && atendimentosFiltrados.length === 0 && (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    border: '1px dashed #dee2e6',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <p style={{ margin: 0, color: '#6c757d' }}>
                        🔍 Nenhum atendimento encontrado para "<strong>{termoPesquisa}</strong>"
                    </p>
                    <button
                        onClick={limparPesquisa}
                        style={{
                            marginTop: '10px',
                            padding: '5px 15px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Limpar pesquisa
                    </button>
                </div>
            )}

            {loadingList ? (
                <p>Carregando registros...</p>
            ) : atendimentosFiltrados.length > 0 ? (
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                {modoSelecao && <th style={thStyle}>Selecionar</th>}
                                <th style={thStyle}>Nome Contribuinte</th>
                                <th style={thStyle}>CPF</th>
                                <th style={thStyle}>Dúvida</th>
                                <th style={thStyle}>Registro</th>
                                <th style={thStyle}>Processado?</th>
                                <th style={{...thStyle, width: '150px'}}>Ações</th> 
                            </tr>
                        </thead>
                        <tbody>
                            {atendimentosFiltrados.map((item, index) => (
                                <tr key={item._id} style={{
                                    backgroundColor: atendimentosSelecionados.includes(item._id) 
                                        ? '#00530cff'
                                        : index % 2 === 0 ? '#07090cff' : '#0c0b0bff'
                                }}>
                                    {modoSelecao && (
                                        <td style={tdStyle}>
                                            <input 
                                                type="checkbox"
                                                checked={atendimentosSelecionados.includes(item._id)}
                                                onChange={() => toggleSelecaoAtendimento(item._id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                    )}
                                    <td style={tdStyle}>
                                        {/* 🔥 DESTAQUE DO TERMO PESQUISADO */}
                                        {termoPesquisa ? (
                                            <span>
                                                {item.nome_contribuinte.split(new RegExp(`(${termoPesquisa})`, 'gi')).map((part, i) => 
                                                    part.toLowerCase() === termoPesquisa.toLowerCase() ? (
                                                        <mark key={i} style={{ 
                                                            backgroundColor: '#ffeb3b', 
                                                            padding: '1px 2px',
                                                            borderRadius: '2px'
                                                        }}>
                                                            {part}
                                                        </mark>
                                                    ) : (
                                                        part
                                                    )
                                                )}
                                            </span>
                                        ) : (
                                            item.nome_contribuinte
                                        )}
                                    </td>
                                    <td style={tdStyle}>{item.cpf}</td>
                                    <td style={tdStyle}>{item.tipo_duvida}</td>
                                    <td style={tdStyle}>{new Date(item.data_registro).toLocaleDateString('pt-BR')}</td>
                                    <td style={tdStyle}>
                                        <span style={{ 
                                            color: item.processado ? 'green' : 'red', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {item.processado ? 'Sim' : 'Não'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button 
                                            onClick={() => handleEdit(item)} 
                                            style={{ 
                                                ...buttonStyle, 
                                                backgroundColor: '#ffc107', 
                                                color: 'white', 
                                                marginRight: '5px', 
                                                padding: '5px 10px',
                                                fontSize: '0.8rem'
                                            }}
                                            disabled={loading || isEditing} 
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item._id)} 
                                            style={{ 
                                                ...buttonStyle, 
                                                backgroundColor: '#dc3545', 
                                                color: 'white', 
                                                padding: '5px 10px',
                                                fontSize: '0.8rem'
                                            }}
                                            disabled={loading || isEditing}
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p style={{ padding: '10px', border: '1px dashed #ccc' }}>
                    {termoPesquisa ? 'Nenhum resultado encontrado.' : 'Nenhum atendimento encontrado no banco de dados. Envie o Excel para começar.'}
                </p>
            )}
        </div>
    </>
);
};

export default UploadPage;