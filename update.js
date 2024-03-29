/**
 * Contact: @naynn_n
 */

(() => {
    if (typeof __csv_generator !== 'undefined')
        return;

    const LAST_UPDATED = '2021-02-05';

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

        getFilename() {
            return `${this.iidxid}_${['sp', 'dp'][this.style]}_score.csv`;
        },

        // follows csv format from e-amusement system
        // may differs from the standard rule (RFC 4180)
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
        async readPage(url, data={}) {
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
        this.version = 29;
        this.domUI = undefined;
        // ('title\tdifficulty', level)
        this.levels = [new Map(), new Map()]; // [SP, DP]
        this.csv = undefined;
        this.stop = true;
    };
    IIDXCSVGenerator.prototype = {
        async parseData(style, iidxid) {
            this.csv = await this.newCSV(style, iidxid);
            this.log('DJ NAME:', this.csv.djname);
            this.log('PLAY STYLE:', ['SP', 'DP'][style]);
            await this._parseLevels(style, this.csv.rivalCode);
            await this._parseSeries(this.csv);
        },

        async _parseSeries(csv) {
            const url = csv.rivalCode
                  ? `https://p.eagate.573.jp/game/2dx/${this.version}/djdata/music/series_rival.html`
                  : `https://p.eagate.573.jp/game/2dx/${this.version}/djdata/music/series.html`;

            const html = await util.readDOM(url);
            const versionList = Array.from(html.querySelector('select[name=list]').children)
                  .map(option => [option.value, option.innerText])
                  .sort((a, b) => a[0] - b[0]);

            for (const [i, [value, versionName]] of versionList.entries()) {
                if (this.stop)
                    throw 'stop';
                this.log(`parse version ${versionName} (${i + 1}/${versionList.length})`);
                const doc = await util.readDOM(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `list=${value}&play_style=${csv.style}&s=1&rival=${csv.rivalCode || ''}`,
                });

                doc
                    .querySelector('div.series-all > table > tbody')
                    .querySelectorAll('tr > td')
                    .forEach(td => {
                        if (td.children.length === 0)
                            return;
                        const title = td.querySelector('.music_info').innerText;
                        let row = {
                            'バージョン': versionName,
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

        async _parseLevels(style, rivalCode) {
            const url = rivalCode
                  ? `https://p.eagate.573.jp/game/2dx/${this.version}/djdata/music/difficulty_rival.html`
                  : `https://p.eagate.573.jp/game/2dx/${this.version}/djdata/music/difficulty.html`;
            const html = await util.readDOM(url);
            const levels = Array.from(html.querySelector('select[name=difficult]').children)
                  .map(option => [option.value, parseInt(option.innerText.match(/LEVEL (\d{1,2})/)[1])])
                  .sort((a, b) => a[0] - b[0]);

            for (const [i, [value, level]] of levels.entries()) {
                let offset = 0;
                this.log(`parse level ${level} (${i + 1}/${levels.length})`);
                while (true) {
                    if (this.stop)
                        throw 'stop';
                    const doc = await util.readDOM(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `difficult=${value}&style=${style}&disp=1&rival=${rivalCode || ''}&offset=${offset}`,
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

        async newCSV(style, iidxid) {
            if (iidxid)
                return await this._newRivalCSV(style, iidxid);
            return await this._newUserCSV(style);
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
            const id = iidxid.replace(/[\D]/g, '');
            const html = await util.readDOM(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `iidxid=${id}&mode=1`,
            });
            const row = Array.from(html.querySelectorAll('table#result > tbody > tr')).pop();
            if (!row)
                throw new Error('could not find user ' + iidxid);
            const fields = row.querySelectorAll('td');
            const djname = fields[0].querySelector('a').innerText;
            // url encoded string
            const rivalCode = fields[0].querySelector('a').href.match(/rival_status.html\?rival=([^&]*)/)[1];
            const rivalId = fields[1].innerText;

            let csv = new CSV(HEADER, style, rivalId, djname);
            csv.rivalCode = rivalCode;
            return csv;
        },

        log(...data) {
            console.log(...data);
            let pre = document.createElement('pre');
            pre.className = 'csv_pre log';
            pre.innerText = data.join(' ');
            let log = document.getElementById('csv_log');
            log.appendChild(pre);
            log.scrollTop = log.scrollHeight;
        },

        error(e) {
            let pre = document.createElement('pre');
            pre.className = 'csv_pre error';
            pre.innerText = e.toString();
            let log = document.getElementById('csv_log');
            log.appendChild(pre);
            log.scrollTop = log.scrollHeight;
        },
        
        renderUI() {
            this.domUI = document.createElement('div');
            this.domUI.style = `
position: fixed;
left: 0;
top: 0;
z-index: 10000;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.5);
`;
            this.domUI.innerHTML = `
<style>
.csv_container {
  position: relative;
  left: 50%;
  top: 50%;
  margin-left: -150px;
  margin-top: -200px;
  width: 300px;
  height: 400px;
  padding: 10px;
  background-color: #252830;
}
.csv_form {
  all: initial;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.csv_form * {
  flex: none;
  font-family: "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 14px;
  display: block;
  color: #fff;
  margin: 5px 0;
}
.csv_form *:after {
  all: initial;
}
.csv_title {
  display: flex;
  justify-content: space-between;
  margin: 0;
  margin-bottom: 5px;
}
.csv_title h3 {
  margin: 0;
  font-size: 18px;
}
.csv_exit {
  margin: 0;
  width: 20px;
  height: 20px;
  background-color: transparent;
  cursor: pointer;
}
.csv_exit:before, .csv_exit:after {
  position: absolute;
  right: 10px;
  width: 21px;
  height: 2px;
  border-radius: 1px;
  content: ' ';
  background-color: #ff8888;
  cursor: pointer;
}
.csv_exit:before {
  transform: rotate(45deg);
}
.csv_exit:after {
  transform: rotate(-45deg);
}
.csv_form a {
  display: inline-block;
  color: #1997c6;
  text-decoration: none;
}
.csv_form a:hover {
  text-decoration: underline;
}
.csv_textinput {
  min-height: 30px;
  border: 1px solid #000;
  padding: 5px;
  color: #000;
}
.csv_buttons {
  display: flex;
  width: 100%;
  margin: 5px 0;
}
.csv_button {
  flex: auto;
  margin: 0 5px;
  width: 100%;
  height: 30px;
  color: #fff;
  background: #434343;
  background: -moz-linear-gradient(top, #434343 0%, #060606 100%);
  background: -webkit-linear-gradient(top, #434343 0%,#060606 100%);
  background: linear-gradient(to bottom, #434343 0%,#060606 100%);
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  border-radius: 10px;
}
.csv_log {
  margin: 0;
  padding: 5px;
  flex: auto;
  width: 100%;
  overflow: scroll;
}
.csv_pre {
  margin: 0;
  font-family: Consolas,Menlo,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New,monospace,sans-serif;
  font-size: .8rem;
  line-height: 1.4;
  color: #bbbbbb;
}
.csv_pre.warn {
  color: #eeee88;
}
.csv_pre.error {
  color: #ff8888;
}
</style>
<div class="csv_container">
<form class="csv_form">
<div class="csv_title"><h3>CSV Generator</h3><button class="csv_exit" id="csv_exit" type="button"></button></div>
<div>Last updated on ${LAST_UPDATED}</div>
<div>Contact: @naynn_n</div>
<input type="text" class="csv_textinput" id="csv_rival_id" name="rival_id" placeholder="Rival ID">
<div class="csv_buttons">
  <button class="csv_button" id="csv_parse_sp" type="button">SP</button>
  <button class="csv_button" id="csv_parse_dp" type="button">DP</button>
</div>
<div class="csv_buttons">
<button class="csv_button" id="csv_stop" type="button">STOP</button>
</div>
<div id="csv_log" class="csv_log">
</div>
</form>
</div>
`;
            document.body.appendChild(this.domUI);
            const thisScript = document.currentScript || Array.from(document.getElementsByTagName('script')).pop();
            const onclick = async style => {
                try {
                    if (!this.stop) {
                        this.error('already running');
                        return;
                    }
                    this.stop = false;
                    const rival = document.getElementById('csv_rival_id').value;
                    await this.parseData(style, rival);
                    this.log('download');
                    let a = document.createElement('a');
                    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(this.csv.toString())}`;
                    a.download = this.csv.getFilename();
                    a.style = 'position: absolute; left: -10000px; top: -10000px;';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    this.stop = true;
                } catch(e) {
                    this.error(e);
                    this.stop = true;
                    throw e;
                }
            };
            const exit = () => {
                this.stop = true;
                this.domUI.remove();
                delete __csv_generator;
                if (thisScript)
                    thisScript.remove();
            };
            document.getElementById('csv_parse_sp').addEventListener('click', () => onclick(PLAYSTYLE.SP).then());
            document.getElementById('csv_parse_dp').addEventListener('click', () => onclick(PLAYSTYLE.DP).then());
            document.getElementById('csv_stop').addEventListener('click', () => this.stop = true);
            document.getElementById('csv_exit').addEventListener('click', exit);
            //this.domUI.addEventListener('click', e => { if (e.target === e.currentTarget) exit() });
        },
    };

    __csv_generator = new IIDXCSVGenerator();
    __csv_generator.renderUI();
})();
