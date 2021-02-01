import * as util from '../util.js';

const LAMPS = ['NO-PLAY', 'FAILED', 'ASSIST', 'EASY', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'];
const RANKS = ['F', 'F', 'E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];

export function DiffTable() {
    this.display = undefined;
    this.cite = undefined;
    this.fields = {
        title: {
            display: 'Title',
            visible: true,
            updateDisplay(group) {
                group.songs.forEach(song => song.domObj.querySelector('.title').style.display = this.visible ? '' : 'none');
            },
            compare: (a, b) => a.title.localeCompare(b.title),
        },
        lamp: {
            display: 'Clear Lamp',
            visible: true,
            updateDisplay(group) {
                group.songs[0].domObj.parentElement.parentElement.querySelector('.label > .right > .lamp').style.display = this.visible ? '' : 'none';
                group.songs.forEach(song => song.domObj.querySelector('.lamp').style.display = this.visible ? '' : 'none');
            },
            compare: (a, b) => LAMPS.indexOf(a.playerData.lamp) - LAMPS.indexOf(b.playerData.lamp),
        },
        rank: {
            display: 'Rank',
            visible: false,
            updateDisplay(group) {
                group.songs.forEach(song => song.domObj.querySelectorAll('.rank')[0].style.display = this.visible ? '' : 'none');
            },
            compare: (a, b) => RANKS.indexOf(a.playerData.rank) - RANKS.indexOf(b.playerData.rank),
        },
        percentage: {
            display: 'Percentage',
            visible: false,
            updateDisplay(group) {
                group.songs.forEach(song => song.domObj.querySelectorAll('.rank')[1].style.display = this.visible ? '' : 'none');
            },
            compare: (a, b) => a.playerData.percentage - b.playerData.percentage,
        },
    };
    this.sortBy = ['+title', '-lamp'];
    this.group = 'level';
    this.prefix = '☆';
    this.groups = [];
    this.dataSources = {
        none: {
            display: 'None',
            instance: async () => await import('../data_source/data_base.js').then(m => new m.DataSource()),
        },
    };
    this.data = undefined;
    this.options = {};
}

DiffTable.prototype = {
    sort() {
        this.groups.forEach(group => group.songs.forEach(song => song.domObj.style.order = ''));

        const comparators = this.sortBy.map(c => [this.fields[c.substring(1)].compare, parseInt(c.charAt(0) + '1')]);
        this.groups.forEach(group => {
            group.songs.sort((a, b) => comparators.reduce((total, [c, asc]) => asc * c(a, b) || total, 0));
            group.songs.forEach((song, i) => song.domObj.style.order = i);
        });
    },

    async parse() {},

    updateDisplay(field) {
        if (field.visible === undefined || !field.updateDisplay)
            return;

        this.groups.forEach(group => {
            field.updateDisplay(group);
            group.songs.forEach(song => {
                const title = song.domObj.querySelector('.title');
                const divWidth = song.domObj.offsetWidth - (song.domObj.querySelector('.right').offsetWidth || 0) - 9;
                if (title.offsetWidth > divWidth) {
                    let widthScale = Math.max(divWidth / title.offsetWidth, 0.6);
                    title.style.transform = `scaleX(${widthScale})`;
                }
            });
        });
    },

    updateDisplayAll() {
        this.groups.forEach(group => {
            Object.values(this.fields).forEach(field => {
                if (field.visible !== undefined && field.updateDisplay)
                    field.updateDisplay(group);
            });
            group.songs.forEach(song => {
                const title = song.domObj.querySelector('.title');
                const divWidth = song.domObj.offsetWidth - (song.domObj.querySelector('.right').offsetWidth || 0) - 9;
                if (title.offsetWidth > divWidth) {
                    let widthScale = Math.max(divWidth / title.offsetWidth, 0.6);
                    title.style.transform = `scaleX(${widthScale})`;
                }
            });
        });
    },

    _renderFields(container) {
        let divSort = document.createElement('div');
        divSort.style.display = 'flex';
        divSort.style.flexDirection = 'column';

        const addCriterion = (last, criterion='+') => {
            let divCrit = document.createElement('div');
            divCrit.style.display = 'flex';
            const fieldKey = criterion.substring(1);
            const asc = parseInt(criterion.charAt(0) + '1');

            let select = document.createElement('select');
            select.innerHTML = Object.entries(this.fields)
                .filter(([key, field]) => field.compare)
                .map(([key, field]) => `<option value="${key}">${field.display}</option>`)
                .join('');
            let buttonAsc = document.createElement('button');
            buttonAsc.type = 'button';
            buttonAsc.className = asc > 0 ? 'icon-sortup' : 'icon-sortdown';
            let buttonRemove = document.createElement('button');
            buttonRemove.type = 'button';
            buttonRemove.className = 'icon-minus';
            let buttonAdd = document.createElement('button');
            buttonAdd.type = 'button';
            buttonAdd.className = 'icon-plus';
            divCrit.append(select, buttonAsc, buttonRemove, buttonAdd);
            if (last)
                last.after(divCrit);
            else
                divSort.appendChild(divCrit);
            if (fieldKey)
                select.querySelector(`[value="${fieldKey}"]`).selected = true;
            else
                this.sortBy.splice(Array.from(divSort.children).indexOf(divCrit), 0,
                                   criterion.charAt(0) + select.querySelector('option').value);
            const update = () => {
                this.sortBy.splice(Array.from(divSort.children).indexOf(divCrit), 1,
                                   (buttonAsc.className === 'icon-sortup' ? '+' : '-') + select.value);
                this.sort();
            };
            select.addEventListener('change', update);
            buttonAsc.addEventListener('click', () => {
                buttonAsc.className = buttonAsc.className === 'icon-sortup' ? 'icon-sortdown' : 'icon-sortup';
                update();
            });
            buttonRemove.addEventListener('click', () => {
                if (divSort.childElementCount > 1) {
                    this.sortBy.splice(Array.from(divSort.children).indexOf(divCrit), 1);
                    divCrit.remove();
                    this.sort();
                }
            });
            buttonAdd.addEventListener('click', () => {
                addCriterion(divCrit);
                this.sort();
            });
        };

        this.sortBy.forEach(criterion => addCriterion(null, criterion));

        let div = document.createElement('div');
        div.className = 'option';
        div.style.alignItems = 'flex-start';
        div.innerHTML = '<div style="padding: .375rem 0">Sort</div>';
        div.appendChild(divSort);
        container.appendChild(div);

        let divShow = document.createElement('div');
        divShow.className = 'menu';
        divShow.innerHTML = '<div class="name">Show</div>';
        divShow.append(
            ...Object.values(this.fields)
                .filter(field => field.updateDisplay && field.visible !== undefined)
                .map(field => {
                    let divItem = document.createElement('div');
                    divItem.className = 'item' + (field.visible ? ' enabled' : '');
                    divItem.innerText = field.display;
                    divItem.addEventListener('click', () => {
                        if (divItem.classList.contains('enabled')) {
                            divItem.classList.remove('enabled');
                            field.visible = false;
                        } else {
                            divItem.classList.add('enabled');
                            field.visible = true;
                        }
                        this.updateDisplay(field);
                    });
                    return divItem;
                })
        );

        container.appendChild(divShow);
    },

    async _renderDataSource(container) {
        let dataSource = document.createElement('div');
        dataSource.className = 'option';
        dataSource.innerHTML = '<div>Player Data Source</div>';

        let select = document.createElement('select');
        let arr = Object.entries(this.dataSources)
            .map(([key, src]) => `<option value="${key}">${src.display}</option>`);
        if (Object.keys(this.dataSources)[0] === 'none')
            arr.push(arr.shift());
        select.innerHTML = arr.join('');
        dataSource.appendChild(select);
        container.appendChild(dataSource);

        let dataOptions = document.createElement('div');
        container.appendChild(dataOptions);

        const onchange = async () => {
            dataSource.style.float = '';
            dataOptions.innerHTML = '';
            let instance = this.dataSources[select.value].instance;
            if(typeof instance === 'function')
                instance = this.dataSources[select.value].instance = await instance();
            this.data = instance;
            this.data.renderOptions(dataOptions);
            (dataOptions.lastElementChild || dataSource).style.float = 'left';
            let div = document.createElement('div');
            div.innerHTML =  `
<button type="submit" class="option" style="float: left">
  <span class="icon-search"></span>
</button>
<div style="clear: both"></div>`;
            dataOptions.appendChild(div);
        }
        select.addEventListener('change', onchange);
        await onchange();
    },

    async renderOptions(container) {
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
        if (this.display !== undefined)
            container.innerHTML += `<h3 style="font-size: 2.5rem; text-align: center; color: #ccccfd6; margin: 0; margin-bottom: 1rem;">${this.display}</h3>`;

        if (this.data.player.username !== undefined)
            container.innerHTML += `<h3 style="margin: 0; margin-bottom: -.5rem;">${this.data.player.username}</h3>`;

        this.groups.forEach(group => {
            let songs = [];
            let levelLamp = LAMPS[LAMPS.length - 1];
            let avgPercentage = 0;
            let dataCount = 0;
            group.songs.forEach(song => {
                if (!song.playerData)
                    song.playerData = {lamp: 'NO-PLAY', rank: '', percentage: 0};
                if (song.playerData.lamp !== 'NO-PLAY' || RANKS.indexOf(song.playerData.rank) > -1)
                    ++dataCount;
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
                if (song.difficulty)
                    divSong.querySelector('.title').classList.add(song.difficulty.toLowerCase());
                song.domObj = divSong;
                songs.push(divSong);
                if (LAMPS.indexOf(song.playerData.lamp) < LAMPS.indexOf(levelLamp))
                    levelLamp = song.playerData.lamp;
                avgPercentage += song.playerData.percentage;
            });
            avgPercentage /= dataCount;
            if (dataCount < 1)
                levelLamp = LAMPS[0];
            const avgRank = RANKS[Math.trunc(avgPercentage / 100 * 9)];

            const divGroup = document.createElement('div');
            divGroup.className = 'group';
            divGroup.innerHTML = `
<div class="label">
  <span>
    ${this.prefix}${group.name}
  </span>
  <span class="right">
    <span class="lamp ${levelLamp.toLowerCase()}"></span>
  </span>
</div>
<div class="songs"></div>
`;
            divGroup.querySelector('.songs').append(...songs);
            container.appendChild(divGroup);
        });

        let bottom = document.createElement('div');
        bottom.style = 'display: flex; justify-content: space-between; margin-bottom: 0;';

        if (this.cite) {
            let cite = document.createElement('div');
            cite.className = 'cite';
            cite.innerHTML = this.cite;
            bottom.appendChild(cite);
        }

        let info = document.createElement('div');
        info.className = 'cite';
        info.innerHTML = `generated from <span style="color: #999bcc">nyan.ch/table/</span> on ${new Date().toISOString().replace(/^([\d-]+)[\w][\d:.]+[\w]$/, '$1')}`;
        bottom.appendChild(info);

        container.appendChild(bottom);

        this.updateDisplayAll();
        this.sort();
    },
};
