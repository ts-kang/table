import * as tables from './difficulty_table.js';

const LAMPS = ['NO-PLAY', 'FAILED', 'ASSIST', 'EASY', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'];
const RANKS = ['F', 'F', 'E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];

const DOM = {
    body: document.body,
    formOptions: document.getElementById('form_options'),
    selectTable: document.getElementById('select_table'),
    selectOptions: document.getElementById('select_options'),
    inputId: document.getElementById('user_id'),
    content: document.getElementById('content'),
    screenshot: document.getElementById('screenshot'),
};

window.onload = async () => {
    ['iidx', 'bms']
        .forEach((type, i) => {
            Object.entries(tables.list[type]).forEach(([key, table]) => {
                var option = document.createElement('option');
                option.value = key;
                option.innerText = table.display;
                DOM.selectTable.children[i].appendChild(option);
            })});
    DOM.selectTable.children[0].children[0].selected = true;
    DOM.selectTable.addEventListener('change', updateOptions);
    updateOptions();

    DOM.formOptions.addEventListener('submit', buildTable);
};

async function buildTable(e) {
    e.preventDefault();

    const type = DOM.selectTable.selectedOptions[0].parentElement.dataset.value;
    const table = tables.list[type][DOM.selectTable.value];

    var options = {
        userId: DOM.inputId.value.replace(/[\D]/g, ''),
    };
    if (table.selects) {
        Object.keys(table.selects).forEach(option => {
            const select = document.getElementById('select_option_' + option);
            options[option] = select.value;
        });
    }

    const parsedTable = await table.parse(options);

    if (table.playerData) {
        const dataSource = table.playerData[document.getElementById('select_data').value];
        const parsedData = await dataSource.parse(options);
        renderTable(parsedTable, parsedData);
    // ---------------
    $('#screenshot').on('click', () => {
        $('#download_screenshot').remove();
        window.scrollTo(0,0);
        html2canvas($('#content')[0], { backgroundColor: '#252830' }).then((canvas) => {
            if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
                let img = new Image();
                img.src = canvas.toDataURL('image/png');
                let new_tab = window.open('');
                setTimeout(() => new_tab.document.write(img.outerHTML), 0);
            } else {
                canvas.toBlob((blob) => {
                    let a = document.createElement('a');
                    a.id = 'download_screenshot';
                    a.style = 'display: block';
                    a.innerText = 'Download link';
                    a.download = 'user_' + parsedData.userId + '_' + new Date().toISOString().replace(/^([\d-]+)[\w][\d:.]+[\w]$/, '$1') + '.png';
                    a.href = URL.createObjectURL(blob);
                    $(a).insertAfter('#screenshot');
                    a.click();
                }, 'image/png');
            }
        });
    });
    // ----------------

        return;
    }
    renderTable(table);
}

function renderTable(table, playerData) {
    if (playerData) {
        if (table.userInfo)
            DOM.content.innerHTML = `<h3 style="margin-top: 0">${playerData.username} - <span style="color: ${table.userInfo.clearAbility_color}">★${table.userInfo.clearAbility}</span></h3>`;
        else
            DOM.content.innerHTML = `<h3 style="margin-top: 0">${playerData.username}</h3>`;
    }
    
    table.levels.forEach(row => {
        // <span class="rank ${song.rank.toLowerCase()}">${song.rank}</span>
        // <span class="rank ${song.rank.toLowerCase()}" style="transform: scaleX(0.9)">${parseInt(song.percentage)}%</span>
        var [songs, levelLamp, avgPercentage] = row.songs.reduce(([html, lamp, percentage], song) => {
            const record = playerData.records.get(song.title + (song.difficulty ? '\t' + song.difficulty : ''));
            return [
                html + `
<div class="song">
  <span class="title ${song.difficulty.toLowerCase()}">${song.title}</span>
<div class="right">
<span class="lamp ${record ? record.lamp.toLowerCase() : 'no-play'}"></span>
</div>
</div>`,
                LAMPS.indexOf(record ? record.lamp : 'NO-PLAY') < LAMPS.indexOf(lamp) ? (record ? record.lamp : 'NO-PLAY') : lamp,
                percentage + (record ? record.percentage : 0)
            ];
        }, ['', LAMPS[LAMPS.length - 1], 0]);
        avgPercentage /= row.songs.length;
        const avgRank = RANKS[Math.trunc(avgPercentage / 100 * 9)];

        const container = document.createElement('div');
        container.className = 'container';
        container.innerHTML = `
<div class="level">
  <span>
    ${table.prefix}${row.level}
  </span>
  <span class="right">
    <span class="lamp ${levelLamp}"></span>
  </span>
</div>
<div class="songs">
  ${songs}
</div>
`;
        DOM.content.appendChild(container);
    });

    DOM.content.querySelectorAll('.song').forEach(song => {
        const title = song.querySelector('.title');
        const divWidth = song.offsetWidth - (song.querySelector('.right').offsetWidth || 0) - 3;
        if (title.offsetWidth > divWidth) {
            let widthScale = Math.max(divWidth / title.offsetWidth, 0.6);
            title.style.transform = `scaleX(${widthScale})`;
        }
    });
}

function updateOptions() {
    const type = DOM.selectTable.selectedOptions[0].parentElement.dataset.value;
    const table = tables.list[type][DOM.selectTable.value];
    DOM.selectOptions.innerHTML = '';

    if (table.playerData) {
        DOM.selectOptions.innerHTML += `
<div class="option">
  <div>Player Data Source</div>
  <select id="select_data"></select>
</div>`;
        var selectData = document.getElementById('select_data');
        Object.entries(table.playerData).forEach(([key, dataSource]) => {
            var option = document.createElement('option');
            option.value = key;
            option.innerText = dataSource.display;
            selectData.appendChild(option);
        });
    }

    if (table.selects) {
        Object.entries(table.selects).forEach(([key, sel]) => {
            DOM.selectOptions.innerHTML += `
<div class="option">
  <div>${sel.display}</div>
  <select id="select_option_${key}"></select>
</div>`;
            var select = document.getElementById('select_option_' + key);
            Object.entries(sel.options).forEach(([key, display]) => {
                var option = document.createElement('option');
                option.value = key;
                option.innerText = display;
                if (key == sel.selected)
                    option.selected = true;
                select.appendChild(option);
            });
        });
    }

    if (type === 'iidx')
        DOM.inputId.placeholder = 'IIDX ID';
    else if (type === 'bms')
        DOM.inputId.placeholder = 'LR2 ID';

}
