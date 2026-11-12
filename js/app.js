/* 数据浏览前端脚本（内容固定，由 bili_pipeline.py 生成） */
(function () {
  'use strict';
  var DATA = window.__DATA__ || (window.__DATA__ = {});
  var MANIFEST = window.__MANIFEST__ || { years: [] };
  var treeEl = document.getElementById('tree');
  var listEl = document.getElementById('list');
  var infoEl = document.getElementById('info');
  var btnEl  = document.getElementById('downloadBtn');
  var state = { path: '', file: '', records: null };

  function buildTree() {
    var frag = document.createDocumentFragment();
    MANIFEST.years.forEach(function (yearNode) {
      var yd = document.createElement('details');
      yd.className = 'tree-year'; yd.open = true;
      var ys = document.createElement('summary');
      ys.textContent = yearNode.year; yd.appendChild(ys);

      yearNode.names.forEach(function (nameNode) {
        var nd = document.createElement('details');
        nd.className = 'tree-name';
        var ns = document.createElement('summary');
        ns.textContent = nameNode.name; nd.appendChild(ns);

        var ul = document.createElement('ul');
        ul.className = 'tree-dates';
        nameNode.dates.forEach(function (dn) {
          var li = document.createElement('li');
          li.className = 'tree-date';
          li.textContent = dn.date;
          li.dataset.path = dn.path;
          li.dataset.file = dn.file;
          li.dataset.label = yearNode.year + ' / ' + nameNode.name + ' / ' + dn.date;
          li.addEventListener('click', function () { selectDate(li); });
          ul.appendChild(li);
        });
        nd.appendChild(ul); yd.appendChild(nd);
      });
      frag.appendChild(yd);
    });
    treeEl.appendChild(frag);
  }

  function loadRecords(path) {
    if (Object.prototype.hasOwnProperty.call(DATA, path)) {
      return Promise.resolve(DATA[path]);
    }
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = path; s.async = true;
      s.onload = function () {
        if (Object.prototype.hasOwnProperty.call(DATA, path)) resolve(DATA[path]);
        else reject(new Error('数据文件内容为空：' + path));
      };
      s.onerror = function () { reject(new Error('数据文件加载失败：' + path)); };
      document.head.appendChild(s);
    });
  }

  function selectDate(li) {
    var path = li.dataset.path;
    if (state.path === path && state.records) return;
    var prev = treeEl.querySelector('.tree-date.active');
    if (prev) prev.classList.remove('active');
    li.classList.add('active');
    state.path = path; state.file = li.dataset.file; state.records = null;
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

  function showMessage(text, isError) {
    listEl.innerHTML = '';
    var d = document.createElement('div');
    d.className = 'empty' + (isError ? ' error' : '');
    d.textContent = text; listEl.appendChild(d);
  }

  function renderList(records) {
    if (!records.length) { showMessage('该文件没有数据'); return; }
    var frag = document.createDocumentFragment();
    records.forEach(function (row) {
      var item = document.createElement('div');
      item.className = 'row';
      var t = document.createElement('div');
      t.className = 'row-title'; t.textContent = row[0] || '';
      var u = document.createElement('div');
      u.className = 'row-up'; u.textContent = row[1] || '';
      item.appendChild(t); item.appendChild(u); frag.appendChild(item);
    });
    listEl.innerHTML = '';
    listEl.appendChild(frag);
  }

  function download() {
    if (!state.records || !state.records.length) return;
    var lines = state.records.map(function (row) { return row.join('\t'); });
    var text = lines.join('\r\n') + '\r\n';
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = state.file || 'data.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  btnEl.addEventListener('click', download);
  buildTree();
  var firstDate = treeEl.querySelector('.tree-date');
  if (firstDate) firstDate.click();
  else showMessage('没有找到数据文件');
})();
