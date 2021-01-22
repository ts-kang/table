import * as util from '../util.js';
import { CSVData } from '../data_source/data_csv.js';

const LAMPS = ['NO-PLAY', 'FAILED', 'ASSIST', 'EASY', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'];
const RANKS = ['F', 'F', 'E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];

function DiffTable(userId) {
    this.name = undefined;
    this.display = undefined;
    this.fields = {
        title: {
            display: 'Title',
            show: (song, visible) => song.domObj.querySelector('.title').style.display = visible ? '' : 'none',
            order: (song, data) => ''.localeCompare(song.title),
        },
        lamp: {
            display: 'Clear Lamp',
            show: (song, visible) => song.domObj.querySelector('.lamp').style.display = visible ? '' : 'none',
            order: (song, data) => LAMPS.indexOf(data.lamp),
        },
        rank: {
            display: 'Rank',
            show: (song, visible) => song.domObj.querySelectorAll('.rank')[0].style.display = visible ? '' : 'none',
            order: (song, data) => RANKS.indexOf(data.rank),
        },
        percentage: {
            display: 'Percentage',
            show: (song, visible) => song.domObj.querySelectorAll('.rank')[1].style.display = visible ? '' : 'none',
            order: (song, data) => data.percentage,
        },
    };
    this.visible = {
        title: true,
        lamp: true,
        rank: false,
        percentage: false,
    };
    this.order = ['+title', '-lamp'];
    this.group = 'level';
    this.prefix = '☆';
    this.player = {
        userId: userId,
        username: undefined,
    };
    this.groups = [];
    this.dataSources = {
        lr2songdb: {
            display: 'LR2 song.db',
            newInstance: () => {
                import { LR2SongDB } from '../data/lr2_song_db.js';
                return new LR2SongDB();
            },
        },
    };
    this.options = {
        dataSource: {
            display: 'Player Data Source',
            value: Object.keys(this.dataSources)[0],
            render: function() {
                let select = document.createElement('select');
                Object.entries(this.dataSources)
                    .forEach(([key, dataSource]) => `<option value="${key}">☆${dataSource.display}</option>`);
                select.querySelector(`[value="${this.value}]"`).selected = true;
            }
        },
        level: {
            display: 'Level',
            value: 12,
            render: function() {
                let select = document.createElement('select');
                Array(12).reverse().forEach(i => select.innerHTML += `<option value="${i + 1}">☆${i + 1}</option>`);
                select.querySelector(`[value="${this.value}]"`).selected = true;
                select.addEventListener('change', () => this.value = select.value);
                return select;
            },
        },
    };
}

DiffTable.prototype = {
    sort: function() {
        this.groups.forEach(group => group.songs.forEach(song => song.domObj.style.order = ''));
        this.order.forEach(criterion => this.sortBy(criterion));
    },

    sortBy: function(criterion) {
        this.groups.forEach(group => {
            const orders = group.songs.map(song => song.domObj.style.order || 0);
            const max = Math.max(...orders);
            const min = Math.min(...orders);
            group.songs.forEach(song => {
                song.domObj.style.order = (song.domObj.style.order || 0)
                    + parseInt(criterion.charAt(0) + '1') * (max - min + 1) * this.fields[criterion.substring(1)].order(song);
            });
        });
    },

    // json parser for bms
    parse: async function() {
        throw new Error('not implemented');
    },

    updateVisibility: function() {
        this.groups.forEach(group => group.songs.forEach(song =>
            Object.entries(this.visible).forEach(([k, v]) => this.fields[k].show(song, v))));
    },

    renderOptions: function(container) {
        container.innerHTML = '';
        Object.values(this.options).forEach(option => {
            let div = document.createElement('div');
            div.className = 'option';
            div.innerHTML += `<div>${option.display}</div>`;
            div.appendChild(option.render());
            container.appendChild(div);
        });
    },

    renderTable: async function(container) {
        container.innerHTML = '';

        if (this.player.userId)
            container.innerHTML += `<h3 style="margin-top: 0">${user_info.username}</h3>`;

        this.groups.forEach(group => {
            let songs, levelLamp, avgPercentage, dataCount;
            group.songs.forEach(song => {
                if (song.playerData && (song.playerData.lamp !== 'NO-PLAY' || RANKS.indexOf(song.playerData.rank) > -1))
                    ++dataCount;
                //song.playerData = {lamp: 'NO-PLAY', rank: '', percentage: 0};
                let divSong = document.createElement('div');
                divSong.className = 'song';
                divSong.innerHTML += `
<span class="title">${song.title}</span>
<div class="right">
<span class="rank ${song.playerData.rank.toLowerCase()}">${song.playerData.rank}</span>
<span class="rank ${song.playerData.rank.toLowerCase()}" style="transform: scaleX(0.9)">${parseInt(song.playerData.percentage)}%</span>
<span class="lamp ${song.playerData.lamp.toLowerCase()}"></span>
</div>
`;
                song.domObj = divSong;
                songs.push(divSong);
                if (LAMPS.indexOf(song.playerData.lamp) < LAMPS.indexOf(levelLamp))
                    levelLamp = song.playerData.lamp;
                avgPercentage += song.playerData.percentage;
            }, ['', LAMPS[LAMPS.length - 1], 0]);
            avgPercentage /= dataCount;
            const avgRank = RANKS[Math.trunc(avgPercentage / 100 * 9)];

            const group = document.createElement('div');
            group.className = 'group';
            group.innerHTML = `
<div class="level">
  <span>
    ${table.prefix}${group.level}
  </span>
  <span class="right">
    <span class="lamp ${levelLamp}"></span>
  </span>
</div>
<div class="songs">
  ${songs}
</div>
`;
            container.appendChild(group);
            group.forEach(song => {
                const title = song.querySelector('.title');
                const divWidth = song.offsetWidth - (song.querySelector('.right').offsetWidth || 0) - 3;
                if (title.offsetWidth > divWidth) {
                    let widthScale = Math.max(divWidth / title.offsetWidth, 0.6);
                    title.style.transform = `scaleX(${widthScale})`;
                }
            });
        });

        this.sort();
    },
}
