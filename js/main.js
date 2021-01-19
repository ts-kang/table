import * as tables from './difficulty_table.js';

const DOM = {
    body: document.body,
    formOptions: document.getElementById('form_options'),
    selectTable: document.getElementById('select_table'),
    selectOptions: document.getElementById('select_options'),
    inputId: document.getElementById('user_id'),
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
        return;
    }
    renderTable(table);
}

function renderTable(table, playerData) {
    
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
