const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { Client } = require('whatsapp-web.js');
const express = require('express');

const app = express();
const port = 3000;
const client = new Client();
let qrCodeData = null;
let isConnected = false;

const TIMEOUT = 15 * 60 * 1000; // 15 minutos em milissegundos

client.on('qr', qr => {
    qrCodeData = qr; // Salva o QR Code para exibição na página
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado!');
    isConnected = true;
    qrCodeData = null; // Limpa o QR Code após conexão bem-sucedida
});

// Evento para detectar quando desconectar
client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp desconectado:', reason);
    isConnected = false;
});

client.initialize();

// Servir a página HTML
app.use(express.static('public'));

// Endpoint para fornecer o QR Code em base64
app.get('/qrcode', async (req, res) => {
    if (qrCodeData) {
        const qrImage = await QRCode.toDataURL(qrCodeData);
        res.json({ qr: qrImage });
    } else {
        res.json({ qr: null });
    }
});

// Endpoint para verificar status de conexão
app.get('/status', (req, res) => {
    res.json({ connected: isConnected });
});

// Iniciar o servidor Express
app.listen(port, () => {
    console.log(`🌍 Servidor rodando em https://chatpatrick.onrender.com`);
});
//console.log(`🌍 Servidor rodando em http://localhost:${port}`);

const delay = ms => new Promise(res => setTimeout(res, ms));

const userState = {}; // Estado do usuário

