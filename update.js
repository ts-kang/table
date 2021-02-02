/**
 * Contact: @naynn_n
 */

(() => {
    function CSV(header, style, iidxid, djname) {
        this.header = header;
        this.iidxid = iidxid;
        this.djname = djname;
        this.rivalCode = undefined;
        this.style = style;
        this.delimiter = ',';
        this.newline = '\n';
        this.data = [];
    }
    CSV.prototype = {
        insert(row) {
            this.data.push(row);
        },

        insertObject(obj) {
            let row = new Array(this.header.length);
            Object.entries(obj).forEach(([k, v]) => {
                if (!this.header.includes(k))
                    throw new Error(`invalid key: ${k}`);
                row[this.header.indexOf(k)] = v;
            });
            this.insert(row);
        },

        indexOf(obj) {
            for (const [i, row] of this.data.entries()) {
                if (Object.entries(obj).reduce((t, [k, v]) => t && row[this.header.indexOf(k)] === v, true))
                    return i;
            }
            return -1;
        },

        setValue(index, key, value) {
            this.data[index][this.header.indexOf(key)] = value;
        },

        getValue(index, key) {
            return this.data[index][this.header.indexOf(key)];
        },

        getFilename() {
            return `${this.iidxid}_${['sp', 'dp'][this.style]}_score.csv`;
        },

        // follows csv format from e-amusement system
        // may differs from standard rule (RFC 4180)
        _escape(s) {
            return (typeof s === 'string' || s instanceof String)
                ? s.replaceAll(',', '，')
                : s;
        },

        toString() {
            let ret = '';
            ret += this.header
                .map(this._escape)
                .join(this.delimiter);
            ret += this.newline;
            ret += this.data
                .map(row => row
                     .map(this._escape)
                     .join(this.delimiter))
                .join(this.newline);

            return ret;
        },
    };

    const PLAYSTYLE = {SP: 0, DP: 1};
    const HEADER = ['バージョン', 'タイトル', 'ジャンル', 'アーティスト', 'プレー回数', 'BEGINNER 難易度', 'BEGINNER スコア', 'BEGINNER PGreat', 'BEGINNER Great', 'BEGINNER ミスカウント', 'BEGINNER クリアタイプ', 'BEGINNER DJ LEVEL', 'NORMAL 難易度', 'NORMAL スコア', 'NORMAL PGreat', 'NORMAL Great', 'NORMAL ミスカウント', 'NORMAL クリアタイプ', 'NORMAL DJ LEVEL', 'HYPER 難易度', 'HYPER スコア', 'HYPER PGreat', 'HYPER Great', 'HYPER ミスカウント', 'HYPER クリアタイプ', 'HYPER DJ LEVEL', 'ANOTHER 難易度', 'ANOTHER スコア', 'ANOTHER PGreat', 'ANOTHER Great', 'ANOTHER ミスカウント', 'ANOTHER クリアタイプ', 'ANOTHER DJ LEVEL', 'LEGGENDARIA 難易度', 'LEGGENDARIA スコア', 'LEGGENDARIA PGreat', 'LEGGENDARIA Great', 'LEGGENDARIA ミスカウント', 'LEGGENDARIA クリアタイプ', 'LEGGENDARIA DJ LEVEL', '最終プレー日時'];
    const LAMP = ['NO PLAY', 'FAILED', 'ASSIST CLEAR', 'EASY CLEAR', 'CLEAR', 'HARD CLEAR', 'EX HARD CLEAR', 'FULLCOMBO CLEAR'];
    const INTERVAL = 500;

    const util = {
        log(...data) {
            console.log(...data);
        },
        
        async readPage(url, data={}) {
            this.log('fetching... ' + url);

            await new Promise(resolve => setTimeout(resolve, INTERVAL));
            const response = await fetch(url, data);
            if (!response.ok)
                throw new Error('failed to fetch. HTTP status ' + response.status);

            return response;
        },

        async readDOM(url, data={}, encoding='shift-jis') {
            return new DOMParser().parseFromString(
                await this.readPage(url, data)
                    .then(res => res.arrayBuffer())
                    .then(buf => new TextDecoder(encoding).decode(buf))
                , 'text/html');
        },
    };

    function IIDXCSVGenerator() {
        this.version = 28;
        this.domUI = undefined;
        // ('title\tdifficulty', level)
        this.levels = [new Map(), new Map()]; // [SP, DP]
        this.csv = [new CSV(HEADER), new CSV(HEADER)]; // [SP, DP]
    };
    IIDXCSVGenerator.prototype = {
        async parseUserData(style) {
            this.csv = await this._newUserCSV(style);
            if (this.levels[style].size === 0)
                await this._parseLevels(style);
            await this._parseSeries(this.csv);
        },

        async parseRivalData(style, iidxid) {
            this.csv = await this._newRivalCSV(style, iidxid);
            if (this.levels[style].size === 0)
                await this._parseLevels(style);
            await this._parseSeries(this.csv);
        },

        async _parseSeries(csv) {
            const url = `https://p.eagate.573.jp/game/2dx/${this.version}/djdata/music/series.html`;

            const html = await util.readDOM(url);
            const versionList = Array.from(html.querySelector('select[name=list]').children)
                  .map(option => [option.innerText, option.value])
                  .sort((a, b) => a[1] - b[1]);

            for (const [versionName, value] of versionList.entries()) {
                const doc = await util.readDOM(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `list=${value}&play_style=${csv.style}&s=1&rival=`,
                });

                doc
                    .querySelector('div.series-all > table > tbody')
                    .querySelectorAll('tr > td')
                    .forEach(td => {
                        if (td.children.length === 0)
                            return;
                        const title = td.querySelector('.music_info').innerText;
                        let row = {
                            'タイトル': title,
                            'ジャンル': '---', // genre
                            'アーティスト': '---', // artist
                            'プレー回数': '---', // play count
                            '最終プレー日時': '---', // last play time
                        };
                        td.querySelectorAll('.series-info > .score-cel')
                            .forEach(cel => {
                                const diff = cel.querySelector('span').innerText;
                                const imgs = cel.querySelectorAll('img');
                                // level
                                row[diff + ' 難易度'] = this.levels[csv.style].get(`${title}\t${diff}`) || 0;
                                // clear type
                                row[diff + ' クリアタイプ'] = LAMP[imgs[0].src.match(new RegExp(`/game/2dx/${this.version}/images/score_icon/clflg([0-7])\.gif`))[1]];
                                // rank
                                row[diff + ' DJ LEVEL'] = imgs[1].src.match(new RegExp(`/game/2dx/${this.version}/images/score_icon/([-A-F]{1,3})\.gif`))[1];
                                Array.from(cel.children).forEach(e => e.remove());
                                row[diff + ' ミスカウント'] = '---';
                                const [_, score, pgreat, great] = cel.innerText.match(/(\d+)\((\d+)\/(\d+)\)/);
                                row[diff + ' PGreat'] = pgreat;
                                row[diff + ' Great'] = great;
                                row[diff + ' スコア'] = score;
                            });

                        csv.insertObject(row);
                    });
            }
        },

        async _parseLevels(style) {
            const url = `https://p.eagate.573.jp/game/2dx/${this.version}/djdata/music/difficulty.html`;
            const html = await util.readDOM(url);
            const levels = Array.from(html.querySelector('select[name=difficult]').children)
                  .map(option => [option.value, parseInt(option.innerText.match(/LEVEL (\d{1,2})/)[1])])
                  .sort((a, b) => a[0] - b[0]);

            for (const [value, level] of levels) {
                let offset = 0;
                while (true) {
                    const doc = await util.readDOM(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `difficult=${value}&style=${style}&disp=1&offset=${offset}`,
                    });

                    let tbody = doc.querySelector('div.series-difficulty > table > tbody');
                    if (!tbody)
                        break;
                    tbody
                        .querySelectorAll('tr')
                        .forEach(tr => {
                            const fields = tr.querySelectorAll('td');
                            if (fields.length < 2)
                                return;
                            const title = fields[0].querySelector('.music_info').innerText;
                            const diff = fields[1].innerText;
                            this.levels[style].set(`${title}\t${diff}`, level);
                        });
                    offset += 50;
                }
            }
        },

        async _newUserCSV(style) {
            const url = `https://p.eagate.573.jp/game/2dx/${this.version}/djdata/status.html`;
            const html = await util.readDOM(url);
            
            let csv = new CSV(HEADER, style);

            html
                .querySelector('.dj-profile > table > tbody')
                .querySelectorAll('tr')
                .forEach(tr => {
                    const fields = tr.querySelectorAll('td');
                    if (fields[0].innerText.includes('DJ NAME'))
                        csv.djname = fields[1].innerText;
                    else if (fields[0].innerText.includes('IIDX ID'))
                        csv.iidxid = fields[1].innerText;
                });

            return csv;
        },

        async _newRivalCSV(style, iidxid) {
            const url = `https://p.eagate.573.jp/game/2dx/${this.version}/rival/rival_search.html`;
            const html = await util.readDOM(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `iidxid=${iidxid}&mode=1`,
            });
            const row = Array.from(html.querySelectorAll('table#result > tbody > tr')).pop();
            const fields = row.querySelectorAll('td');
            const djname = fields[0].querySelector('a').innerText;
            // url encoded string
            const rivalCode = fields[0].querySelector('a').href.match(/rival_status.html\?rival=([^&]*)/)[1];
            const rivalId = fields[1].innerText;

            let csv = new CSV(HEADER, style, rivalId, djname);
            csv.rivalCode = rivalCode;
            return csv;
        },

        renderUI() {
            this.domUI = document.createElement('div');
            this.domUI.style = `
position: fixed;
right: 10px;
top: 10px;
z-index: 10000;
width: 10rem;
height: 15rem;
background-color: #252830;
`;
            this.domUI.innerHTML = `
<style>
</style>
<h3 class="title">CSV Generator</h3>
<input type="text" id="rival_id" name="rival_id" placeholder="Rival ID">
<div style="display: flex">
  <button id="parse_sp" type="button" class="submit_btn">SP</button>
  <button id="parse_dp" type="button" class="submit_btn">DP</button>
</div>
`;
            document.body.appendChild(this.domUI);
            const onclick = style => {
                const rival = document.getElementById('rival_id').value;
                if (rival)
                    await this.parseRivalData(style, rival.replace(/[\D]/g, ''));
                else
                    await this.parseUserData(style);
                let a = document.createElement('a');
                a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(this.csv.toString())}`;
                a.download = csv.getFilename();
                a.style = 'position: absolute; left: -10000px; top: -10000px;';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            document.getElementById('parse_sp').addEventListener('click', () => onclick(PLAYSTYLE.SP));
            document.getElementById('parse_dp').addEventListener('click', () => onclick(PLAYSTYLE.DP));
        },
    };

    let generator = new IIDXCSVGenerator();
    generator.renderUI();
})();
