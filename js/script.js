const url_ereter_analytics = 'http://ereter.net/iidxplayerdata/{}/analytics/perlevel/';
const url_ereter_level = 'http://ereter.net/iidxplayerdata/{}/level/12/';

const lamps = ['no-play', 'failed', 'assist', 'easy', 'clear', 'hard', 'ex-hard', 'fullcombo'];
const ranks = ['F', 'F', 'E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];

const comparators = {
    title: (a, b) => a.title.localeCompare(b.title),
    clear_lamp: (a, b) => lamps.indexOf(a.lamp) - lamps.indexOf(b.lamp),
    ereter_difficulty: (a, b) => a.recommend[0] - b.recommend[0],
    rank: (a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank),
    percentage: (a, b) => a.percentage - b.percentage
}

var config = {
    show: {
        title: true,
        rank: false,
        percentage: false,
        clear_lamp: true,
        ereter_color: false
    }
}

$(document).ready(async () => {
    $('#player').val(location.search.substring(1));
    $('#player_form').on('submit', () => {
        location.search = '?' + $('#player').val().replace(/[\D]/g, '');

        return false;
    });

    let player = $('#player').val();

    if (!player)
        return;

    let content = $('#content');

    var diff_table = [];
    var index_table = {}; // song_id: [level_index, song_index]
    var user_info = {};

    Object.keys(config.show).forEach((opt) => {
        $('#show_' + opt).on('click', function () {
            config.show[opt] = !config.show[opt];
            config_update();
            table_render(diff_table, user_info);
        });
    });
    config_update();

    content.html('<h3 class="loading">Loading... (1/2)</h3>');
    await access_page(url_ereter_analytics.replace('{}', player), (data) => {
        let html = $($.parseHTML(data));
        let user = html.find('.content > h3');
        user_info.id = player;
        user_info.username = user.text().replace(/ - .*$/, '');
        user_info.recommend = user.find('span').text().substring(1);
        user_info.recommend_color = user.find('span').css('color');
        let table_analytics = html.find('[data-sort=table-perlevel]');
        table_parse(diff_table, table_analytics, index_table);
    });
    console.debug(diff_table);

    if (!diff_table)
        return;

    content.html('<h3 class="loading">Loading... (2/2)</h3>');
    await access_page(url_ereter_level.replace('{}', player), (data) => {
        let records_table = $($.parseHTML(data)).find('[data-sort=table]');
        table_parse_records(diff_table, records_table, index_table);
    });

    diff_table.reverse();

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
                    a.download = 'user_' + player + '_' + new Date().toISOString().replace(/^([\d-]+)[\w][\d:.]+[\w]$/, '$1') + '.png';
                    a.href = URL.createObjectURL(blob);
                    $(a).insertAfter('#screenshot');
                    a.click();
                }, 'image/png');
            }
        });
    });

    Object.keys(comparators).forEach((comp) => {
        $('#sort_' + comp).on('click', function () {
            var status = $(this).hasClass('sort-up') ? 1 :
                $(this).hasClass('sort-down') ? -1 : 0;
            $(this).removeClass('sort-up sort-down enabled');
            status = (status % 3 + 3) % 3 - 1;
            if (status == 1)
                $(this).addClass('sort-up enabled');
            else if (status == -1)
                $(this).addClass('sort-down enabled');
            else
                return;

            table_sort(diff_table, (a, b) => status * comparators[comp](a, b));
            table_render(diff_table, user_info);
        });
    });

    $('#sort_ereter_difficulty').click();
    $('#sort_clear_lamp').click();
});

async function access_page(url, success, progress) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'GET',
            url: 'https://cors-header-proxy.nnyan.workers.dev/?' + url,
            async: true,
            success: success,
            error: (xhr) => {
                alert(xhr.status + ' - ' + xhr.statusText);
            }
        })
        .always(() => resolve())
    });
}

function config_update() {
    Object.keys(config).forEach((conf) => {
        Object.keys(config[conf]).forEach((opt) => {
            if (config[conf][opt])
                $(`#${conf}_${opt}`).addClass('enabled');
            else
                $(`#${conf}_${opt}`).removeClass('enabled');
        });
    });
}

function config_(conf, str, def) {
    return conf ? str : def == undefined ? '' : def;
}

