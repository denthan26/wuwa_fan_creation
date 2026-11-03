/* 数据浏览前端脚本（内容固定，由 main.py 生成） */
(function () {
  'use strict';

  var DATA = window.__DATA__ || (window.__DATA__ = {});
  var MANIFEST = window.__MANIFEST__ || { years: [] };

  var treeEl = document.getElementById('tree');
  var listEl = document.getElementById('list');
  var infoEl = document.getElementById('info');
  var btnEl  = document.getElementById('downloadBtn');

  var state = { path: '', file: '', records: null };

  /* ---------------- 侧边栏 ---------------- */

  function buildTree() {
    var frag = document.createDocumentFragment();

    MANIFEST.years.forEach(function (yearNode) {
      var yearDetails = document.createElement('details');
      yearDetails.className = 'tree-year';
      yearDetails.open = true;

      var yearSummary = document.createElement('summary');
      yearSummary.textContent = yearNode.year;
      yearDetails.appendChild(yearSummary);

      yearNode.names.forEach(function (nameNode) {
        var nameDetails = document.createElement('details');
        nameDetails.className = 'tree-name';

        var nameSummary = document.createElement('summary');
        nameSummary.textContent = nameNode.name;
        nameDetails.appendChild(nameSummary);

        var ul = document.createElement('ul');
        ul.className = 'tree-dates';

        nameNode.dates.forEach(function (dateNode) {
          var li = document.createElement('li');
          li.className = 'tree-date';
          li.textContent = dateNode.date;
          li.dataset.path = dateNode.path;
          li.dataset.file = dateNode.file;
          li.dataset.label = yearNode.year + ' / ' + nameNode.name + ' / ' + dateNode.date;
          li.addEventListener('click', function () { selectDate(li); });
          ul.appendChild(li);
        });

        nameDetails.appendChild(ul);
        yearDetails.appendChild(nameDetails);
      });

      frag.appendChild(yearDetails);
    });

    treeEl.appendChild(frag);
  }

  /* ---------------- 数据加载 ---------------- */

  function loadRecords(path) {
    if (Object.prototype.hasOwnProperty.call(DATA, path)) {
      return Promise.resolve(DATA[path]);
    }
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = path;
      script.async = true;
      script.onload = function () {
        if (Object.prototype.hasOwnProperty.call(DATA, path)) {
          resolve(DATA[path]);
        } else {
          reject(new Error('数据文件内容为空：' + path));
        }
      };
      script.onerror = function () {
        reject(new Error('数据文件加载失败：' + path));
      };
      document.head.appendChild(script);
    });
  }

  /* ---------------- 选择日期 ---------------- */

  function selectDate(li) {
    var path = li.dataset.path;
    if (state.path === path && state.records) return;

    var prev = treeEl.querySelector('.tree-date.active');
    if (prev) prev.classList.remove('active');
    li.classList.add('active');

    state.path = path;
    state.file = li.dataset.file;
    state.records = null;

    infoEl.textContent = li.dataset.label;
    btnEl.disabled = true;
    showMessage('加载中…');

    loadRecords(path).then(function (records) {
      if (state.path !== path) return;
      state.records = records;
      renderList(records);
      infoEl.textContent = li.dataset.label + ' · 共 ' + records.length + ' 条';
      btnEl.disabled = records.length === 0;
    }).catch(function (err) {
      if (state.path !== path) return;
      showMessage(err.message, true);
    });
  }

  /* ---------------- 列表渲染 ---------------- */

  function showMessage(text, isError) {
    listEl.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'empty' + (isError ? ' error' : '');
    div.textContent = text;
    listEl.appendChild(div);
  }

  function renderList(records) {
    if (!records.length) {
      showMessage('该文件没有数据');
      return;
    }
    var frag = document.createDocumentFragment();
    records.forEach(function (row) {
      var item = document.createElement('div');
      item.className = 'row';

      var titleEl = document.createElement('div');
      titleEl.className = 'row-title';
      titleEl.textContent = row[0] || '';

      var upEl = document.createElement('div');
      upEl.className = 'row-up';
      upEl.textContent = row[1] || '';

      item.appendChild(titleEl);
      item.appendChild(upEl);
      frag.appendChild(item);
    });
    listEl.innerHTML = '';
    listEl.appendChild(frag);
  }

  /* ---------------- 下载 ---------------- */

  function download() {
    if (!state.records || !state.records.length) return;

    var lines = state.records.map(function (row) { return row.join('\t'); });
    var text = lines.join('\r\n') + '\r\n';

    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = state.file || 'data.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  btnEl.addEventListener('click', download);

  /* ---------------- 启动 ---------------- */
  buildTree();

  var firstDate = treeEl.querySelector('.tree-date');
  if (firstDate) {
    firstDate.click();
  } else {
    showMessage('没有找到数据文件');
  }
})();
