import * as util from '../util.js';

const LAMPS = ['NO-PLAY', 'FAILED', 'ASSIST', 'EASY', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'];
const RANKS = ['F', 'F', 'E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];

export function DiffTable() {
    this.name = undefined;
    this.display = undefined;
    this.fields = {
        title: {
            display: 'Title',
            visible: true,
            updateDisplay(song) { song.domObj.querySelector('.title').style.display = this.visible ? '' : 'none' },
            compare: (a, b) => a.title.localeCompare(b.title),
        },
        lamp: {
            display: 'Clear Lamp',
            visible: true,
            updateDisplay(song) { song.domObj.querySelector('.lamp').style.display = this.visible ? '' : 'none' },
            compare: (a, b) => LAMPS.indexOf(a.playerData.lamp) - LAMPS.indexOf(b.playerData.lamp),
        },
        rank: {
            display: 'Rank',
            visible: false,
            updateDisplay(song) { song.domObj.querySelectorAll('.rank')[0].style.display = this.visible ? '' : 'none' },
            compare: (a, b) => RANKS.indexOf(a.playerData.rank) - RANKS.indexOf(b.playerData.rank),
        },
        percentage: {
            display: 'Percentage',
            visible: false,
            updateDisplay(song) { song.domObj.querySelectorAll('.rank')[1].style.display = this.visible ? '' : 'none' },
            compare: (a, b) => a.playerData.percentage - b.playerData.percentage,
        },
    };
    this.sortBy = ['+title', '-lamp'];
    this.group = 'level';
    this.prefix = '☆';
    this.groups = [];
    this.dataSources = {
        lr2songdb: {
            display: 'LR2 song.db',
            instance: async () => await import('../data/lr2_song_db.js').then(m => new m.LR2SongDB()),
        },
    };
    this.data = undefined;
    this.options = {
        level: {
            display: 'Level',
            value: 12,
            render() {
                let select = document.createElement('select');
                select.innerHTML = [...Array(12).keys()]
                    .reverse()
                    .map(i => `<option value="${i + 1}">☆${i + 1}</option>`)
                    .join('');
                select.querySelector(`[value="${this.value}"]`).selected = true;
                select.addEventListener('change', () => this.value = select.value);
                return select;
            },
        },
    };
}

DiffTable.prototype = {
    sort() {
        this.groups.forEach(group => group.songs.forEach(song => song.domObj.style.order = ''));

        const comparators = this.sortBy.map(c => [this.fields[c.substring(1)].compare, parseInt(c.charAt(0) + '1')]);
        this.groups.forEach(group => {
            group.songs.sort((a, b) => comparators.reduce((total, [c, asc]) => asc * c(a, b) || total));
            group.songs.forEach((song, i) => song.domObj.style.order = i);
        });
    },

    async parse() {
        this.data.parse();
    },

    updateDisplay() {
        this.groups.forEach(group => group.songs.forEach(song => Object.values(this.fields).forEach(field => {
            if (field.visible !== undefined && field.updateDisplay)
                field.updateDisplay(song);
        })));
    },

    _renderFields(container) {
        Object.entries(this.fields).forEach(([key, field]) => {
            
        });
    },

    async _renderDataSource(container) {
        let dataSource = document.createElement('div');
        dataSource.className = 'option';
        dataSource.innerHTML = '<div>Player Data Source</div>';

        let select = document.createElement('select');
        select.innerHTML = Object.entries(this.dataSources)
            .map(([key, src]) => `<option value="${key}">${src.display}</option>`)
            .join('');
        dataSource.appendChild(select);
        container.appendChild(dataSource);

        let dataOptions = document.createElement('div');
        container.appendChild(dataOptions);

        const onchange = async () => {
            dataOptions.innerHTML = '';
            let instance = this.dataSources[select.value].instance;
            if(typeof instance === 'function')
                instance = this.dataSources[select.value].instance = await instance();
            this.data = instance;
            this.data.renderOptions(dataOptions);
        }
        select.addEventListener('change', onchange);
        await onchange();
    },

    async renderOptions(container) {
        container.innerHTML = '';
        Object.values(this.options).forEach(option => {
            let div = document.createElement('div');
            div.className = 'option';
            if (option.display)
                div.innerHTML += `<div>${option.display}</div>`;
            div.appendChild(option.render());
            container.appendChild(div);
        });

        await this._renderDataSource(container);
        this._renderFields(container);
    },

    async renderTable(container) {
        container.innerHTML = '';

        if (this.player.username !== undefined)
            container.innerHTML += `<h3 style="margin-top: 0">${this.player.username}</h3>`;

        if (this.player.userId === undefined) {
            this.fields.rank.visible = false;
            this.fields.percentage.visible = false;
        }

        this.groups.forEach(group => {
            let songs = [];
            let levelLamp = 'NO-PLAY';
            let avgPercentage = 0;
            let dataCount = 0;
            group.songs.forEach(song => {
                if (song.playerData && (song.playerData.lamp !== 'NO-PLAY' || RANKS.indexOf(song.playerData.rank) > -1))
                    ++dataCount;
                else
                    song.playerData = {lamp: 'NO-PLAY', rank: '', percentage: 0};
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
            });
            avgPercentage /= dataCount;
            const avgRank = RANKS[Math.trunc(avgPercentage / 100 * 9)];

            const divGroup = document.createElement('div');
            divGroup.className = 'group';
            divGroup.innerHTML = `
<div class="level">
  <span>
    ${this.prefix}${group.name}
  </span>
  <span class="right">
    <span class="lamp ${levelLamp}"></span>
  </span>
</div>
<div class="songs"></div>
`;
            divGroup.querySelector('.songs').append(...songs);
            container.appendChild(divGroup);
            group.songs.forEach(song => {
                const title = song.domObj.querySelector('.title');
                const divWidth = song.domObj.offsetWidth - (song.domObj.querySelector('.right').offsetWidth || 0) - 3;
                if (title.offsetWidth > divWidth) {
                    let widthScale = Math.max(divWidth / title.offsetWidth, 0.6);
                    title.style.transform = `scaleX(${widthScale})`;
                }
            });
        });

        this.updateDisplay();
        this.sort();
    },
}
