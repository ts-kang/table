import { DiffTable } from './table_base.js';
import * as util from '../util.js'

const TYPE = { IIDX: 0, BMS: 1 };

function EreterTable(type) {
    DiffTable.call(this);
    this.type = type;
    this.prefix = this.type === TYPE.BMS ? '★' : '☆';
    this.fields.ereterEst = {
        display: 'Ereter Difficulty',
        order: song => song.playerData.percentage,
    };
    this.fields.ereterColor = {
        display: 'Difficulty Color',
        show: (song, visible) => song.domObj.style.backgroundColor = `rgba(${song.ereterColor[0].join(', ')}, 0.3)`,
    };
}

EreterTable.prototype = Object.create(DiffTable.prototype);
EreterTable.prototype.constructor = EreterTable;

EreterTable.prototype.renderTable = async function(container) {
    await DiffTable.prototype.renderTable.call(this, container);
    const h3 = container.querySelector('h3');
    if (h3)
        h3.innerHTML += ` - <span style="color: ${this.player.clearAbility_color}">★${this.player.clearAbility}</span>`;
}

EreterTable.prototype.parse = async function() {
    const url = this.type === TYPE.IIDX
          ? (this.player.userId
             ? `http://ereter.net/iidxplayerdata/${this.player.userId}/analytics/perlevel/`
             : `http://ereter.net/iidxsongs/analytics/perlevel/`)
          : (this.player.userId
             ? `http://ereter.net/bmsplayerdata/${this.player.userId}/dpbms/analytics/perlevel/`
             : `http://ereter.net/bmssongs/dpbms/analytics/perlevel/`);
    const html = new DOMParser().parseFromString(await util.readPage(url), 'text/html');

    this.from = '<span style="color: #ce8ef9"><span style="color: #91e1ff">ereter</span>\'s dp laboratory</span> & difficulty table from ' + this.type === TYPE.IIDX ? 'SNJ@KMZS beatmaniaIIDX DP非公式難易度表' : '';

    if (this.player.userId) {
        const user = html.querySelector('.content > h3');
        this.player.username = user.innerText.replace(/ - .*$/, '');
        this.player.clearAbility = user.querySelector('span').innerText.substring(1);
        this.player.clearAbility_color = user.querySelector('span').style.color;
    }

    const tables = html.querySelectorAll('[data-sort^=table]');
    const tableAnalytics = tables[tables.length - 1];

    tableAnalytics.querySelectorAll('tbody:not(.tablesorter-no-sort)').forEach(tbody => {
        var level;
        const songs = Array.from(tbody.querySelectorAll('tr')).map((row, i) => {
            const fields = row.querySelectorAll('td');
            if (!level)
                level = fields[0].innerText.substring(1);
            var ret = {
                ereterID: parseInt(fields[1].querySelector('a').href.match(/ranking\/([\d]+)\//)[1]),
                // [EASY, HARD, EX-HARD] for IIDX, [EASY, HARD] for BMS
                ereterEst: (this.type === TYPE.IIDX ? [3, 5, 7] : [4, 6])
                    .map(i => parseFloat(fields[i].querySelector('span').innerText.substring(1))),
                ereterColor: (this.type === TYPE.IIDX ? [3, 5, 7] : [4, 6])
                    .map(i => fields[i].querySelector('span').style.color.match(/\b[\d]+\b/g)
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
}

export function EreterIIDXTable() {
    EreterTable.call(this, TYPE.IIDX);
    delete this.dataSources.lr2songdb;
    let _super_render = this.options.level.render;
    this.options.level.render = () => {
        let select = _super_render.call(this.options.level);
        select.innerHTML = `<option value="12">☆12</option>`;
        return select;
    };
}

EreterIIDXTable.prototype = Object.create(EreterTable.prototype);
EreterIIDXTable.prototype.constructor = EreterIIDXTable;

export function EreterBMSInsaneTable() {
    EreterTable.call(this, TYPE.BMS);
    delete EreterTable.options.level;
}

EreterBMSInsaneTable.prototype = Object.create(EreterTable.prototype);
EreterBMSInsaneTable.prototype.constructor = EreterBMSInsaneTable;
