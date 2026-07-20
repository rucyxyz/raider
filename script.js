document.addEventListener('DOMContentLoaded', function() {
    const logBox = document.getElementById('log');
    const startBtn = document.getElementById('startBtn');

    function log(msg, type = '') {
        const time = new Date().toLocaleTimeString();
        let className = 'log-entry';
        if (type === 'success') className += ' log-success';
        if (type === 'error') className += ' log-error';
        logBox.innerHTML += `<div class="${className}"><span class="log-time">[${time}]</span>${msg}</div>`;
        logBox.scrollTop = logBox.scrollHeight;
    }

    function obfuscateMessage(originalContent) {
        let content = originalContent;
        const ZWC_CHARS = ['\u200B', '\u200C', '\u200D', '\u2060', '\uFEFF'];
        const INV_CHARS = ['\u200E', '\u200F', '\u2061', '\u2062', '\u2063'];

        function generateRandomJp(length) {
            let result = '';
            const ranges = [[0x3040, 0x309F], [0x4E00, 0x9FAF]];
            for (let i = 0; i < length; i++) {
                const range = ranges[Math.floor(Math.random() * ranges.length)];
                const codePoint = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
                result += String.fromCodePoint(codePoint);
            }
            return result;
        }

        function injectRandomly(text, charArray, probability = 0.3) {
            return text.split('').map(char => {
                if (Math.random() < probability) {
                    const randomChar = charArray[Math.floor(Math.random() * charArray.length)];
                    return char + randomChar;
                }
                return char;
            }).join('');
        }

        const useZwc = document.getElementById('obf_zwc')?.checked || false;
        const useInv = document.getElementById('obf_inv')?.checked || false;
        const useJp = document.getElementById('obf_jp')?.checked || false;

        if (useJp) content += ' ' + generateRandomJp(5);
        if (useInv) content = injectRandomly(content, INV_CHARS, 0.2);
        if (useZwc) content = injectRandomly(content, ZWC_CHARS, 0.3);
        return content;
    }

    window.startSending = async function() {
        const tokenInput = document.getElementById('tokens').value;
        const tokens = tokenInput.split('\n').map(t => t.trim()).filter(t => t);
        const channelId = document.getElementById('channelId').value;
        const originalContent = document.getElementById('messageContent').value;
        const count = parseInt(document.getElementById('msgCount').value) || 1;
        const delay = parseInt(document.getElementById('msgDelay').value) || 1000;

        if (tokens.length === 0) return log("エラー: トークンを入力してください", "error");
        if (!channelId) return log("エラー: チャンネルIDを入力してください", "error");
        if (!originalContent) return log("エラー: メッセージを入力してください", "error");

        startBtn.disabled = true;
        startBtn.innerText = "送信中...";
        log(`開始: ${tokens.length}個のトークン, ${count}回送信, 遅延${delay}ms`);

        try {
            for (let i = 0; i < count; i++) {
                const token = tokens[i % tokens.length];
                const partialToken = token.substring(0, 10) + "...";
                const obfuscatedContent = obfuscateMessage(originalContent);

                // ★★★ ここを書き換えてください ★★★
                // 現在はテスト用エコーサーバーに送信しています。
                // Discordに送信する場合は、下記のURLを以下のように変更してください：
                // const API_URL = `https://discord.com/api/v9/channels/${channelId}/messages`;
                const API_URL = 'https://httpbin.org/post';

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ 
                        content: obfuscatedContent,
                        channel_id: channelId
                    })
                });

                const resData = await response.json();
                if (response.ok) {
                    log(`成功 [${i+1}/${count}]`, "success");
                } else {
                    log(`エラー [${i+1}/${count}]: ${response.status}`, "error");
                }

                if (i < count - 1) await new Promise(r => setTimeout(r, delay));
            }
            log("完了", "success");
        } catch (e) {
            log(`エラー: ${e.message}`, "error");
        } finally {
            startBtn.disabled = false;
            startBtn.innerText = "送信開始";
        }
    };
});