client.on('message', async msg => {
    const userId = msg.from;

    // Se o usuário está em atendimento humano, o bot não responde automaticamente
    if (userState[userId] === 'atendimento_humano') {
        console.log(`📩 Mensagem ignorada (Aguardando atendimento humano): ${msg.body}`);
        return;
    }

    // Garante que o estado do usuário sempre existe
    if (!userState[userId]) {
        userState[userId] = null;
    }

    // Primeiro menu de boas-vindas
    if (msg.body.match(/(menu|dia|tarde|noite|oi|olá|ola)/i) && msg.from.endsWith('@c.us')) {
        userState[userId] = null; // Resetando estado do usuário

        await client.sendMessage(userId, `👋 Olá! Seja bem-vindo(a) ao atendimento automático da PATRICK SILVA FOTOGRAFIA E FILMAGEM.` +
            '\nPara facilitar seu atendimento, selecione uma das opções abaixo:\n' +
            '\n1 Quero um orçamento 📸' +
            '\n2 Já tenho um orçamento e quero agendar um ensaio 📅' +
            '\n3 Quero saber mais sobre revelação de fotos 🖼' +
            '\n4 Tenho uma dúvida ❓' +
            '\n5 Falar com um atendente ☎');
        return;
    }

    // Usuário escolheu "1" (orçamento)
    if (msg.body === '1' && userState[userId] === null) {
        userState[userId] = 'orcamento'; // Define o estado do usuário
        await client.sendMessage(userId, `Ótimo! Me diga qual serviço você precisa:\n
            \n📷 *Fotografia:*
            \n1. Aniversário 🎂
            \n2. Gestante 🤰
            \n3. Família 👨‍👩‍👧‍👦
            \n4. Casal ❤
            \n5. Produtos 🛍
            \n6. Individual 🌟
            \n7. Ensaio Profissão 👔
            \n8. Batizado ✝
            \n9. Outros (Atendimento Humano)\n
            \n🎥 *Filmagem:*
            \n10. Casamento 💍 (Atendimento Humano)
            \n11. Aniversário 🎂 (Atendimento Humano)`);
        return;
    }

    // Usuário já está no menu de orçamento
    if (userState[userId] === 'orcamento') {
        switch (msg.body) {
            case '1':
                await client.sendMessage(userId, '📸 *Aniversário 🎂*\nUma data especial merece ser registrada! Oferecemos pacotes incríveis.');
                break;
            case '2':
                await client.sendMessage(userId, '🤰 *Gestante*\nEternize este momento único com um ensaio delicado.');
                break;
            case '3':
                await client.sendMessage(userId, '👨‍👩‍👧‍👦 *Família*\nRegistre a essência da sua família.');
                break;
            case '4':
                await client.sendMessage(userId, '❤ *Casal*\nVamos eternizar sua história com fotos cheias de sentimentos!');
                break;
            case '5':
                await client.sendMessage(userId, '🛍 *Produtos*\nFotografia profissional para destacar seus produtos.');
                break;
            case '6':
                await client.sendMessage(userId, '🌟 *Individual*\nCelebre sua autenticidade com um ensaio profissional.');
                break;
            case '7':
                await client.sendMessage(userId, '👔 *Ensaio Profissional*\nInvista em um ensaio que transmita profissionalismo.');
                break;
            case '8':
                await client.sendMessage(userId, '✝ *Batizado*\nRegistre esse momento especial com fotos emocionantes.');
                break;
            case '9':
            case '10':
            case '11':
                await client.sendMessage(userId, 'Aguarde, um atendente humano irá falar com você em breve.');
                break;
            case '12': // Opção para voltar ao menu principal
                userState[userId] = null;
                await client.sendMessage(userId, '🔄 Voltando ao menu principal...');
                await client.sendMessage(userId, `👋 Olá! Seja bem-vindo(a) ao atendimento automático da PATRICK SILVA FOTOGRAFIA E FILMAGEM.` +
                    '\nPara facilitar seu atendimento, selecione uma das opções abaixo:\n' +
                    '\n1 Quero um orçamento 📸' +
                    '\n2 Já tenho um orçamento e quero agendar um ensaio 📅' +
                    '\n3 Quero saber mais sobre revelação de fotos 🖼' +
                    '\n4 Tenho uma dúvida ❓' +
                    '\n5 Falar com um atendente ☎');
                break;
            default:
                await client.sendMessage(userId, 'Opção inválida! Selecione uma das opções de 1 a 12.');
                return;
        }
        return;
    }

    //\n🔗 *[Agendar agora](https://agenda.patrickfotografo.com.br)*\n
    // Usuário escolheu "2" (agenda)
    if (msg.body === '2' && userState[userId] === null) {
        userState[userId] = 'agenda'; // Define o estado do usuário
        await client.sendMessage(userId, `📅 *Agende seu evento!*\n
            \nÓtimo! Clique no link abaixo e agende seu horário:\n
            \n🔗 *[Agendar agora](Agenda em desenvolvimento, em breve disponível)*\n
            \n2. Voltar ao menu principal ⬅`);
        return;
    }

    if (userState[userId] === 'agenda') {
        switch (msg.body) {
            case '2': // Opção para voltar ao menu principal
                userState[userId] = null;
                await client.sendMessage(userId, '🔄 Voltando ao menu principal...');
                await client.sendMessage(userId, `👋 Olá! Seja bem-vindo(a) ao atendimento automático da PATRICK SILVA FOTOGRAFIA E FILMAGEM.` +
                    '\nPara facilitar seu atendimento, selecione uma das opções abaixo:\n' +
                    '\n1 Quero um orçamento 📸' +
                    '\n2 Já tenho um orçamento e quero agendar um ensaio 📅' +
                    '\n3 Quero saber mais sobre revelação de fotos 🖼' +
                    '\n4 Tenho uma dúvida ❓' +
                    '\n5 Falar com um atendente ☎');
                break;
            default:
                await client.sendMessage(userId, 'Opção inválida! Selecione uma das opções disponíveis.');
                return;
        }
        return;
    }

    if (msg.body === '3' && userState[userId] === null) {
        userState[userId] = 'revelacao'; // Define o estado do usuário
        await client.sendMessage(userId, `📏 *Revelação de Fotos*\nTemos a opção de revelação em diferentes tamanhos e materiais:\n
            \n📦 *Tamanhos disponíveis:* 10x15; 15x21; 20x30
            \n💰 *Valores:*
            \n- Fotos 10x15: R$ 2,00
            \n- Fotos 15x21: R$ 4,00
            \n- Fotos 20x30: R$ 8,00\n
            \nDeseja revelar suas fotos agora?
            \n1 Sim, quero revelar 📸\n2 Tenho dúvidas ❓\n3 Voltar ao menu ⬅`);
        return;
    }

    // Se o usuário está no menu de revelação
    if (userState[userId] === 'revelacao') {
        switch (msg.body) {
            case '1':
                await client.sendMessage(userId, '📸 *Revelação Confirmada!*\nPor favor, envie as fotos que deseja revelar e escolha o tamanho desejado.');
                break;
            case '2':
                await client.sendMessage(userId, '❓ *Dúvidas sobre revelação*\nVocê pode revelar fotos em tamanhos 10x15, 15x21 e 20x30. Caso tenha dúvidas adicionais, fale com um atendente.');
                break;
            case '3': // Opção para voltar ao menu principal
                userState[userId] = null;
                await client.sendMessage(userId, '🔄 Voltando ao menu principal...');
                await client.sendMessage(userId, `👋 Olá! Seja bem-vindo(a) ao atendimento automático da PATRICK SILVA FOTOGRAFIA E FILMAGEM.` +
                    '\nPara facilitar seu atendimento, selecione uma das opções abaixo:\n' +
                    '\n1 Quero um orçamento 📸' +
                    '\n2 Já tenho um orçamento e quero agendar um ensaio 📅' +
                    '\n3 Quero saber mais sobre revelação de fotos 🖼' +
                    '\n4 Tenho uma dúvida ❓' +
                    '\n5 Falar com um atendente ☎');
                break;
            default:
                await client.sendMessage(userId, 'Opção inválida! Selecione uma das opções de 1 a 3.');
                return;
        }
        return;
    }

    if (msg.body === '4' && userState[userId] === null) {
        userState[userId] = 'duvidas'; // Define o estado do usuário
        await client.sendMessage(userId, `❓ *Dúvidas Frequentes*
            \n1 Qual o prazo de entrega das fotos?
            \n2 Em quais formatos as fotos são entregues?
            \n3 Quanto tempo dura o ensaio?
            \n4 Quando recebo as prévias e as fotos finais?
            \n5 Outra dúvida (Falar com um atendente) ☎`);
        return;
    }

    // Se o usuário está no menu de dúvidas
    if (userState[userId] === 'duvidas') {
        switch (msg.body) {
            case '1':
                await client.sendMessage(userId, '📆 *Prazo de entrega:* O prazo médio para entrega das fotos é de 7 a 10 dias úteis.');
                break;
            case '2':
                await client.sendMessage(userId, '🖼 *Formatos das fotos:* As fotos são entregues em formato digital (JPEG) e podem ser impressas em papel fotográfico.');
                break;
            case '3':
                await client.sendMessage(userId, '⏳ *Duração do ensaio:* Um ensaio fotográfico dura, em média, entre 1 e 2 horas.');
                break;
            case '4':
                await client.sendMessage(userId, '📷 *Prévias e fotos finais:* As prévias são enviadas em até 3 dias úteis. A seleção final das fotos é feita pelo cliente, e a entrega ocorre em até 10 dias úteis.');
                break;
            case '5':
                await client.sendMessage(userId, '☎ *Falar com um atendente:* Aguarde, um atendente humano irá falar com você em breve.');
                break;
            case '6': // Opção para voltar ao menu principal
                userState[userId] = null;
                await client.sendMessage(userId, '🔄 Voltando ao menu principal...');
                await client.sendMessage(userId, `👋 Olá! Seja bem-vindo(a) ao atendimento automático da PATRICK SILVA FOTOGRAFIA E FILMAGEM.` +
                    '\nPara facilitar seu atendimento, selecione uma das opções abaixo:\n' +
                    '\n1 Quero um orçamento 📸' +
                    '\n2 Já tenho um orçamento e quero agendar um ensaio 📅' +
                    '\n3 Quero saber mais sobre revelação de fotos 🖼' +
                    '\n4 Tenho uma dúvida ❓' +
                    '\n5 Falar com um atendente ☎');
                break;
            default:
                await client.sendMessage(userId, 'Opção inválida! Selecione uma das opções de 1 a 6.');
                return;
        }
        return;
    }

    // Usuário escolheu "5" para atendimento humano
    if (msg.body === '5') {
        userState[userId] = 'atendimento_humano'; // Define que está aguardando atendimento
        await client.sendMessage(userId, `☎ *Falar com um Atendente*\n
            \nAguarde um momento, estamos direcionando você para um atendimento humano.`);
        return;
    }

    // Função que reseta o estado após 15 minutos sem resposta
    function startAutoReactivationTimer(userId) {
        // Configura um temporizador para rodar após 15 minutos
        setTimeout(async () => {
            if (userState[userId] === 'atendimento_humano') {
                userState[userId] = null;
                await client.sendMessage(userId, '🔄 O atendimento automático foi reativado.');
            }
        }, TIMEOUT);
    }

    // Exemplo de uso: se o usuário não responder em 15 minutos, o atendimento será reativado automaticamente
    if (msg.body && userState[userId] === 'atendimento_humano') {
        startAutoReactivationTimer(userId);
    }

    const axios = require("axios");

    setInterval(() => {
        axios.get("https://embarrassed-letizia-chatbotfoto-8c53d754.koyeb.app/")
            .then(() => console.log("Ping enviado!"))
            .catch(err => console.error("Erro no ping:", err));
    }, 30000); // A cada 10 minutos

    const puppeteer = require('puppeteer');

    (async () => {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('https://embarrassed-letizia-chatbotfoto-8c53d754.koyeb.app/');
        await browser.close();
    })();

});
