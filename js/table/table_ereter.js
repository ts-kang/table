import { DiffTable } from './table_base.js';
import * as util from '../util.js'

const TYPE = { IIDX: 0, BMS: 1 };

function TableEreter(type) {
    DiffTable.call(this);
    this.type = type;
    this.dataSources.ereter = {
        display: 'ereter.net',
        instance: async () => await import('../data_source/data_ereter.js').then(m => new m.DataEreter(this.type, this.options)),
    };
    this.cite = 'from <span style="color: #ce8ef9"><span style="color: #91e1ff">ereter</span>\'s dp laboratory</span> & difficulty table from ' + (this.type === TYPE.IIDX ? 'SNJ@KMZS beatmaniaIIDX DP非公式難易度表' : 'δ難易度表 - 発狂難易度表');
    this.prefix = this.type === TYPE.BMS ? '★' : '☆';
    this.fields.ereterEst = {
        display: 'Ereter Difficulty',
        compare: (a, b) => a.ereterEst[0] - b.ereterEst[0],
    };
    this.fields.ereterColor = {
        display: 'Difficulty Color',
        visible: true,
        updateDisplay(group) {
            group.songs.forEach(song => song.domObj.style.backgroundColor = this.visible ? `rgba(${song.ereterColor[0].join(', ')}, 0.3)` : '');
        },
    };
    this.sortBy = ['+title', '-ereterEst', '-lamp'];
}

TableEreter.prototype = Object.create(DiffTable.prototype);
TableEreter.prototype.constructor = TableEreter;

TableEreter.prototype.parse = async function() {
    this.groups = [];
    
    const url = this.type === TYPE.IIDX
          ? (this.data.options.userId
             ? `http://ereter.net/iidxplayerdata/${this.data.options.userId.value}/analytics/perlevel/`
             : `http://ereter.net/iidxsongs/analytics/perlevel/`)
          : (this.data.options.userId
             ? `http://ereter.net/bmsplayerdata/${this.data.options.userId.value}/dpbms/analytics/perlevel/`
             : `http://ereter.net/bmssongs/dpbms/analytics/perlevel/`);
    const html = new DOMParser().parseFromString(await util.readPage(url).then(res => res.text()), 'text/html');

    if (this.data.options.userId) {
        const user = html.querySelector('.content > h3');
        this.data.player.userId = this.data.options.userId.value;
        this.data.player.username = user.innerText.replace(/ - .*$/, '');
        this.data.player.clearAbility = user.querySelector('span').innerText.substring(1);
        this.data.player.clearAbility_color = user.querySelector('span').style.color;
    }

    const tableAnalytics = Array.from(html.querySelectorAll('[data-sort^=table]')).pop();

    tableAnalytics.querySelectorAll('tbody:not(.tablesorter-no-sort)').forEach(tbody => {
        var level;
        const songs = Array.from(tbody.querySelectorAll('tr')).map((row, i) => {
            const fields = row.querySelectorAll('td');
            if (!level)
                level = fields[0].innerText.substring(1);
            const offset = this.data.player.userId ? 1 : 0;
            // [EASY, HARD, EX-HARD] for IIDX, [EASY, HARD] for BMS
            const estIndices = this.type === TYPE.IIDX ? [2, 4, 6] : [3, 5];
            var ret = {
                ereterID: parseInt(fields[1].querySelector('a').href.match(/ranking\/([\d]+)\//)[1]),
                ereterEst: estIndices.map(i => parseFloat(fields[i + offset].querySelector('span').innerText.substring(1))),
                ereterColor: estIndices.map(i => fields[i + offset].querySelector('span').style.color.match(/\b[\d]+\b/g)
                                            .map(c => parseInt(c))),
            };
            if (this.type === TYPE.IIDX) {
                ret.title = fields[1].innerText.replace(/ \([A-Z]+\)$/, '');
                ret.difficulty = fields[1].innerText.match(/ \(([A-Z]+)\)$/)[1];
                // ereter analytics page is available only for level 12 currently
                ret.officialLevel = 12;
            } else {
                ret.title = fields[1].innerText;
            }
            return ret;
        });
        if (!level)
            return;
        this.groups.push({
            name: level,
            songs: songs,
        });
    });

    this.groups.reverse();

    await this.data.parse();
    await this.data.apply(this);
};

TableEreter.prototype.renderTable = async function(container) {
    await DiffTable.prototype.renderTable.call(this, container);
    const h3 = Array.from(container.querySelectorAll('h3')).pop();
    if (h3 && this.data.player.clearAbility)
        h3.innerHTML += ` - <span style="color: ${this.data.player.clearAbility_color}">★${this.data.player.clearAbility}</span>`;

    container.querySelectorAll('.label').forEach((label, i) => {
        const rgb = this.groups[i].songs
              .reduce((t, song) => song.ereterColor[0].map((c, j) => t[j] + parseFloat(c)), [0.0, 0.0, 0.0])
              .map(c => parseInt(c / this.groups[i].songs.length));
        label.querySelector('span').style.color = `rgba(${rgb.join(', ')})`;
    });
};

export function TableEreterIIDX() {
    TableEreter.call(this, TYPE.IIDX);
    this.display = 'IIDX DP Lv.12 Normal Clear';
    this.dataSources.csv = {
        display: 'CSV',
        instance: async () => await import('../data_source/data_csv.js').then(m => new m.DataCSV()),
    };
    this.options.level = {
        display: 'Level',
        value: 12,
        render() {
            let select = document.createElement('select');
            select.innerHTML = `<option value="12">☆12</option>`;
            select.querySelector(`[value="${this.value}"]`).selected = true;
            select.addEventListener('change', () => this.value = select.value);
            return select;
        },
    };
}

TableEreterIIDX.prototype = Object.create(TableEreter.prototype);
TableEreterIIDX.prototype.constructor = TableEreterIIDX;

export function TableEreterBMSInsane() {
    TableEreter.call(this, TYPE.BMS);
    this.display = 'DP Insane BMS';
}

TableEreterBMSInsane.prototype = Object.create(TableEreter.prototype);
TableEreterBMSInsane.prototype.constructor = TableEreterBMSInsane;
