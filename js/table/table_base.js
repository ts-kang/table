import * as util from '../util.js';
import { CSVData } from '../data_source/data_csv.js';

const LAMPS = ['NO-PLAY', 'FAILED', 'ASSIST', 'EASY', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'];
const RANKS = ['F', 'F', 'E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];

function DiffTable(userId) {
    this.name = undefined;
    this.displayName = undefined;
    this.showData = {
        title: {
            displayName: 'Title',
            update: (song, show) => song.domObj.querySelector('.title').style.display = show ? '' : 'none',
        },
        lamp: {
            displayName: 'Clear Lamp',
            update: (song, show) => song.domObj.querySelector('.lamp').style.display = show ? '' : 'none',
        },
        rank: {
            displayName: 'Rank',
            update: (song, show) => song.domObj.querySelectorAll('.rank')[0].style.display = show ? '' : 'none',
        },
        percentage: {
            displayName: 'Percentage',
            update: (song, show) => song.domObj.querySelectorAll('.rank')[1].style.display = show ? '' : 'none',
        },
    };
    this.show = {
        title: true,
        lamp: true,
        rank: false,
        percentage: false,
    };
    this.criteria = {
        title: (song, record) => ''.localeCompare(song.title),
        lamp: (song, record) => LAMPS.indexOf(record.lamp),
        rank: (song, record) => RANKS.indexOf(record.rank),
        percentage: (song, record) => record.percentage,
    };
    this.order = ['+title', '-lamp'];
    this.group = 'level';
    this.prefix = '☆';
    this.player = {
        userId: userId,
        username: undefined,
        // ('title' or 'title\tdifficulty', {rank, percentage, lamp})
        data: new Map(),
    };
    this.dataSources = [new CSVData()];
}

DiffTable.prototype = {
    sort: async function() {
        this.groups.forEach(group => group.songs.forEach(song => song.domObj.style.order = ''));
        this.order.forEach(criterion => this.sortBy(criterion));
    },

    sortBy: async function(criterion) {
        this.groups.forEach(group => {
            const orders = group.songs.map(song => song.domObj.style.order || 0);
            const max = Math.max(...orders);
            const min = Math.min(...orders);
            group.songs.forEach(song => {
                song.domObj.style.order = (song.domObj.style.order || 0)
                    + parseInt(criterion.charAt(0) + '1') * (max - min + 1) * this.criteria[criterion.substring(1)](song, this.player.data.get(song.key));
            });
        });
    },

    // json parser for bms
    parse: async function() {
        throw new Error('not implemented');
    },

    updateDisplay: async function() {
        this.groups.forEach(group => group.songs.forEach(song =>
            Object.entries(this.show).forEach(([k, v]) => this.showData[k](song, v))));
    },

    render: async function(container) {
        this.groups.forEach(group => {
            let songs, levelLamp, avgPercentage, recordCount;
            group.songs.forEach(song => {
                let record = player.data.get(song.key);
                if (record && (record.lamp !== 'NO-PLAY' || RANKS.indexOf(record.rank) > -1))
                    ++recordCount;
                else
                    record = {lamp: 'NO-PLAY', rank: '', percentage: 0};
                let divSong = document.createElement('div');
                divSong.className = 'song';
                if (this.show.title)
                    divSong.innerHTML += `<span class="title">${song.title}</span>`;
                let right = document.createElement('div');
                right.className = 'right';
                if (this.show.rank)
                    right.innerHTML += `<span class="rank ${record.rank.toLowerCase()}">${record.rank}</span>`;
                if (this.show.percentage)
                    right.innerHTML += `<span class="rank ${record.rank.toLowerCase()}" style="transform: scaleX(0.9)">${parseInt(record.percentage)}%</span>`;
                if (this.show.lamp)
                    right.innerHTML += `<span class="lamp ${record.lamp.toLowerCase()}"></span>`;
                song.domObj = divSong;
                songs.push(divSong);
                if (LAMPS.indexOf(record.lamp) < LAMPS.indexOf(levelLamp))
                    levelLamp = record.lamp;
                avgPercentage += record.percentage;
            }, ['', LAMPS[LAMPS.length - 1], 0]);
            avgPercentage /= recordCount;
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

        this.order();
    },
}