function table_render(diff_table, user_info) {
    if (!diff_table || !user_info)
        return;
    
    let table_object = diff_table.map((level_table) => {
        let songs = level_table.songs
            .map((song) => '<div class="song"' +
                 config_(config.show.ereter_color,
                         ` style="background-color: rgba(${song.recommend_color[0].join(', ')}, 0.3)"`) +
                 /*config_(config.show.ereter_color,
                         ` style="background-image: linear-gradient(to right, rgba(${song.recommend_color[0].join(', ')}, 0.3) 25%, rgba(${song.recommend_color[0].join(', ')}, 0.1) 100%)"`) +*/
                 '>' +
                 config_(config.show.title,
                         `<a href="http://ereter.net/iidxranking/${song.id}/${user_info.id}/" target="_blank" class="title ${song.difficulty.toLowerCase()}">${song.title}</a>`) +
                 '<div class="right">' +
                 config_(config.show.rank,
                         `<span class="rank ${song.rank.toLowerCase()}">${song.rank}</span>`) +
                 config_(config.show.percentage,
                         `<span class="rank ${song.rank.toLowerCase()}" style="transform: scaleX(0.9)">${parseInt(song.percentage)}%</span>`) +
                 config_(config.show.clear_lamp,
                         `<span class="lamp ${song.lamp}"></span>`) +
                 '</div></div>')
            .join('');
        let container = $(`
        <div class="container">
            <div class="level">
                <span style="color: rgb(${level_table.recommend_color[0].join(', ')})">
                    ☆${level_table.level}
                </span>
                <div>` +
                 config_(config.show.rank,
                         `<span class="rank ${level_table.rank.toLowerCase()}">${level_table.rank}</span>`) +
                 config_(config.show.percentage,
                         `<span class="rank ${level_table.rank.toLowerCase()}" style="transform: none">${parseInt(level_table.percentage)}%</span>`) +
                `</div>
                <span class="right">` +
                 config_(config.show.clear_lamp,
                         `<span class="lamp ${level_table.lamp}"></span>`) +
                `</span>
            </div>
            <div class="songs">${songs}</div>
        </div>
        `);

        return container;
    });

    $('#content')
        .html(`<h3 style="margin-top: 0">${user_info.username} - <span style="color: ${user_info.recommend_color}">★${user_info.recommend}</span></h3>`)
        .append(table_object);

    $('.song').each((_, song) => {
        let title = $(song).find('.title');
        let div_width = $(song).width() - ($($(song).find('.right')).width() || 0) - 3;
        if (title.width() > div_width) {
            let width_scale = Math.max(div_width / title.width(), 0.6);
            title.css('transform', `scaleX(${width_scale})`);
        }
    });
}

function table_sort(diff_table, comp) {
    diff_table.forEach((level_table) => level_table.songs.sort(comp));
}

function table_parse(diff_table, table_element, index_table) {
    table_element.find('tbody:not(.tablesorter-no-sort)').get().forEach((tbody) => {
        var level;
        let songs = $(tbody).find('tr').get().map((row, i) => {
            let fields = $(row).find('td').get();
            if (!level)
                level = $(fields[0]).text().substring(1);
            let title = $(fields[1]).text();
            let id = $(fields[1]).find('a').attr('href').replace(/^\/iidxranking\/([\d]+)\/[\d]+\/$/, '$1');
            index_table[id] = [diff_table.length, i];

            return {
                id: id,
                title: title.replace(/ \([A-Z]+\)$/, ''),
                difficulty: title.replace(/^.* \(([A-Z]+)\)$/, '$1'),
                recommend: [3, 5, 7] // easy, hard, ex-hard
                    .map((i) => parseFloat($(fields[i]).find('span').text().substring(1))),
                recommend_color: [3, 5, 7]
                    .map((i) => $(fields[i]).find('span').css('color').match(/\b[\d]+\b/g)
                         .map((c) => parseInt(c)))
                /*
                  lamp: $(fields[6]).find('span').length == 0
                  ? 'no-play'
                  : $(fields[6]).find('span').hasClass('icon-check')
                  ? 'ex-hard'
                  : $(fields[4]).find('span').hasClass('icon-check')
                  ? 'hard'
                  : $(fields[2]).find('span').hasClass('icon-check')
                  ? 'easy'
                  : 'failed'
                */
            };
        });
        if (!level)
            return;
        diff_table.push({
            level: level,
            songs: songs
        });
    });
}

function table_parse_records(diff_table, records_table, index_table) {
    records_table.find('tbody').get().forEach((tbody) => {
        var level;
        var songs = [];
        $(tbody).find('tr').get().forEach((row) => {
            let fields = $(row).find('td').get();
            let id = $(fields[1]).find('a').attr('href').replace(/^\/iidxranking\/([\d]+)\/[\d]+\/$/, '$1');
            let indices = index_table[id];
            let song = diff_table[indices[0]].songs[indices[1]];
            song.rank = $(fields[4]).children().length > 0
                ? $(fields[4]).find('span span span')[0].innerText
                : '';
            song.percentage = $(fields[4]).children().length > 0
                ? parseFloat($(fields[4]).find('span span span')[1].innerText)
                : 0;
            song.lamp = $(fields[5]).text().toLowerCase();
            if (song.lamp.trim() === '')
                song.lamp = 'no-play';
        });
    });

    diff_table.forEach((level_table) => {
        var size = level_table.songs.length;

        let level_sum = level_table.songs
            .reduce((total, current) => {
                if (current.rank === '')
                    --size;
                total.percentage += current.percentage;
                total.recommend = current.recommend
                    .map((rec, i) => total.recommend[i] + rec);
                total.recommend_color = current.recommend_color
                    .map((color, i) =>
                         color.map((c, j) => total.recommend_color[i][j] + c));
                return total;
            }, {
                percentage: 0,
                recommend: [0, 0, 0],
                recommend_color: [0, 0, 0].map(() => [0, 0, 0])
            });

        level_table.percentage = (level_sum.percentage / size) || 0;
        level_table.rank = ranks[Math.trunc(level_table.percentage / 100 * 9)];
        level_table.recommend =
            level_sum.recommend.map((rec) => Math.floor(rec / level_table.songs.length * 10.0) / 10.0);
        level_table.recommend_color =
            level_sum.recommend_color.map((color) => color.map((c) => parseInt(c / level_table.songs.length)));
        level_table.lamp = level_table.songs
            .reduce((total, current) =>
                    lamps.indexOf(current.lamp) < lamps.indexOf(total.lamp) ? current : total,
                    {lamp: lamps[lamps.length - 1]}).lamp;
    });
}
