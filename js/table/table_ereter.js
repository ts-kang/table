import { DiffTable } from './table_base.js';
import * as util from '../util.js'

const TYPE = { IIDX: 0, BMS: 1 };

function EreterIIDXTable(userId) {
    EreterTable.call(this, userId, TYPE.IIDX);
}

EreterIIDXTable.prototype = Object.create(EreterTable.prototype);
EreterIIDXTable.prototype.constructor = EreterIIDXTable;

EreterIIDXTable.prototype.

function EreterBMSInsaneTable(userId) {
    EreterTable.call(this, userId, TYPE.BMS);
}

EreterBMSInsaneTable.prototype = Object.create(EreterTable.prototype);
EreterBMSInsaneTable.prototype.constructor = EreterBMSInsaneTable;

function EreterTable(userId, type) {
    DiffTable.call(this, userId);
    this.type = type;
    this.prefix = this.type === TYPE.BMS ? '★' : '☆';
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
                ereterEst: (iidx ? [3, 5, 7] : [4, 6])
                    .map(i => parseFloat(fields[i].querySelector('span').innerText.substring(1))),
                ereterColor: (iidx ? [3, 5, 7] : [4, 6])
                    .map(i => fields[i].querySelector('span').style.color.match(/\b[\d]+\b/g)
                         .map(c => parseInt(c))),
            };
            if (iidx) {
                ret.title = fields[1].innerText.replace(/ \([A-Z]+\)$/, '');
                ret.difficulty = fields[1].innerText.match(/ \(([A-Z]+)\)$/)[1];
                // ereter analytics page is available only for level 12 currently
                ret.officialLevel = 12;
            } else {
                ret.title = fields[1].innerText;
            }
            diffTable.indices.set(ret.title + '\t' + ret.difficulty, [diffTable.levels.length, i]);
            return ret;
        });
        if (!level)
            return;
        diffTable.levels.push({
            level: level,
            songs: songs,
        });
    });

    return diffTable;
}

